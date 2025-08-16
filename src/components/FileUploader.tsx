'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { ArrowLeft, Upload, File, X, Lock, Unlock, Users, Copy, QrCode, Eye, EyeOff, Pause, Play, Database } from 'lucide-react';
import { usePeer } from '@/hooks/usePeer';
import { v4 as uuidv4 } from 'uuid';
import { largeFileStorage } from '@/utils/largeFileStorage';
import { MemoryOptimizedFileProcessor } from '@/utils/memoryOptimizedProcessor';
import { transferSessionManager, TransferState } from '@/utils/transferSessionManager';
import { formatFileSize } from '@/utils/helpers';

interface UploadedFile extends File {
  id: string;
  preview?: string;
}

interface FileUploaderProps {
  onBack: () => void;
  onTransferStateChange?: (state: {
    isConnected: boolean;
    isTransferring: boolean;
    transferProgress: number;
    connectionCount: number;
    transferStatus: 'idle' | 'connecting' | 'transferring' | 'complete' | 'error';
    errorMessage: string;
  }) => void;
}

export default function FileUploader({ onBack, onTransferStateChange }: FileUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [connections, setConnections] = useState<number>(0);
  const [transferStats, setTransferStats] = useState({
    totalBytes: 0,
    sentBytes: 0,
    progress: 0,
  });
  const [transferErrors, setTransferErrors] = useState<{[fileName: string]: string}>({});
  const [completedTransfers, setCompletedTransfers] = useState<{[fileName: string]: boolean}>({});
  
  // Large file support states
  const [largeFileMode, setLargeFileMode] = useState(false);
  const [processingFiles, setProcessingFiles] = useState<{[fileName: string]: number}>({});
  const [transferStates, setTransferStates] = useState<{[fileId: string]: TransferState}>({});
  const [isInitialized, setIsInitialized] = useState(false);

  const { peer, peerId, isConnected, error } = usePeer();
  const connectionsRef = useRef<Set<any>>(new Set());

  // Initialize large file storage
  useEffect(() => {
    const initializeLargeFileSupport = async () => {
      try {
        await largeFileStorage.initialize();
        setIsInitialized(true);
        console.log('Large file storage initialized');
        
        // Cleanup old sessions on startup
        await transferSessionManager.cleanupOldTransfers(24);
      } catch (error) {
        console.error('Failed to initialize large file storage:', error);
      }
    };
    
    initializeLargeFileSupport();
  }, []);

  // Check if any file is large enough to require large file mode
  useEffect(() => {
    const hasLargeFiles = files.some(file => file.size > 100 * 1024 * 1024); // 100MB threshold
    if (hasLargeFiles !== largeFileMode) {
      setLargeFileMode(hasLargeFiles);
      console.log(`Large file mode: ${hasLargeFiles ? 'enabled' : 'disabled'}`);
    }
  }, [files, largeFileMode]);

  // Update transfer state for animation
  useEffect(() => {
    if (onTransferStateChange) {
      const hasErrors = Object.keys(transferErrors).length > 0;
      const allCompleted = files.length > 0 && files.every(f => completedTransfers[f.name]);
      
      onTransferStateChange({
        isConnected: isConnected && connections > 0,
        isTransferring: isSharing && transferStats.progress > 0 && transferStats.progress < 100,
        transferProgress: transferStats.progress,
        connectionCount: connections,
        transferStatus: hasErrors ? 'error' : 
                       allCompleted && files.length > 0 ? 'complete' :
                       isSharing && transferStats.progress > 0 ? 'transferring' :
                       connections > 0 ? 'connecting' : 'idle',
        errorMessage: hasErrors ? Object.values(transferErrors)[0] : ''
      });
    }
  }, [isConnected, connections, isSharing, transferStats.progress, transferErrors, completedTransfers, files.length, onTransferStateChange]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log('Files dropped:', acceptedFiles.map(f => ({ 
      name: f.name, 
      size: f.size, 
      type: f.type,
      lastModified: f.lastModified 
    })));
    
    const newFiles = acceptedFiles.map(file => {
      const fileObj = {
        ...file,
        id: uuidv4(),
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        // Ensure size is preserved
        size: file.size,
        name: file.name,
        type: file.type
      };
      
      console.log('Created file object:', {
        id: fileObj.id,
        name: fileObj.name,
        size: fileObj.size,
        type: fileObj.type
      });
      
      return fileObj;
    });
    
    console.log('All processed files:', newFiles.map(f => ({ 
      name: f.name, 
      size: f.size, 
      id: f.id 
    })));
    
    setFiles(prev => {
      const updated = [...prev, ...newFiles];
      console.log('Updated file list:', updated.map(f => ({ 
        name: f.name, 
        size: f.size, 
        id: f.id 
      })));
      return updated;
    });
  }, []);

  // Large file processing method
  const processLargeFile = async (file: File): Promise<string> => {
    const fileId = uuidv4();
    setProcessingFiles(prev => ({ ...prev, [file.name]: 0 }));

    try {
      // Check if device can handle this file size
      const canProcess = await MemoryOptimizedFileProcessor.canProcessFile(file.size);
      if (!canProcess.canProcess) {
        throw new Error(`File too large for this device. Estimated memory needed: ${Math.round(canProcess.estimatedMemoryUsage / 1024 / 1024)}MB`);
      }

      const chunkSize = canProcess.recommendedChunkSize;
      console.log(`Processing large file: ${file.name} (${formatFileSize(file.size)}) with ${Math.round(chunkSize / 1024)}KB chunks`);

      // Process file in chunks and store in IndexedDB
      const result = await MemoryOptimizedFileProcessor.processFileStream(file, {
        chunkSize,
        onProgress: (progress) => {
          setProcessingFiles(prev => ({ ...prev, [file.name]: progress }));
        },
        onChunkProcessed: async (chunkIndex, chunkData) => {
          // Store chunk in IndexedDB
          await largeFileStorage.storeChunk({
            fileId,
            chunkIndex,
            data: chunkData,
            timestamp: Date.now()
          });
        }
      });

      // Create session
      const session = {
        fileId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        totalChunks: result.totalChunks,
        completedChunks: Array.from({ length: result.totalChunks }, (_, i) => i), // All chunks processed
        fileHash: result.fileHash,
        timestamp: Date.now(),
        isComplete: true
      };

      await largeFileStorage.saveSession(session);
      setProcessingFiles(prev => {
        const newState = { ...prev };
        delete newState[file.name];
        return newState;
      });

      console.log(`Large file processed: ${file.name}, Hash: ${result.fileHash}`);
      return fileId;

    } catch (error) {
      setProcessingFiles(prev => {
        const newState = { ...prev };
        delete newState[file.name];
        return newState;
      });
      setTransferErrors(prev => ({
        ...prev,
        [file.name]: error instanceof Error ? error.message : 'Processing failed'
      }));
      throw error;
    }
  };

  // Enhanced file sharing with large file support
  const startSharingLargeFiles = async () => {
    if (!peer || files.length === 0 || !isInitialized) return;

    setIsSharing(true);
    const totalBytes = files.reduce((total, file) => total + file.size, 0);
    setTransferStats(prev => ({ ...prev, totalBytes }));

    try {
      // Process large files first
      const fileProcessingPromises = files.map(async (file) => {
        if (file.size > 100 * 1024 * 1024) { // 100MB threshold
          return await processLargeFile(file);
        }
        return null; // Small files will use existing method
      });

      await Promise.all(fileProcessingPromises);
      console.log('All large files processed, ready for sharing');

    } catch (error) {
      console.error('Error processing large files:', error);
      setIsSharing(false);
      return;
    }

    // Continue with normal sharing flow
    startSharing();
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const updatedFiles = prev.filter(f => f.id !== fileId);
      // Clean up preview URLs
      const removedFile = prev.find(f => f.id === fileId);
      if (removedFile?.preview) {
        URL.revokeObjectURL(removedFile.preview);
      }
      return updatedFiles;
    });
  };

  const startSharing = async () => {
    if (!peer || files.length === 0) return;

    setIsSharing(true);
    const totalBytes = files.reduce((total, file) => total + file.size, 0);
    setTransferStats(prev => ({ ...prev, totalBytes }));

    // Create share URL
    const shareId = peerId;
    const currentUrl = window.location.origin;
    const fullShareUrl = `${currentUrl}?share=${shareId}${password ? '&protected=1' : ''}`;
    setShareUrl(fullShareUrl);

    // Listen for incoming connections
    peer.on('connection', (conn) => {
      console.log('New connection:', conn.peer);
      connectionsRef.current.add(conn);
      setConnections(connectionsRef.current.size);

      conn.on('data', async (data: any) => {
        if (data.type === 'request-info') {
          // Send file list
          const fileList = files.map(f => ({
            fileName: f.name,
            size: f.size,
            type: f.type,
          }));
          
          conn.send({
            type: 'file-list',
            files: fileList,
            passwordRequired: !!password,
          });
        } else if (data.type === 'password') {
          if (password && data.password !== password) {
            conn.send({ type: 'auth-failed' });
            return;
          }
          conn.send({ type: 'auth-success' });
        } else if (data.type === 'request-file') {
          const file = files.find(f => f.name === data.fileName);
          if (file) {
            try {
              await sendFileInChunks(conn, file);
              setCompletedTransfers(prev => ({ ...prev, [file.name]: true }));
              console.log(`Successfully completed transfer of ${file.name}`);
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown transfer error';
              setTransferErrors(prev => ({ ...prev, [file.name]: errorMessage }));
              console.error(`Transfer failed for ${file.name}:`, errorMessage);
              
              // Notify the receiver about the error
              conn.send({
                type: 'transfer-error',
                fileName: file.name,
                error: errorMessage,
              });
            }
          }
        } else if (data.type === 'chunk-ack') {
          // Handle chunk acknowledgments (processed within sendFileInChunks)
        } else if (data.type === 'file-complete') {
          // Handle final completion confirmations (processed within sendFileInChunks)
          setCompletedTransfers(prev => ({ ...prev, [data.fileName]: true }));
        } else if (data.type === 'file-error') {
          // Handle receiver-side errors
          setTransferErrors(prev => ({ ...prev, [data.fileName]: data.error }));
          console.error(`Receiver reported error for ${data.fileName}: ${data.error}`);
        }
      });

      conn.on('close', () => {
        connectionsRef.current.delete(conn);
        setConnections(connectionsRef.current.size);
      });

      conn.on('error', (err) => {
        console.error('Connection error:', err);
        connectionsRef.current.delete(conn);
        setConnections(connectionsRef.current.size);
      });
    });
  };

  const sendFileInChunks = async (conn: any, file: File) => {
    const CHUNK_SIZE = 256 * 1024; // 256KB chunks
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    let sentBytes = 0;
    let acknowledgedChunks = 0;
    const pendingChunks = new Set<number>();

    console.log(`🚀 Starting file transfer: ${file.name} (${file.size} bytes, ${totalChunks} chunks)`);

    // Listen for chunk acknowledgments
    const handleChunkAck = (data: any) => {
      if (data.type === 'chunk-ack' && data.fileName === file.name) {
        acknowledgedChunks++;
        pendingChunks.delete(data.chunkIndex);
        
        // Update progress based on acknowledged chunks, not sent chunks
        const realProgress = (acknowledgedChunks / totalChunks) * 100;
        setTransferStats(prev => ({
          ...prev,
          progress: realProgress,
        }));
      } else if (data.type === 'file-complete' && data.fileName === file.name) {
        console.log(`File ${file.name} transfer confirmed complete by receiver`);
      } else if (data.type === 'file-error' && data.fileName === file.name) {
        console.error(`File transfer error: ${data.error}`);
        // Handle transfer error - could retry or abort
      }
    };

    try {
      // Generate file hash for integrity verification with error handling
      let fileHash: string;
      try {
        let fileBuffer: ArrayBuffer;
        
        // Validate that file is a proper File/Blob object
        if (!file || typeof file !== 'object') {
          throw new Error('Invalid file object provided');
        }
        
        if (!(file instanceof File) && !(file instanceof Blob)) {
          throw new Error('Parameter is not a File or Blob object');
        }
        
        // Use compatible method to get ArrayBuffer from File
        if (file.arrayBuffer && typeof file.arrayBuffer === 'function') {
          fileBuffer = await file.arrayBuffer();
        } else {
          // Fallback method using FileReader with additional validation
          console.log(`📁 Using FileReader fallback for ${file.name}, type: ${file.constructor?.name}`);
          fileBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              if (reader.result instanceof ArrayBuffer) {
                resolve(reader.result);
              } else {
                reject(new Error('FileReader did not return ArrayBuffer'));
              }
            };
            reader.onerror = () => reject(new Error('FileReader failed to read file'));
            
            // Additional validation before calling readAsArrayBuffer
            try {
              reader.readAsArrayBuffer(file);
            } catch (readerError) {
              reject(new Error(`FileReader.readAsArrayBuffer failed: ${readerError instanceof Error ? readerError.message : 'Unknown error'}`));
            }
          });
        }      const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
      fileHash = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      console.log(`🔐 Generated file hash: ${fileHash.substring(0, 16)}... for ${file.name}`);
    } catch (error) {
      console.error(`❌ Failed to generate file hash for ${file.name}:`, error);
      throw new Error(`File hash generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

      // Send file metadata first with MIME type for proper reconstruction
      conn.send({
        type: 'file-start',
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type, // Include MIME type for proper download formatting
        totalChunks,
        fileHash,
      });

      // Add temporary listener for this file transfer
      conn.on('data', handleChunkAck);

      for (let i = 0; i < totalChunks; i++) {
        // Check if connection is still active
        if (conn.open !== true) {
          throw new Error('Connection lost during transfer');
        }

        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);
        
        // Convert chunk to Uint8Array with fallback method
        let uint8Array: Uint8Array;
        try {
          // Validate chunk is a proper Blob object
          if (!chunk || typeof chunk !== 'object' || !(chunk instanceof Blob)) {
            throw new Error('Invalid chunk: not a Blob object');
          }
          
          // Primary method: use Blob.arrayBuffer() if available
          if (chunk.arrayBuffer && typeof chunk.arrayBuffer === 'function') {
            const arrayBuffer = await chunk.arrayBuffer();
            uint8Array = new Uint8Array(arrayBuffer);
          } else {
            // Fallback method: use FileReader for better compatibility
            console.log(`📦 Using FileReader fallback for chunk ${i}, type: ${chunk.constructor?.name}`);
            uint8Array = await new Promise<Uint8Array>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                if (reader.result instanceof ArrayBuffer) {
                  resolve(new Uint8Array(reader.result));
                } else {
                  reject(new Error('FileReader did not return ArrayBuffer'));
                }
              };
              reader.onerror = () => reject(new Error('FileReader failed'));
              
              // Additional validation before calling readAsArrayBuffer
              try {
                reader.readAsArrayBuffer(chunk);
              } catch (readerError) {
                reject(new Error(`Chunk FileReader.readAsArrayBuffer failed: ${readerError instanceof Error ? readerError.message : 'Unknown error'}`));
              }
            });
          }
        } catch (error) {
          console.error(`❌ Failed to convert chunk ${i} to ArrayBuffer:`, error);
          throw new Error(`Chunk conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        
        console.log(`📤 Sending chunk ${i} for ${file.name}, size: ${uint8Array.byteLength} bytes`);
        
        pendingChunks.add(i);
        
        conn.send({
          type: 'file-chunk',
          fileName: file.name,
          chunkIndex: i,
          totalChunks,
          data: uint8Array,
          isLast: i === totalChunks - 1,
          timestamp: Date.now(),
        });

        sentBytes += chunk.size;

        // Wait for acknowledgment before continuing (with timeout)
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            if (pendingChunks.has(i)) {
              reject(new Error(`Chunk ${i} acknowledgment timeout`));
            }
          }, 5000); // 5 second timeout per chunk

          const checkAck = () => {
            if (!pendingChunks.has(i)) {
              clearTimeout(timeout);
              resolve();
            } else {
              setTimeout(checkAck, 50);
            }
          };
          checkAck();
        });

        // Small delay to prevent overwhelming the connection
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Wait for final confirmation from receiver
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Final confirmation timeout'));
        }, 10000); // 10 second timeout for final confirmation

        const checkComplete = (data: any) => {
          if (data.type === 'file-complete' && data.fileName === file.name && data.verified === true) {
            clearTimeout(timeout);
            conn.off('data', checkComplete);
            resolve();
          }
        };
        
        conn.on('data', checkComplete);
      });

    } catch (error) {
      console.error(`💥 File transfer failed for ${file.name}:`, error);
      
      // Send error notification to receiver
      try {
        conn.send({
          type: 'transfer-error',
          fileName: file.name,
          error: `Transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: Date.now(),
        });
      } catch (sendError) {
        console.error('❌ Failed to send error notification:', sendError);
      }
      
      // Reset transfer state
      setTransferStats({ totalBytes: 0, sentBytes: 0, progress: 0 });
      
      // Re-throw error for upper level handling
      throw error;
    } finally {
      // Clean up temporary listener
      conn.off('data', handleChunkAck);
    }
  };

  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      // Could add a toast notification here
      alert('Share URL copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const stopSharing = () => {
    setIsSharing(false);
    setShareUrl('');
    setConnections(0);
    setTransferStats({ totalBytes: 0, sentBytes: 0, progress: 0 });
    connectionsRef.current.forEach(conn => conn.close());
    connectionsRef.current.clear();
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-space-grotesk font-semibold text-gray-800 dark:text-white mb-2 tracking-tight">Connection Error</h2>
          <p className="font-inter text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Establishing peer connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 safe-area-insets">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <button
            onClick={onBack}
            className="flex items-center touch-target text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors duration-200 rounded-lg"
            aria-label="Go back to home"
          >
            <ArrowLeft className="w-5 h-5 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <h1 className="text-xl sm:text-2xl font-space-grotesk font-bold text-gray-800 dark:text-white tracking-tight">Share Files</h1>
          <div className="w-12 sm:w-16"></div>
        </div>

        {!isSharing ? (
          <>
            {/* File Drop Zone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 ${
                isDragActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
              {isDragActive ? (
                <p className="font-inter text-blue-600 dark:text-blue-400 font-medium text-sm sm:text-base">Drop files here</p>
              ) : (
                <>
                  <p className="font-inter text-gray-600 dark:text-gray-400 mb-2 text-sm sm:text-base">
                    Drag & drop files here, or <span className="hidden sm:inline">click to select</span><span className="sm:hidden">tap to select</span>
                  </p>
                  <p className="text-xs sm:text-sm font-inter text-gray-500 dark:text-gray-500">
                    Support for multiple files of any size
                  </p>
                </>
              )}
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-space-grotesk font-semibold text-gray-800 dark:text-white mb-4 tracking-tight">
                  Selected Files ({files.length})
                </h3>
                <div className="space-y-2">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center space-x-3">
                        {file.preview ? (
                          <img src={file.preview} alt={file.name} className="w-8 h-8 object-cover rounded" />
                        ) : (
                          <File className="w-8 h-8 text-gray-400" />
                        )}
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white">{file.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatFileSize(file.size || 0)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors duration-200"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Password Protection */}
            {files.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                  Security Options
                </h3>
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {password ? <Lock className="w-5 h-5 text-green-600" /> : <Unlock className="w-5 h-5 text-gray-400" />}
                      <label className="font-medium text-gray-800 dark:text-white">
                        Password Protection
                      </label>
                    </div>
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password (optional)"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors duration-200"
                    autoComplete="new-password"
                    aria-label="Enter password to protect files (optional)"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Add a password to protect your files during transfer
                  </p>
                </div>
              </div>
            )}

            {/* Start Sharing Button with Large File Support */}
            {files.length > 0 && (
              <div className="mt-8 space-y-4">
                {/* Large File Mode Indicator */}
                {largeFileMode && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <Database className="w-5 h-5 text-amber-600" />
                      <div>
                        <h4 className="font-semibold text-amber-800 dark:text-amber-200">Large File Mode Active</h4>
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          Files will be processed and stored locally for efficient transfer. This may take a few moments for very large files.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* File Processing Progress */}
                {Object.keys(processingFiles).length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-800 dark:text-white">Processing Files...</h4>
                    {Object.entries(processingFiles).map(([fileName, progress]) => (
                      <div key={fileName} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-300">{fileName}</span>
                          <span className="text-blue-600 dark:text-blue-400">{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-center">
                  <button
                    onClick={largeFileMode ? startSharingLargeFiles : startSharing}
                    disabled={Object.keys(processingFiles).length > 0}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
                  >
                    {Object.keys(processingFiles).length > 0 
                      ? 'Processing Files...' 
                      : largeFileMode 
                        ? 'Process & Start Sharing' 
                        : 'Start Sharing Files'
                    }
                  </button>
                  
                  {largeFileMode && Object.keys(processingFiles).length === 0 && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Large files detected. Files will be processed for optimal transfer.
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Sharing Mode */
          <div className="space-y-6">
            {/* Share URL */}
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Share Link</h3>
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white transition-colors duration-200"
                  aria-label="Share URL - click copy button to copy"
                  tabIndex={-1}
                />
                <button
                  onClick={copyShareUrl}
                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Share this link with people you want to send files to
              </p>
            </div>

            {/* Connection Status */}
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Status</h3>
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-800 dark:text-white">{connections} connected</span>
                </div>
              </div>

              {transferStats.totalBytes > 0 && (
                <div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>Transfer Progress (Verified)</span>
                    <span>{transferStats.progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300 progress-bar"
                      style={{ width: `${transferStats.progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <span>{formatFileSize(transferStats.sentBytes)} verified</span>
                    <span>{formatFileSize(transferStats.totalBytes)} total</span>
                  </div>
                  
                  {/* Individual file status */}
                  <div className="mt-4 space-y-2">
                    {files.map(file => (
                      <div key={file.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400 truncate flex-1 mr-2">
                          {file.name}
                        </span>
                        <div className="flex items-center space-x-2">
                          {completedTransfers[file.name] ? (
                            <span className="text-green-600 font-medium">✓ Complete & Verified</span>
                          ) : transferErrors[file.name] ? (
                            <span className="text-red-600 font-medium" title={transferErrors[file.name]}>
                              ✗ Failed
                            </span>
                          ) : connections > 0 ? (
                            <span className="text-blue-600 font-medium">📡 Ready</span>
                          ) : (
                            <span className="text-gray-500 font-medium">⏸ Waiting</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={stopSharing}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200"
                >
                  Stop Sharing
                </button>
              </div>
            </div>

            {/* File List */}
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Sharing {files.length} file{files.length !== 1 ? 's' : ''}
              </h3>
              <div className="space-y-2">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-2">
                    <div className="flex items-center space-x-3">
                      <File className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-800 dark:text-white">{file.name}</span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

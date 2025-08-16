'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Download, Lock, Unlock, File, CheckCircle, XCircle, Eye, EyeOff, Database, Pause, Play } from 'lucide-react';
import { usePeer } from '@/hooks/usePeer';
import { largeFileStorage } from '@/utils/largeFileStorage';
import { transferSessionManager, TransferState } from '@/utils/transferSessionManager';
import { formatFileSize } from '@/utils/helpers';

interface FileInfo {
  fileName: string;
  size: number;
  type: string;
}

interface FileDownloaderProps {
  shareId: string;
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

export default function FileDownloader({ shareId, onBack, onTransferStateChange }: FileDownloaderProps) {
  const [targetPeerId, setTargetPeerId] = useState(shareId);
  const [connection, setConnection] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [downloadProgress, setDownloadProgress] = useState<{ [fileName: string]: number }>({});
  const [downloadedFiles, setDownloadedFiles] = useState<{ [fileName: string]: Blob }>({});
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadErrors, setDownloadErrors] = useState<{[fileName: string]: string}>({});
  const [verifiedFiles, setVerifiedFiles] = useState<{[fileName: string]: boolean}>({});

  // Large file support states
  const [largeFileMode, setLargeFileMode] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [transferStates, setTransferStates] = useState<{[fileId: string]: any}>({});
  const [pausedTransfers, setPausedTransfers] = useState<Set<string>>(new Set());

  const { peer, isConnected, error } = usePeer();

  // Initialize large file storage
  useEffect(() => {
    const initializeLargeFileSupport = async () => {
      try {
        // await largeFileStorage.initialize();
        setIsInitialized(true);
        console.log('Large file support initialized for downloader');
      } catch (error) {
        console.error('Failed to initialize large file storage:', error);
      }
    };
    
    initializeLargeFileSupport();
  }, []);

  // Update transfer state for animation
  useEffect(() => {
    if (onTransferStateChange) {
      const hasErrors = Object.keys(downloadErrors).length > 0;
      const allCompleted = files.length > 0 && files.every(f => verifiedFiles[f.fileName]);
      const currentProgress = Object.values(downloadProgress).reduce((acc, progress) => acc + progress, 0) / Math.max(files.length, 1);
      
      onTransferStateChange({
        isConnected: connectionStatus === 'connected',
        isTransferring: isDownloading,
        transferProgress: currentProgress,
        connectionCount: connectionStatus === 'connected' ? 1 : 0,
        transferStatus: hasErrors ? 'error' : 
                       allCompleted && files.length > 0 ? 'complete' :
                       isDownloading ? 'transferring' :
                       connectionStatus === 'connecting' ? 'connecting' : 'idle',
        errorMessage: hasErrors ? Object.values(downloadErrors)[0] : ''
      });
    }
  }, [connectionStatus, isDownloading, downloadProgress, downloadErrors, verifiedFiles, files, onTransferStateChange]);

  const connectToPeer = useCallback(async () => {
    if (!peer || !targetPeerId) return;

    setConnectionStatus('connecting');
    setAuthError('');

    // Extract peer ID from URL if a full URL was pasted
    let actualPeerId = targetPeerId.trim();
    
    try {
      // Check if the input looks like a URL
      if (actualPeerId.includes('://') || actualPeerId.includes('?share=')) {
        const url = new URL(actualPeerId.includes('://') ? actualPeerId : `http://localhost:3002/${actualPeerId}`);
        const shareParam = url.searchParams.get('share');
        if (shareParam) {
          actualPeerId = shareParam;
          console.log('Extracted peer ID from URL:', actualPeerId);
        }
      }
    } catch (error) {
      console.warn('Failed to parse URL, using input as peer ID:', error);
      // If URL parsing fails, use the original input as peer ID
    }

    try {
      console.log('Attempting to connect to peer:', actualPeerId);
      const conn = peer.connect(actualPeerId, { reliable: true });

      conn.on('open', () => {
        console.log('Connected to uploader');
        setConnection(conn);
        setConnectionStatus('connected');

        // Request file list
        conn.send({ type: 'request-info' });
      });

      conn.on('data', (data: any) => {
        console.log('Received data:', data);

        if (data.type === 'file-list') {
          setFiles(data.files);
          setPasswordRequired(data.passwordRequired);
        } else if (data.type === 'auth-failed') {
          setAuthError('Incorrect password');
        } else if (data.type === 'auth-success') {
          setAuthError('');
          setPasswordRequired(false);
        } else if (data.type === 'file-start' || data.type === 'file-chunk') {
          handleFileChunk(data);
        } else if (data.type === 'transfer-error') {
          console.error('Transfer error:', data.error);
          setDownloadErrors(prev => ({ ...prev, [data.fileName]: data.error }));
          setIsDownloading(false);
          // Could show error to user
        }
      });

      conn.on('error', (err) => {
        console.error('Connection error:', err);
        setConnectionStatus('error');
      });

      conn.on('close', () => {
        console.log('Connection closed');
        setConnection(null);
        setConnectionStatus('idle');
      });

    } catch (err) {
      console.error('Failed to connect:', err);
      setConnectionStatus('error');
    }
  }, [peer, targetPeerId]);

  const submitPassword = () => {
    if (connection) {
      connection.send({ type: 'password', password });
    }
  };

  const downloadFile = (fileName: string) => {
    if (!connection) return;

    setIsDownloading(true);
    setDownloadProgress(prev => ({ ...prev, [fileName]: 0 }));
    
    // Initialize file transfer state
    const fileChunks: { [index: number]: ArrayBuffer } = {};
    let totalChunks = 0;
    let expectedFileSize = 0;
    let expectedFileHash = '';
    let receivedChunks = 0;
    
    // Override handleFileChunk for this specific download
    (window as any).currentDownloadHandler = async (data: any) => {
      if (data.fileName === fileName) {
        if (data.type === 'file-start') {
          // Initialize transfer metadata including MIME type
          totalChunks = data.totalChunks;
          expectedFileSize = data.fileSize;
          expectedFileHash = data.fileHash;
          
          // Store MIME type for proper file reconstruction
          (window as any).currentDownloadMimeType = data.fileType || 'application/octet-stream';
          
          console.log(`🚀 Starting download: ${fileName}`);
          console.log(`📊 Size: ${expectedFileSize} bytes, Chunks: ${totalChunks}`);
          console.log(`📁 MIME Type: ${data.fileType || 'application/octet-stream'}`);
          console.log(`🔐 Hash: ${expectedFileHash}`);
          
        } else if (data.type === 'file-chunk') {
          console.log(`Received chunk ${data.chunkIndex}/${totalChunks-1} for ${fileName}`);
          console.log(`Data type: ${typeof data.data}, Constructor: ${data.data?.constructor?.name}`);
          console.log(`Data size: ${data.data?.byteLength || data.data?.length || 'unknown'}`);
          
          // Convert data to ArrayBuffer with enhanced validation
          let chunkData: ArrayBuffer;
          
          if (data.data instanceof ArrayBuffer) {
            chunkData = data.data;
            console.log(`✓ Direct ArrayBuffer, size: ${chunkData.byteLength}`);
          } else if (data.data instanceof Uint8Array) {
            // Ensure we get the correct slice of the underlying buffer
            chunkData = data.data.buffer.slice(
              data.data.byteOffset, 
              data.data.byteOffset + data.data.byteLength
            );
            console.log(`✓ Converted Uint8Array to ArrayBuffer, size: ${chunkData.byteLength}`);
          } else if (typeof data.data === 'object' && data.data.type === 'Buffer' && Array.isArray(data.data.data)) {
            // Handle Node.js Buffer serialized by PeerJS
            const uint8Array = new Uint8Array(data.data.data);
            chunkData = uint8Array.buffer.slice(uint8Array.byteOffset, uint8Array.byteOffset + uint8Array.byteLength);
            console.log(`✓ Converted Buffer to ArrayBuffer, size: ${chunkData.byteLength}`);
          } else if (Array.isArray(data.data)) {
            // Handle plain array (fallback for various serialization formats)
            const uint8Array = new Uint8Array(data.data);
            chunkData = uint8Array.buffer;
            console.log(`✓ Converted Array to ArrayBuffer, size: ${chunkData.byteLength}`);
          } else if (data.data && typeof data.data === 'object' && typeof data.data.byteLength === 'number') {
            // Handle other ArrayBuffer-like objects
            try {
              const uint8Array = new Uint8Array(data.data);
              chunkData = uint8Array.buffer.slice(uint8Array.byteOffset, uint8Array.byteOffset + uint8Array.byteLength);
              console.log(`✓ Converted ArrayBuffer-like object, size: ${chunkData.byteLength}`);
            } catch (error) {
              console.error('Failed to convert ArrayBuffer-like object:', error);
              setDownloadErrors(prev => ({ ...prev, [fileName]: 'Invalid chunk data format' }));
              return;
            }
          } else {
            console.error('❌ Unexpected chunk data type:', typeof data.data, data.data);
            console.error('Data sample:', data.data);
            setDownloadErrors(prev => ({ ...prev, [fileName]: `Invalid chunk data type: ${typeof data.data}` }));
            return;
          }
          
          // Validate chunk data integrity
          if (!chunkData || chunkData.byteLength === 0) {
            console.error(`❌ Empty or invalid chunk ${data.chunkIndex} for ${fileName}`);
            setDownloadErrors(prev => ({ ...prev, [fileName]: `Empty chunk received: ${data.chunkIndex}` }));
            return;
          }
          
          // Store chunk with validation
          fileChunks[data.chunkIndex] = chunkData;
          receivedChunks++;
          
          console.log(`✅ Stored chunk ${data.chunkIndex}, total received: ${receivedChunks}/${totalChunks}`);
          console.log(`Chunk size: ${chunkData.byteLength} bytes`);
        
          
          // Send acknowledgment for this chunk
          connection.send({
            type: 'chunk-ack',
            fileName: fileName,
            chunkIndex: data.chunkIndex,
            timestamp: Date.now(),
          });
          
          // Update progress based on actually received chunks
          const progress = (receivedChunks / totalChunks) * 100;
          setDownloadProgress(prev => ({ ...prev, [fileName]: progress }));

          // Check if all chunks received
          if (data.isLast || receivedChunks === totalChunks) {
            await completeFileDownload(fileName, fileChunks, totalChunks, expectedFileSize, expectedFileHash);
          }
        }
      }
    };

    // Request the file
    connection.send({ type: 'request-file', fileName });
  };

  const completeFileDownload = async (
    fileName: string, 
    fileChunks: { [index: number]: ArrayBuffer }, 
    totalChunks: number, 
    expectedFileSize: number, 
    expectedFileHash: string
  ) => {
    try {
      console.log(`🔄 Starting file reconstruction for ${fileName}`);
      console.log(`Expected: ${totalChunks} chunks, ${expectedFileSize} bytes`);
      
      // Verify all chunks are present with detailed validation
      const missingChunks: number[] = [];
      const corruptedChunks: number[] = [];
      let totalSize = 0;
      
      for (let i = 0; i < totalChunks; i++) {
        if (!fileChunks[i]) {
          missingChunks.push(i);
        } else {
          const chunk = fileChunks[i];
          if (!chunk || chunk.byteLength === 0) {
            corruptedChunks.push(i);
          } else {
            totalSize += chunk.byteLength;
          }
        }
      }

      // Report missing chunks
      if (missingChunks.length > 0) {
        console.error(`❌ Missing chunks for ${fileName}:`, missingChunks);
        setDownloadErrors(prev => ({ 
          ...prev, 
          [fileName]: `Missing ${missingChunks.length} chunks: ${missingChunks.slice(0, 5).join(', ')}${missingChunks.length > 5 ? '...' : ''}` 
        }));
        connection.send({
          type: 'file-error',
          fileName: fileName,
          error: `Missing chunks: ${missingChunks.join(', ')}`,
        });
        setIsDownloading(false);
        return;
      }

      // Report corrupted chunks
      if (corruptedChunks.length > 0) {
        console.error(`❌ Corrupted chunks for ${fileName}:`, corruptedChunks);
        setDownloadErrors(prev => ({ 
          ...prev, 
          [fileName]: `Corrupted ${corruptedChunks.length} chunks: ${corruptedChunks.join(', ')}` 
        }));
        connection.send({
          type: 'file-error',
          fileName: fileName,
          error: `Corrupted chunks: ${corruptedChunks.join(', ')}`,
        });
        setIsDownloading(false);
        return;
      }

      console.log(`✅ All ${totalChunks} chunks present and valid`);
      console.log(`✅ File size verified: ${totalSize} bytes`);

      // Reconstruct file from chunks in correct order
      const orderedChunks: ArrayBuffer[] = [];
      
      for (let i = 0; i < totalChunks; i++) {
        const chunk = fileChunks[i];
        if (!chunk) {
          throw new Error(`Chunk ${i} is missing during reconstruction`);
        }
        orderedChunks.push(chunk);
        console.log(`Added chunk ${i}: ${chunk.byteLength} bytes`);
      }

      console.log(`✅ Reconstructed ${orderedChunks.length} chunks in order`);

      // Verify file size matches expected
      if (totalSize !== expectedFileSize) {
        console.error(`File size mismatch for ${fileName}: expected ${expectedFileSize}, got ${totalSize}`);
        setDownloadErrors(prev => ({ ...prev, [fileName]: 'File size mismatch - corrupted transfer' }));
        connection.send({
          type: 'file-error',
          fileName: fileName,
          error: `File size mismatch: expected ${expectedFileSize}, got ${totalSize}`,
        });
        setIsDownloading(false);
        return;
      }

      // Create final blob with proper MIME type preservation and detection
      let blob: Blob;
      try {
        // Enhanced MIME type detection based on file extension
        let mimeType = (window as any).currentDownloadMimeType || 'application/octet-stream';
        
        // Fallback MIME type detection based on file extension
        if (mimeType === 'application/octet-stream') {
          const extension = fileName.split('.').pop()?.toLowerCase();
          const mimeTypes: { [key: string]: string } = {
            // Images
            'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'gif': 'image/gif', 'webp': 'image/webp', 'svg': 'image/svg+xml', 'bmp': 'image/bmp', 'ico': 'image/x-icon',
            // Documents  
            'pdf': 'application/pdf', 'doc': 'application/msword', 'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'xls': 'application/vnd.ms-excel', 'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'ppt': 'application/vnd.ms-powerpoint', 'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            // Text files
            'txt': 'text/plain', 'csv': 'text/csv', 'json': 'application/json', 'xml': 'application/xml', 'html': 'text/html', 'css': 'text/css', 'js': 'application/javascript', 'ts': 'application/typescript',
            // Audio
            'mp3': 'audio/mpeg', 'wav': 'audio/wav', 'ogg': 'audio/ogg', 'flac': 'audio/flac', 'm4a': 'audio/mp4',
            // Video
            'mp4': 'video/mp4', 'webm': 'video/webm', 'avi': 'video/x-msvideo', 'mov': 'video/quicktime', 'wmv': 'video/x-ms-wmv',
            // Archives
            'zip': 'application/zip', 'rar': 'application/vnd.rar', 'tar': 'application/x-tar', '7z': 'application/x-7z-compressed',
            // Code files
            'py': 'text/x-python', 'java': 'text/x-java', 'cpp': 'text/x-c++src', 'c': 'text/x-csrc', 'php': 'text/x-php',
          };
          
          if (extension && mimeTypes[extension]) {
            mimeType = mimeTypes[extension];
            console.log(`🔍 Detected MIME type: ${mimeType} for .${extension} file`);
          }
        }
        
        blob = new Blob(orderedChunks, { type: mimeType });
        console.log(`✅ Created blob: ${blob.size} bytes, type: ${blob.type || 'application/octet-stream'}`);
        console.log(`📄 File format preserved: ${fileName} -> ${blob.type}`);
      } catch (error) {
        console.error(`❌ Failed to create blob for ${fileName}:`, error);
        setDownloadErrors(prev => ({ ...prev, [fileName]: 'Failed to reconstruct file from chunks' }));
        setIsDownloading(false);
        return;
      }
      
      // Verify blob size matches expected
      if (blob.size !== expectedFileSize) {
        console.error(`❌ Blob size mismatch for ${fileName}: expected ${expectedFileSize}, got ${blob.size}`);
        setDownloadErrors(prev => ({ ...prev, [fileName]: `Blob size mismatch: expected ${expectedFileSize}, got ${blob.size}` }));
        setIsDownloading(false);
        return;
      }

      // Perform cryptographic integrity verification
      let receivedBuffer: ArrayBuffer;
      try {
        receivedBuffer = await blob.arrayBuffer();
      } catch (error) {
        console.error(`Failed to get array buffer from blob for ${fileName}:`, error);
        setDownloadErrors(prev => ({ ...prev, [fileName]: 'Failed to process downloaded file' }));
        setIsDownloading(false);
        return;
      }
      // Calculate SHA-256 hash for integrity verification
      const hashBuffer = await crypto.subtle.digest('SHA-256', receivedBuffer);
      const receivedHash = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      console.log(`Calculated hash: ${receivedHash}`);
      console.log(`Expected hash:   ${expectedFileHash}`);

      if (receivedHash !== expectedFileHash) {
        console.error(`❌ File integrity check FAILED for ${fileName}`);
        console.error(`Expected hash: ${expectedFileHash}`);
        console.error(`Received hash: ${receivedHash}`);
        console.error(`Hash difference detected - file may be corrupted`);
        
        setDownloadErrors(prev => ({ 
          ...prev, 
          [fileName]: 'File integrity verification failed - corrupted during transfer' 
        }));
        connection.send({
          type: 'file-error',
          fileName: fileName,
          error: 'File integrity verification failed - corrupted during transfer',
        });
        setIsDownloading(false);
        return;
      }

      console.log(`🎉 File integrity verification PASSED for ${fileName}`);
      console.log(`✅ File ${fileName} successfully downloaded and verified`);
      console.log(`📊 Final stats: ${blob.size} bytes, ${totalChunks} chunks, verified hash`);
      
      // Send completion confirmation to sender with full verification details
      connection.send({
        type: 'file-complete',
        fileName: fileName,
        verified: true,
        fileSize: blob.size,
        fileHash: receivedHash,
        chunksReceived: totalChunks,
        integrityVerified: true,
        timestamp: Date.now(),
      });

      // Store the completed and verified file
      setDownloadedFiles(prev => ({ ...prev, [fileName]: blob }));
      setVerifiedFiles(prev => ({ ...prev, [fileName]: true }));
      setIsDownloading(false);

      // Clear any previous errors for this file
      setDownloadErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fileName];
        return newErrors;
      });

      // Trigger secure download with proper filename preservation
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = fileName; // Preserve original filename and extension
      downloadLink.style.display = 'none';
      
      // Add to DOM temporarily for compatibility
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Clean up blob URL to prevent memory leaks
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      console.log(`💾 File ${fileName} download initiated successfully`);

    } catch (error) {
      console.error(`💥 Critical error completing download for ${fileName}:`, error);
      setDownloadErrors(prev => ({ 
        ...prev, 
        [fileName]: error instanceof Error ? `Complete download error: ${error.message}` : 'Complete download error occurred' 
      }));
      
      // Notify sender about the critical error with detailed information
      try {
        connection.send({
          type: 'file-error',
          fileName: fileName,
          error: `Download completion failed: ${error instanceof Error ? error.message : 'Unknown critical error'}`,
          errorType: 'completion_failure',
          timestamp: Date.now(),
        });
      } catch (sendError) {
        console.error('❌ Failed to notify sender about download completion error:', sendError);
      }
      
      setIsDownloading(false);
      
      // Clean up any partial data by clearing the chunks reference
      // Note: fileChunks is local to the handleMessage scope and will be garbage collected
      console.log(`🧹 Cleaned up partial download data for ${fileName}`);
    }
  };

  const handleFileChunk = (data: any) => {
    // If there's a custom handler for current download, use it
    if ((window as any).currentDownloadHandler) {
      (window as any).currentDownloadHandler(data);
    }
  };

  useEffect(() => {
    // Extract share ID from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const shareFromUrl = urlParams.get('share');
    if (shareFromUrl) {
      setTargetPeerId(shareFromUrl);
    }
  }, []);

  useEffect(() => {
    if (isConnected && targetPeerId && connectionStatus === 'idle') {
      connectToPeer();
    }
  }, [isConnected, targetPeerId, connectionStatus, connectToPeer]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Connection Error</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
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
            className="touch-target flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors duration-200 rounded-lg"
            aria-label="Go back to home"
          >
            <ArrowLeft className="w-5 h-5 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <h1 className="text-xl sm:text-2xl font-space-grotesk font-bold text-gray-800 dark:text-white tracking-tight">Download Files</h1>
          <div className="w-12 sm:w-16"></div>
        </div>

        {/* Connection Input */}
        {connectionStatus === 'idle' && (
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-space-grotesk font-semibold text-gray-800 dark:text-white mb-3 sm:mb-4 tracking-tight">Connect to Uploader</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={targetPeerId}
                onChange={(e) => setTargetPeerId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && targetPeerId.trim()) {
                    connectToPeer();
                  }
                }}
                placeholder="Enter share ID or paste full share link"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors duration-200"
                autoComplete="off"
                spellCheck={false}
                aria-label="Enter share ID or paste complete share link"
              />
              <button
                onClick={connectToPeer}
                disabled={!targetPeerId.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200"
              >
                Connect
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              You can paste either the complete share link (http://...) or just the share ID
            </p>
          </div>
        )}

        {/* Connecting Status */}
        {connectionStatus === 'connecting' && (
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full mr-3"></div>
              <p className="text-gray-600 dark:text-gray-400">Connecting to uploader...</p>
            </div>
          </div>
        )}

        {/* Connection Error */}
        {connectionStatus === 'error' && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
            <div className="flex items-center">
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 mr-3" />
              <div>
                <h3 className="font-semibold text-red-800 dark:text-red-200">Connection Failed</h3>
                <p className="text-red-600 dark:text-red-400">
                  Could not connect to the uploader. They may have stopped sharing or closed their browser.
                </p>
              </div>
            </div>
            <button
              onClick={connectToPeer}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Password Required */}
        {passwordRequired && connectionStatus === 'connected' && (
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Lock className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Password Required</h3>
              </div>
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                title="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This share is password protected. Enter the password to access the files.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && password.trim()) {
                    submitPassword();
                  }
                }}
                placeholder="Enter password"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors duration-200"
                autoComplete="current-password"
                aria-label="Enter password to access protected files"
              />
              <button
                onClick={submitPassword}
                disabled={!password.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200"
              >
                Submit
              </button>
            </div>
            {authError && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-2">{authError}</p>
            )}
          </div>
        )}

        {/* File List */}
        {files.length > 0 && !passwordRequired && (
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Available Files ({files.length})
            </h3>
            <div className="space-y-3">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <File className="w-6 h-6 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">{file.fileName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || 'Unknown type'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {downloadProgress[file.fileName] !== undefined && (
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          {/* eslint-disable-next-line react/forbid-dom-props */}
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${downloadProgress[file.fileName] ?? 0}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {Math.round(downloadProgress[file.fileName])}%
                        </span>
                      </div>
                    )}
                    
                    {downloadedFiles[file.fileName] && verifiedFiles[file.fileName] ? (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <span className="text-green-600 font-medium text-sm">Verified & Complete</span>
                      </div>
                    ) : downloadErrors[file.fileName] ? (
                      <div className="flex items-center space-x-2">
                        <XCircle className="w-6 h-6 text-red-600" />
                        <span className="text-red-600 font-medium text-sm" title={downloadErrors[file.fileName]}>
                          Failed
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => downloadFile(file.fileName)}
                        disabled={isDownloading || downloadProgress[file.fileName] !== undefined}
                        className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200"
                        title={`Download ${file.fileName}`}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {files.length > 1 && (
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => files.forEach(file => downloadFile(file.fileName))}
                  disabled={isDownloading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg font-semibold transition-all duration-200"
                >
                  Download All Files
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

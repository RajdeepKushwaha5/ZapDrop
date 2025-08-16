// File Preview System Integration Demo
// This file demonstrates how to integrate the File Preview System with existing ZapDrop components

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Eye, Download, X } from 'lucide-react';
import FilePreviewModal from './FilePreviewModal';
import { getFilePreviewCapabilities, PreviewableFile } from '../utils/filePreviewCapabilities';
import { filePreviewService, PreviewData } from '../utils/filePreviewService';
import { formatFileSize } from '../utils/helpers';

// Example file data structure that would come from existing file transfer components
interface TransferredFile {
  fileName: string;
  size: number;
  type: string;
  chunks: Uint8Array[];
  metadata?: {
    uploadedAt: Date;
    shareId: string;
    senderId: string;
  };
}

// Demo component showing preview integration with file download list
interface FileListWithPreviewProps {
  files: TransferredFile[];
  onDownload: (file: TransferredFile) => void;
}

export function FileListWithPreview({ files, onDownload }: FileListWithPreviewProps) {
  const [previewFile, setPreviewFile] = useState<PreviewableFile | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Initialize preview service
  const previewService = useMemo(() => filePreviewService, []);

  const handlePreviewClick = useCallback(async (file: TransferredFile) => {
    try {
      setPreviewLoading(true);
      setPreviewError(null);
      
      // Convert transferred file to previewable file format
      const previewableFile: PreviewableFile = {
        fileName: file.fileName,
        size: file.size,
        type: file.type,
        capabilities: getFilePreviewCapabilities(file.fileName, file.type)
      };

      setPreviewFile(previewableFile);
      setIsPreviewOpen(true);

      // Generate preview from file chunks
      if (previewableFile.capabilities.canPreview && file.chunks.length > 0) {
        // Convert Uint8Array chunks to ArrayBuffer chunks
        const arrayBufferChunks: ArrayBuffer[] = file.chunks.map(chunk => {
          // Create a new ArrayBuffer from the Uint8Array
          const buffer = new ArrayBuffer(chunk.length);
          const view = new Uint8Array(buffer);
          view.set(chunk);
          return buffer;
        });
        const preview = await previewService.generatePreview(previewableFile, arrayBufferChunks);
        setPreviewData(preview);
      }
    } catch (error) {
      console.error('Preview generation failed:', error);
      setPreviewError(error instanceof Error ? error.message : 'Failed to generate preview');
    } finally {
      setPreviewLoading(false);
    }
  }, [previewService]);

  const handleClosePreview = useCallback(() => {
    setIsPreviewOpen(false);
    setPreviewFile(null);
    setPreviewData(null);
    setPreviewError(null);
  }, []);

  const handleDownload = useCallback((file: TransferredFile) => {
    onDownload(file);
  }, [onDownload]);

  const handlePreviewDownload = useCallback(() => {
    const file = files.find(f => f.fileName === previewFile?.fileName);
    if (file) {
      handleDownload(file);
    }
  }, [files, previewFile, handleDownload]);

  return (
    <>
      <div className="space-y-3">
        {files.map((file, index) => {
          const capabilities = getFilePreviewCapabilities(file.fileName, file.type);
          
          return (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {capabilities.canPreview ? (
                    <Eye className="w-5 h-5 text-blue-500" />
                  ) : (
                    <X className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white truncate max-w-xs">
                    {file.fileName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.size)} • {capabilities.previewType}
                    {capabilities.canPreview && (
                      <span className="text-green-600 dark:text-green-400 ml-2">
                        • Preview Available
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Preview Button */}
                {capabilities.canPreview && (
                  <button
                    onClick={() => handlePreviewClick(file)}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors duration-200"
                    title="Preview file before downloading"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">Preview</span>
                  </button>
                )}

                {/* Download Button */}
                <button
                  onClick={() => handleDownload(file)}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors duration-200"
                  title="Download file"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* File Preview Modal */}
      <FilePreviewModal
        fileName={previewFile?.fileName || ''}
        fileSize={previewFile?.size || 0}
        previewData={previewData}
        isOpen={isPreviewOpen}
        onClose={handleClosePreview}
        onDownload={handlePreviewDownload}
        loading={previewLoading}
        error={previewError}
      />
    </>
  );
}

// Demo usage with sample data
export function PreviewSystemDemo() {
  const [sampleFiles] = useState<TransferredFile[]>([
    {
      fileName: 'sample-image.jpg',
      size: 1024 * 1024 * 2.5, // 2.5 MB
      type: 'image/jpeg',
      chunks: [], // Would contain actual file chunks
      metadata: {
        uploadedAt: new Date(),
        shareId: 'demo123',
        senderId: 'peer-123'
      }
    },
    {
      fileName: 'document.pdf',
      size: 1024 * 1024 * 5, // 5 MB
      type: 'application/pdf',
      chunks: [], // Would contain actual file chunks
      metadata: {
        uploadedAt: new Date(),
        shareId: 'demo123',
        senderId: 'peer-123'
      }
    },
    {
      fileName: 'presentation.pptx',
      size: 1024 * 1024 * 10, // 10 MB
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      chunks: [], // Would contain actual file chunks
      metadata: {
        uploadedAt: new Date(),
        shareId: 'demo123',
        senderId: 'peer-123'
      }
    },
    {
      fileName: 'video.mp4',
      size: 1024 * 1024 * 50, // 50 MB
      type: 'video/mp4',
      chunks: [], // Would contain actual file chunks
      metadata: {
        uploadedAt: new Date(),
        shareId: 'demo123',
        senderId: 'peer-123'
      }
    },
    {
      fileName: 'code.js',
      size: 1024 * 15, // 15 KB
      type: 'application/javascript',
      chunks: [], // Would contain actual file chunks
      metadata: {
        uploadedAt: new Date(),
        shareId: 'demo123',
        senderId: 'peer-123'
      }
    },
    {
      fileName: 'large-archive.zip',
      size: 1024 * 1024 * 100, // 100 MB - too large for preview
      type: 'application/zip',
      chunks: [], // Would contain actual file chunks
      metadata: {
        uploadedAt: new Date(),
        shareId: 'demo123',
        senderId: 'peer-123'
      }
    }
  ]);

  const handleDownload = useCallback((file: TransferredFile) => {
    // In a real implementation, this would trigger the actual download
    console.log('Downloading file:', file.fileName);
    
    // Create a blob from chunks and trigger download
    // const blob = new Blob(file.chunks, { type: file.type });
    // const url = URL.createObjectURL(blob);
    // const a = document.createElement('a');
    // a.href = url;
    // a.download = file.fileName;
    // document.body.appendChild(a);
    // a.click();
    // document.body.removeChild(a);
    // URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          ZapDrop File Preview System
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Preview files before downloading them. Supports images, documents, videos, audio, and text files.
        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Available Files
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Click &ldquo;Preview&rdquo; to see supported files before downloading. Some files may show partial previews for large sizes.
        </p>
      </div>

      <FileListWithPreview
        files={sampleFiles}
        onDownload={handleDownload}
      />

      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Preview System Features:
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• 📸 Image preview with zoom, rotation, and fullscreen support</li>
          <li>• 🎥 Video preview with playback controls and fullscreen</li>
          <li>• 🎵 Audio preview with media controls</li>
          <li>• 📄 Document preview (PDF, DOCX, PPTX, XLSX)</li>
          <li>• 📝 Text file preview with syntax highlighting</li>
          <li>• ⚡ Streaming preview for large files</li>
          <li>• 🔒 Secure client-side processing</li>
          <li>• ⌨️ Keyboard shortcuts for quick navigation</li>
          <li>• 📱 Responsive design for all screen sizes</li>
          <li>• 🌙 Dark/Light mode support</li>
        </ul>
      </div>
    </div>
  );
}

export default PreviewSystemDemo;

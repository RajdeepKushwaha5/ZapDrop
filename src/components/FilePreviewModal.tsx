'use client';

import React, { useEffect, useRef } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { PreviewData } from '../utils/filePreviewService';
import { formatFileSize } from '../utils/helpers';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  fileSize: number;
  previewData: PreviewData | null;
  loading: boolean;
  error: string | null;
  onDownload?: () => void;
}

export default function FilePreviewModal({
  isOpen,
  onClose,
  fileName,
  fileSize,
  previewData,
  loading,
  error,
  onDownload
}: FilePreviewModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Close modal on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const renderPreviewContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-300">Loading preview...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-96 text-red-600 dark:text-red-400">
          <div className="text-center">
            <X className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Preview Error</p>
            <p className="text-sm mt-2">{error}</p>
          </div>
        </div>
      );
    }

    if (!previewData) {
      return (
        <div className="flex items-center justify-center h-96 text-gray-600 dark:text-gray-300">
          <div className="text-center">
            <X className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No Preview Available</p>
            <p className="text-sm mt-2">This file type cannot be previewed</p>
          </div>
        </div>
      );
    }

    // Render based on file type and preview data
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
    const isImage = previewData.mimeType.startsWith('image/');
    const isVideo = previewData.mimeType.startsWith('video/');
    const isAudio = previewData.mimeType.startsWith('audio/');
    const isText = previewData.mimeType.startsWith('text/') || ['txt', 'md', 'json', 'js', 'ts', 'jsx', 'tsx', 'css', 'html'].includes(fileExtension);
    const isPdf = previewData.mimeType === 'application/pdf';

    if (isImage) {
      return (
        <div className="flex items-center justify-center max-h-[70vh] overflow-auto">
          <img
            src={previewData.dataUrl}
            alt={fileName}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      );
    }

    if (isText) {
      // For text files, we need to decode the data URL
      const textContent = previewData.dataUrl.includes(',') 
        ? decodeURIComponent(escape(atob(previewData.dataUrl.split(',')[1])))
        : 'Cannot display text content';
      
      return (
        <div className="max-h-[70vh] overflow-auto">
          <pre className="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-800 p-4 rounded-lg font-mono">
            {textContent}
          </pre>
        </div>
      );
    }

    if (isPdf) {
      return (
        <div className="max-h-[70vh] overflow-auto">
          <iframe
            src={previewData.dataUrl}
            className="w-full h-96 border rounded-lg"
            title={`Preview of ${fileName}`}
          />
        </div>
      );
    }

    if (isVideo) {
      return (
        <div className="flex items-center justify-center max-h-[70vh]">
          <video
            src={previewData.dataUrl}
            controls
            className="max-w-full max-h-full rounded-lg"
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    if (isAudio) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
            <audio
              src={previewData.dataUrl}
              controls
              className="w-full max-w-sm"
              preload="metadata"
            >
              Your browser does not support the audio tag.
            </audio>
          </div>
        </div>
      );
    }

    // Fallback for unsupported types
    return (
      <div className="flex items-center justify-center h-96 text-gray-600 dark:text-gray-300">
        <div className="text-center">
          <X className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Unsupported Preview Type</p>
          <p className="text-sm mt-2">Cannot display this file type</p>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {fileName}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatFileSize(fileSize)}
            </p>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            {onDownload && (
              <button
                onClick={onDownload}
                className="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Download file"
              >
                <Download className="w-5 h-5" />
              </button>
            )}
            
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Close preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {renderPreviewContent()}
        </div>
      </div>
    </div>
  );
}

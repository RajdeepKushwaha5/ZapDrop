'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, Image, Music, Video, Archive, File, Play, Eye, Download } from 'lucide-react';

// Simple file preview service
const generateFilePreview = async (file: File) => {
  return new Promise((resolve) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve({
        type: 'image',
        content: reader.result as string,
        fileName: file.name,
        size: file.size,
        mimeType: file.type
      });
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('text/') || file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = () => resolve({
        type: 'text',
        content: reader.result as string,
        fileName: file.name,
        size: file.size,
        mimeType: file.type
      });
      reader.readAsText(file);
    } else {
      resolve({
        type: 'info',
        content: null,
        fileName: file.name,
        size: file.size,
        mimeType: file.type
      });
    }
  });
};

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return Image;
  if (type.startsWith('video/')) return Video;
  if (type.startsWith('audio/')) return Music;
  if (type.startsWith('text/') || type.includes('json')) return FileText;
  if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return Archive;
  return File;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

interface FilePreview {
  type: 'image' | 'text' | 'info';
  content: string | null;
  fileName: string;
  size: number;
  mimeType: string;
}

const FilePreviewTester: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<FilePreview[]>([]);
  const [selectedPreview, setSelectedPreview] = useState<FilePreview | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: File[]) => {
    console.log('Files selected:', files);
    setSelectedFiles(files);
    
    const newPreviews = await Promise.all(
      files.map(file => {
        console.log(`Processing file: ${file.name}, size: ${file.size}, type: ${file.type}`);
        return generateFilePreview(file);
      })
    );
    
    console.log('Generated previews:', newPreviews);
    setPreviews(newPreviews as FilePreview[]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const openPreview = (preview: FilePreview) => {
    setSelectedPreview(preview);
  };

  const closePreview = () => {
    setSelectedPreview(null);
  };

  const clearFiles = () => {
    setSelectedFiles([]);
    setPreviews([]);
    setSelectedPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            File Preview Tester
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Test the file preview functionality by uploading or dragging files
          </p>
        </div>

        {/* File Upload Area */}
        <div
          className={`
            border-2 border-dashed rounded-xl p-8 mb-6 text-center transition-all duration-300
            ${isDragging 
              ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-400' 
              : 'border-gray-300 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500'
            }
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-300">
            Drop files here or click to browse
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Support for images, text files, documents, and more
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
            aria-label="Select files for preview"
          />
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Choose Files
            </button>
            {selectedFiles.length > 0 && (
              <button
                onClick={clearFiles}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* File List */}
        {previews.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
              Selected Files ({previews.length})
            </h2>
            <div className="grid gap-4">
              {previews.map((preview, index) => {
                const IconComponent = getFileIcon(preview.mimeType);
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <IconComponent className="w-8 h-8 text-purple-600" />
                      <div>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                          {preview.fileName}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>Size: {formatFileSize(preview.size)}</span>
                          <span>Type: {preview.mimeType || 'Unknown'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {preview.type !== 'info' && (
                        <button
                          onClick={() => openPreview(preview)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Preview</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {selectedPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b dark:border-gray-600">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                  {selectedPreview.fileName}
                </h2>
                <button
                  onClick={closePreview}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-6 max-h-[70vh] overflow-auto">
                {selectedPreview.type === 'image' && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedPreview.content!}
                    alt={selectedPreview.fileName}
                    className="max-w-full h-auto rounded-lg"
                  />
                )}
                
                {selectedPreview.type === 'text' && (
                  <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap">
                    {selectedPreview.content}
                  </pre>
                )}
              </div>
              
              <div className="p-6 border-t dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Size: {formatFileSize(selectedPreview.size)}</span>
                  <span>Type: {selectedPreview.mimeType}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">
            Testing Instructions
          </h3>
          <ul className="space-y-2 text-blue-700 dark:text-blue-300">
            <li>• Try uploading different file types (images, text files, PDFs, etc.)</li>
            <li>• Check if file names and sizes are displayed correctly</li>
            <li>• Test the preview functionality for supported file types</li>
            <li>• Drag and drop files to test that functionality</li>
            <li>• Verify that multiple files can be selected at once</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FilePreviewTester;

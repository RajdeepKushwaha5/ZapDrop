// File preview streaming and management service
import { FilePreviewCapabilities, PreviewableFile } from './filePreviewCapabilities';

export interface PreviewChunk {
  chunkIndex: number;
  data: ArrayBuffer;
  isLast: boolean;
  totalChunks: number;
}

export interface PreviewRequest {
  fileName: string;
  previewType: string;
  startByte?: number;
  endByte?: number;
  quality?: 'low' | 'medium' | 'high';
}

export interface PreviewData {
  fileName: string;
  dataUrl: string;
  mimeType: string;
  isPartial: boolean;
  loadedBytes: number;
  totalBytes: number;
}

class FilePreviewService {
  private previewCache = new Map<string, PreviewData>();
  private activeStreams = new Map<string, ReadableStream>();
  private chunkBuffers = new Map<string, ArrayBuffer[]>();
  
  // Maximum preview sizes for different types
  private readonly PREVIEW_LIMITS = {
    image: 2 * 1024 * 1024,    // 2MB for image previews
    text: 100 * 1024,          // 100KB for text previews  
    document: 5 * 1024 * 1024, // 5MB for document previews
    video: 10 * 1024 * 1024,   // 10MB for video previews
    audio: 5 * 1024 * 1024,    // 5MB for audio previews
  };

  // Generate preview from file chunks
  async generatePreview(
    file: PreviewableFile,
    chunks: ArrayBuffer[],
    isComplete: boolean = false
  ): Promise<PreviewData | null> {
    if (!file.capabilities.canPreview) {
      return null;
    }

    const cacheKey = `${file.fileName}_${file.size}`;
    
    // Check cache first
    if (this.previewCache.has(cacheKey) && isComplete) {
      return this.previewCache.get(cacheKey)!;
    }

    try {
      let previewData: PreviewData | null = null;
      
      switch (file.capabilities.previewType) {
        case 'image':
          previewData = await this.generateImagePreview(file, chunks, isComplete);
          break;
        case 'text':
          previewData = await this.generateTextPreview(file, chunks, isComplete);
          break;
        case 'document':
          previewData = await this.generateDocumentPreview(file, chunks, isComplete);
          break;
        case 'video':
          previewData = await this.generateVideoPreview(file, chunks, isComplete);
          break;
        case 'audio':
          previewData = await this.generateAudioPreview(file, chunks, isComplete);
          break;
        default:
          return null;
      }

      if (previewData && isComplete) {
        this.previewCache.set(cacheKey, previewData);
      }

      return previewData;
    } catch (error) {
      console.error('Preview generation failed:', error);
      return null;
    }
  }

  // Generate image preview
  private async generateImagePreview(
    file: PreviewableFile,
    chunks: ArrayBuffer[],
    isComplete: boolean
  ): Promise<PreviewData | null> {
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
    const previewLimit = this.PREVIEW_LIMITS.image;
    
    // For images, we need enough data to render or complete file if small
    const hasEnoughData = isComplete || totalSize >= Math.min(previewLimit, file.size * 0.3);
    
    if (!hasEnoughData) {
      return null;
    }

    // Combine available chunks
    const combinedData = this.combineChunks(chunks);
    const blob = new Blob([combinedData], { type: file.type });
    const dataUrl = await this.blobToDataUrl(blob);

    return {
      fileName: file.fileName,
      dataUrl,
      mimeType: file.type,
      isPartial: !isComplete,
      loadedBytes: totalSize,
      totalBytes: file.size,
    };
  }

  // Generate text preview
  private async generateTextPreview(
    file: PreviewableFile,
    chunks: ArrayBuffer[],
    isComplete: boolean
  ): Promise<PreviewData | null> {
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
    const previewLimit = this.PREVIEW_LIMITS.text;
    
    // For text, we can show partial content
    if (totalSize === 0) {
      return null;
    }

    // Combine chunks and decode as text
    const combinedData = this.combineChunks(chunks, Math.min(totalSize, previewLimit));
    const textDecoder = new TextDecoder('utf-8');
    let textContent = textDecoder.decode(combinedData);
    
    // If partial, add indicator
    if (!isComplete && file.size > previewLimit) {
      textContent += '\n\n... (content truncated for preview)';
    }

    const blob = new Blob([textContent], { type: 'text/plain' });
    const dataUrl = await this.blobToDataUrl(blob);

    return {
      fileName: file.fileName,
      dataUrl,
      mimeType: 'text/plain',
      isPartial: !isComplete,
      loadedBytes: totalSize,
      totalBytes: file.size,
    };
  }

  // Generate document preview (placeholder for now)
  private async generateDocumentPreview(
    file: PreviewableFile,
    chunks: ArrayBuffer[],
    isComplete: boolean
  ): Promise<PreviewData | null> {
    if (!isComplete) {
      return null; // Documents need to be complete for preview
    }

    const combinedData = this.combineChunks(chunks);
    const blob = new Blob([combinedData], { type: file.type });
    const dataUrl = await this.blobToDataUrl(blob);

    return {
      fileName: file.fileName,
      dataUrl,
      mimeType: file.type,
      isPartial: false,
      loadedBytes: file.size,
      totalBytes: file.size,
    };
  }

  // Generate video preview
  private async generateVideoPreview(
    file: PreviewableFile,
    chunks: ArrayBuffer[],
    isComplete: boolean
  ): Promise<PreviewData | null> {
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
    const previewLimit = this.PREVIEW_LIMITS.video;
    
    // For video, we need a substantial portion or complete file
    const hasEnoughData = isComplete || totalSize >= Math.min(previewLimit, file.size * 0.1);
    
    if (!hasEnoughData) {
      return null;
    }

    const combinedData = this.combineChunks(chunks);
    const blob = new Blob([combinedData], { type: file.type });
    const dataUrl = await this.blobToDataUrl(blob);

    return {
      fileName: file.fileName,
      dataUrl,
      mimeType: file.type,
      isPartial: !isComplete,
      loadedBytes: totalSize,
      totalBytes: file.size,
    };
  }

  // Generate audio preview
  private async generateAudioPreview(
    file: PreviewableFile,
    chunks: ArrayBuffer[],
    isComplete: boolean
  ): Promise<PreviewData | null> {
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
    const previewLimit = this.PREVIEW_LIMITS.audio;
    
    // For audio, we need enough data to start playing
    const hasEnoughData = isComplete || totalSize >= Math.min(previewLimit, file.size * 0.05);
    
    if (!hasEnoughData) {
      return null;
    }

    const combinedData = this.combineChunks(chunks);
    const blob = new Blob([combinedData], { type: file.type });
    const dataUrl = await this.blobToDataUrl(blob);

    return {
      fileName: file.fileName,
      dataUrl,
      mimeType: file.type,
      isPartial: !isComplete,
      loadedBytes: totalSize,
      totalBytes: file.size,
    };
  }

  // Utility: Combine array buffers
  private combineChunks(chunks: ArrayBuffer[], maxSize?: number): ArrayBuffer {
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
    const targetSize = maxSize ? Math.min(totalSize, maxSize) : totalSize;
    
    const combined = new Uint8Array(targetSize);
    let offset = 0;
    
    for (const chunk of chunks) {
      const chunkArray = new Uint8Array(chunk);
      const copySize = Math.min(chunkArray.length, targetSize - offset);
      
      if (copySize <= 0) break;
      
      combined.set(chunkArray.subarray(0, copySize), offset);
      offset += copySize;
      
      if (offset >= targetSize) break;
    }
    
    return combined.buffer;
  }

  // Utility: Convert blob to data URL
  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Clear preview cache
  clearCache(): void {
    this.previewCache.clear();
  }

  // Clear cache for specific file
  clearFileCache(fileName: string): void {
    const keysToRemove: string[] = [];
    for (const key of this.previewCache.keys()) {
      if (key.startsWith(`${fileName}_`)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => this.previewCache.delete(key));
  }

  // Get cached preview
  getCachedPreview(fileName: string, fileSize: number): PreviewData | null {
    const cacheKey = `${fileName}_${fileSize}`;
    return this.previewCache.get(cacheKey) || null;
  }

  // Check if preview is available for file type
  canGeneratePreview(file: PreviewableFile): boolean {
    return file.capabilities.canPreview && 
           this.isFileSizeSupported(file.size, file.capabilities.previewType);
  }

  // Check if file size is supported for preview
  private isFileSizeSupported(fileSize: number, previewType: string): boolean {
    const limit = this.PREVIEW_LIMITS[previewType as keyof typeof this.PREVIEW_LIMITS];
    return limit ? fileSize <= limit * 5 : false; // Allow 5x the preview limit for streaming
  }
}

// Export singleton instance
export const filePreviewService = new FilePreviewService();

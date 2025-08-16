/**
 * Memory-Optimized File Processing for Large Files (up to 100GB)
 * Handles streaming reads without loading entire file into memory
 */

export interface ProcessingOptions {
  chunkSize: number;
  onProgress?: (progress: number) => void;
  onChunkProcessed?: (chunkIndex: number, chunk: ArrayBuffer) => void;
  signal?: AbortSignal;
}

export interface FileStreamResult {
  fileHash: string;
  totalChunks: number;
  fileSize: number;
}

class MemoryOptimizedFileProcessor {
  
  /**
   * Calculate optimal chunk size based on file size
   */
  static getOptimalChunkSize(fileSize: number): number {
    if (fileSize < 10 * 1024 * 1024) {
      // Small files: 256KB chunks
      return 256 * 1024;
    } else if (fileSize < 100 * 1024 * 1024) {
      // Medium files: 512KB chunks  
      return 512 * 1024;
    } else if (fileSize < 1024 * 1024 * 1024) {
      // Large files: 1MB chunks
      return 1024 * 1024;
    } else if (fileSize < 10 * 1024 * 1024 * 1024) {
      // Very large files: 2MB chunks
      return 2 * 1024 * 1024;
    } else {
      // Massive files (10GB+): 4MB chunks
      return 4 * 1024 * 1024;
    }
  }

  /**
   * Process file in streaming chunks with hash calculation
   */
  static async processFileStream(
    file: File,
    options: ProcessingOptions
  ): Promise<FileStreamResult> {
    const { chunkSize, onProgress, onChunkProcessed, signal } = options;
    const totalChunks = Math.ceil(file.size / chunkSize);
    
    // Initialize SHA-256 for progressive hashing
    const hashBuffer = await crypto.subtle.digest('SHA-256', new ArrayBuffer(0));
    let combinedHashes: Uint8Array[] = [];

    let processedChunks = 0;

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      // Check for abort signal
      if (signal?.aborted) {
        throw new Error('File processing aborted');
      }

      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      
      // Read chunk as ArrayBuffer (streaming, not loading full file)
      const chunkBlob = file.slice(start, end);
      const chunkBuffer = await chunkBlob.arrayBuffer();
      
      // Add chunk hash to combined hash calculation
      const chunkHashBuffer = await crypto.subtle.digest('SHA-256', chunkBuffer);
      combinedHashes.push(new Uint8Array(chunkHashBuffer));
      
      // Process chunk callback
      if (onChunkProcessed) {
        await onChunkProcessed(chunkIndex, chunkBuffer);
      }

      processedChunks++;
      
      // Progress callback
      if (onProgress) {
        onProgress((processedChunks / totalChunks) * 100);
      }

      // Yield control to prevent UI blocking
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    // Calculate final file hash from all chunk hashes
    const combinedHashBuffer = new Uint8Array(combinedHashes.length * 32);
    combinedHashes.forEach((hash, index) => {
      combinedHashBuffer.set(hash, index * 32);
    });
    
    const finalHashBuffer = await crypto.subtle.digest('SHA-256', combinedHashBuffer);
    const fileHash = Array.from(new Uint8Array(finalHashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return {
      fileHash,
      totalChunks,
      fileSize: file.size
    };
  }

  /**
   * Read specific chunk from file without loading entire file
   */
  static async readFileChunk(
    file: File,
    chunkIndex: number,
    chunkSize: number
  ): Promise<ArrayBuffer> {
    const start = chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunkBlob = file.slice(start, end);
    return await chunkBlob.arrayBuffer();
  }

  /**
   * Verify chunk integrity
   */
  static async verifyChunkHash(
    chunkData: ArrayBuffer,
    expectedHash?: string
  ): Promise<boolean> {
    if (!expectedHash) return true;
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', chunkData);
    const calculatedHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return calculatedHash === expectedHash;
  }

  /**
   * Calculate memory usage for processing
   */
  static getMemoryRequirement(fileSize: number, chunkSize: number): {
    chunkMemory: number;
    totalChunks: number;
    estimatedPeakUsage: number;
  } {
    const totalChunks = Math.ceil(fileSize / chunkSize);
    const chunkMemory = chunkSize;
    // Peak usage: current chunk + hash buffers + overhead
    const estimatedPeakUsage = chunkMemory + (totalChunks * 32) + (1024 * 1024); // 1MB overhead
    
    return {
      chunkMemory,
      totalChunks,
      estimatedPeakUsage
    };
  }

  /**
   * Check if device can handle file processing
   */
  static async canProcessFile(fileSize: number): Promise<{
    canProcess: boolean;
    recommendedChunkSize: number;
    estimatedMemoryUsage: number;
  }> {
    const chunkSize = this.getOptimalChunkSize(fileSize);
    const memoryReq = this.getMemoryRequirement(fileSize, chunkSize);
    
    // Check available memory (if supported)
    let availableMemory = 0;
    if ('memory' in performance && 'jsHeapSizeLimit' in (performance as any).memory) {
      availableMemory = (performance as any).memory.jsHeapSizeLimit;
    } else {
      // Estimate based on device type (conservative)
      availableMemory = 512 * 1024 * 1024; // Assume 512MB available
    }

    const canProcess = memoryReq.estimatedPeakUsage < (availableMemory * 0.5); // Use max 50% of available
    
    return {
      canProcess,
      recommendedChunkSize: chunkSize,
      estimatedMemoryUsage: memoryReq.estimatedPeakUsage
    };
  }
}

export { MemoryOptimizedFileProcessor };

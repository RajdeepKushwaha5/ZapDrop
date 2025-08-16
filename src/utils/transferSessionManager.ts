/**
 * Transfer Resume and Session Management for Large Files
 * Handles pause/resume functionality and session persistence
 */

import { largeFileStorage, FileTransferSession } from './largeFileStorage';
import { MemoryOptimizedFileProcessor } from './memoryOptimizedProcessor';

export interface TransferState {
  fileId: string;
  status: 'idle' | 'processing' | 'connecting' | 'transferring' | 'paused' | 'complete' | 'error';
  progress: number;
  transferredChunks: number;
  totalChunks: number;
  transferSpeed: number; // bytes per second
  estimatedTimeRemaining: number; // seconds
  lastActivity: number;
  canResume: boolean;
  error?: string;
}

export interface ResumeOptions {
  fileId: string;
  connection: any; // PeerJS DataConnection
  onProgress?: (state: TransferState) => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

class TransferSessionManager {
  private activeSessions = new Map<string, TransferState>();
  private transferControllers = new Map<string, AbortController>();
  private speedCalculationHistory = new Map<string, { timestamp: number; bytes: number }[]>();

  async initializeSession(
    fileId: string,
    file: File,
    connection: any,
    options?: {
      onProgress?: (state: TransferState) => void;
      onComplete?: () => void;
      onError?: (error: string) => void;
    }
  ): Promise<TransferState> {
    // Check if session already exists
    let session = await largeFileStorage.getSession(fileId);
    
    if (!session) {
      // Create new session
      const chunkSize = MemoryOptimizedFileProcessor.getOptimalChunkSize(file.size);
      const totalChunks = Math.ceil(file.size / chunkSize);
      
      session = {
        fileId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        totalChunks,
        completedChunks: [],
        fileHash: '', // Will be calculated during processing
        timestamp: Date.now(),
        isComplete: false
      };
      
      await largeFileStorage.saveSession(session);
    }

    // Initialize transfer state
    const transferState: TransferState = {
      fileId,
      status: 'idle',
      progress: (session.completedChunks.length / session.totalChunks) * 100,
      transferredChunks: session.completedChunks.length,
      totalChunks: session.totalChunks,
      transferSpeed: 0,
      estimatedTimeRemaining: 0,
      lastActivity: Date.now(),
      canResume: session.completedChunks.length > 0,
      error: undefined
    };

    this.activeSessions.set(fileId, transferState);
    this.speedCalculationHistory.set(fileId, []);
    
    return transferState;
  }

  async resumeTransfer(options: ResumeOptions): Promise<void> {
    const { fileId, connection, onProgress, onComplete, onError } = options;
    
    const session = await largeFileStorage.getSession(fileId);
    if (!session) {
      throw new Error('Session not found for resume');
    }

    const transferState = this.activeSessions.get(fileId);
    if (!transferState) {
      throw new Error('Transfer state not initialized');
    }

    // Create abort controller for this transfer
    const controller = new AbortController();
    this.transferControllers.set(fileId, controller);

    try {
      transferState.status = 'transferring';
      transferState.lastActivity = Date.now();

      // Get remaining chunks to transfer
      const completedChunkSet = new Set(session.completedChunks);
      const remainingChunks: number[] = [];
      
      for (let i = 0; i < session.totalChunks; i++) {
        if (!completedChunkSet.has(i)) {
          remainingChunks.push(i);
        }
      }

      console.log(`Resuming transfer: ${remainingChunks.length} chunks remaining`);

      // Transfer remaining chunks
      for (const chunkIndex of remainingChunks) {
        if (controller.signal.aborted) {
          throw new Error('Transfer aborted');
        }

        await this.transferChunk(fileId, chunkIndex, connection);
        
        // Update progress
        transferState.transferredChunks++;
        transferState.progress = (transferState.transferredChunks / transferState.totalChunks) * 100;
        transferState.lastActivity = Date.now();
        
        // Update session
        session.completedChunks.push(chunkIndex);
        await largeFileStorage.saveSession(session);
        
        // Calculate transfer speed and ETA
        this.updateTransferStats(fileId, MemoryOptimizedFileProcessor.getOptimalChunkSize(session.fileSize));
        
        // Progress callback
        if (onProgress) {
          onProgress({ ...transferState });
        }

        // Yield control to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 1));
      }

      // Mark as complete
      transferState.status = 'complete';
      transferState.progress = 100;
      session.isComplete = true;
      await largeFileStorage.saveSession(session);

      if (onComplete) {
        onComplete();
      }

    } catch (error) {
      transferState.status = 'error';
      transferState.error = error instanceof Error ? error.message : 'Unknown error';
      
      if (onError) {
        onError(transferState.error);
      }
    } finally {
      this.transferControllers.delete(fileId);
    }
  }

  async pauseTransfer(fileId: string): Promise<void> {
    const controller = this.transferControllers.get(fileId);
    const transferState = this.activeSessions.get(fileId);
    
    if (controller) {
      controller.abort();
    }
    
    if (transferState) {
      transferState.status = 'paused';
      transferState.canResume = true;
    }

    console.log(`Transfer paused: ${fileId}`);
  }

  async cancelTransfer(fileId: string, deleteData: boolean = false): Promise<void> {
    const controller = this.transferControllers.get(fileId);
    
    if (controller) {
      controller.abort();
    }
    
    this.activeSessions.delete(fileId);
    this.transferControllers.delete(fileId);
    this.speedCalculationHistory.delete(fileId);
    
    if (deleteData) {
      await largeFileStorage.deleteFileData(fileId);
    }

    console.log(`Transfer cancelled: ${fileId}`);
  }

  private async transferChunk(
    fileId: string,
    chunkIndex: number,
    connection: any
  ): Promise<void> {
    const session = await largeFileStorage.getSession(fileId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Get chunk from storage (if available) or read from file
    let chunkData = await largeFileStorage.getChunk(fileId, chunkIndex);
    
    if (!chunkData) {
      throw new Error('Chunk data not available - file may need to be reprocessed');
    }

    // Send chunk with enhanced metadata
    const chunkMessage = {
      type: 'large-file-chunk',
      fileId: session.fileId,
      fileName: session.fileName,
      chunkIndex,
      totalChunks: session.totalChunks,
      data: chunkData.data,
      chunkSize: chunkData.data.byteLength,
      fileHash: session.fileHash,
      timestamp: Date.now()
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Chunk ${chunkIndex} send timeout`));
      }, 30000); // 30 second timeout for large chunks

      // Send chunk
      connection.send(chunkMessage);

      // Wait for acknowledgment
      const handleAck = (data: any) => {
        if (data.type === 'large-file-chunk-ack' && 
            data.fileId === fileId && 
            data.chunkIndex === chunkIndex) {
          clearTimeout(timeout);
          connection.off('data', handleAck);
          
          if (data.success) {
            resolve();
          } else {
            reject(new Error(`Chunk ${chunkIndex} failed: ${data.error}`));
          }
        }
      };

      connection.on('data', handleAck);
    });
  }

  private updateTransferStats(fileId: string, chunkSize: number): void {
    const transferState = this.activeSessions.get(fileId);
    const history = this.speedCalculationHistory.get(fileId);
    
    if (!transferState || !history) return;

    const now = Date.now();
    history.push({ timestamp: now, bytes: chunkSize });

    // Keep only last 10 data points for speed calculation
    if (history.length > 10) {
      history.shift();
    }

    // Calculate transfer speed (bytes per second)
    if (history.length >= 2) {
      const firstPoint = history[0];
      const lastPoint = history[history.length - 1];
      const timeDiff = (lastPoint.timestamp - firstPoint.timestamp) / 1000; // seconds
      const bytesDiff = (history.length - 1) * chunkSize;
      
      if (timeDiff > 0) {
        transferState.transferSpeed = bytesDiff / timeDiff;
        
        // Calculate ETA
        const remainingChunks = transferState.totalChunks - transferState.transferredChunks;
        const remainingBytes = remainingChunks * chunkSize;
        transferState.estimatedTimeRemaining = remainingBytes / transferState.transferSpeed;
      }
    }
  }

  getTransferState(fileId: string): TransferState | null {
    return this.activeSessions.get(fileId) || null;
  }

  getAllActiveTransfers(): TransferState[] {
    return Array.from(this.activeSessions.values());
  }

  async getResumableTransfers(): Promise<FileTransferSession[]> {
    const sessions = await largeFileStorage.getAllSessions();
    return sessions.filter(session => !session.isComplete && session.completedChunks.length > 0);
  }

  async cleanupOldTransfers(maxAgeHours: number = 24): Promise<void> {
    await largeFileStorage.cleanupOldSessions(maxAgeHours);
    
    // Also cleanup in-memory state
    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    for (const [fileId, state] of this.activeSessions.entries()) {
      if (state.lastActivity < cutoffTime && state.status !== 'transferring') {
        this.activeSessions.delete(fileId);
        this.speedCalculationHistory.delete(fileId);
      }
    }
  }
}

// Singleton instance
export const transferSessionManager = new TransferSessionManager();

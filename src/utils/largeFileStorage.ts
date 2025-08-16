/**
 * Large File Storage System using IndexedDB
 * Handles chunks for files up to 100GB with session persistence
 */

export interface FileChunk {
  fileId: string;
  chunkIndex: number;
  data: ArrayBuffer;
  timestamp: number;
}

export interface FileTransferSession {
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  totalChunks: number;
  completedChunks: number[];
  fileHash: string;
  timestamp: number;
  isComplete: boolean;
}

class LargeFileStorage {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'ZapDropLargeFiles';
  private readonly DB_VERSION = 1;
  private readonly CHUNK_STORE = 'chunks';
  private readonly SESSION_STORE = 'sessions';

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create chunks store
        if (!db.objectStoreNames.contains(this.CHUNK_STORE)) {
          const chunkStore = db.createObjectStore(this.CHUNK_STORE, {
            keyPath: ['fileId', 'chunkIndex']
          });
          chunkStore.createIndex('fileId', 'fileId', { unique: false });
        }

        // Create sessions store
        if (!db.objectStoreNames.contains(this.SESSION_STORE)) {
          const sessionStore = db.createObjectStore(this.SESSION_STORE, {
            keyPath: 'fileId'
          });
          sessionStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async storeChunk(chunk: FileChunk): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.CHUNK_STORE], 'readwrite');
      const store = transaction.objectStore(this.CHUNK_STORE);
      const request = store.put(chunk);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getChunk(fileId: string, chunkIndex: number): Promise<FileChunk | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.CHUNK_STORE], 'readonly');
      const store = transaction.objectStore(this.CHUNK_STORE);
      const request = store.get([fileId, chunkIndex]);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async getAllChunks(fileId: string): Promise<FileChunk[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.CHUNK_STORE], 'readonly');
      const store = transaction.objectStore(this.CHUNK_STORE);
      const index = store.index('fileId');
      const request = index.getAll(fileId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const chunks = request.result.sort((a, b) => a.chunkIndex - b.chunkIndex);
        resolve(chunks);
      };
    });
  }

  async saveSession(session: FileTransferSession): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.SESSION_STORE], 'readwrite');
      const store = transaction.objectStore(this.SESSION_STORE);
      const request = store.put(session);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getSession(fileId: string): Promise<FileTransferSession | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.SESSION_STORE], 'readonly');
      const store = transaction.objectStore(this.SESSION_STORE);
      const request = store.get(fileId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async getAllSessions(): Promise<FileTransferSession[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.SESSION_STORE], 'readonly');
      const store = transaction.objectStore(this.SESSION_STORE);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async deleteFileData(fileId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.CHUNK_STORE, this.SESSION_STORE], 'readwrite');
      
      // Delete chunks
      const chunkStore = transaction.objectStore(this.CHUNK_STORE);
      const chunkIndex = chunkStore.index('fileId');
      const chunkRequest = chunkIndex.openCursor(fileId);
      
      chunkRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      // Delete session
      const sessionStore = transaction.objectStore(this.SESSION_STORE);
      sessionStore.delete(fileId);

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();
    });
  }

  async cleanupOldSessions(maxAgeHours: number = 24): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    const sessions = await this.getAllSessions();

    for (const session of sessions) {
      if (session.timestamp < cutoffTime && !session.isComplete) {
        await this.deleteFileData(session.fileId);
      }
    }
  }

  async getStorageUsage(): Promise<{ estimatedUsage: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        estimatedUsage: estimate.usage || 0,
        quota: estimate.quota || 0
      };
    }
    return { estimatedUsage: 0, quota: 0 };
  }

  async assembleFile(fileId: string): Promise<Blob> {
    const chunks = await this.getAllChunks(fileId);
    const session = await this.getSession(fileId);
    
    if (!session) {
      throw new Error('Session not found for file assembly');
    }

    // Verify all chunks are present
    const expectedChunks = session.totalChunks;
    if (chunks.length !== expectedChunks) {
      throw new Error(`Missing chunks: expected ${expectedChunks}, got ${chunks.length}`);
    }

    // Sort chunks by index and create blob
    chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
    const buffers = chunks.map(chunk => chunk.data);
    
    return new Blob(buffers, { type: session.fileType });
  }
}

// Singleton instance
export const largeFileStorage = new LargeFileStorage();

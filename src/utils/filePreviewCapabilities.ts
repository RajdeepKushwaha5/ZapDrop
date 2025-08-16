// File type detection and preview capabilities
export interface FilePreviewCapabilities {
  canPreview: boolean;
  previewType: 'image' | 'video' | 'audio' | 'document' | 'text' | 'unsupported';
  requiresStreaming: boolean;
  supportedFeatures: {
    zoom: boolean;
    scroll: boolean;
    navigation: boolean;
    playControls: boolean;
    fullscreen: boolean;
  };
}

export interface PreviewableFile {
  fileName: string;
  size: number;
  type: string;
  lastModified?: number;
  capabilities: FilePreviewCapabilities;
}

// Supported file types and their preview capabilities
const FILE_TYPE_MAPPINGS: Record<string, FilePreviewCapabilities> = {
  // Images
  'image/jpeg': {
    canPreview: true,
    previewType: 'image',
    requiresStreaming: false,
    supportedFeatures: {
      zoom: true,
      scroll: true,
      navigation: false,
      playControls: false,
      fullscreen: true,
    }
  },
  'image/jpg': {
    canPreview: true,
    previewType: 'image',
    requiresStreaming: false,
    supportedFeatures: {
      zoom: true,
      scroll: true,
      navigation: false,
      playControls: false,
      fullscreen: true,
    }
  },
  'image/png': {
    canPreview: true,
    previewType: 'image',
    requiresStreaming: false,
    supportedFeatures: {
      zoom: true,
      scroll: true,
      navigation: false,
      playControls: false,
      fullscreen: true,
    }
  },
  'image/gif': {
    canPreview: true,
    previewType: 'image',
    requiresStreaming: false,
    supportedFeatures: {
      zoom: true,
      scroll: true,
      navigation: false,
      playControls: false,
      fullscreen: true,
    }
  },
  'image/svg+xml': {
    canPreview: true,
    previewType: 'image',
    requiresStreaming: false,
    supportedFeatures: {
      zoom: true,
      scroll: true,
      navigation: false,
      playControls: false,
      fullscreen: true,
    }
  },
  'image/webp': {
    canPreview: true,
    previewType: 'image',
    requiresStreaming: false,
    supportedFeatures: {
      zoom: true,
      scroll: true,
      navigation: false,
      playControls: false,
      fullscreen: true,
    }
  },
  
  // Videos
  'video/mp4': {
    canPreview: true,
    previewType: 'video',
    requiresStreaming: true,
    supportedFeatures: {
      zoom: false,
      scroll: false,
      navigation: false,
      playControls: true,
      fullscreen: true,
    }
  },
  'video/webm': {
    canPreview: true,
    previewType: 'video',
    requiresStreaming: true,
    supportedFeatures: {
      zoom: false,
      scroll: false,
      navigation: false,
      playControls: true,
      fullscreen: true,
    }
  },
  'video/ogg': {
    canPreview: true,
    previewType: 'video',
    requiresStreaming: true,
    supportedFeatures: {
      zoom: false,
      scroll: false,
      navigation: false,
      playControls: true,
      fullscreen: true,
    }
  },
  
  // Audio
  'audio/mpeg': {
    canPreview: true,
    previewType: 'audio',
    requiresStreaming: true,
    supportedFeatures: {
      zoom: false,
      scroll: false,
      navigation: false,
      playControls: true,
      fullscreen: false,
    }
  },
  'audio/mp3': {
    canPreview: true,
    previewType: 'audio',
    requiresStreaming: true,
    supportedFeatures: {
      zoom: false,
      scroll: false,
      navigation: false,
      playControls: true,
      fullscreen: false,
    }
  },
  'audio/wav': {
    canPreview: true,
    previewType: 'audio',
    requiresStreaming: true,
    supportedFeatures: {
      zoom: false,
      scroll: false,
      navigation: false,
      playControls: true,
      fullscreen: false,
    }
  },
  'audio/ogg': {
    canPreview: true,
    previewType: 'audio',
    requiresStreaming: true,
    supportedFeatures: {
      zoom: false,
      scroll: false,
      navigation: false,
      playControls: true,
      fullscreen: false,
    }
  },
  
  // Documents
  'application/pdf': {
    canPreview: true,
    previewType: 'document',
    requiresStreaming: true,
    supportedFeatures: {
      zoom: true,
      scroll: true,
      navigation: true,
      playControls: false,
      fullscreen: true,
    }
  },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    canPreview: true,
    previewType: 'document',
    requiresStreaming: true,
    supportedFeatures: {
      zoom: true,
      scroll: true,
      navigation: true,
      playControls: false,
      fullscreen: true,
    }
  },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': {
    canPreview: true,
    previewType: 'document',
    requiresStreaming: true,
    supportedFeatures: {
      zoom: true,
      scroll: true,
      navigation: true,
      playControls: false,
      fullscreen: true,
    }
  },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
    canPreview: true,
    previewType: 'document',
    requiresStreaming: true,
    supportedFeatures: {
      zoom: true,
      scroll: true,
      navigation: true,
      playControls: false,
      fullscreen: true,
    }
  },
  
  // Text files
  'text/plain': {
    canPreview: true,
    previewType: 'text',
    requiresStreaming: false,
    supportedFeatures: {
      zoom: true,
      scroll: true,
      navigation: false,
      playControls: false,
      fullscreen: true,
    }
  },
  'text/html': {
    canPreview: true,
    previewType: 'text',
    requiresStreaming: false,
    supportedFeatures: {
      zoom: true,
      scroll: true,
      navigation: false,
      playControls: false,
      fullscreen: true,
    }
  },
  'text/css': {
    canPreview: true,
    previewType: 'text',
    requiresStreaming: false,
    supportedFeatures: {
      zoom: true,
      scroll: true,
      navigation: false,
      playControls: false,
      fullscreen: true,
    }
  },
  'text/javascript': {
    canPreview: true,
    previewType: 'text',
    requiresStreaming: false,
    supportedFeatures: {
      zoom: true,
      scroll: true,
      navigation: false,
      playControls: false,
      fullscreen: true,
    }
  },
  'application/json': {
    canPreview: true,
    previewType: 'text',
    requiresStreaming: false,
    supportedFeatures: {
      zoom: true,
      scroll: true,
      navigation: false,
      playControls: false,
      fullscreen: true,
    }
  },
  'application/xml': {
    canPreview: true,
    previewType: 'text',
    requiresStreaming: false,
    supportedFeatures: {
      zoom: true,
      scroll: true,
      navigation: false,
      playControls: false,
      fullscreen: true,
    }
  },
};

// Get file preview capabilities based on file type
export function getFilePreviewCapabilities(fileName: string, mimeType?: string): FilePreviewCapabilities {
  // Try with provided mime type first
  if (mimeType && FILE_TYPE_MAPPINGS[mimeType]) {
    return FILE_TYPE_MAPPINGS[mimeType];
  }
  
  // Fallback to file extension detection
  const extension = fileName.toLowerCase().split('.').pop();
  if (!extension) {
    return getUnsupportedCapabilities();
  }
  
  // Map extensions to MIME types
  const extensionToMimeType: Record<string, string> = {
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'webp': 'image/webp',
    
    // Videos
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'ogv': 'video/ogg',
    
    // Audio
    'mp3': 'audio/mp3',
    'wav': 'audio/wav',
    'mpeg': 'audio/mpeg',
    'ogg': 'audio/ogg',
    
    // Documents
    'pdf': 'application/pdf',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    
    // Text
    'txt': 'text/plain',
    'html': 'text/html',
    'htm': 'text/html',
    'css': 'text/css',
    'js': 'text/javascript',
    'json': 'application/json',
    'xml': 'application/xml',
  };
  
  const detectedMimeType = extensionToMimeType[extension];
  if (detectedMimeType && FILE_TYPE_MAPPINGS[detectedMimeType]) {
    return FILE_TYPE_MAPPINGS[detectedMimeType];
  }
  
  return getUnsupportedCapabilities();
}

// Get default capabilities for unsupported files
function getUnsupportedCapabilities(): FilePreviewCapabilities {
  return {
    canPreview: false,
    previewType: 'unsupported',
    requiresStreaming: false,
    supportedFeatures: {
      zoom: false,
      scroll: false,
      navigation: false,
      playControls: false,
      fullscreen: false,
    }
  };
}

// Generate thumbnail for file
export function generateFileThumbnail(fileName: string, mimeType?: string): string {
  const capabilities = getFilePreviewCapabilities(fileName, mimeType);
  
  switch (capabilities.previewType) {
    case 'image':
      return '🖼️';
    case 'video':
      return '🎥';
    case 'audio':
      return '🎵';
    case 'document':
      return '📄';
    case 'text':
      return '📝';
    default:
      return '📁';
  }
}

// Check if file size is suitable for preview
export function isFileSizePreviewable(fileSize: number, previewType: string): boolean {
  const sizeLimit = {
    image: 10 * 1024 * 1024, // 10MB for images
    text: 1024 * 1024, // 1MB for text files
    document: 50 * 1024 * 1024, // 50MB for documents
    video: 100 * 1024 * 1024, // 100MB for videos
    audio: 20 * 1024 * 1024, // 20MB for audio
  };
  
  const limit = sizeLimit[previewType as keyof typeof sizeLimit] || 0;
  return fileSize <= limit;
}

// Create a previewable file object
export function createPreviewableFile(fileName: string, size: number, type: string): PreviewableFile {
  const capabilities = getFilePreviewCapabilities(fileName, type);
  
  return {
    fileName,
    size,
    type,
    lastModified: Date.now(),
    capabilities
  };
}

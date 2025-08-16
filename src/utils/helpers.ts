import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function generateShareId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function validateShareId(shareId: string): boolean {
  return /^[a-z0-9]+$/i.test(shareId) && shareId.length >= 10;
}

export function extractShareIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const shareParam = urlObj.searchParams.get('share');
    if (shareParam && validateShareId(shareParam)) {
      return shareParam;
    }
    
    // Also check if the entire URL is just a share ID
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    if (pathParts.length === 1 && validateShareId(pathParts[0])) {
      return pathParts[0];
    }
    
    return null;
  } catch {
    // If URL parsing fails, check if the input is just a share ID
    if (validateShareId(url)) {
      return url;
    }
    return null;
  }
}

export function createShareUrl(shareId: string, password?: boolean): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const url = new URL(baseUrl);
  url.searchParams.set('share', shareId);
  if (password) {
    url.searchParams.set('protected', '1');
  }
  return url.toString();
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

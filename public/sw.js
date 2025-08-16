// Service Worker for streaming file downloads
// This enables downloading files as they're being received via WebRTC

const CACHE_NAME = 'zapdrop-sw-v1';
const downloadMap = new Map();

self.addEventListener('install', (event) => {
  console.log('ZapDrop Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('ZapDrop Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  const { data } = event;

  if (data.type === 'DOWNLOAD_START') {
    const { downloadId, filename, size } = data;
    const port = event.ports[0];

    // Create a download URL that we'll intercept
    const downloadUrl = `${self.registration.scope}download/${downloadId}/${filename}`;

    // Store the port and metadata for this download
    downloadMap.set(downloadUrl, {
      port,
      filename,
      size,
      chunks: [],
      receivedBytes: 0,
    });

    // Send the download URL back to the main thread
    port.postMessage({ type: 'DOWNLOAD_URL', url: downloadUrl });
  } else if (data.type === 'DOWNLOAD_CHUNK') {
    const { downloadId, filename, chunk } = data;
    const downloadUrl = `${self.registration.scope}download/${downloadId}/${filename}`;

    const downloadInfo = downloadMap.get(downloadUrl);
    if (downloadInfo) {
      downloadInfo.chunks.push(chunk);
      downloadInfo.receivedBytes += chunk.byteLength;

      // If we have a pending response, send the chunk
      if (downloadInfo.controller) {
        downloadInfo.controller.enqueue(new Uint8Array(chunk));

        // If this is the last chunk, close the stream
        if (downloadInfo.receivedBytes >= downloadInfo.size) {
          downloadInfo.controller.close();
        }
      }
    }
  } else if (data.type === 'DOWNLOAD_COMPLETE') {
    const { downloadId, filename } = data;
    const downloadUrl = `${self.registration.scope}download/${downloadId}/${filename}`;

    const downloadInfo = downloadMap.get(downloadUrl);
    if (downloadInfo && downloadInfo.controller) {
      downloadInfo.controller.close();
    }
  }
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Check if this is a download request we should handle
  if (url.includes('/download/') && downloadMap.has(url)) {
    event.respondWith(handleDownload(url));
  }
});

function handleDownload(url) {
  const downloadInfo = downloadMap.get(url);

  if (!downloadInfo) {
    return new Response('Download not found', { status: 404 });
  }

  const { filename, size } = downloadInfo;

  const stream = new ReadableStream({
    start(controller) {
      downloadInfo.controller = controller;

      // If we already have chunks, send them
      downloadInfo.chunks.forEach(chunk => {
        controller.enqueue(new Uint8Array(chunk));
      });

      // If we've received all data, close the stream
      if (downloadInfo.receivedBytes >= size) {
        controller.close();
      }
    },
    cancel() {
      // Clean up when download is cancelled
      downloadMap.delete(url);
    }
  });

  const headers = new Headers({
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': `attachment; filename="${filename}"`,
  });

  // Set content length if we know the size
  if (size > 0) {
    headers.set('Content-Length', size.toString());
  }

  return new Response(stream, { headers });
}

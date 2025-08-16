'use client';

import { useState, useEffect, useRef } from 'react';
import Peer, { DataConnection } from 'peerjs';

export interface FileInfo {
  fileName: string;
  size: number;
  type: string;
}

export interface PeerConnection {
  peer: Peer | null;
  peerId: string;
  isConnected: boolean;
  error: string | null;
}

export function usePeer() {
  const [peerConnection, setPeerConnection] = useState<PeerConnection>({
    peer: null,
    peerId: '',
    isConnected: false,
    error: null,
  });

  const peerRef = useRef<Peer | null>(null);

  useEffect(() => {
    const initializePeer = () => {
      try {
        // Use free STUN servers
        const peer = new Peer({
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
            ]
          }
        });

        peer.on('open', (id) => {
          console.log('Peer connected with ID:', id);
          setPeerConnection(prev => ({
            ...prev,
            peer,
            peerId: id,
            isConnected: true,
            error: null,
          }));
        });

        peer.on('error', (err) => {
          console.error('Peer error:', err);
          setPeerConnection(prev => ({
            ...prev,
            error: err.message,
            isConnected: false,
          }));
        });

        peer.on('disconnected', () => {
          console.log('Peer disconnected');
          setPeerConnection(prev => ({
            ...prev,
            isConnected: false,
          }));
        });

        peerRef.current = peer;

      } catch (err) {
        console.error('Failed to initialize peer:', err);
        setPeerConnection(prev => ({
          ...prev,
          error: 'Failed to initialize peer connection',
        }));
      }
    };

    initializePeer();

    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, []);

  const connectToPeer = (remotePeerId: string): Promise<DataConnection> => {
    return new Promise((resolve, reject) => {
      if (!peerRef.current) {
        reject(new Error('Peer not initialized'));
        return;
      }

      const conn = peerRef.current.connect(remotePeerId, {
        reliable: true
      });

      conn.on('open', () => {
        console.log('Connected to peer:', remotePeerId);
        resolve(conn);
      });

      conn.on('error', (err) => {
        console.error('Connection error:', err);
        reject(err);
      });
    });
  };

  return {
    ...peerConnection,
    connectToPeer,
  };
}

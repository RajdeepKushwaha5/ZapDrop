/**
 * WebRTC Configuration Manager
 * Provides ICE servers with TURN support for enterprise firewalls
 */

interface ICEServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

interface WebRTCConfig {
  iceServers: ICEServer[];
  iceCandidatePoolSize: number;
  iceTransportPolicy?: 'all' | 'relay';
}

/**
 * Get production WebRTC configuration with TURN servers
 */
export function getWebRTCConfig(forceRelay = false): WebRTCConfig {
  const config: WebRTCConfig = {
    iceServers: [],
    iceCandidatePoolSize: 10,
  };

  // Force TURN relay for testing firewall scenarios
  if (forceRelay) {
    config.iceTransportPolicy = 'relay';
  }

  // STUN servers (always include)
  const stunServers = process.env.NEXT_PUBLIC_STUN_SERVERS?.split(',') || [
    'stun:stun.l.google.com:19302',
    'stun:stun1.l.google.com:19302',
    'stun:stun2.l.google.com:19302',
  ];

  config.iceServers.push({
    urls: stunServers,
  });

  // Primary TURN server (Metered.ca)
  if (process.env.NEXT_PUBLIC_TURN_SERVER && 
      process.env.NEXT_PUBLIC_TURN_USERNAME && 
      process.env.NEXT_PUBLIC_TURN_PASSWORD) {
    
    const turnServer = process.env.NEXT_PUBLIC_TURN_SERVER;
    const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
    const turnPassword = process.env.NEXT_PUBLIC_TURN_PASSWORD;

    config.iceServers.push({
      urls: [
        `${turnServer}?transport=tcp`,
        `${turnServer}?transport=udp`,
      ],
      username: turnUsername,
      credential: turnPassword,
    });
  }

  // Backup TURN server
  if (process.env.NEXT_PUBLIC_TURN_SERVER_BACKUP) {
    config.iceServers.push({
      urls: [
        `${process.env.NEXT_PUBLIC_TURN_SERVER_BACKUP}?transport=tcp`,
        `${process.env.NEXT_PUBLIC_TURN_SERVER_BACKUP}?transport=udp`,
      ],
    });
  }

  // Self-hosted COTURN server (if available)
  if (process.env.NEXT_PUBLIC_COTURN_SERVER) {
    config.iceServers.push({
      urls: [
        `${process.env.NEXT_PUBLIC_COTURN_SERVER}?transport=tcp`,
        `${process.env.NEXT_PUBLIC_COTURN_SERVER}?transport=udp`,
      ],
    });
  }

  return config;
}

/**
 * Test TURN server connectivity
 */
export async function testTURNConnectivity(): Promise<{
  stunWorking: boolean;
  turnWorking: boolean;
  servers: string[];
}> {
  return new Promise((resolve) => {
    const config = getWebRTCConfig();
    const pc = new RTCPeerConnection(config);
    const servers: string[] = [];
    let stunWorking = false;
    let turnWorking = false;

    // Create a data channel to trigger ICE gathering
    pc.createDataChannel('test');

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candidate = event.candidate.candidate;
        servers.push(candidate);

        if (candidate.includes('srflx')) {
          stunWorking = true;
        }
        if (candidate.includes('relay')) {
          turnWorking = true;
        }
      } else {
        // ICE gathering complete
        pc.close();
        resolve({ stunWorking, turnWorking, servers });
      }
    };

    // Start ICE gathering
    pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .catch((error) => {
        console.error('TURN connectivity test failed:', error);
        pc.close();
        resolve({ stunWorking: false, turnWorking: false, servers: [] });
      });

    // Timeout after 10 seconds
    setTimeout(() => {
      pc.close();
      resolve({ stunWorking, turnWorking, servers });
    }, 10000);
  });
}

/**
 * Get optimized PeerJS configuration
 */
export function getPeerJSConfig() {
  return {
    host: process.env.NEXT_PUBLIC_PEERJS_HOST || '0.peerjs.com',
    port: parseInt(process.env.NEXT_PUBLIC_PEERJS_PORT || '443'),
    path: process.env.NEXT_PUBLIC_PEERJS_PATH || '/',
    secure: process.env.NEXT_PUBLIC_PEERJS_SECURE === 'true',
    config: getWebRTCConfig(),
    debug: process.env.NODE_ENV === 'development' ? 2 : 0,
  };
}

/**
 * Connection quality assessment
 */
export interface ConnectionQuality {
  rtt: number; // Round-trip time in ms
  bandwidth: number; // Estimated bandwidth in bytes/sec
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  usingTURN: boolean;
}

export function assessConnectionQuality(stats: RTCStatsReport): ConnectionQuality {
  let rtt = 0;
  let bandwidth = 0;
  let usingTURN = false;

  stats.forEach((report) => {
    if (report.type === 'candidate-pair' && report.state === 'succeeded') {
      rtt = report.currentRoundTripTime * 1000; // Convert to ms
      
      // Check if using TURN relay
      if (report.localCandidateId || report.remoteCandidateId) {
        stats.forEach((candidate) => {
          if (candidate.id === report.localCandidateId || 
              candidate.id === report.remoteCandidateId) {
            if (candidate.candidateType === 'relay') {
              usingTURN = true;
            }
          }
        });
      }
    }
    
    if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
      bandwidth = report.bytesReceived || 0;
    }
  });

  let quality: ConnectionQuality['quality'] = 'excellent';
  if (rtt > 500) quality = 'poor';
  else if (rtt > 200) quality = 'fair';
  else if (rtt > 100) quality = 'good';

  return { rtt, bandwidth, quality, usingTURN };
}

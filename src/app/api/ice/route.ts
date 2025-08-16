import { NextRequest, NextResponse } from 'next/server';

// Free STUN servers that work well for WebRTC
const FREE_ICE_SERVERS = [
  {
    urls: [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302',
      'stun:stun2.l.google.com:19302',
      'stun:stun3.l.google.com:19302',
      'stun:stun4.l.google.com:19302',
    ]
  },
  {
    urls: 'stun:stun.stunprotocol.org'
  },
  {
    urls: 'stun:stun.voiparound.com'
  },
  {
    urls: 'stun:stun.voipbuster.com'
  }
];

// Optional: You can add TURN servers if you have them
// For production, consider using services like:
// - Metered.ca (free tier available)
// - Twilio STUN/TURN
// - Your own COTURN server

export async function POST(request: NextRequest) {
  try {
    // In a production app, you might want to:
    // 1. Rate limit requests
    // 2. Add authentication
    // 3. Log usage for monitoring
    // 4. Rotate TURN credentials if using TURN servers
    
    return NextResponse.json({
      iceServers: FREE_ICE_SERVERS,
      success: true
    });
  } catch (error) {
    console.error('Error providing ICE servers:', error);
    return NextResponse.json(
      { error: 'Failed to provide ICE servers' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Also support GET requests for convenience
  return POST(request);
}

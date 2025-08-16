'use client';

import { useState } from 'react';
import { testTURNConnectivity, ConnectionQuality, assessConnectionQuality } from '@/utils/webrtcConfig';

interface NetworkDiagnostics {
  isOpen: boolean;
  onClose: () => void;
}

export default function NetworkDiagnostics({ isOpen, onClose }: NetworkDiagnostics) {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<{
    stunWorking: boolean;
    turnWorking: boolean;
    servers: string[];
  } | null>(null);

  const runDiagnostics = async () => {
    setTesting(true);
    try {
      const testResults = await testTURNConnectivity();
      setResults(testResults);
    } catch (error) {
      console.error('Network diagnostics failed:', error);
    }
    setTesting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Network Diagnostics
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Connection Test
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
              Test your network connectivity to ensure file transfers work behind firewalls.
            </p>
            
            <button
              onClick={runDiagnostics}
              disabled={testing}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {testing ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Testing Connection...
                </div>
              ) : (
                'Run Network Test'
              )}
            </button>
          </div>

          {results && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                  Test Results
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      STUN Servers (Basic Connectivity)
                    </span>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      results.stunWorking 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      {results.stunWorking ? 'Working' : 'Failed'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      TURN Servers (Firewall Bypass)
                    </span>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      results.turnWorking 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                    }`}>
                      {results.turnWorking ? 'Working' : 'Limited'}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Connection Quality
                  </h4>
                  
                  {results.stunWorking && results.turnWorking && (
                    <div className="text-sm text-green-600 dark:text-green-400">
                      ✅ Excellent - You can connect to users behind any firewall
                    </div>
                  )}
                  
                  {results.stunWorking && !results.turnWorking && (
                    <div className="text-sm text-yellow-600 dark:text-yellow-400">
                      ⚠️ Good - You can connect to most users, but some corporate firewalls may block connections
                    </div>
                  )}
                  
                  {!results.stunWorking && (
                    <div className="text-sm text-red-600 dark:text-red-400">
                      ❌ Poor - Connection issues likely. Check your network or try a different connection
                    </div>
                  )}
                </div>

                {results.servers.length > 0 && (
                  <details className="mt-4">
                    <summary className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400">
                      Technical Details ({results.servers.length} candidates)
                    </summary>
                    <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono text-gray-600 dark:text-gray-400 max-h-40 overflow-y-auto">
                      {results.servers.map((server, index) => (
                        <div key={index} className="mb-1">
                          {server}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <h3 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
                  Troubleshooting Tips
                </h3>
                <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                  <li>• If STUN failed: Check your internet connection</li>
                  <li>• If TURN failed: You may still connect to most users</li>
                  <li>• Corporate networks: Ask IT to whitelist WebRTC traffic</li>
                  <li>• Mobile hotspot: Try switching between WiFi and cellular</li>
                </ul>
              </div>
            </div>
          )}

          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Environment Info
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <div>Environment: {process.env.NODE_ENV}</div>
              <div>STUN Servers: {process.env.NEXT_PUBLIC_STUN_SERVERS ? 'Configured' : 'Default'}</div>
              <div>TURN Servers: {process.env.NEXT_PUBLIC_TURN_SERVER ? 'Configured' : 'None'}</div>
              <div>Max File Size: {((parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '0')) / (1024**3)).toFixed(0)}GB</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

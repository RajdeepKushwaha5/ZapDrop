'use client';

import { useEffect, useState } from 'react';

interface P2PAnimationProps {
  isConnected?: boolean;
  isTransferring?: boolean;
  transferProgress?: number;
  connectionCount?: number;
  transferStatus?: 'idle' | 'connecting' | 'transferring' | 'complete' | 'error';
  errorMessage?: string;
}

const P2PAnimation = ({
  isConnected = false,
  isTransferring = false,
  transferProgress = 0,
  connectionCount = 0,
  transferStatus = 'idle',
  errorMessage = ''
}: P2PAnimationProps) => {
  const [animationPhase, setAnimationPhase] = useState(0);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  // Auto-cycle animation phases when not actively transferring
  useEffect(() => {
    if (transferStatus === 'idle' || transferStatus === 'connecting') {
      const interval = setInterval(() => {
        setAnimationPhase(prev => (prev + 1) % 4);
      }, 2500);
      return () => clearInterval(interval);
    } else if (transferStatus === 'transferring') {
      // During actual transfer, show real progress
      const progressPhase = Math.floor((transferProgress / 100) * 3);
      setAnimationPhase(Math.min(progressPhase, 2));
    } else if (transferStatus === 'complete') {
      setAnimationPhase(3);
    } else if (transferStatus === 'error') {
      setAnimationPhase(4);
    }
  }, [transferStatus, transferProgress]);

  // Pulse effect for active connections
  useEffect(() => {
    if (isConnected || isTransferring) {
      setPulseAnimation(true);
      const pulseInterval = setInterval(() => {
        setPulseAnimation(prev => !prev);
      }, 1500);
      return () => clearInterval(pulseInterval);
    }
  }, [isConnected, isTransferring]);

  const getConnectionLineColor = () => {
    switch (transferStatus) {
      case 'error':
        return 'from-red-400 via-red-500 to-red-400';
      case 'transferring':
        return 'from-green-400 via-emerald-500 to-green-400';
      case 'complete':
        return 'from-emerald-400 via-teal-500 to-emerald-400';
      case 'connecting':
        return 'from-yellow-400 via-orange-500 to-yellow-400';
      default:
        return 'from-blue-400 via-purple-400 to-blue-400';
    }
  };

  const getStatusText = () => {
    switch (transferStatus) {
      case 'connecting':
        return 'Establishing Connection...';
      case 'transferring':
        return `Transferring... ${Math.round(transferProgress)}%`;
      case 'complete':
        return 'Transfer Complete & Verified ✓';
      case 'error':
        return errorMessage || 'Transfer Failed';
      default:
        return connectionCount > 0 ? `${connectionCount} Connected` : 'Ready to Share';
    }
  };

  const getStatusColor = () => {
    switch (transferStatus) {
      case 'error':
        return 'text-red-500';
      case 'transferring':
        return 'text-emerald-500';
      case 'complete':
        return 'text-green-600';
      case 'connecting':
        return 'text-yellow-500';
      default:
        return connectionCount > 0 ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400';
    }
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto h-72 mb-12">
      {/* Connection Line */}
      <div className="absolute top-1/2 left-1/4 right-1/4 transform -translate-y-1/2">
        <div className="relative">
          {/* Base connection line */}
          <div className={`h-1 bg-gradient-to-r ${getConnectionLineColor()} rounded-full ${
            pulseAnimation ? 'opacity-90' : 'opacity-60'
          } transition-all duration-500`}></div>
          
          {/* Animated wave effect during transfer */}
          {(transferStatus === 'transferring' || transferStatus === 'connecting') && (
            <div className="absolute top-0 left-0 right-0 h-1 overflow-hidden rounded-full">
              <div className="h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-70">
                <div className="w-20 h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-70 animate-wave"></div>
              </div>
            </div>
          )}

          {/* Real-time progress indicator */}
          {transferStatus === 'transferring' && transferProgress > 0 && (
            <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-emerald-300 to-teal-300 rounded-full transition-all duration-300"
                 style={{ width: `${transferProgress}%` }}></div>
          )}
        </div>
        
        {/* Connection nodes */}
        <div className={`absolute -top-1.5 left-0 w-3 h-3 rounded-full transition-all duration-500 ${
          transferStatus === 'error' ? 'bg-red-400' :
          transferStatus === 'transferring' ? 'bg-emerald-400 animate-pulse' :
          transferStatus === 'complete' ? 'bg-green-400' :
          isConnected ? 'bg-blue-400 animate-pulse' : 'bg-gray-400'
        }`}></div>
        <div className={`absolute -top-1.5 right-0 w-3 h-3 rounded-full transition-all duration-500 ${
          transferStatus === 'error' ? 'bg-red-400' :
          transferStatus === 'transferring' ? 'bg-emerald-400 animate-pulse' :
          transferStatus === 'complete' ? 'bg-green-400' :
          connectionCount > 0 ? 'bg-purple-400 animate-pulse' : 'bg-gray-400'
        }`}></div>
      </div>

      {/* Left Device (Sender) */}
      <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
        <div className="relative">
          {/* Laptop */}
          <div className="w-28 h-18 bg-gradient-to-br from-gray-300 to-gray-500 dark:from-gray-600 dark:to-gray-800 rounded-xl shadow-lg">
            {/* Screen */}
            <div className={`w-24 h-14 rounded-lg m-2 flex items-center justify-center transition-all duration-500 ${
              transferStatus === 'error' ? 'bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900 dark:to-red-800' :
              transferStatus === 'transferring' ? 'bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-800' :
              transferStatus === 'complete' ? 'bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800' :
              'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800'
            }`}>
              <div className={`w-10 h-10 rounded-lg opacity-90 transition-all duration-500 ${
                transferStatus === 'error' ? 'bg-red-500' :
                transferStatus === 'transferring' ? 'bg-emerald-500 animate-pulse' :
                transferStatus === 'complete' ? 'bg-green-500' :
                isConnected ? 'bg-blue-500 animate-pulse' : 'bg-blue-500'
              }`}>
                {/* ZapDrop logo mini */}
                <div className="w-6 h-6 mx-auto mt-2 relative">
                  <div className="absolute inset-0 bg-white rounded opacity-90"></div>
                  <div className="absolute inset-1 bg-current rounded opacity-60"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Glow effect for sender */}
          <div className={`absolute inset-0 rounded-xl opacity-20 transition-all duration-500 ${
            transferStatus === 'error' ? 'bg-red-400' :
            transferStatus === 'transferring' ? 'bg-emerald-400 animate-pulse' :
            transferStatus === 'complete' ? 'bg-green-400' :
            isConnected ? 'bg-blue-400 animate-pulse' : 'bg-blue-400'
          }`}></div>
          
          {/* Label */}
          <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Sender</span>
            {connectionCount > 0 && (
              <div className="text-xs text-blue-500 mt-1">Online</div>
            )}
          </div>
        </div>
      </div>

      {/* Right Device (Receiver) */}
      <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
        <div className="relative">
          {/* Laptop */}
          <div className="w-28 h-18 bg-gradient-to-br from-gray-300 to-gray-500 dark:from-gray-600 dark:to-gray-800 rounded-xl shadow-lg">
            {/* Screen */}
            <div className={`w-24 h-14 rounded-lg m-2 flex items-center justify-center transition-all duration-500 ${
              transferStatus === 'error' ? 'bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900 dark:to-red-800' :
              transferStatus === 'transferring' ? 'bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-800' :
              transferStatus === 'complete' ? 'bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800' :
              'bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800'
            }`}>
              <div className={`w-10 h-10 rounded-lg opacity-90 transition-all duration-500 ${
                transferStatus === 'error' ? 'bg-red-500' :
                transferStatus === 'transferring' ? 'bg-emerald-500 animate-pulse' :
                transferStatus === 'complete' ? 'bg-green-500' :
                connectionCount > 0 ? 'bg-purple-500 animate-pulse' : 'bg-purple-500'
              }`}>
                {/* Download icon */}
                <div className="w-6 h-6 mx-auto mt-2 relative">
                  <div className="absolute inset-0 bg-white rounded opacity-90"></div>
                  <div className="absolute inset-1 bg-current rounded opacity-60"></div>
                  {transferStatus === 'complete' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3 h-3 border-2 border-white rounded-full"></div>
                      <div className="absolute w-1 h-1 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Glow effect for receiver */}
          <div className={`absolute inset-0 rounded-xl opacity-20 transition-all duration-500 ${
            transferStatus === 'error' ? 'bg-red-400' :
            transferStatus === 'transferring' ? 'bg-emerald-400 animate-pulse' :
            transferStatus === 'complete' ? 'bg-green-400' :
            connectionCount > 0 ? 'bg-purple-400 animate-pulse' : 'bg-purple-400'
          }`}></div>
          
          {/* Label */}
          <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Receiver</span>
            {connectionCount > 0 && (
              <div className="text-xs text-purple-500 mt-1">{connectionCount} Connected</div>
            )}
          </div>
        </div>
      </div>

      {/* Animated File Transfer */}
      <div className="absolute top-1/2 left-1/4 right-1/4 transform -translate-y-1/2">
        <div className="relative h-20 flex items-center">
          {/* File icon that moves across based on real progress */}
          <div 
            className={`absolute w-14 h-14 bg-gradient-to-br rounded-xl shadow-lg flex items-center justify-center transform transition-all duration-1000 ease-in-out progress-indicator ${
              transferStatus === 'error' ? 'from-red-400 to-red-600' :
              transferStatus === 'transferring' || transferStatus === 'complete' ? 'from-emerald-400 to-teal-500' :
              'from-gray-400 to-gray-600'
            } ${
              transferStatus === 'transferring' ? 'scale-110 animate-pulse' :
              transferStatus === 'complete' ? 'scale-105' :
              'scale-100'
            }`}
            style={{
              left: transferStatus === 'transferring' ? `${Math.min(transferProgress, 90)}%` :
                    transferStatus === 'complete' ? '90%' :
                    transferStatus === 'error' ? '50%' : '0%'
            }}
          >
            {/* File icon */}
            <div className="w-8 h-8 bg-white rounded-lg opacity-95 flex items-center justify-center">
              {transferStatus === 'complete' ? (
                <div className="w-4 h-4 text-emerald-600">
                  <div className="w-full h-0.5 bg-emerald-600 rounded mt-1"></div>
                  <div className="w-3 h-0.5 bg-emerald-500 rounded mt-1"></div>
                  <div className="w-full h-0.5 bg-emerald-400 rounded mt-1"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 border border-emerald-600 rounded-full"></div>
                    <div className="absolute w-0.5 h-0.5 bg-emerald-600 rounded-full"></div>
                  </div>
                </div>
              ) : transferStatus === 'error' ? (
                <div className="w-4 h-4 text-red-600">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3 h-0.5 bg-red-600 rounded transform rotate-45"></div>
                    <div className="w-3 h-0.5 bg-red-600 rounded transform -rotate-45"></div>
                  </div>
                </div>
              ) : (
                <div className="w-4 h-4 text-emerald-600">
                  <div className="w-full h-0.5 bg-emerald-600 rounded mt-1"></div>
                  <div className="w-3 h-0.5 bg-emerald-500 rounded mt-1"></div>
                  <div className="w-full h-0.5 bg-emerald-400 rounded mt-1"></div>
                </div>
              )}
            </div>
          </div>
          
          {/* Transfer particles - only during active transfer */}
          {transferStatus === 'transferring' && (
            <>
              <div className="absolute left-1/4 top-2 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></div>
              <div className="absolute left-1/3 top-12 w-1 h-1 bg-teal-400 rounded-full animate-ping particle-delay-1"></div>
              <div className="absolute left-1/2 top-1 w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping particle-delay-2"></div>
              <div className="absolute left-2/3 top-8 w-1 h-1 bg-purple-400 rounded-full animate-ping particle-delay-3"></div>
              <div className="absolute left-3/4 top-4 w-1.5 h-1.5 bg-emerald-300 rounded-full animate-ping particle-delay-1"></div>
            </>
          )}

          {/* Success particles - only when complete */}
          {transferStatus === 'complete' && (
            <>
              <div className="absolute right-8 top-2 w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
              <div className="absolute right-4 top-10 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce particle-delay-1"></div>
              <div className="absolute right-12 top-6 w-1 h-1 bg-teal-400 rounded-full animate-bounce particle-delay-2"></div>
            </>
          )}
        </div>
      </div>

      {/* Status indicator */}
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center justify-center space-x-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
          <div className={`w-3 h-3 rounded-full transition-all duration-500 ${
            transferStatus === 'error' ? 'bg-red-400 animate-pulse' :
            transferStatus === 'transferring' ? 'bg-emerald-400 animate-pulse' :
            transferStatus === 'complete' ? 'bg-green-400' :
            transferStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
            isConnected ? 'bg-blue-400 animate-pulse' : 'bg-gray-300 dark:bg-gray-600'
          }`}></div>
          <span className={`text-sm font-medium transition-all duration-500 ${getStatusColor()}`}>
            {getStatusText()}
          </span>
          
          {/* Connection indicator */}
          {connectionCount > 0 && transferStatus !== 'transferring' && transferStatus !== 'complete' && (
            <div className="flex items-center space-x-1 ml-2 pl-2 border-l border-gray-300 dark:border-gray-600">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 dark:text-green-400">{connectionCount} online</span>
            </div>
          )}
        </div>
      </div>

      {/* Error details */}
      {transferStatus === 'error' && errorMessage && (
        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 max-w-md">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-center">
            <p className="text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Transfer speed indicator */}
      {transferStatus === 'transferring' && transferProgress > 0 && (
        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2 text-center">
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              Verifying chunks • {Math.round(transferProgress)}% complete
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default P2PAnimation;

import React, { useState, useEffect } from 'react';
import { Monitor, Smartphone, Tablet, Laptop } from 'lucide-react';

interface ResponsiveTestProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ResponsiveTest({ isOpen, onClose }: ResponsiveTestProps) {
  const [screenInfo, setScreenInfo] = useState({
    width: 0,
    height: 0,
    devicePixelRatio: 1,
    orientation: 'portrait'
  });

  useEffect(() => {
    if (!isOpen) return;

    const updateScreenInfo = () => {
      setScreenInfo({
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio || 1,
        orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      });
    };

    updateScreenInfo();
    window.addEventListener('resize', updateScreenInfo);
    window.addEventListener('orientationchange', updateScreenInfo);

    return () => {
      window.removeEventListener('resize', updateScreenInfo);
      window.removeEventListener('orientationchange', updateScreenInfo);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getDeviceType = () => {
    if (screenInfo.width < 480) return { type: 'Mobile', icon: Smartphone, color: 'text-green-600' };
    if (screenInfo.width < 768) return { type: 'Large Mobile', icon: Smartphone, color: 'text-blue-600' };
    if (screenInfo.width < 1024) return { type: 'Tablet', icon: Tablet, color: 'text-purple-600' };
    if (screenInfo.width < 1440) return { type: 'Laptop', icon: Laptop, color: 'text-orange-600' };
    return { type: 'Desktop', icon: Monitor, color: 'text-teal-600' };
  };

  const device = getDeviceType();
  const DeviceIcon = device.icon;

  const breakpoints = [
    { name: 'xs (Extra Small)', range: '< 360px', active: screenInfo.width < 360 },
    { name: 'sm (Small)', range: '480px - 767px', active: screenInfo.width >= 480 && screenInfo.width < 768 },
    { name: 'md (Medium)', range: '768px - 1023px', active: screenInfo.width >= 768 && screenInfo.width < 1024 },
    { name: 'lg (Large)', range: '1024px - 1279px', active: screenInfo.width >= 1024 && screenInfo.width < 1280 },
    { name: 'xl (Extra Large)', range: '1280px - 1535px', active: screenInfo.width >= 1280 && screenInfo.width < 1536 },
    { name: '2xl (2X Large)', range: '≥ 1536px', active: screenInfo.width >= 1536 }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Responsive Design Test
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Current Device Info */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
            <div className="flex items-center mb-3">
              <DeviceIcon className={`w-6 h-6 ${device.color} mr-2`} />
              <span className="font-semibold text-gray-900 dark:text-white">
                {device.type}
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <div>Viewport: {screenInfo.width} × {screenInfo.height}px</div>
              <div>Pixel Ratio: {screenInfo.devicePixelRatio}x</div>
              <div>Orientation: {screenInfo.orientation}</div>
            </div>
          </div>

          {/* Breakpoint Status */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Tailwind Breakpoints
            </h3>
            <div className="space-y-2">
              {breakpoints.map((breakpoint) => (
                <div
                  key={breakpoint.name}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    breakpoint.active
                      ? 'bg-green-100 dark:bg-green-900/20 border-2 border-green-500'
                      : 'bg-gray-50 dark:bg-gray-700/50'
                  }`}
                >
                  <div>
                    <div className={`font-medium ${
                      breakpoint.active 
                        ? 'text-green-800 dark:text-green-200' 
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {breakpoint.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {breakpoint.range}
                    </div>
                  </div>
                  {breakpoint.active && (
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Responsive Features Test */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Responsive Features
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {/* Touch Target Test */}
              <div className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Touch Target (44×44px)
                </div>
                <button className="touch-target bg-blue-600 text-white rounded-lg">
                  Test Button
                </button>
              </div>

              {/* Typography Scale Test */}
              <div className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Responsive Typography
                </div>
                <div className="text-xs sm:text-sm md:text-base lg:text-lg">
                  Scales with screen size
                </div>
              </div>

              {/* Grid Test */}
              <div className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Responsive Grid
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  <div className="h-8 bg-blue-200 dark:bg-blue-800 rounded"></div>
                  <div className="h-8 bg-purple-200 dark:bg-purple-800 rounded"></div>
                  <div className="h-8 bg-green-200 dark:bg-green-800 rounded"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="w-full py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              Close Test Panel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

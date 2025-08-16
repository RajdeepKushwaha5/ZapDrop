import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface ResponsiveHeaderProps {
  title: string;
  onBack: () => void;
  showBackButton?: boolean;
  rightElement?: React.ReactNode;
}

export default function ResponsiveHeader({ 
  title, 
  onBack, 
  showBackButton = true, 
  rightElement 
}: ResponsiveHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 safe-area-insets">
      <div className="flex items-center justify-between p-4 sm:p-6 max-w-7xl mx-auto">
        {showBackButton ? (
          <button
            onClick={onBack}
            className="touch-target flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors duration-200 rounded-lg -ml-2"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 mr-1 sm:mr-2" />
            <span className="hidden sm:inline font-medium">Back</span>
          </button>
        ) : (
          <div className="w-12 sm:w-20"></div>
        )}
        
        <h1 className="text-lg sm:text-xl md:text-2xl font-space-grotesk font-bold text-gray-800 dark:text-white tracking-tight text-center truncate px-2">
          {title}
        </h1>
        
        <div className="flex items-center gap-2 sm:gap-4">
          {rightElement || <div className="w-12 sm:w-20"></div>}
        </div>
      </div>
    </header>
  );
}

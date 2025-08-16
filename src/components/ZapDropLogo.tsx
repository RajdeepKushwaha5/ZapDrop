'use client';

import React from 'react';

interface ZapDropLogoProps {
  size?: number;
  className?: string;
  variant?: 'default' | 'icon-only' | 'text-only';
  theme?: 'light' | 'dark' | 'auto';
}

export default function ZapDropLogo({ 
  size = 40, 
  className = '', 
  variant = 'default',
  theme = 'auto' 
}: ZapDropLogoProps) {
  
  const iconSize = variant === 'text-only' ? 0 : size;
  const showText = variant !== 'icon-only';
  
  // Dynamic colors based on theme
  const getColors = () => {
    if (theme === 'light') {
      return {
        primary: '#2563eb',
        secondary: '#0ea5e9',
        accent: '#06b6d4',
        text: '#1f2937'
      };
    } else if (theme === 'dark') {
      return {
        primary: '#60a5fa',
        secondary: '#38bdf8',
        accent: '#22d3ee',
        text: '#f9fafb'
      };
    }
    // Auto theme - use CSS custom properties
    return {
      primary: 'currentColor',
      secondary: 'currentColor', 
      accent: 'currentColor',
      text: 'currentColor'
    };
  };

  const colors = getColors();

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {variant !== 'text-only' && (
        <div className="relative" style={{ width: iconSize, height: iconSize }}>
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-sm"
          >
            {/* Background Circle with Gradient */}
            <defs>
              <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="50%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
              <linearGradient id="zapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
            
            {/* Main Background Circle */}
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="url(#bgGradient)"
              className="animate-pulse duration-3000"
            />
            
            {/* Connection Lines (P2P Network) */}
            <g opacity="0.7">
              {/* Left node */}
              <circle cx="12" cy="24" r="3" fill="white" opacity="0.9" />
              {/* Right node */}
              <circle cx="36" cy="24" r="3" fill="white" opacity="0.9" />
              {/* Connection line */}
              <line x1="15" y1="24" x2="33" y2="24" stroke="white" strokeWidth="1.5" opacity="0.8" />
            </g>
            
            {/* Lightning Bolt (Zap) */}
            <path
              d="M22 14 L18 22 L26 22 L26 34 L30 26 L22 26 Z"
              fill="url(#zapGradient)"
              className="drop-shadow"
            />
            
            {/* Data Transfer Particles */}
            <g className="animate-pulse">
              <circle cx="20" cy="24" r="1" fill="#fbbf24" opacity="0.8">
                <animate attributeName="cx" values="15;33;15" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="28" cy="24" r="1" fill="#f59e0b" opacity="0.6">
                <animate attributeName="cx" values="33;15;33" dur="2.5s" repeatCount="indefinite" />
              </circle>
            </g>
            
            {/* Subtle Glow Effect */}
            <circle
              cx="24"
              cy="24"
              r="22"
              fill="none"
              stroke="url(#bgGradient)"
              strokeWidth="0.5"
              opacity="0.3"
              className="animate-pulse duration-2000"
            />
          </svg>
        </div>
      )}
      
      {showText && (
        <div className="flex flex-col">
          <span 
            className="font-space-grotesk font-bold tracking-tight leading-none"
            style={{ 
              fontSize: size * 0.6,
              background: theme === 'auto' 
                ? 'linear-gradient(135deg, #2563eb, #0ea5e9, #06b6d4)'
                : `linear-gradient(135deg, ${colors.primary}, ${colors.secondary}, ${colors.accent})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: theme === 'auto' ? 'transparent' : colors.text,
              backgroundClip: 'text'
            }}
          >
            ZapDrop
          </span>
          {size >= 32 && (
            <span 
              className="font-inter font-medium tracking-wide"
              style={{ 
                fontSize: size * 0.18,
                color: theme === 'auto' ? 'currentColor' : colors.text,
                opacity: 0.7
              }}
            >
              Zap it. Drop it. Share it.
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Alternative simplified icon for favicons and small sizes
export function ZapDropIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      
      {/* Simplified background */}
      <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#iconGradient)" />
      
      {/* Lightning bolt */}
      <path
        d="M11 7 L8 11 L13 11 L13 17 L16 13 L11 13 Z"
        fill="#fbbf24"
      />
      
      {/* Connection dots */}
      <circle cx="6" cy="12" r="1.5" fill="white" opacity="0.8" />
      <circle cx="18" cy="12" r="1.5" fill="white" opacity="0.8" />
      <line x1="7.5" y1="12" x2="16.5" y2="12" stroke="white" strokeWidth="1" opacity="0.6" />
    </svg>
  );
}

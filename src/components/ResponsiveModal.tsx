import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { ResponsiveIconButton } from './ResponsiveButton';

interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

export default function ResponsiveModal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = ''
}: ResponsiveModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px'; // Prevent layout shift
      
      // Focus the modal
      if (modalRef.current) {
        modalRef.current.focus();
      }
    } else {
      // Restore body scroll
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      
      // Restore focus
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4 sm:mx-6'
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={handleOverlayClick}
      />

      {/* Modal container */}
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div
          ref={modalRef}
          tabIndex={-1}
          className={`
            relative w-full ${sizeClasses[size]} 
            bg-white dark:bg-gray-800 
            rounded-2xl shadow-2xl 
            transform transition-all
            animate-scale-in
            safe-area-insets
            ${className}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              {title && (
                <h2 
                  id="modal-title" 
                  className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate pr-4"
                >
                  {title}
                </h2>
              )}
              
              {showCloseButton && (
                <ResponsiveIconButton
                  icon={X}
                  onClick={onClose}
                  variant="ghost"
                  size="md"
                  aria-label="Close modal"
                  className="flex-shrink-0"
                />
              )}
            </div>
          )}

          {/* Content */}
          <div className="p-4 sm:p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// Full-screen mobile modal for better mobile experience
interface ResponsiveMobileModalProps extends Omit<ResponsiveModalProps, 'size'> {
  mobileFullscreen?: boolean;
}

export function ResponsiveMobileModal({
  mobileFullscreen = true,
  ...props
}: ResponsiveMobileModalProps) {
  return (
    <ResponsiveModal
      {...props}
      className={`
        ${mobileFullscreen ? 'sm:max-w-lg sm:rounded-2xl' : ''}
        ${mobileFullscreen ? 'max-w-full mx-0 rounded-none h-full sm:h-auto sm:mx-auto' : ''}
        ${props.className || ''}
      `}
    />
  );
}

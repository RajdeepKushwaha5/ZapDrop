import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ResponsiveButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
}

export default function ResponsiveButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  fullWidth = false,
  className = '',
  type = 'button',
  'aria-label': ariaLabel,
  ...props
}: ResponsiveButtonProps) {
  const baseClasses = 'touch-target inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl focus:ring-blue-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white focus:ring-gray-500',
    outline: 'border-2 border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:ring-gray-500',
    ghost: 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-500',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl focus:ring-red-500'
  };

  const sizeClasses = {
    sm: 'text-sm px-3 py-2 min-h-[36px]',
    md: 'text-base px-4 py-2.5 sm:px-6 sm:py-3 min-h-[44px]',
    lg: 'text-lg px-6 py-3 sm:px-8 sm:py-4 min-h-[52px]'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const widthClasses = fullWidth ? 'w-full' : '';
  
  const iconSpacing = iconPosition === 'left' ? 'mr-2' : 'ml-2';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${widthClasses}
        ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <div className={`animate-spin rounded-full border-2 border-current border-t-transparent ${iconSizes[size]} ${iconSpacing}`}></div>
          <span className="hidden sm:inline">Loading...</span>
          <span className="sm:hidden">...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && (
            <Icon className={`${iconSizes[size]} ${iconSpacing}`} />
          )}
          
          <span className="truncate">{children}</span>
          
          {Icon && iconPosition === 'right' && (
            <Icon className={`${iconSizes[size]} ${iconSpacing}`} />
          )}
        </>
      )}
    </button>
  );
}

// Touch-friendly icon button for mobile
interface ResponsiveIconButtonProps {
  icon: LucideIcon;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  'aria-label': string;
  title?: string;
}

export function ResponsiveIconButton({
  icon: Icon,
  onClick,
  variant = 'ghost',
  size = 'md',
  disabled = false,
  className = '',
  'aria-label': ariaLabel,
  title,
  ...props
}: ResponsiveIconButtonProps) {
  const baseClasses = 'touch-target inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg';
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white focus:ring-gray-500',
    ghost: 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-500',
    danger: 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 focus:ring-red-500'
  };

  const sizeClasses = {
    sm: 'p-2 min-w-[36px] min-h-[36px]',
    md: 'p-2.5 min-w-[44px] min-h-[44px]',
    lg: 'p-3 min-w-[52px] min-h-[52px]'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={title || ariaLabel}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'}
        ${className}
      `}
      {...props}
    >
      <Icon className={iconSizes[size]} />
    </button>
  );
}

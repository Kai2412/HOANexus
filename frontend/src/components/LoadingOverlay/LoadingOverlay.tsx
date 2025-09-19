import React from 'react';
import { createPortal } from 'react-dom';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  subMessage?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  isVisible, 
  message = 'Processing...', 
  subMessage 
}) => {
  if (!isVisible) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface border border-primary rounded-xl p-8 shadow-2xl max-w-sm w-full mx-4">
        <div className="flex flex-col items-center space-y-6">
          
          {/* Animated Spinner */}
          <div className="relative">
            <div className="w-16 h-16 border-4 border-royal-200 dark:border-royal-800 rounded-full animate-spin">
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-royal-600 rounded-full animate-spin"></div>
            </div>
          </div>

          {/* Loading Text */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-primary">
              {message}
            </h3>
            {subMessage && (
              <p className="text-sm text-secondary">
                {subMessage}
              </p>
            )}
          </div>

          {/* Animated Dots */}
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-royal-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-royal-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-royal-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
};

export default LoadingOverlay;

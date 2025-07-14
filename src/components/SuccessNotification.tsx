import React, { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

interface SuccessNotificationProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export const SuccessNotification: React.FC<SuccessNotificationProps> = ({ 
  message, 
  isVisible, 
  onClose, 
  duration = 3000 
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-20 sm:top-24 right-4 sm:right-6 z-40 animate-fade-in max-w-sm sm:max-w-md">
      <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-4 sm:p-5 rounded-3xl shadow-2xl border border-green-200 dark:border-green-700 flex items-start gap-3 sm:gap-4 backdrop-blur-xl">
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
            <CheckCircle className="text-white" size={20} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base leading-tight">{message}</p>
        </div>
        <button 
          onClick={onClose}
          className="flex-shrink-0 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 mt-0.5"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
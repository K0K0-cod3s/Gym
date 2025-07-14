import React from 'react';

interface ProgressBarProps {
  current: number;
  target: number;
  color: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  current, 
  target, 
  color, 
  size = 'md' 
}) => {
  const percentage = Math.min(100, (current / target) * 100);
  const height = size === 'sm' ? 'h-3' : size === 'lg' ? 'h-6' : 'h-4';
  
  return (
    <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full ${height} overflow-hidden shadow-inner relative`}>
      <div 
        className={`${color} ${height} rounded-full transition-all duration-1000 ease-out relative overflow-hidden`}
        style={{ width: `${percentage}%` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
      </div>
      
      {/* Percentage indicator */}
      {percentage > 10 && (
        <div 
          className="absolute top-0 h-full flex items-center text-xs font-bold text-white px-2"
          style={{ width: `${percentage}%` }}
        >
          <span className="ml-auto">{Math.round(percentage)}%</span>
        </div>
      )}
      
      {/* Goal line indicator */}
      {percentage < 100 && (
        <div className="absolute right-0 top-0 h-full w-0.5 bg-white/50"></div>
      )}
    </div>
  );
};

// Shimmer animation keyframes will be added to CSS
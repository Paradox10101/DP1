import React from 'react';

const LinearProgressBar = ({
  percentage = 0,
  height = 8,
  backgroundColor = "#E5E7EB",
  progressColor = "#3B82F6",
  showPercentage = true,
  animate = true,
  className = ""
}) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="relative w-full">
        {/* Background bar */}
        <div 
          className="w-full rounded-full"
          style={{
            backgroundColor,
            height: `${height}px`
          }}
        />
        
        {/* Progress bar */}
        <div 
          className={`absolute top-0 left-0 rounded-full ${animate ? 'transition-all duration-300 ease-in-out' : ''}`}
          style={{
            backgroundColor: progressColor,
            width: `${percentage}%`,
            height: `${height}px`
          }}
        />
      </div>
      
      {showPercentage && (
        <div className="mt-2 text-sm font-medium text-gray-700">
          {percentage}% Completado
        </div>
      )}
    </div>
  );
};

export default LinearProgressBar;
import React from 'react';

const ErrorDisplay = ({ error, onRetry, isRetrying }) => {
  if (!error?.title) return null;

  return (
    <div className="absolute top-0 left-0 z-10 flex items-center justify-center w-full h-full bg-black bg-opacity-30">
      <div className="bg-white rounded-lg p-6 max-w-md shadow-xl">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          {error.title}
        </h3>
        <p className="text-gray-600 mb-4">
          {error.message}
        </p>
        {error.action && onRetry && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className={`
              bg-blue-500 text-white font-medium py-2 px-4 rounded transition-colors
              ${isRetrying 
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-blue-600'
              }
            `}
          >
            {isRetrying ? 'Reconectando...' : error.action}
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;
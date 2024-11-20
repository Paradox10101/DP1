import React from 'react'

export const MetricItem = ({ icon: Icon, label, value }) => {
  return (
    <div className="group flex items-center p-3 rounded-lg border border-transparent transition-all hover:border-gray-100">
      <div className="mr-3">
        <Icon 
          size={20} 
          className="text-gray-400 group-hover:text-gray-600 transition-colors" 
        />
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          {label}
        </span>
        <span className="text-sm text-gray-700 font-medium mt-0.5">
          {value}
        </span>
      </div>
    </div>
  );
};
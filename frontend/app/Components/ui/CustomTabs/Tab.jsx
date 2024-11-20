import React from 'react';

const Tab = ({ children, className = "", tabId }) => {
  return (
    <div className={`h-full w-full animate-in slide-in-from-right duration-300 ${className}`}>
      {children}
    </div>
  );
};

export default Tab;

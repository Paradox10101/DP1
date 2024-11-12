import React from 'react'

export const MetricItem = ({ icon: Icon, label, value }) => {
  return (
    <div className="flex w-full flex-wrap gap-4">
      <Icon size={18} />
      <span className="regular">
        {label}: {value}
      </span>
    </div>
  );
};
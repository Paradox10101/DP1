import React from 'react';
import { getStatusConfig } from '../../utils/simulationUtils';

export const SimulationStatusDisplay = ({ status, isServerAvailable }) => {
  const { color, text } = getStatusConfig(status, isServerAvailable);
  return (
    <div className="flex items-center justify-between px-1">
      <span className="text-xs text-gray-500 uppercase tracking-wide">
        Estado
      </span>
      <span className={`text-sm font-medium ${color}`}>
        {text}
      </span>
    </div>
  );
};

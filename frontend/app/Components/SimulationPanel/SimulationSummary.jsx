import React from 'react'
import MetricsDisplay from '../MetricsDisplay';

const SimulationSummary = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <h2 className="text-sm font-medium text-gray-700 tracking-wide uppercase">
            Resumen de la simulación
          </h2>
          <div className="flex-grow ml-3 border-t border-gray-100"></div>
        </div>
        <MetricsDisplay />
      </div>
    );
  };
  
  export default SimulationSummary;
import { useState, useCallback } from 'react';
import { Button } from "@nextui-org/react";
import { Clock } from "lucide-react";

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? process.env.NEXT_PUBLIC_API_BASE_URL_PROD
  : process.env.NEXT_PUBLIC_API_BASE_URL;

const SimulationSpeedControl = ({ simulationStatus }) => {
  const [currentSpeed, setCurrentSpeed] = useState('SLOW');
  const [isChanging, setIsChanging] = useState(false);

  const speeds = [
    { key: 'FAST', label: '8x', value: 8 },
    { key: 'MEDIUM', label: '6x', value: 6 },
    { key: 'SLOW', label: '5x', value: 5 }
  ];

  const handleSpeedChange = useCallback(async (speed) => {
    if (simulationStatus === 'DISCONNECTED') return;
    setIsChanging(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/simulation/speed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ speed: speed.key }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to change simulation speed');
      }
      
      setCurrentSpeed(speed.key);
    } catch (error) {
      console.error('Error changing simulation speed:', error);
    } finally {
      setIsChanging(false);
    }
  }, [simulationStatus]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Clock size={16} className="text-gray-400" />
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Velocidad
        </span>
      </div>

      <div className="flex rounded-lg bg-gray-50/50 p-1">
        {speeds.map((speed) => {
          const isActive = currentSpeed === speed.key;
          const isDisabled = simulationStatus === 'DISCONNECTED' || isChanging;
          
          return (
            <button
              key={speed.key}
              disabled={isDisabled}
              className={`
                flex-1 py-2 px-3 rounded-md text-sm font-medium
                transition-all duration-200
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white hover:shadow-sm'}
                ${isActive 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600'}
              `}
              onClick={() => handleSpeedChange(speed)}
            >
              {speed.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-gray-400">
          Tiempo simulado
        </span>
        <span className="text-xs font-medium text-gray-600">
          {`${speeds.find(s => s.key === currentSpeed)?.value} min/seg`}
        </span>
      </div>
    </div>
  );
};

export default SimulationSpeedControl;
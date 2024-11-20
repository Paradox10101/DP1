import { SimulationStatus } from '@/app/constants';
import React from 'react';
import { Play, Pause, Square } from 'lucide-react';

const BUTTON_CONFIG = {
  pauseResume: {
    running: {
      icon: <Pause size={18} />,
      text: 'Pausar',
      baseStyle: 'bg-white border-yellow-400 text-yellow-600 hover:bg-yellow-50',
      title: 'Pause Simulation'
    },
    paused: {
      icon: <Play size={18} />,
      text: 'Reanudar',
      baseStyle: 'bg-white border-blue-400 text-blue-600 hover:bg-blue-50',
      title: 'Resume Simulation'
    },
    default: {
      icon: <Play size={18} />,
      text: 'Reanudar',
      baseStyle: 'bg-gray-50 border-gray-200 text-gray-400',
      title: 'Simulation Controls'
    }
  },
  stop: {
    icon: <Square size={18} />,
    text: 'Detener',
    baseStyle: 'bg-white border-red-400 text-red-600 hover:bg-red-50',
    title: 'Stop Simulation'
  }
};

export const SimulationButton = ({
  type,
  onClick,
  disabled,
  simulationStatus
}) => {
  let config;
  
  if (type === 'pauseResume') {
    if (simulationStatus === SimulationStatus.RUNNING) {
      config = BUTTON_CONFIG.pauseResume.running;
    } else if (simulationStatus === SimulationStatus.PAUSED) {
      config = BUTTON_CONFIG.pauseResume.paused;
    } else {
      config = BUTTON_CONFIG.pauseResume.default;
    }
  } else {
    config = BUTTON_CONFIG[type];
  }

  const style = disabled
    ? 'bg-gray-50 border-gray-200 text-gray-400'
    : config.baseStyle;

  return (
    <button
      className={`
        py-2 px-4 rounded-lg
        flex items-center justify-center gap-2
        border transition-all duration-200
        ${style}
        ${disabled ? '' : 'hover:shadow-sm active:scale-[0.98]'}
      `}
      onClick={onClick}
      disabled={disabled}
      title={config.title}
      aria-label={config.text}
    >
      {config.icon}
      <span className="text-sm font-medium">{config.text}</span>
    </button>
  );
};
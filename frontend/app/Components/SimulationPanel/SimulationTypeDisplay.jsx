import React from 'react';
import { Button } from "@nextui-org/react";
import { Clock, ChevronRight } from "lucide-react";

const SimulationTypeDisplay = ({ simulationType, simulationStatus, setShowModal }) => {
  const getSimulationTypeText = (type) => {
    return type === 'semanal' ? 'Simulación Semanal' :
           type === 'colapso' ? 'Simulación hasta Colapso' :
           'Tipo de simulación no seleccionado';
  };

  const isStopped = simulationStatus === 'stopped';

  return (
    <div className="group relative p-4 rounded-xl transition-all duration-200 bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Clock size={14} className="text-gray-400" />
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          Tipo de simulación
        </span>
      </div>

      {/* Content */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-800">
          {getSimulationTypeText(simulationType)}
        </span>
        
        <Button
          variant="light"
          size="sm"
          className={`
            min-w-[120px] h-8 
            flex items-center justify-between
            transition-all duration-200
            ${isStopped
              ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              : 'bg-gray-50 text-gray-400 opacity-50 cursor-not-allowed'
            }
          `}
          onClick={() => setShowModal(true)}
          disabled={!isStopped}
        >
          <span className="text-xs font-medium">
            Cambiar tipo
          </span>
          <ChevronRight 
            size={14} 
            className={`
              transition-transform duration-200
              ${isStopped ? 'group-hover:translate-x-0.5' : ''}
            `}
          />
        </Button>
      </div>

      {/* Highlight border when stopped */}
      <div className={`
        absolute inset-0 rounded-xl pointer-events-none
        transition-opacity duration-200
        ${isStopped 
          ? 'border border-blue-100 opacity-100' 
          : 'border border-gray-100 opacity-50'
        }
      `} />
    </div>
  );
};

export default SimulationTypeDisplay;
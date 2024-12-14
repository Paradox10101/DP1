import React from 'react';
import LinearProgressBar from './LinearProgressBar';

const CapacidadTotalVehiculos = ({ 
  capacidadUsadaTotal = 0, 
  capacidadTotalMaxima = 0 
}) => {
  return (
    <div className="flex flex-col gap-2 p-4 border rounded-xl w-full">
      <div className="flex flex-col gap-2">
        <div className="text-sm font-medium text-gray-800 text-center">
          Capacidad Total de los Vehículos
        </div>
        
        <div className="flex flex-col gap-1">
            <LinearProgressBar
                percentage={parseFloat(((capacidadUsadaTotal / capacidadTotalMaxima) * 100).toFixed(2))}
                height={8}
                backgroundColor="#E5E7EB"
                progressColor="#3B82F6"
                showPercentage={false}
                animate={true}
            />
          
          <div className="flex flex-row justify-between text-xs text-gray-600">
            <div>
              Ocupado: {capacidadUsadaTotal.toLocaleString()}
            </div>
            <div className="font-medium">
              {capacidadTotalMaxima 
                ? parseFloat(((capacidadUsadaTotal / capacidadTotalMaxima) * 100).toFixed(2)) 
                : 0}%
            </div>
            <div>
              Máximo: {capacidadTotalMaxima.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CapacidadTotalVehiculos;
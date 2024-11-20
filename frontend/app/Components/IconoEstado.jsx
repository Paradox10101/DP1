import React from 'react';

const VEHICLE_CAPACITIES = {
  A: 90,
  B: 45,
  C: 30
};

const getCapacityData = (tipo, capacidadUsada) => {
  const maxCapacity = VEHICLE_CAPACITIES[tipo] || 30;
  const percentageUsed = (capacidadUsada / maxCapacity) * 100;
  
  // Colores modernos con gradientes
  if (percentageUsed >= 90) {
    return {
      bgColor: 'bg-gradient-to-r from-red-500 to-red-600',
      ringColor: 'ring-red-300',
      textColor: 'text-red-700'
    };
  } else if (percentageUsed >= 75) {
    return {
      bgColor: 'bg-gradient-to-r from-orange-400 to-orange-500',
      ringColor: 'ring-orange-200',
      textColor: 'text-orange-700'
    };
  } else if (percentageUsed >= 50) {
    return {
      bgColor: 'bg-gradient-to-r from-yellow-400 to-yellow-500',
      ringColor: 'ring-yellow-200',
      textColor: 'text-yellow-700'
    };
  } else {
    return {
      bgColor: 'bg-gradient-to-r from-green-400 to-green-500',
      ringColor: 'ring-green-200',
      textColor: 'text-green-700'
    };
  }
};

const IconoEstado = ({ 
  Icono, 
  tipo = 'C',
  capacidadUsada = 0,
  classNameContenido = "w-4 h-4 stroke-white",
  tooltipText 
}) => {
  const { bgColor, ringColor, textColor } = getCapacityData(tipo, capacidadUsada);
  const maxCapacity = VEHICLE_CAPACITIES[tipo] || 30;
  const percentageUsed = ((capacidadUsada / maxCapacity) * 100).toFixed(1);

  return (
    <div className="group relative">
      <div className={`
        ${bgColor} 
        w-8 h-8 
        rounded-full 
        flex items-center justify-center 
        shadow-lg 
        ring-2 ${ringColor} 
        transform transition-all duration-200 
        hover:scale-110 
        hover:shadow-xl
      `}>
        <Icono className={`${classNameContenido} transition-transform group-hover:scale-110`} />
      </div>
      
      {/* Tooltip moderno */}
      <div className="
        absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
        px-3 py-2 
        bg-white 
        shadow-lg 
        rounded-lg 
        border border-gray-100
        opacity-0 group-hover:opacity-100 
        transition-all duration-200 
        scale-95 group-hover:scale-100
        pointer-events-none
        z-50
      ">
        <div className="text-xs font-medium">
          {tooltipText || (
            <div className="space-y-1">
              <div className={textColor}>
                Capacidad: {percentageUsed}%
              </div>
              <div className="text-gray-500 text-[10px]">
                {capacidadUsada}/{maxCapacity} unidades
              </div>
            </div>
          )}
        </div>
        {/* Flecha del tooltip */}
        <div className="
          absolute -bottom-1 left-1/2 transform -translate-x-1/2 
          w-2 h-2 
          bg-white 
          border-r border-b border-gray-100
          rotate-45
        "/>
      </div>
    </div>
  );
};

export default IconoEstado;
import React, { memo } from 'react';
import { Globe, Warehouse, MapPin, Package, Building2, Navigation } from "lucide-react";
import { Chip } from "@nextui-org/react";
import LinearProgressBar from './LinearProgressBar';

// Definimos el tipo de props que aceptará nuestro componente
const LocationCard = memo(({ 
  type, // 'warehouse' | 'office'
  province,
  department,
  ubigeo,
  region,
  latitude,
  longitude,
  capacity,
  occupiedPercentage
}) => {
  //console.log(`Rendering LocationCard for ${ubigeo} with occupancy ${occupiedPercentage}%`); // Debug log

  // Determinamos si es un almacén
  const isWarehouse = type === 'warehouse';
  
  // Construimos el nombre basado en el tipo y la ubicación
  const locationName = isWarehouse 
    ? `Almacén Principal ${province}`
    : `Oficina ${province}`;

  return (
    <div className='flex flex-col gap-2 p-4 rounded-lg border w-full hover:shadow-md transition-shadow'>
        <div className='flex flex-row gap-3 items-center w-full'>
            {isWarehouse ? (
              <Warehouse size={24} className='text-blue-500'/>
            ) : (
              <Building2 size={24} className='text-green-500'/>
            )}
            <div className='flex flex-col w-full'>
                <div className='flex flex-row justify-between items-center w-full'>
                    <span className='text-base font-medium'>{locationName}</span>
                    <Chip 
                      size='sm' 
                      color={isWarehouse ? 'primary' : 'success'}
                    >
                      {isWarehouse ? 'Almacén' : 'Oficina'}
                    </Chip>
                </div>
                <div className='flex flex-col gap-1'>
                    <div className='flex flex-row gap-2 items-center'>
                        <Globe size={14}/>
                        <span className='font-medium text-gray-600 text-sm'>{region}</span>
                    </div>
                    <span className='text-xs text-gray-500'>{department}</span>
                </div>
            </div>
        </div>
        
        <div className='flex flex-row justify-between'>
            <div className='flex flex-row gap-2 items-center'>
                <Navigation size={14}/>
                <span className='text-sm text-gray-600'>
                  {latitude.toFixed(4)}, {longitude.toFixed(4)}
                </span>
            </div>
            <div className="flex items-center text-sm text-gray-500">
                <MapPin className="w-4 h-4 mr-1" />
                <span>Ubigeo: {ubigeo}</span>
            </div>
        </div>

        {!isWarehouse && capacity && (
          <div className='flex flex-col gap-1'>
              <div className='flex flex-row justify-between'>
                  <span className='text-small text-gray-600'>Capacidad utilizada</span>
                  <span className='text-small font-medium text-gray-800'>
                    {occupiedPercentage.toFixed(2)}%
                  </span>
              </div>
              <LinearProgressBar
                  percentage={occupiedPercentage.toFixed(2)}
                  height={8}
                  backgroundColor="#E5E7EB"
                  progressColor={
                    occupiedPercentage > 80 ? "#EF4444" :
                    occupiedPercentage > 60 ? "#F59E0B" : "#3B82F6"
                  }
                  showPercentage={false}
                  animate={true}
              />
              <div className='flex flex-row justify-between text-xs text-gray-600'>
                  <span>0</span>
                  <span>{capacity} paquetes</span>
              </div>
          </div>
        )}

        {isWarehouse && (
          <div className='mt-1 text-sm text-gray-600 italic'>
            Capacidad ilimitada
          </div>
        )}
    </div>
  )
});

export default LocationCard

'use client';
import { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { vehiclePositionsAtom } from '../atoms';
import { ChevronDown, AlertTriangle, Calendar, MapPin, Truck, CarFront, Car, Spline, Route } from 'lucide-react';
import { format, addHours } from 'date-fns';
import { es, is } from 'date-fns/locale';
import { Modal, ModalContent, ModalHeader, ModalBody, useDisclosure, Switch } from '@nextui-org/react';
import ModalVehiculo from './ModalVehiculo';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList as List } from 'react-window';
import { blockageRoutesAtom, showBlockagesRoutesAtom, showVehiclesRoutesAtom } from '@/atoms/routeAtoms';
//import StatusBadge from './StatusBadge';
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? process.env.NEXT_PUBLIC_API_BASE_URL_PROD
  : process.env.NEXT_PUBLIC_API_BASE_URL;


export default function BlockedRoutesPanel({toggleSecondaryPanel, setToggleSecondaryPanel}) {
  const [isOpen, setIsOpen] = useState(false);
  const [blockageRoutes,] = useAtom(blockageRoutesAtom)
  const [showBlockageRoutes,setShowBlockageRoutes] = useAtom(showBlockagesRoutesAtom)
  const [showVehiclesRoutes,setShowVehiclesRoutes] = useAtom(showVehiclesRoutesAtom)

  const Row = ({ index, style }) => {
    const blockage = blockageRoutes.features[index];
    return (
      <div
      key={index}
      style={style}
      className="border rounded-lg p-3 w-full flex flex-col justify-between"
    >
        <div className="flex items-center gap-2">
          <Route className="w-4 h-4 text-red-500" />
          {blockage.properties.originCity + " -> " +
          blockage.properties.destinationCity}
        </div>
      
      
      <div className="flex items-center gap-2">
          {"(" + blockage.properties.originUbigeo + ") -> (" +
          blockage.properties.destinationUbigeo + ")"}
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <p>Inicio: {format(blockage.properties.startTime, 'dd/MM/yyyy HH:mm')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <p>Fin estimado: {format(blockage.properties.endTime, 'dd/MM/yyyy HH:mm')}</p>
        </div>
      </div>
    
    );
};

    
  


  return (
    <div >
      <div className="bg-white rounded-xl shadow-lg">
        <button
          onClick={() => {
            setIsOpen(!isOpen)
            
          
          }}
          className="w-full flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors duration-200 rounded-xl"
        >
          <div className="flex items-center gap-2">
            <Route className="text-red-500" />
            <span className="text-sm font-medium text-black">
              Rutas bloqueadas
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-gray-600 transition-transform duration-300 ${
              (isOpen ) ? "rotate-180" : ""
            }`}
          />
        </button>
        <div className={`
          overflow-hidden transition-all duration-300 ease-in-out
          ${(isOpen) ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}
        `}>
          <div className="p-4 space-y-3 overflow-y-auto max-h-[600px] w-full min-h-[450px]">
            <div className='flex flex-col gap-2'>
                  <Switch isSelected={showBlockageRoutes} onValueChange={setShowBlockageRoutes}>{(showBlockageRoutes?"Ocultar":"Visualizar") +" rutas bloquedas"}</Switch>
                  <Switch isSelected={showVehiclesRoutes} onValueChange={setShowVehiclesRoutes}>{(showVehiclesRoutes?"Ocultar":"Visualizar") +" rutas recorridas"}</Switch>
            </div>
            {blockageRoutes === undefined ||blockageRoutes === null ||  !blockageRoutes?.features || blockageRoutes.features.length === 0 ? (
              <p className="text-gray-500 text-sm">No hay rutas bloqueadas</p>
            ) : (
              <div className='w-full h-full flex flex-col gap-4'>
                
                <div>{"Cantidad de rutas bloqueadas: " + blockageRoutes.features.length}</div>
                <div className='h-[240px]'>
                  <AutoSizer>
                    {({ height, width }) => (
                        <List
                            height={height}
                            width={width}
                            itemCount={blockageRoutes.features.length}
                            itemSize={140}
                            className="scroll-area"
                        >
                          {Row}
                        </List>
                    )}
                  </AutoSizer>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { vehiclePositionsAtom } from '../atoms';
import { ChevronDown, AlertTriangle, Calendar, MapPin, Truck, CarFront, Car } from 'lucide-react';
import { format, addHours } from 'date-fns';
import { es } from 'date-fns/locale';
import { Modal, ModalContent, ModalHeader, ModalBody, useDisclosure } from '@nextui-org/react';
import ModalVehiculo from './ModalVehiculo';
//import StatusBadge from './StatusBadge';
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? process.env.NEXT_PUBLIC_API_BASE_URL_PROD
  : process.env.NEXT_PUBLIC_API_BASE_URL;

const StatusBadge = ({ status }) => {
  switch (status) {
    case "AVERIADO_1":
      return (
        <div className="pequenno border rounded-xl w-[140px] text-center bg-yellow-100 text-black-600 font-medium">
          Avería Leve
        </div>
      );
    case "AVERIADO_2":
      return (
        <div className="pequenno border rounded-xl w-[140px] text-center bg-orange-100 text-black-600 font-medium">
          Avería Moderada
        </div>
      );
    case "AVERIADO_3":
      return (
        <div className="pequenno border rounded-xl w-[140px] text-center bg-red-100 text-black-600 font-medium">
          Avería Grave
        </div>
      );
    default:
      return (
        <div className="pequenno border rounded-xl w-[140px] text-center bg-gray-100 text-black-600 font-medium">
          Averiado
        </div>
      );
  }
};

export default function BreakdownPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const [brokenVehicles, setBrokenVehicles] = useState([]);
  const [vehiclePositions] = useAtom(vehiclePositionsAtom);
  const { isOpen: isModalOpen, onOpen, onClose, onOpenChange } = useDisclosure();
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [tiempos, setTiempos] = useState({ inicio: new Date() });

    // Función para obtener tiempos
    const fetchTiempos = async () => {
        try {
        const response = await fetch(`${API_BASE_URL}/simulation/report`);
        if (response.ok) {
            const data = await response.json();
            if (data.tiempos && data.tiempos.length >= 2) {
            setTiempos({
                inicio: new Date(data.tiempos[2])
            });
            }
        }
        } catch (error) {
        console.error('Error al obtener los tiempos:', error);
        }
    };

  // Modificar esta función para que realmente sume las horas al tiempo base
    const calculateTime = (baseTime, hoursToAdd) => {
        if (!baseTime) return new Date();
        const time = new Date(baseTime);
        time.setHours(time.getHours() + hoursToAdd); // Aquí sumamos las horas según la severidad
        return time;
    };

  useEffect(() => {
    if (vehiclePositions?.features) {
      const newBrokenVehicles = vehiclePositions.features.filter(vehicle => 
        vehicle.properties.status.includes('AVERIADO')
      );
      // Si hay un cambio en la cantidad de vehículos averiados, actualizar tiempos
      if (newBrokenVehicles.length !== brokenVehicles.length) {
        fetchTiempos();
      }
      setBrokenVehicles(newBrokenVehicles);
    }
  }, [vehiclePositions]);

  //console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", vehiclePositions);

  const getBreakdownSeverity = (status) => {
    switch (status) {
      case 'AVERIADO_1':
        return { text: 'Leve', color: 'text-yellow-600', bg: 'bg-yellow-100', hours: 4 };
      case 'AVERIADO_2':
        return { text: 'Moderada', color: 'text-orange-600', bg: 'bg-orange-100', hours: 36 };
      case 'AVERIADO_3':
        return { text: 'Grave', color: 'text-red-600', bg: 'bg-red-100', hours: 72 };
      default:
        return { text: 'Desconocida', color: 'text-gray-600', bg: 'bg-gray-100', hours: 0 };
    }
  };

  const getVehicleIcon = (tipo) => {
    switch (tipo) {
      case 'A':
        return <Truck className="w-5 h-5" />;
      case 'B':
        return <CarFront className="w-5 h-5" />;
      case 'C':
        return <Car className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const handleVehicleClick = (vehicle) => {
    setSelectedVehicle(vehicle.properties);
    onOpen();
  };

  return (
    <div className="fixed right-5 bottom-6 w-96">
      <div className="bg-white rounded-xl shadow-lg">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors duration-200 rounded-xl"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-red-500" />
            <span className="text-sm font-medium text-black">
              Vehículos Averiados
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-gray-600 transition-transform duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        <div className={`
          overflow-hidden transition-all duration-300 ease-in-out
          ${isOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}
        `}>
          <div className="p-4 space-y-3 overflow-y-auto max-h-[400px]">
            {brokenVehicles.length === 0 ? (
              <p className="text-gray-500 text-sm">No hay vehículos averiados</p>
            ) : (
              <div className="space-y-3">
                {brokenVehicles.map((vehicle) => {
                  const severity = getBreakdownSeverity(vehicle.properties.status);
                  const startTime = tiempos?.inicio || new Date();
                  const endTime = calculateTime(startTime, severity.hours);
                  const coordinates = vehicle.geometry.coordinates;
                  
                  return (
                    <div
                      key={vehicle.properties.vehicleCode}
                      className="border rounded-lg p-3 space-y-2 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleVehicleClick(vehicle)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {getVehicleIcon(vehicle.properties.tipo)}
                          <span className="font-medium text-black">
                            {vehicle.properties.vehicleCode}
                          </span>
                        </div>
                        <span className={`text-sm px-2 py-1 rounded-full ${severity.bg} text-black font-medium`}>
                          {severity.text}
                        </span>
                      </div>
                      
                      <div className="text-sm text-black space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <p>Inicio: {format(startTime, 'dd/MM/yyyy HH:mm')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <p>Fin estimado: {format(endTime, 'dd/MM/yyyy HH:mm')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <p>Ubicación: [{coordinates[0].toFixed(2)}, {coordinates[1].toFixed(2)}]</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        closeButton
        isOpen={isModalOpen}
        onOpenChange={onOpenChange}
        isDismissable={true}
        blur="true"
      >
        <ModalContent className="h-[790px] min-w-[850px] overflow-y-auto scroll-area">
          <ModalHeader>
            {selectedVehicle && (
              <div className="flex flex-row gap-2">
                <div className="subEncabezado">
                  Información del vehículo {selectedVehicle.vehicleCode}
                </div>
                <StatusBadge status={selectedVehicle.status} />
              </div>
            )}
          </ModalHeader>
          <ModalBody>
            {selectedVehicle && <ModalVehiculo vehicle={selectedVehicle} />}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
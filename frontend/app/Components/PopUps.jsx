import React, { useState } from 'react';
import { Card, Modal, ModalBody, ModalContent, ModalHeader, useDisclosure } from "@nextui-org/react";
//import ModalVehiculo from "./ModalVehiculo"; // Importa el modal de detalle del vehículo
//import { AlertCircle, Activity, MapPin, Gauge } from 'lucide-react';
import VehicleHeader from "../Components/VehiclePopUp/VehicleHeader";
import VehicleActions from "../Components/VehiclePopUp/VehicleActions";
import VehicleInfo from "../Components/VehiclePopUp/VehicleInfo";
import BreakdownModal from "../Components/VehiclePopUp/BreakdownModal";
import { MAP_CONFIG } from '@/config/mapConfig';
import ModalAlmacen from './ModalAlmacen';
import ModalOficina from './ModalOficina';
import { renderToStaticMarkup } from 'react-dom/server';
import { Building, Warehouse } from 'lucide-react'; // Añadir estos iconos a los imports

// Función para generar SVG genérico con un componente de Lucide
const getSvgWithLucideIcon = (IconComponent, bgColor) => {
  const svgString = renderToStaticMarkup(
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
      <circle 
        cx="20" 
        cy="20" 
        r="20" 
        fill={bgColor}
      />
      <g transform="translate(8, 8)">
        <IconComponent color="#FFFFFF" size={24} />
      </g>
    </svg>
  );
  return `data:image/svg+xml;base64,${btoa(svgString)}`;
};


// Función para generar SVG de almacén
const getWarehouseSvg = () => {
  const svgString = renderToStaticMarkup(
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
      <circle 
        cx="20" 
        cy="20" 
        r="20" 
        fill="#2563EB"
      />
      <path
        d="M6 22V11L16 4L26 11V22H20V16H12V22H6Z"
        fill="#FFFFFF"
        transform="translate(4, 7)"
        strokeWidth="1"
      />
    </svg>
  );
  return `data:image/svg+xml;base64,${btoa(svgString)}`;
};

// Función para generar SVG de oficina
const getOfficeSvg = (occupiedPercentage) => {
  let bgColor;
  if (occupiedPercentage >= 81) {
    bgColor = '#F97316'; // Naranja para >= 81%
  } else if (occupiedPercentage >= 41) {
    bgColor = '#EAB308'; // Amarillo para >= 41%
  } else {
    bgColor = '#22C55E'; // Verde por defecto
  }

  const svgString = renderToStaticMarkup(
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
      <circle 
        cx="20" 
        cy="20" 
        r="20" 
        fill={bgColor}
      />
      <path
        d="M3 21h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V11H3v2zm0-4h18V7H3v2z"
        fill="#FFFFFF"
        transform="translate(8, 6)"
      />
    </svg>
  );
  return `data:image/svg+xml;base64,${btoa(svgString)}`;
};


const AlmacenPopUp = ({ title, ubigeo, warehouseData }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  return (
    <div className="warehouse-popup-content">
      <div className="flex items-center gap-2 mb-1">
        <img src={getSvgWithLucideIcon(Warehouse, '#2563EB')} alt="Warehouse Icon" className="w-5 h-5" />
        <h3 className="font-semibold text-sm text-gray-900">{title}</h3>
        <span className="bg-blue-600 text-white text-[11px] px-2 py-0.5 rounded-full">
          Almacén
        </span>
      </div>
      
      <div className="text-xs text-gray-600 mb-2">
        <span className="font-medium">Ubigeo:</span> {ubigeo || 'No especificado'}
      </div>

      <button
        onClick={onOpen}
        className="w-full bg-blue-600 text-white text-sm px-4 py-1.5 rounded
                 transition-colors duration-200 hover:bg-blue-700 focus:outline-none"
      >
        Ver Detalle
      </button>
        <Modal
          closeButton
          isOpen={isOpen}
          onClose={onClose}
          isDismissable={true}
          blur="true"
        >
          <ModalContent className="h-[800px] min-w-[850px]">
            <ModalHeader>
              Información del almacén {title}
            </ModalHeader>
            <ModalBody>
              <ModalAlmacen warehouse={warehouseData} />
            </ModalBody>
          </ModalContent>
        </Modal>
      </div>
    );
};

const OficinaPopUp = ({ title, ubigeo, capacidadMaxima, capacidadUtilizada, officeData, tipo = "Oficina" }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const occupiedPercentage = (capacidadUtilizada / capacidadMaxima) * 100;
  let bgColor;
  if (occupiedPercentage >= 81) {
    bgColor = '#F97316'; // Naranja para >= 81%
  } else if (occupiedPercentage >= 41) {
    bgColor = '#EAB308'; // Amarillo para >= 41%
  } else {
    bgColor = '#22C55E'; // Verde por defecto
  }

  return (
    <div className="bg-white rounded p-4 w-80 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          {/*<div dangerouslySetInnerHTML={{ __html: iconoHtmlString }} className="mr-3" />*/}
          <img src={getSvgWithLucideIcon(Building, bgColor)} alt="Office Icon" className="w-6 h-6" />          

          <h3 className="font-semibold text-base text-gray-800">{title}</h3>
        </div>
        <span className="bg-[#03AF00] text-[#BAFFB9] py-1 px-2 rounded-xl text-xs inline-block w-[100px] text-center">{tipo}</span>
      </div>
      <div className="text-gray-700 mb-2">
        <span className="font-medium mr-1">Ubigeo:</span> {ubigeo}
      </div>
      <div className="text-gray-700 mb-2">
        <span className="font-medium mr-1">Capacidad:</span> {capacidadUtilizada} / {capacidadMaxima} paquetes
      </div>
      <button className="bg-principal text-blanco py-1 px-3 rounded mt-2 self-end transition duration-300 hover:bg-principal/90" onClick={onOpen}>
        Ver Detalle
      </button>
      <Modal
          closeButton
          isOpen={isOpen}
          onClose={onClose}
          isDismissable={true}
          blur="true"
        >
          <ModalContent className="h-[800px] min-w-[850px]">
            <ModalHeader>
              Información de la oficina {title}
            </ModalHeader>
            <ModalBody>
              <ModalOficina office={officeData} />
            </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};

// Función para determinar el estado del vehículo
const determineVehicleStatus = (status, capacidadUsada) => {
  // Primero normalizamos el status actual
  let normalizedStatus = status || "Desconocido";
  
  switch (normalizedStatus) {
    case "EN_ALMACEN":
      return "En Almacén";
    case "AVERIADO":
      return "Averiado";
    case "EN_MANTENIMIENTO":
      return "En mantenimiento";
    case "EN_TRANSITO":
      return "En tránsito";
    case "HACIA_ALMACEN":
        return "Hacia almacén"
    default:
      return "En tránsito"; // Estado por defecto
  }
};



const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-center space-x-2 py-2">
    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
      <Icon className="w-4 h-4 text-gray-500" />
    </div>
    <div className="flex-1">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm font-medium text-gray-900">{value}</div>
    </div>
  </div>
);

const VehiculoPopUp = ({
  title,
  capacidadMaxima,
  capacidadUtilizada,
  estado,
  ubicacionActual,
  ubicacionSiguiente,
  velocidad,
  iconoComponent,
  vehicleData,
  onViewDetail,
  onReportIssue
}) => {
  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = React.useState(false);
  //const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();
  const handleViewDetail = (e) => {
    e.stopPropagation();
    onViewDetail?.(vehicleData);
    //alert("VEHICULO ENCONTRADO:"+ JSON.stringify(vehicleData, null, 2));
    //onOpen();
  };

  const handleBreakdownClick = (e) => {
    e.stopPropagation();
    setIsBreakdownModalOpen(true);
  };

  const handleBreakdownSuccess = () => {
    // Aquí puedes actualizar el estado del vehículo o recargar los datos
    onReportIssue?.(vehicleData);
  };
  //AQUI EL "VEHICLE HEADER" --> SOLO CAMBIA EL COLOR DEL TAG DE STATUS <---- LO MÁS RELEVANTE DE ESO
  return (
    <>
      <Card className="min-w-[300px]">
        <VehicleHeader
          iconoComponent={iconoComponent}
          title={title}
          status={estado}
        />
        
        <VehicleInfo 
          capacidadUtilizada={capacidadUtilizada}
          capacidadMaxima={capacidadMaxima}
          ubicacionActual={ubicacionActual}
          ubicacionSiguiente={ubicacionSiguiente}
          velocidad={velocidad}
        />
        
        <VehicleActions 
          onProvoke={handleBreakdownClick}
          onViewDetail={handleViewDetail}
          isInTransit={estado === 'EN_TRANSITO_ORDEN'}
        />
      </Card>

      <BreakdownModal 
        isOpen={isBreakdownModalOpen}
        onClose={() => setIsBreakdownModalOpen(false)}
        vehicleCode={title}
        onSuccess={handleBreakdownSuccess}
      />
    </>
  );
};

export { AlmacenPopUp, OficinaPopUp, VehiculoPopUp };

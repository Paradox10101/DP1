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

const AlmacenPopUp = ({ title, ubigeo, warehouseData }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  return (
      <div className="bg-white rounded p-4 w-80 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          {/*<div dangerouslySetInnerHTML={{ __html: iconoHtmlString }} className="mr-3" />*/}
          <img src={MAP_CONFIG.IMAGES.WAREHOUSE.url} alt="Warehouse Icon" className="w-6 h-6" />
          <h3 className="font-semibold text-base text-gray-800">{title}</h3>
          <span className="bg-[#284BCC] text-[#BECCFF] py-1 px-2 rounded-xl text-xs inline-block w-[100px] text-center">Almacén</span>
        </div>
        <div className="text-gray-700 mb-2">
          <span className="font-medium mr-1">Ubigeo:</span> {ubigeo}
        </div>
        <button className="bg-principal text-blanco py-1 px-3 rounded mt-2 self-end transition duration-300 hover:bg-principal/90" onClick={onOpen}>
          Ver Detalle
        </button>
        <Modal
          closeButton
          isOpen={isOpen}
          onClose={onClose}
          isDismissable={true}
          blur
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
  return (
    <div className="bg-white rounded p-4 w-80 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          {/*<div dangerouslySetInnerHTML={{ __html: iconoHtmlString }} className="mr-3" />*/}
          <img src={MAP_CONFIG.IMAGES.OFFICE.url} alt="Office Icon" className="w-6 h-6" />          

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
          blur
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

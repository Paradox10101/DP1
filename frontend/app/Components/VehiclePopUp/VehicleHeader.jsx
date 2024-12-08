import React from 'react';
import { Chip } from "@nextui-org/react";

const getStatusColor = (status) => {
  const statusColors = {
    // Vehículo en almacén
    'EN_ALMACEN': "#DEA71A", 
    "ORDENES_CARGADAS": "#DEA71A",
    
    // Vehículo en mantenimiento
    "EN_MANTENIMIENTO": "#7B15FA",
    "EN_REPARACION": "#7B15FA",

    // Vehículo en espera
    'LISTO_PARA_RETORNO': "#7B15FA",
    'EN_ESPERA_EN_OFICINA': "#7B15FA",
    'EN_REEMPLAZO': "#7B15FA",

    // Vehículo en tránsito
    'EN_TRANSITO_ORDEN': "#284BCC",
    'HACIA_ALMACEN': "#284BCC",
    
    // Averías por severidad
    'AVERIADO_1': "#FFD700", // Amarillo - Avería leve
    'AVERIADO_2': "#FF4500", // Naranja/rojo - Avería moderada
    'AVERIADO_3': {          // Rojo intenso - Avería grave
      color: "#B22222",
      variant: 'solid'
    },

    // Estados especiales
    'DETENIDO': {            // Gris - Vehículo detenido
      color: '#A9A9A9',
      variant: 'flat'
    }
  };

  const defaultStatus = {
    color: 'default',
    variant: 'flat'
  };

  const statusC = statusColors[status];

  // Si el status es un string, convertirlo al formato de objeto
  if (typeof statusC === 'string') {
    return {
      color: statusC,
      variant: 'bordered'  // variant por defecto para los que solo especifican color
    };
  }

  return statusC || defaultStatus;
};


const getStatusText = (status) => {
  const statusTexts = {
    // Vehiculo en almacen
    'EN_ALMACEN': 'En Almacén', 
    "ORDENES_CARGADAS": 'En Almacén',

    // Vehiculo en mantenimiento
    "EN_MANTENIMIENTO": 'En mantenimiento',
    "EN_REPARACION": 'En reparación',

    // Vehículo en espera
    'LISTO_PARA_RETORNO': 'Por retornar',
    'EN_ESPERA_EN_OFICINA': 'En Espera',
    'EN_REEMPLAZO': 'En Reemplazo',

    // Vehiculo en transito
    'EN_TRANSITO_ORDEN': 'En Tránsito',
    'HACIA_ALMACEN': 'Hacia almacén',


    // Estados de avería
    'AVERIADO_1': 'Avería Leve',
    'AVERIADO_2': 'Avería Moderada',
    'AVERIADO_3': 'Avería Grave',
    
    // Otros estados
    'DETENIDO': 'Detenido'
  };
  
  return statusTexts[status] || status;
};
  
const VehicleHeader = ({ iconoComponent, title, status }) => {
  const statusStyle = getStatusColor(status);
  
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-100">
      <div className="flex items-center space-x-3 gap-2">
        {iconoComponent}
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <Chip
      variant={statusStyle.variant}
      size="sm"
      style={{
        backgroundColor: statusStyle.color, // Color de fondo dinámico
        borderColor: statusStyle.color, // Color del borde dinámico
        color: '#FFFFFF', // Texto blanco
        fontWeight: 'bold', // Texto en negrita
        fontSize: '0.875rem', // Ajuste al tamaño pequeño
      }}
    >
      {getStatusText(status)} {/* Llamada para mostrar el estado */}
    </Chip>
    </div>
  );
};

export default VehicleHeader;
import React from 'react';
import { Chip } from "@nextui-org/react";

const getStatusColor = (status) => {
  const statusColors = {
    // Vehículo operativo
    'EN_TRANSITO_ORDEN': 'success',     // Verde - Activamente en ruta
    'EN_ESPERA_EN_OFICINA': 'secondary',   // Morado - Esperando en oficina
    'EN_ALMACEN': 'primary',            // Azul - En almacén

    // Averías por severidad
    'AVERIADO_1': 'warning',            // Amarillo - Avería leve
    'AVERIADO_2': 'danger',             // Rojo suave - Avería moderada
    'AVERIADO_3': {                     // Rojo intenso - Avería grave
      color: 'danger',
      variant: 'solid'
    },

    // Estados especiales
    'DETENIDO': {                       // Gris - Vehículo detenido
      color: 'default',
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
    // Estados operativos
    'EN_TRANSITO_ORDEN': 'En Tránsito',
    'EN_ESPERA_EN_OFICINA': 'En Espera',
    'EN_ALMACEN': 'En Almacén',
    
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
      <div className="flex items-center space-x-3">
        {iconoComponent}
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <Chip
        color={statusStyle.color}
        variant={statusStyle.variant}
        size="sm"
        classNames={{
          base: "font-medium",
          content: "text-sm"
        }}
      >
        {getStatusText(status)}
      </Chip>
    </div>
  );
};

export default VehicleHeader;
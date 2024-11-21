import React from 'react';
import { Card, CardBody } from "@nextui-org/react";
import { Activity, MapPin, Gauge } from 'lucide-react';

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-2">
    <Icon className="w-4 h-4 text-gray-500" />
    <span className="text-sm text-gray-600">{label}:</span>
    <span className="text-sm font-medium">{value}</span>
  </div>
);

const VehicleInfo = ({ capacidadUtilizada, capacidadMaxima, ubicacionActual, velocidad }) => (
  <CardBody className="p-4 space-y-3">
    <InfoItem
      icon={Activity}
      label="Capacidad"
      value={`${capacidadUtilizada}/${capacidadMaxima} paquetes`}
    />
    <InfoItem
      icon={MapPin}
      label="Ubicación"
      value={ubicacionActual}
    />
    <InfoItem
      icon={Gauge}
      label="Velocidad"
      value={`${velocidad} km/h`}
    />
  </CardBody>
);

export default VehicleInfo;
import React from 'react';
import { locationService } from '../../../services/locationService';

export const ConfirmationStep = ({ formData }) => {
  const { customerInfo, packageDetails } = formData;
  const orderDateTime = new Date();

  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-4 space-y-4">
        <h3 className="font-medium text-lg text-gray-900">Detalles del Envío</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Cantidad de paquetes</p>
            <p className="text-gray-900">{packageDetails.quantity}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Ciudad de destino</p>
            <p className="text-gray-900">{packageDetails.destinationCityName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Fecha y hora de registro</p>
            <p className="text-gray-900">
              {locationService.formatDateTime(orderDateTime)}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-gray-500">Plazo máximo de entrega</p>
            <p className="text-gray-900 font-medium">
              {packageDetails.dueDate ? locationService.formatDateTime(packageDetails.dueDate) : '-'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationStep;
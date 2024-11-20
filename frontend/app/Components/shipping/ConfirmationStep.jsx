'use client'

import React, { useState, useEffect } from 'react';
import { Spinner } from "@nextui-org/react";
import { locationService } from '../../../services/locationService';

export const ConfirmationStep = ({ formData, onDataChange }) => {
  const { customerInfo, packageDetails } = formData;
  const [loading, setLoading] = useState(true);
  const [orderDateTime] = useState(new Date());
  const [dueDate, setDueDate] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const calculateDeliveryDate = () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!packageDetails.locations) {
          throw new Error('No se encontraron datos de ubicación');
        }

        const calculatedDueDate = locationService.calculateDueDate(
          orderDateTime,
          packageDetails.destinationCity,
          packageDetails.locations
        );
        
        setDueDate(calculatedDueDate);
      } catch (error) {
        console.error('Error calculando fecha de entrega:', error);
        setError('No se pudo calcular la fecha de entrega. Por favor, inténtelo de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    calculateDeliveryDate();
  }, [packageDetails.destinationCity, packageDetails.locations]);

  useEffect(() => {
    onDataChange?.({
      data: {
        ...customerInfo,
        ...packageDetails,
        orderDateTime,
        dueDate
      },
      isValid: !error && dueDate !== null,
      errors: error ? { dueDate: error } : {}
    });
  }, [customerInfo, packageDetails, orderDateTime, dueDate, error]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-4 space-y-4">
        <h3 className="font-medium text-lg text-gray-900">Información del Cliente</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Nombre</p>
            <p className="text-gray-900">{customerInfo.firstName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Apellidos</p>
            <p className="text-gray-900">{customerInfo.lastName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Teléfono</p>
            <p className="text-gray-900">{customerInfo.phone}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="text-gray-900">{customerInfo.email || '-'}</p>
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-4 space-y-4">
        <h3 className="font-medium text-lg text-gray-900">Detalles del Envío</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Cantidad de paquetes</p>
            <p className="text-gray-900">{packageDetails.quantity}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Ciudad de origen</p>
            <p className="text-gray-900">{packageDetails.originCityName}</p>
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
              {dueDate ? locationService.formatDateTime(dueDate) : 'Calculando...'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationStep;
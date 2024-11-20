import React from 'react';
import { Card, Button, Progress } from '@nextui-org/react';
import { CheckCircle2, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';

export const UploadStatus = ({
  status,
  progress,
  isUploading,
  onReset,
  errorDetails = []
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          icon: <CheckCircle2 className="h-6 w-6 text-success" />,
          title: '¡Carga completada con éxito!',
          description: 'Todos los registros fueron procesados correctamente.',
          color: 'bg-success-50',
          variant: 'success'
        };
      case 'error':
        return {
          icon: <XCircle className="h-6 w-6 text-danger" />,
          title: 'Error en la carga',
          description: 'Se encontraron errores durante el proceso.',
          color: 'bg-danger-50',
          variant: 'danger'
        };
      case 'partial':
        return {
          icon: <AlertTriangle className="h-6 w-6 text-warning" />,
          title: 'Carga parcialmente completada',
          description: 'Algunos registros no pudieron ser procesados.',
          color: 'bg-warning-50',
          variant: 'warning'
        };
      default:
        return {
          icon: <RefreshCw className="h-6 w-6 text-primary animate-spin" />,
          title: 'Procesando archivo',
          description: 'Por favor, espere mientras se procesan los registros.',
          color: 'bg-primary-50',
          variant: 'primary'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Card className={`p-6 ${config.color}`}>
      <div className="space-y-4">
        {/* Encabezado del estado */}
        <div className="flex items-center gap-3">
          {config.icon}
          <div>
            <h3 className="font-semibold text-gray-900">
              {config.title}
            </h3>
            <p className="text-sm text-gray-600">
              {config.description}
            </p>
          </div>
        </div>

        {/* Barra de progreso */}
        {isUploading && (
          <div className="space-y-2">
            <Progress
              value={progress}
              color={config.variant}
              className="max-w-full"
              size="sm"
            />
            <p className="text-sm text-gray-600 text-right">
              {progress}% completado
            </p>
          </div>
        )}

        {/* Detalles de errores si existen */}
        {status === 'error' && errorDetails.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium text-gray-900">
              Detalles de los errores:
            </h4>
            <Card className="bg-danger-50">
              <div className="max-h-40 overflow-y-auto p-3">
                <ul className="space-y-1">
                  {errorDetails.map((error, index) => (
                    <li
                      key={index}
                      className="text-sm text-danger flex items-start gap-2"
                    >
                      <span>•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </div>
        )}

        {/* Estadísticas de la carga */}
        {status === 'partial' && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Card className="p-3">
              <div className="text-center">
                <p className="text-sm text-gray-600">Registros procesados</p>
                <p className="text-xl font-semibold text-gray-900">150</p>
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-center">
                <p className="text-sm text-gray-600">Registros con error</p>
                <p className="text-xl font-semibold text-danger">23</p>
              </div>
            </Card>
          </div>
        )}

        {/* Acciones */}
        <div className="flex justify-end gap-3 mt-4">
          {status === 'error' && (
            <Button
              variant="light"
              color={config.variant}
              onPress={onReset}
              size="sm"
            >
              Reintentar
            </Button>
          )}
          {status === 'success' && (
            <Button
              variant="light"
              color={config.variant}
              onPress={onReset}
              size="sm"
            >
              Cargar otro archivo
            </Button>
          )}
          {(status === 'error' || status === 'partial') && (
            <Button
              variant="light"
              color={config.variant}
              onPress={() => {/* Lógica para descargar reporte */}}
              size="sm"
            >
              Descargar reporte
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
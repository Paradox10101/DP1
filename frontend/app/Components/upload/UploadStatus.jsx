import React from 'react';
import { Card, Button, Progress } from '@nextui-org/react';
import { CheckCircle2, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';

export const UploadStatus = ({
  status,
  progress,
  isUploading,
  onReset,
  errorDetails = [],
  totalRecords = 0,
  successfulRecords = []
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          icon: <CheckCircle2 className="h-6 w-6 text-green-500" />,
          title: '¡Carga completada con éxito!',
          description: 'Todos los registros fueron procesados correctamente.',
          color: 'bg-green-50',
          variant: 'success'
        };
      case 'error':
        return {
          icon: <XCircle className="h-6 w-6 text-red-500" />,
          title: 'Error en la carga',
          description: 'Se encontraron errores durante el proceso.',
          color: 'bg-red-50',
          variant: 'danger'
        };
      case 'partial':
        return {
          icon: <AlertTriangle className="h-6 w-6 text-yellow-500" />,
          title: 'Carga parcialmente completada',
          description: 'Algunos registros no pudieron ser procesados.',
          color: 'bg-yellow-50',
          variant: 'warning'
        };
      default:
        return {
          icon: <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />,
          title: 'Procesando archivo',
          description: 'Por favor, espere mientras se procesan los registros.',
          color: 'bg-blue-50',
          variant: 'primary'
        };
    }
  };

  // Procesar los errores para agrupar por ubigeo
  const processUbigeoErrors = () => {
    return errorDetails.reduce((acc, error) => {
      if (typeof error === 'string') {
        // Extraer el JSON string del error
        const jsonStart = error.indexOf('{');
        const jsonEnd = error.indexOf('}') + 1;
        if (jsonStart !== -1 && jsonEnd !== -1) {
          try {
            const recordData = JSON.parse(error.slice(jsonStart, jsonEnd));
            const ubigeo = recordData.destinationUbigeo;
            if (ubigeo) {
              acc[ubigeo] = (acc[ubigeo] || 0) + 1;
            }
          } catch (e) {
            console.error('Error parsing record data:', e);
          }
        }
      }
      return acc;
    }, {});
  };

  const config = getStatusConfig();
  const ubigeoErrors = processUbigeoErrors();

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
              className="max-w-full"
              size="sm"
            />
            <p className="text-sm text-gray-600 text-right">
              {progress}% completado
            </p>
          </div>
        )}

        {/* Detalles de errores si existen */}
        {status === 'error' && Object.keys(ubigeoErrors).length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium text-gray-900">
              Errores por Ubigeo:
            </h4>
            <Card className="bg-red-50">
              <div className="max-h-40 overflow-y-auto p-3">
                <ul className="space-y-1">
                  {Object.entries(ubigeoErrors).map(([ubigeo, count]) => (
                    <li
                      key={ubigeo}
                      className="text-sm text-red-600 flex items-start gap-2"
                    >
                      <span>•</span>
                      <span>El ubigeo {ubigeo} no existe - {count} {count === 1 ? 'registro afectado' : 'registros afectados'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </div>
        )}

        {/* Estadísticas de la carga */}
        {(status === 'partial' || status === 'error') && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Card className="p-3">
              <div className="text-center">
                <p className="text-sm text-gray-600">Registros procesados</p>
                <p className="text-xl font-semibold text-gray-900">
                  {successfulRecords.length}
                </p>
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-center">
                <p className="text-sm text-gray-600">Registros con error</p>
                <p className="text-xl font-semibold text-red-500">
                  {errorDetails.length}
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Acciones */}
        <div className="flex justify-end gap-3 mt-4">
          {status === 'error' && (
            <Button
              variant="outline"
              className="text-red-500 border-red-500 hover:bg-red-50"
              onClick={onReset}
              size="sm"
            >
              Reintentar
            </Button>
          )}
          {status === 'success' && (
            <Button
              variant="outline"
              className="text-green-500 border-green-500 hover:bg-green-50"
              onClick={onReset}
              size="sm"
            >
              Cargar otro archivo
            </Button>
          )}
          {(status === 'error' || status === 'partial') && (
            <Button
              variant="outline"
              className="text-blue-500 border-blue-500 hover:bg-blue-50"
              onClick={() => {/* Lógica para descargar reporte */}}
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
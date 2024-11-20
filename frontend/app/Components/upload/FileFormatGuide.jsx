import React from 'react';
import { Card } from '@nextui-org/react';
import { InfoIcon, FileText, Check } from 'lucide-react';

export const FileFormatGuide = () => {
  return (
    <Card className="p-6">
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <InfoIcon className="h-5 w-5 text-blue-500" />
          Guía de Formato
        </h2>

        {/* Estructura del contenido */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Estructura del registro
          </h3>
          <Card className="bg-default-50">
            <div className="p-4">
              <code className="text-sm text-gray-800">
                dd hh:mm, UG-Ori =&gt; UG-Des, Cant, IdCliente
              </code>
              <div className="mt-3 grid gap-2">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">dd:</span> día del mes (01-31)
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">hh:mm:</span> hora y minuto
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">UG-Ori:</span> UbiGeo Origen
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">UG-Des:</span> UbiGeo Destino
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Cant:</span> Cantidad vendida
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">IdCliente:</span> Código del cliente
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Ejemplo */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-500" />
            Ejemplo de contenido
          </h3>
          <Card className="bg-default-50">
            <div className="p-4">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                01 01:13, 130101 =&gt; 010201, 16, 000176{'\n'}
                01 03:03, 150101 =&gt; 101001, 24, 000810
              </pre>
            </div>
          </Card>
        </div>

        {/* Validaciones */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Validaciones
          </h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-600">
                El archivo debe tener extensión .csv
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-600">
                El nombre debe seguir el formato especificado
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-600">
                Cada línea debe cumplir con el formato de registro
              </span>
            </li>
          </ul>
        </div>
      </div>
    </Card>
  );
};
import React from 'react';
import { Card } from '@nextui-org/react';
import { InfoIcon, FileText, Check } from 'lucide-react';

const formatGuideConfigs = {
  vehiculos: {
    structure: {
      format: "CODIGO,TIPO,CAPACIDAD,UBIGEO",
      fields: [
        { label: "CODIGO", desc: "código del vehículo (A001, B001, C001)" },
        { label: "TIPO", desc: "tipo de vehículo (A, B o C)" },
        { label: "CAPACIDAD", desc: "capacidad en unidades" },
        { label: "UBIGEO", desc: "ubigeo del almacén de origen (6 dígitos)" }
      ]
    },
    examples: [
      "A001,A,90,150101",
      "B002,B,45,150101",
      "C001,C,30,150101"
    ],
    validations: [
      "El archivo debe tener extensión .txt",
      "El código debe empezar con el tipo de vehículo (A, B o C)",
      "Solo se permiten tipos A, B y C",
      "La capacidad debe ser un número entero positivo",
      "El ubigeo debe tener exactamente 6 dígitos"
    ]
  },
  ubicaciones: {
    structure: {
      format: "UBIGEO,DEPARTAMENTO,PROVINCIA,LATITUD,LONGITUD,REGION,CAPACIDAD",
      fields: [
        { label: "UBIGEO", desc: "código de provincia (6 dígitos)" },
        { label: "DEPARTAMENTO", desc: "nombre del departamento" },
        { label: "PROVINCIA", desc: "nombre de la provincia" },
        { label: "LATITUD", desc: "coordenada latitud (ej: -13.6373465)" },
        { label: "LONGITUD", desc: "coordenada longitud (ej: -72.87887764)" },
        { label: "REGION", desc: "región natural (COSTA, SIERRA o SELVA)" },
        { label: "CAPACIDAD", desc: "capacidad de la oficina en unidades" }
      ]
    },
    examples: [
      "030101,APURIMAC,ABANCAY,-13.6373465,-72.87887764,SIERRA,103",
      "040101,AREQUIPA,AREQUIPA,-16.39881421,-71.537019649,COSTA,177"
    ],
    validations: [
      "El archivo debe tener extensión .txt",
      "El ubigeo debe tener 6 dígitos",
      "Las coordenadas deben estar en el rango válido para Perú",
      "La región natural debe ser COSTA, SIERRA o SELVA",
      "La capacidad debe ser un número entero positivo",
      "Todos los campos son obligatorios",
      "Las coordenadas deben tener formato decimal"
    ]
  },
  tramos: {
    structure: {
      format: "UBIGEO_ORIGEN => UBIGEO_DESTINO",
      fields: [
        { label: "UBIGEO_ORIGEN", desc: "código de provincia origen (6 dígitos)" },
        { label: "=>", desc: "separador de dirección del tramo" },
        { label: "UBIGEO_DESTINO", desc: "código de provincia destino (6 dígitos)" }
      ]
    },
    examples: [
      "010201 => 010301",
      "020101 => 020501",
      "030101 => 040101"
    ],
    validations: [
      "El archivo debe tener extensión .txt",
      "Cada ubigeo debe tener exactamente 6 dígitos",
      "Los ubigeos de origen y destino deben ser diferentes",
      "Debe usarse '=>' como separador entre ubigeos",
      "No debe haber información adicional en la línea",
      "Los ubigeos deben corresponder a provincias existentes"
    ]
  },
  mantenimientos: {
    structure: {
      format: "AAAAMMDD:CODIGO_VEHICULO",
      fields: [
        { label: "AAAAMMDD", desc: "fecha del mantenimiento (ej: 20240423)" },
        { label: ":", desc: "separador" },
        { label: "CODIGO_VEHICULO", desc: "código del vehículo a programar mantenimiento" }
      ]
    },
    examples: [
      "20240423:B013",
      "20240425:C021",
      "20240427:B002"
    ],
    validations: [
      "El archivo debe tener extensión .txt",
      "La fecha debe tener formato AAAAMMDD",
      "La fecha debe ser igual o posterior a la fecha actual",
      "El código del vehículo debe existir en el sistema",
      "Debe usarse ':' como separador entre fecha y código",
      "No debe haber espacios en la línea",
      "El código del vehículo debe seguir el formato correcto (letra seguida de 3 dígitos)"
    ]
  },
  bloqueos: {
    structure: {
      format: "UG-Ori => UG-Des;mmdd-inicio,hh:mm-inicio==mmdd-fin,hh:mm-fin",
      fields: [
        { label: "UG-Ori", desc: "ubigeo de origen (6 dígitos)" },
        { label: "=>", desc: "separador de ruta" },
        { label: "UG-Des", desc: "ubigeo de destino (6 dígitos)" },
        { label: ";", desc: "separador de sección temporal" },
        { label: "mmdd-inicio", desc: "mes y día de inicio (4 dígitos)" },
        { label: ",", desc: "separador" },
        { label: "hh:mm-inicio", desc: "hora y minuto de inicio (formato 24h)" },
        { label: "==", desc: "separador de período" },
        { label: "mmdd-fin", desc: "mes y día de fin (4 dígitos)" },
        { label: ",", desc: "separador" },
        { label: "hh:mm-fin", desc: "hora y minuto de fin (formato 24h)" }
      ]
    },
    examples: [
      "250301 => 220501;0101,13:32==0119,10:39",
      "150101 => 150201;0215,08:00==0215,18:00",
      "220101 => 220301;0301,06:00==0302,22:00"
    ],
    validations: [
      "El archivo debe tener extensión .txt",
      "Los ubigeos deben tener exactamente 6 dígitos",
      "Los ubigeos de origen y destino deben ser diferentes",
      "El formato de fecha debe ser MMDD (mes y día)",
      "El formato de hora debe ser HH:MM (24 horas)",
      "La fecha y hora de fin debe ser posterior a la de inicio",
      "Los separadores deben ser '=>', ';', ',' y '==' exactamente como se especifica",
      "Las fechas deben ser válidas para el año en curso",
      "Las horas deben estar entre 00:00 y 23:59"
    ]
  }
};

export const FileFormatGuide = ({ type = 'vehiculos' }) => {
  const config = formatGuideConfigs[type];

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
          <Card className="bg-default-50 overflow-x-auto">
            <div className="p-4">
              <code className="text-sm text-gray-800">
                {config.structure.format}
              </code>
              <div className="mt-3 grid gap-2">
                {config.structure.fields.map((field, index) => (
                  <div key={index} className="text-sm text-gray-600">
                    <span className="font-medium">{field.label}:</span> {field.desc}
                  </div>
                ))}
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
          <Card className="bg-default-50 overflow-x-auto">
            <div className="p-4">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                {config.examples.join('\n')}
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
            {config.validations.map((validation, index) => (
              <li key={index} className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-600">
                  {validation}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
};

export default FileFormatGuide;
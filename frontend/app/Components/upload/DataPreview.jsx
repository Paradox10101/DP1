import React from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Card,
  Pagination,
  Chip
} from "@nextui-org/react";
import { AlertTriangle } from 'lucide-react';

const configColumns = {
  vehiculos: [
    { key: "codigo", header: "Código" },
    { key: "tipo", header: "Tipo" },
    { key: "capacidad", header: "Capacidad" },
    { key: "ubigeo", header: "Ubigeo" },
    { key: "status", header: "Estado" }
  ],
  ubicaciones: [
    { key: "ubigeo", header: "Ubigeo" },
    { key: "departamento", header: "Departamento" },
    { key: "provincia", header: "Provincia" },
    { key: "latitud", header: "Latitud" },
    { key: "longitud", header: "Longitud" },
    { key: "region", header: "Región" },
    { key: "capacidad", header: "Capacidad" },
    { key: "status", header: "Estado" }
  ],
  tramos: [
    { key: "origen", header: "Ubigeo Origen" },
    { key: "destino", header: "Ubigeo Destino" },
    { key: "status", header: "Estado" }
  ],
  mantenimientos: [
    { key: "fecha", header: "Fecha" },
    { key: "vehiculo", header: "Código Vehículo" },
    { key: "status", header: "Estado" }
  ],
  bloqueos: [
    { key: "origen", header: "Ubigeo Origen" },
    { key: "destino", header: "Ubigeo Destino" },
    { key: "fechaInicio", header: "Inicio" },
    { key: "fechaFin", header: "Fin" },
    { key: "status", header: "Estado" }
  ],
  shipment: [
    { key: "dia", header: "Día" },
    { key: "hora", header: "Hora" },
    { key: "origen", header: "Origen" },
    { key: "destino", header: "Destino" },
    { key: "cantidad", header: "Cantidad" },
    { key: "status", header: "Estado" }
  ]
};

// Función para parsear el contenido según el tipo
const parseContent = (item, type) => {
  const content = item.content;
  
  switch(type) {
    case 'shipment': {
      // Formato: "DD HH:MM, ****** => XXXXXX, N"
      const match = content.match(/^(\d{2})\s+(\d{2}:\d{2}),\s*(\*{6})\s*=>\s*(\d{6}),\s*(\d+)$/);
      if (match) {
        const [, dia, hora, origen, destino, cantidad] = match;
        return {
          dia,
          hora,
          origen,
          destino,
          cantidad
        };
      }
      return {};
    }
    case 'vehiculos': {
      const [codigo, tipo, capacidad, ubigeoVehiculo] = content.split(',');
      return {
        codigo,
        tipo,
        capacidad,
        ubigeo: ubigeoVehiculo
      };
    }
    case 'ubicaciones': {
      const [ubigeoLoc, dpto, prov, lat, lon, reg, cap] = content.split(',');
      return {
        ubigeo: ubigeoLoc,
        departamento: dpto,
        provincia: prov,
        latitud: lat,
        longitud: lon,
        region: reg,
        capacidad: cap
      };
    }
    case 'tramos': {
      const [origenTramo, destinoTramo] = content.split('=>').map(s => s.trim());
      return {
        origen: origenTramo,
        destino: destinoTramo
      };
    }
    case 'mantenimientos': {
      const [fechaMant, vehiculoMant] = content.split(':');
      return {
        fecha: fechaMant,
        vehiculo: vehiculoMant
      };
    }
    case 'bloqueos': {
      const [rutaBloqueo, periodoBloqueo] = content.split(';');
      const [origenBloqueo, destinoBloqueo] = rutaBloqueo.split('=>').map(s => s.trim());
      const [inicioBloqueo, finBloqueo] = periodoBloqueo.split('==');
      const [fechaInicioBloqueo, horaInicioBloqueo] = inicioBloqueo.split(',');
      const [fechaFinBloqueo, horaFinBloqueo] = finBloqueo.split(',');
      return {
        origen: origenBloqueo,
        destino: destinoBloqueo,
        fechaInicio: `${fechaInicioBloqueo} ${horaInicioBloqueo}`,
        fechaFin: `${fechaFinBloqueo} ${horaFinBloqueo}`
      };
    }
    default:
      return { content };
  }
};

export const DataPreview = ({
  data,
  onConfirm,
  onCancel,
  isLoading,
  type = 'vehiculos'
}) => {
  const [page, setPage] = React.useState(1);
  const rowsPerPage = 10;

  const pages = Math.ceil(data.length / rowsPerPage);
  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return data.slice(start, end);
  }, [page, data]);

  const renderCell = React.useCallback((item, columnKey) => {
    if (columnKey === 'status') {
      return (
        <Chip
          className="capitalize"
          color={item.hasError ? "danger" : "success"}
          size="sm"
          variant="flat"
        >
          {item.hasError ? "Error" : "Válido"}
        </Chip>
      );
    }

    const parsedContent = parseContent(item, type);
    return parsedContent[columnKey] || '';
  }, [type]);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Previsualización de datos
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Revisa los datos antes de confirmar la carga
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              color="danger"
              variant="light"
              onPress={onCancel}
              isDisabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              color="primary"
              onPress={onConfirm}
              isLoading={isLoading}
            >
              Confirmar carga
            </Button>
          </div>
        </div>

        {/* Resumen de validación */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1 bg-default-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Total de registros</p>
            <p className="text-2xl font-semibold text-gray-900">{data.length}</p>
          </div>
          <div className="flex-1 bg-success-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Registros válidos</p>
            <p className="text-2xl font-semibold text-success">
              {data.filter(item => !item.hasError).length}
            </p>
          </div>
          <div className="flex-1 bg-danger-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Registros con error</p>
            <p className="text-2xl font-semibold text-danger">
              {data.filter(item => item.hasError).length}
            </p>
          </div>
        </div>

        {/* Alerta de errores si existen */}
        {data.some(item => item.hasError) && (
          <div className="mb-6 flex items-start gap-2 bg-warning-50 p-4 rounded-lg text-warning-600">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Se encontraron errores en algunos registros</p>
              <p className="text-sm">
                Los registros con error no serán procesados. Puedes continuar con la carga de los registros válidos o cancelar para corregir los errores.
              </p>
            </div>
          </div>
        )}

        {/* Tabla de datos */}
        <Table
          aria-label="Tabla de previsualización de datos"
          bottomContent={
            <div className="flex w-full justify-center">
              <Pagination
                isCompact
                showControls
                showShadow
                color="primary"
                page={page}
                total={pages}
                onChange={setPage}
              />
            </div>
          }
          classNames={{
            wrapper: "min-h-[400px]",
          }}
        >
          <TableHeader>
            {configColumns[type].map(column => (
              <TableColumn key={column.key}>{column.header}</TableColumn>
            ))}
          </TableHeader>
          <TableBody items={items}>
            {(item) => (
              <TableRow key={item.id} className={item.hasError ? "bg-danger-50" : ""}>
                {(columnKey) => (
                  <TableCell>{renderCell(item, columnKey)}</TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
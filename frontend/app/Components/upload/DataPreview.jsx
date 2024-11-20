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

export const DataPreview = ({
  data,
  onConfirm,
  onCancel,
  isLoading
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
    const cellValue = item[columnKey];

    // Personaliza el renderizado según el tipo de columna
    switch (columnKey) {
      case "date":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small">{item.date}</p>
            <p className="text-bold text-tiny text-default-400">{item.time}</p>
          </div>
        );
      case "status":
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
      default:
        return cellValue;
    }
  }, []);

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
            <TableColumn key="date">Fecha y Hora</TableColumn>
            <TableColumn key="originUbigeo">Origen</TableColumn>
            <TableColumn key="destinationUbigeo">Destino</TableColumn>
            <TableColumn key="quantity">Cantidad</TableColumn>
            <TableColumn key="clientId">ID Cliente</TableColumn>
            <TableColumn key="status">Estado</TableColumn>
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
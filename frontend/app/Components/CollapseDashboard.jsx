"use client";
import { useEffect, useMemo, useState } from "react";
import { FaDownload, FaWarehouse, FaBuilding, FaTruck, FaInfoCircle } from "react-icons/fa";

// Definir las URLs de la API y WebSocket basadas en el entorno
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? process.env.NEXT_PUBLIC_API_BASE_URL_PROD
  : process.env.NEXT_PUBLIC_API_BASE_URL;

// Función para formatear las fechas de manera más amigable, incluyendo AM/PM
const formatDate = (dateString) => {
  if (!dateString) return "---";
  const date = new Date(dateString);
  const hours = date.getHours();
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${date.toLocaleDateString()} - ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ${suffix}`;
};

export default function CollapseDashboard({ tiempos }) {
  const [data, setData] = useState(null); // Datos del pedido seleccionado
  const [loading, setLoading] = useState(false); // Estado de carga para el reporte de colapso
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(""); // Pedido seleccionado en el combo box
  const [pedidos, setPedidos] = useState([]); // Lista de todos los pedidos disponibles
  const [error, setError] = useState(null);

  // Mantener la función formatDateTime igual que en Dashboard
  const formatDateTime = (date) => {
    if (!date) return '';
    return date.toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const downloadReportData = () => {
    if (!data) return;

    let csvContent = "REPORTE DE PEDIDO\n\n";
    
    // Información básica del pedido
    csvContent += "INFORMACIÓN GENERAL\n";
    csvContent += `Código del Pedido,${data.codigoPedido}\n`;
    csvContent += `Ruta del Pedido,${data.rutaPedido}\n`;
    csvContent += `Cantidad de Paquetes,${data.cantidadPaquetes}\n`;
    csvContent += `Fecha de Inicio,${formatDate(data.fechaInicioPedido)}\n`;
    csvContent += `Fecha Límite,${formatDate(data.fechaLimiteEntrega)}\n`;
    csvContent += `Estado del Pedido,${data.estadoPedido}\n\n`;

    // Información de camiones asignados
    if (data.camionesAsignados) {
      csvContent += "DETALLE DE CAMIONES\n";
      Object.entries(data.camionesAsignados).forEach(([camion, detalles]) => {
        csvContent += `\nCAMIÓN: ${camion}\n`;
        csvContent += `Paquetes Asignados,${detalles.paquetes}\n`;
        csvContent += `Fecha Estimada de Entrega,${formatDate(detalles.fechaEntregaEstimada)}\n`;
        
        // Detalles de la ruta
        csvContent += "\nRUTA DETALLADA\n";
        csvContent += "Tramo,Origen,Destino,Estado\n";
        detalles.rutaDelPedido.forEach((ruta, index) => {
          csvContent += `${index + 1},${ruta.origen},${ruta.destino},${ruta.estadoTramo}\n`;
        });
      });
    }

    // Crear y descargar el archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const fileName = `reporte_pedido_${data.codigoPedido}_${new Date().toISOString().split('T')[0]}.csv`;
    
    if (navigator.msSaveBlob) { // IE 10+
      navigator.msSaveBlob(blob, fileName);
    } else {
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Petición para obtener la lista de pedidos disponibles
  useEffect(() => {
    let isMounted = true; // Añadir un flag
    setLoading(true);
    const fetchPedidos = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/simulation/list_pedidos`);
        if (response.ok && isMounted) {
          const result = await response.json(); //Aqui ahora se obtiene el codigo de los pedidos
          setPedidos(result);
          // Solo seleccionar automáticamente si no hay pedido seleccionado
          if (result.length > 0 && !pedidoSeleccionado) {
            setPedidoSeleccionado(result[0]);
          }
        } else {
          console.log('Error al obtener la lista de pedidos: ', response.statusText);
        }
      } catch (error) {
        console.log('Error fetching pedidos:', error);
      } finally {
          if (isMounted) setLoading(false);
      }
    };
    fetchPedidos();

    return () => {
      isMounted = false; // Desmontar flag
    };
  }, []);

  // Petición para obtener los datos específicos de colapso cuando hay un pedido seleccionado
  useEffect(() => {
  if (!pedidoSeleccionado){
    setLoading(false)
    return;
  }
  let isMounted = true;
  
  const fetchCollapseData = async () => {      
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/simulation/collapse_report/${pedidoSeleccionado}`);
      if (response.ok) {
        const result = await response.json();
        if (isMounted) {
          setData(result);
          setLoading(false);
        }
      } else {
        console.log('Error al obtener los datos de colapso: ', response.statusText);
      }
    } catch (error) {
      console.log('Error fetching collapse data:', error);
      if (isMounted) {
        setError(error.message);
        setLoading(false);
      }
    } finally {
      setLoading(false);
    }
  };
  fetchCollapseData();

  return () => {
    isMounted = false;
  };
  
}, [pedidoSeleccionado]);

  // Descargar el reporte en CSV
  const downloadCSV = () => {
    if (!data) return;

    let csvData = `Código del Pedido,${data.codigoPedido}\n`;
    csvData += `Ruta del Pedido,${data.rutaPedido}\n`;
    csvData += `Cantidad de Paquetes,${data.cantidadPaquetes}\n`;
    csvData += `Fecha de Inicio del Pedido,${formatDate(data.fechaInicioPedido)}\n`;
    csvData += `Fecha Límite de Entrega,${formatDate(data.fechaLimiteEntrega)}\n`;
    csvData += `Estado del Pedido,${data.estadoPedido}\n`;

    // Agregar información de los camiones asignados
    if (data.camionesAsignados) {
      csvData += `Camiones Asignados:\n`;
      Object.entries(data.camionesAsignados).forEach(([camion, detalles]) => {
        csvData += `Camión,${camion}\n`;
        csvData += `Paquetes,${detalles.paquetes}\n`;
        csvData += `Fecha de Entrega Estimada,${formatDate(detalles.fechaEntregaEstimada)}\n`;
        detalles.rutaDelPedido.forEach((ruta, index) => {
          csvData += `Tramo ${index + 1},Origen: ${ruta.origen},Destino: ${ruta.destino},Estado: ${ruta.estadoTramo}\n`;
        });
      });
    }

    const blob = new Blob([csvData], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Reporte_Pedido_${pedidoSeleccionado || 'default'}.csv`;
    link.click();
  };

  // Renderiza el dropdown con los pedidos disponibles
  const renderPedidoDropdown = () => (
    <div className="mb-4 flex items-center space-x-4">
      <label htmlFor="pedido-dropdown" className="text-lg font-bold">Código del Pedido:</label>
      <select
        id="pedido-dropdown"
        value={pedidoSeleccionado}
        onChange={(e) => setPedidoSeleccionado(e.target.value)}
        className="border rounded-lg p-2"
      >
        <option value="">Seleccione un pedido</option>
        {pedidos.map((codigo) => (
          <option key={codigo} value={codigo}>
            {codigo}
          </option>
        ))}
      </select>
      <button
        onClick={downloadReportData}
        className="bg-blue-500 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600 flex items-center"
      >
        <FaDownload className="mr-2" />
        Exportar CSV
      </button>
    </div>
  );

  // Define el color y el texto del estado del pedido en función de `estadoPedido`
  const getEstadoPedidoTag = (estado) => {
    switch (estado) {
      case "REGISTERED":
        return {
          text: "REGISTRADO",
          bgColor: "bg-[#B0F8F4]",
          textColor: "text-[#4B9490]"
        };
      case "DELIVERED":
      case "PENDING_PICKUP":
        return {
          text: "ENTREGADO",
          bgColor: "bg-[#D0B0F8]",
          textColor: "text-[#7B15FA]"
        };
      case "FULLY_ASSIGNED":
        return {
          text: "EN TRÁNSITO",
          bgColor: "bg-[#284BCC]",
          textColor: "text-[#BECCFF]"
        };
      default:
        return {
          text: "---",
          bgColor: "bg-gray-300",
          textColor: "text-gray-700"
        };
    }
  };

  // Renderiza la leyenda con los íconos y el estado del pedido
  const renderLegend = () => {
    const estadoPedidoTag = data ? getEstadoPedidoTag(data.estadoPedido) : getEstadoPedidoTag(null);
    return (
      <div className="bg-white shadow-md p-4 mb-4 rounded-lg flex items-center space-x-6">
        <h3 className="font-bold">Leyenda:</h3>
        <div className="flex items-center space-x-2">
          <FaWarehouse className="text-blue-500" />
          <span>Almacén</span>
        </div>
        <div className="flex items-center space-x-2">
          <FaBuilding className="text-green-500" />
          <span>Oficina</span>
        </div>
        <div className="flex items-center space-x-2">
          <FaTruck className="text-red-500" />
          <span>Transporte</span>
        </div>
        <div className="ml-auto flex items-center space-x-2">
          <span className={`${estadoPedidoTag.bgColor} ${estadoPedidoTag.textColor} px-3 py-1 rounded-full font-bold`}>
            {estadoPedidoTag.text}
          </span>
        </div>
      </div>
    );
  };

  // Renderiza la información del reporte de colapso para el pedido seleccionado o muestra valores predeterminados
  const renderCollapseReport = () => (
    <div className="flex justify-between space-x-6">
      {/* Información del pedido */}
      <div className="bg-white shadow-md p-6 mb-4 rounded-lg w-2/3">
        <h2 className="font-bold text-xl mb-4">Información de Pedido:</h2>
        <div className="grid grid-cols-2 gap-4">
          <div><strong>Ruta del Pedido:</strong> {data ? data.rutaPedido : "---"}</div>
          <div><strong>Cantidad de Paquetes:</strong> {data ? data.cantidadPaquetes : "---"}</div>
          <div><strong>Fecha de Inicio del Pedido:</strong> {data ? formatDate(data.fechaInicioPedido) : "---"}</div>
          <div><strong>Fecha Límite de Entrega:</strong> {data ? formatDate(data.fechaLimiteEntrega) : "---"}</div>
        </div>
      </div>

      {/* Camiones asignados */}
      <div className="bg-white shadow-md p-6 mb-4 rounded-lg w-1/3">
        <h2 className="font-bold text-xl mb-4">Camiones Asignados:</h2>
        {data && data.camionesAsignados ? (
          Object.entries(data.camionesAsignados).map(([camion, detalles]) => (
            <div key={camion} className="bg-gray-100 p-4 mb-4 rounded-lg">
              <p className="flex items-center">
                <FaTruck className="text-red-500 mr-2" />
                <strong>{camion}:</strong> {detalles.paquetes}
              </p>
              <p><strong>Fecha de Entrega Estimada:</strong> {formatDate(detalles.fechaEntregaEstimada)}</p>
            </div>
          ))
        ) : (
          <p>---</p>
        )}
      </div>
    </div>
  );

  // Renderiza las rutas de cada camión
  const renderVehicleRoutes = () => (
    <div className="overflow-y-auto max-h-96 space-y-4">
      {data && data.camionesAsignados && Object.entries(data.camionesAsignados).map(([camion, detalles]) => (
        <div key={camion} className="bg-white shadow-md p-6 rounded-lg">
          <h2 className="font-bold text-xl mb-4">Ruta del Vehículo - {camion}</h2>
          {detalles.rutaDelPedido.map((ruta, index) => (
            <div key={index} className="flex items-center bg-gray-50 p-3 my-2 rounded-lg">
              {index === 0 ? (
                <FaWarehouse className="mr-2 text-blue-500" />
              ) : (
                <FaBuilding className="mr-2 text-green-500" />
              )}
              <p className="flex-grow"><strong>Origen:</strong> {ruta.origen} → <strong>Destino:</strong> {ruta.destino}</p>
              <span className={`px-2 py-1 rounded-lg ${ruta.estadoTramo === "Tramo Recorrido" ? "bg-green-300" : "bg-blue-300"}`}>{ruta.estadoTramo}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  const MemoizedVehicleRoutes = useMemo(() => renderVehicleRoutes(), [data]);
  const MemoizedCollapseReport = useMemo(() => renderCollapseReport(), [data]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
       {/* Agregar la sección de Periodo */}
      <div className="mb-6">
        {tiempos && (
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 py-2 text-sm">
                  <span className="text-gray-500 font-medium">Periodo</span>
                  <div className="flex items-center gap-2">
                      <span className="bg-gray-50 text-gray-700 px-3 py-1.5 rounded-md border border-gray-100">
                          {formatDateTime(tiempos.inicio)}
                      </span>
                      <svg 
                          width="16" 
                          height="16" 
                          viewBox="0 0 16 16" 
                          fill="none" 
                          className="text-gray-400"
                      >
                          <path 
                              d="M3 8h10M10 5l3 3-3 3" 
                              stroke="currentColor" 
                              strokeWidth="1.5" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                          />
                      </svg>
                      <span className="bg-gray-50 text-gray-700 px-3 py-1.5 rounded-md border border-gray-100">
                          {formatDateTime(tiempos.fin)}
                      </span>
                  </div>
              </div>
              {data && (
                  <button
                      onClick={downloadReportData}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                      <FaDownload className="mr-2" />
                      Exportar CSV
                  </button>
              )}
          </div>
        )}
      </div>

      {/* Dropdown siempre visible si hay pedidos */}
      {pedidos.length > 0 && (
        <div className="mb-4">
          <select
            value={pedidoSeleccionado}
            onChange={(e) => setPedidoSeleccionado(e.target.value)}
            className="border rounded-lg p-2"
            disabled={loading}
          >
            <option value="">Seleccione un pedido</option>
            {pedidos.map((codigo) => (
              <option key={codigo} value={codigo}>
                {codigo}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Estado de carga */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse flex flex-col items-center">
            <div className="text-gray-600 mb-2">Cargando datos...</div>
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-red-600 flex items-center gap-2">
            <FaInfoCircle />
            {error}
          </div>
        </div>
      ) : data ? (
        <>
          {renderLegend()}
          {renderCollapseReport()}
          {renderVehicleRoutes()}
        </>
      ) : (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">
            Seleccione un pedido para ver los detalles
          </div>
        </div>
      )}
    </div>
  );
}

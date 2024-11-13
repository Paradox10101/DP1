"use client";
import { useEffect, useState } from "react";
import { FaDownload, FaWarehouse, FaBuilding, FaTruck } from "react-icons/fa";

export default function CollapseDashboard() {
  const [data, setData] = useState(null); // Datos del pedido seleccionado
  const [loading, setLoading] = useState(false); // Estado de carga para el reporte de colapso
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(""); // Pedido seleccionado en el combo box
  const [pedidos, setPedidos] = useState([]); // Lista de todos los pedidos disponibles

  // Petición para obtener la lista de pedidos disponibles
  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        const response = await fetch('http://localhost:4567/api/v1/simulation/list_pedidos');
        if (response.ok) {
          const result = await response.json();
          setPedidos(result); // Guardar la lista de pedidos
        } else {
          console.error('Error al obtener la lista de pedidos: ', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching pedidos:', error);
      }
    };
    fetchPedidos();
  }, []);

  // Petición para obtener los datos específicos de colapso cuando hay un pedido seleccionado
  useEffect(() => {
    if (pedidoSeleccionado !== "") {
      const fetchCollapseData = async () => {
        setLoading(true);
        try {
          const response = await fetch(`http://localhost:4567/api/v1/simulation/collapse_report/${pedidoSeleccionado}`);
          if (response.ok) {
            const result = await response.json();
            setData(result);
          } else {
            console.error('Error al obtener los datos de colapso: ', response.statusText);
          }
        } catch (error) {
          console.error('Error fetching collapse data:', error);
        }
        setLoading(false);
      };
      fetchCollapseData();
    }
  }, [pedidoSeleccionado]);

  // Descargar el reporte en CSV
  const downloadCSV = () => {
    const csvData = `Ruta del Pedido,${data ? data.rutaPedido : "---"}\nCantidad de Paquetes,${data ? data.cantidadPaquetes : "---"}\nFecha de Inicio del Pedido,${data ? data.fechaInicioPedido : "---"}\nFecha de Entrega Estimada,${data ? data.fechaEntregaEstimada : "---"}\nFecha Límite de Entrega,${data ? data.fechaLimiteEntrega : "---"}\nEstado del Pedido,${data ? data.estadoPedido : "---"}\n`;

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
        {pedidos.map((pedido) => (
          <option key={pedido.orderCode} value={pedido.orderCode}>
            {pedido.orderCode}
          </option>
        ))}
      </select>
      <button
        onClick={downloadCSV}
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
          <div><strong>Fecha de Inicio del Pedido:</strong> {data ? data.fechaInicioPedido : "---"}</div>
          <div><strong>Fecha de Entrega Estimada:</strong> {data ? data.fechaEntregaEstimada : "---"}</div>
          <div><strong>Fecha Límite de Entrega:</strong> {data ? data.fechaLimiteEntrega : "---"}</div>
          <div><strong>Estado del Pedido:</strong> {data ? data.estadoPedido : "---"}</div>
        </div>
      </div>

      {/* Camiones asignados */}
      <div className="bg-white shadow-md p-6 mb-4 rounded-lg w-1/3">
        <h2 className="font-bold text-xl mb-4">Camiones Asignados:</h2>
        {data && data.camionesAsignados ? (
          Object.entries(data.camionesAsignados).map(([camion, detalles]) => (
            <div key={camion} className="bg-gray-100 p-4 mb-4 rounded-lg">
              <p className="flex items-center">
                <FaTruck className="text-blue-500 mr-2" />
                <strong>{camion}:</strong> {detalles.paquetes}
              </p>
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
              <FaBuilding className={`mr-2 ${ruta.estadoTramo === "Tramo Recorrido" ? "text-green-500" : "text-green-500"}`} />
              <p className="flex-grow"><strong>Origen:</strong> {ruta.origen} → <strong>Destino:</strong> {ruta.destino}</p>
              <span className={`px-2 py-1 rounded-lg ${ruta.estadoTramo === "Tramo Recorrido" ? "bg-green-300" : "bg-blue-300"}`}>{ruta.estadoTramo}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-4">
        {renderPedidoDropdown()}
      </div>
      {renderLegend()}
      {pedidoSeleccionado ? (loading ? <div>Loading...</div> : renderCollapseReport()) : renderCollapseReport()}
      {renderVehicleRoutes()}
    </div>
  );
}

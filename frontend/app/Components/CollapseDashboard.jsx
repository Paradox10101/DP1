"use client";
import { useEffect, useState } from "react";

export default function CollapseDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState("P0000154"); // Estado con valor inicial del pedido
  const [pedidos, setPedidos] = useState([]); // Estado para guardar la lista de todos los pedidos disponibles

  // Petición para obtener la lista de pedidos disponibles
  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        const response = await fetch('http://localhost:4567/api/v1/simulation/list_pedidos');
        if (response.ok) {
          const result = await response.json();
          setPedidos(result);
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
    if (pedidoSeleccionado) {
      const fetchCollapseData = async () => {
        setLoading(true);
        try {
          const response = await fetch(`http://localhost:4567/api/v1/simulation/collapse_report?codigoPedido=${pedidoSeleccionado}`);
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

  if (loading) {
    return <div>Loading...</div>;
  }

  // Renderiza mensaje de error si no hay datos
  if (!data && pedidoSeleccionado) {
    return <div>Error al cargar los datos de colapso.</div>;
  }

  // Renderiza el dropdown con los pedidos disponibles
  const renderPedidoDropdown = () => (
    <div className="mb-4">
      <label htmlFor="pedido-dropdown" className="block text-lg font-bold mb-2">Código del Pedido:</label>
      <select
        id="pedido-dropdown"
        value={pedidoSeleccionado}
        onChange={(e) => setPedidoSeleccionado(e.target.value)}
        className="border rounded-lg p-2 w-full"
      >
        <option value="">Seleccione un pedido</option>
        {pedidos.map((pedido) => (
          <option key={pedido.codigoPedido} value={pedido.codigoPedido}>
            {pedido.codigoPedido}
          </option>
        ))}
      </select>
    </div>
  );

  // Renderiza la información del reporte de colapso para el pedido seleccionado
  const renderCollapseReport = () => (
    data && (
      <div className="collapse-report-container">
        <h1 className="text-2xl font-bold mb-4">Reporte de la última planificación estable</h1>

        {/* Información del pedido */}
        <div className="bg-white shadow p-4 mb-6 rounded-lg">
          <h2 className="font-bold text-xl mb-2">Información de Pedido:</h2>
          <p><strong>Ruta del Pedido:</strong> {data.rutaPedido}</p>
          <p><strong>Cantidad de Paquetes:</strong> {data.cantidadPaquetes}</p>
          <p><strong>Fecha de Inicio del Pedido:</strong> {data.fechaInicioPedido}</p>
          <p><strong>Fecha de Entrega Estimada:</strong> {data.fechaEntregaEstimada}</p>
          <p><strong>Fecha Límite de Entrega:</strong> {data.fechaLimiteEntrega}</p>
          <p><strong>Estado del Pedido:</strong> {data.estadoPedido}</p>
        </div>

        {/* Camiones asignados */}
        <div className="bg-white shadow p-4 mb-6 rounded-lg">
          <h2 className="font-bold text-xl mb-2">Camiones Asignados:</h2>
          {Object.entries(data.camionesAsignados).map(([camion, detalles]) => (
            <div key={camion} className="bg-gray-50 p-4 mb-4 rounded-lg">
              <p><strong>{camion}:</strong> {detalles.paquetes}</p>

              {/* Renderizar la ruta del pedido para cada camión */}
              <h3 className="font-semibold mt-2">Ruta del Vehículo:</h3>
              {detalles.rutaDelPedido.map((ruta, index) => (
                <div key={index} className="bg-gray-100 p-3 my-2 rounded-lg">
                  <p><strong>Origen:</strong> {ruta.origen}</p>
                  <p><strong>Destino:</strong> {ruta.destino}</p>
                  <p><strong>Estado del Tramo:</strong> {ruta.estadoTramo}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  );

  return (
    <div className="p-6">
      {renderPedidoDropdown()}
      {pedidoSeleccionado && renderCollapseReport()}
    </div>
  );
}

"use client";
import { Pie, Bar, Doughnut } from "react-chartjs-2";
import 'chart.js/auto';
import { useEffect, useState } from "react";

export default function Dashboard({ shipment }) {
  // Estado para manejar los datos del dashboard
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Petición de datos para el dashboard
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:4567/api/v1/simulation/report');
        if (response.ok) {
          const result = await response.json();
          setData(result);
        } else {
          console.error('Error al obtener los datos: ', response.statusText);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!data) {
    return <div>Error al cargar los datos.</div>;
  }

  // Helper function para capitalizar nombres de ciudades
  const capitalizeCityName = (name) => {
    return name.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
  };

  // Obtener las 5 ciudades con mayor demanda de pedidos
  const demandasEntries = Object.entries(data.demandasPorCiudad);
  const top5Cities = demandasEntries
    .sort((a, b) => b[1] - a[1]) // Ordenar por demanda descendente
    .slice(0, 5); // Tomar las 5 primeras

  // Labels y datos para el gráfico de ciudades con mayor demanda
  const barLabels = top5Cities.map(([city]) => capitalizeCityName(city));
  const barDataValues = top5Cities.map(([_, value]) => value);

  // Datos de los gráficos con redondeo a dos decimales para porcentajes
  const pieData = {
    labels: ['En Almacén', 'En Oficina', 'En Entrega', 'Entregado'],
    datasets: [
      {
        data: [
          data.estadoPaquetes?.['En Almacén'],
          data.estadoPaquetes?.['En Oficina'],
          data.estadoPaquetes?.['En Entrega'],
          data.estadoPaquetes?.['Entregado'],
        ],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
      },
    ],
  };

  const barData = {
    labels: barLabels, // Utilizar las etiquetas dinámicas obtenidas del backend
    datasets: [
      {
        label: 'Demandas por Ciudad',
        data: barDataValues, // Utilizar los valores de demanda obtenidos del backend
        backgroundColor: '#284BCC',
      },
    ],
  };

  const almacenDemandasData = {
    labels: ['Trujillo', 'Lima', 'Arequipa'],
    datasets: [
      {
        label: 'Cantidad de pedidos por almacén',
        data: [
          data.demandasEnAlmacenes?.Trujillo,
          data.demandasEnAlmacenes?.Lima,
          data.demandasEnAlmacenes?.Arequipa,
        ],
        backgroundColor: '#284BCC',
      },
    ],
  };

  const averiasData = {
    labels: ['Tipo 1', 'Tipo 2', 'Tipo 3'],
    datasets: [
      {
        label: 'Número de Averías por Tipo',
        data: [
          data.averiasPorTipo?.['Tipo 1'],
          data.averiasPorTipo?.['Tipo 2'],
          data.averiasPorTipo?.['Tipo 3'],
        ],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
      },
    ],
  };

  const regionDemandaData = {
    labels: ['Costa', 'Sierra', 'Selva'],
    datasets: [
      {
        label: 'Regiones con Mayor Demanda',
        data: [
          data.regionConMayorDemanda?.Costa,
          data.regionConMayorDemanda?.Sierra,
          data.regionConMayorDemanda?.Selva,
        ],
        backgroundColor: ['#4BC0C0', '#FF9F40', '#9966FF'],
      },
    ],
  };

  return (
    <div className="dashboard-container">
      <div className="grid grid-cols-4 gap-4">
        {/* Tarjetas de información */}
        <div className="col-span-1 flex flex-col gap-4">
          <div className="card border p-4 shadow-md">
            <p>Proporción de Capacidad Efectiva transportada</p>
            <h3>{data.capacidadEfectiva.toFixed(2)}%</h3>
          </div>
          <div className="card border p-4 shadow-md">
            <p>Cantidad Total de Pedidos Atendidos</p>
            <h3>{data.pedidosAtendidos}</h3>
          </div>
          <div className="card border p-4 shadow-md">
            <p>Eficiencia de Planificación de Rutas</p>
            <h3>{data.eficienciaRutas.toFixed(2)}%</h3>
          </div>
          <div className="card border p-4 shadow-md">
            <p>Cantidad Promedio de Pedidos por Día</p>
            <h3>{data.promedioPedidos.toFixed(2)}</h3>
          </div>
          <button className="bg-blue-700 text-white w-full rounded p-3 flex items-center justify-center mt-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v16m8-8H4" />
            </svg>
            Exportar CSV
          </button>
        </div>

        {/* Gráficos */}
        <div className="col-span-3 grid grid-cols-2 gap-4">
          <div className="chart-container">
            <h4>Regiones con Mayor Demanda</h4>
            <Doughnut data={regionDemandaData} />
          </div>
          <div className="chart-container">
            <h4>Estado de Paquetes</h4>
            <Pie data={pieData} />
          </div>
          <div className="chart-container">
            <h4>Ciudades con mayor demanda de pedidos</h4>
            <Bar data={barData} />
          </div>
          <div className="chart-container">
            <h4>Número de Averías por Tipo</h4>
            <Bar data={averiasData} />
          </div>
          <div className="chart-container">
            <h4>Cantidad de Pedidos por almacén</h4>
            <Bar data={almacenDemandasData} />
          </div>
        </div>
      </div>
    </div>
  );
}

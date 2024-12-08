"use client";
import { Pie, Bar, Doughnut } from "react-chartjs-2";
import 'chart.js/auto';
import { useEffect, useState } from "react";
import { exportDataToCSV } from "./controls/exportDataCSVDash";
import { FaDownload, FaQuestionCircle } from 'react-icons/fa';
import { Tooltip } from "@nextui-org/react";

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? process.env.NEXT_PUBLIC_API_BASE_URL_PROD
  : process.env.NEXT_PUBLIC_API_BASE_URL;

export default function Dashboard({ shipment, onClose}) {
  // Estado para manejar los datos del dashboard
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Petición de datos para el dashboard
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/simulation/report`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
        } else {
          console.error('Error al obtener los datos: ', response.statusText);
          onClose();
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
        onClose();
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

  // Preparar datos para el gráfico de barras de almacenes
  const almacenesData = {
    labels: Object.keys(data.demandasEnAlmacenes),
    values: Object.values(data.demandasEnAlmacenes)
  };

  // Preparar datos para el gráfico de averías
  const averiasData = {
    labels: Object.keys(data.averiasPorTipo),
    values: Object.values(data.averiasPorTipo)
  };

  // Estilo común para los tooltips
  const tooltipStyles = {
    //className: "max-w-[300px] text-sm p-3", // Tamaño fijo para tooltips
    className: "max-w-[300px] text-sm p-3", // Tamaño fijo para tooltips
    placement: "right",
    offset: 10
  };

  // Configuración común para los gráficos de dona/pie
  const doughnutOptions = {
    maintainAspectRatio: false,
    plugins: {
      datalabels: {
        color: '#fff',
        font: {
          weight: 'bold',
          size: 12
        },
        formatter: (value, ctx) => {
          const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          return `${percentage}%`;
        },
        anchor: 'center',
        align: 'center',
        offset: 0
      },
      legend: {
        position: 'top'
      }
    }
  };

  // Configuración común para los gráficos de barras
  const barOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      datalabels: {
        color: '#fff',
        font: {
          weight: 'bold',
          size: 12
        },
        formatter: (value) => `${value}`,
        anchor: 'end',
        align: 'start',
        offset: -20
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  // Definición de tooltips para las métricas
  const tooltips = {
    capacidadEfectiva: "Promedio acumulado del porcentaje de capacidad utilizada por los vehículos durante el transporte de pedidos.",
    pedidosAtendidos: "Número total de pedidos que han sido completamente procesados y entregados durante la simulación.",
    eficienciaRutas: "Medida de la eficiencia en la planificación de rutas, calculada como la relación entre el tiempo estimado y el tiempo límite de entrega.",
    promedioPedidos: "Promedio diario de pedidos procesados durante toda la simulación.",
    demandaRegion: "Distribución de pedidos por región natural del Perú.",
    topCiudades: "Las 5 ciudades con mayor cantidad de pedidos registrados.",
    averias: "Cantidad de incidentes técnicos registrados por tipo de avería.",
    demandaAlmacen: "Distribución de pedidos procesados por cada almacén principal."
  };

  return (
    <div className="dashboard-container">
      <div className="grid grid-cols-4 gap-4">
        {/* Tarjetas de información de métricas */}
        <div className="col-span-1 flex flex-col gap-6">
          <div className="card border p-4 shadow-md">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-700">Capacidad Efectiva</h3>
              <Tooltip content={tooltips.capacidadEfectiva} {...tooltipStyles}>
                <FaQuestionCircle className="text-gray-400 hover:text-gray-600 cursor-help" />
              </Tooltip>
            </div>
            <p className="text-3xl font-bold text-blue-700 mt-2">{data.capacidadEfectiva.toFixed(2)}%</p>
          </div>
          <div className="card border p-4 shadow-md">
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-gray-700">Total Pedidos Atendidos</p>
              <Tooltip content={tooltips.pedidosAtendidos} {...tooltipStyles}>
                <FaQuestionCircle className="text-gray-400 hover:text-gray-600 cursor-help" />
              </Tooltip>
            </div>
            <h3 className="text-3xl font-bold text-blue-700 mt-2">{data.pedidosAtendidos}</h3>
          </div>
          <div className="card border p-4 shadow-md">
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-gray-700">Eficiencia de Rutas</p>
              <Tooltip content={tooltips.eficienciaRutas} {...tooltipStyles}>
                <FaQuestionCircle className="text-gray-400 hover:text-gray-600 cursor-help" />
              </Tooltip>
            </div>
            <h3 className="text-3xl font-bold text-blue-700 mt-2">{data.eficienciaRutas.toFixed(2)}%</h3>
          </div>
          <div className="card border p-4 shadow-md">
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-gray-700">Promedio Diario de Pedidos</p>
              <Tooltip content={tooltips.promedioPedidos} {...tooltipStyles}>
                <FaQuestionCircle className="text-gray-400 hover:text-gray-600 cursor-help" />
              </Tooltip>
            </div>
            <h3 className="text-3xl font-bold text-blue-700 mt-2">{data.promedioPedidos.toFixed(2)}</h3>
          </div>
          <button
            onClick={() => exportDataToCSV(data)} 
            className="bg-blue-700 text-white w-full rounded p-3 flex items-center justify-center mt-4"
          >
            <FaDownload className="h-5 w-5 mr-2" />
            Exportar CSV
          </button>
        </div>

        {/* Gráficos */}
        <div className="col-span-3 grid grid-cols-2 gap-4">
          {/* Gráfico de Demanda por Región */}
          <div className="chart-container" style={{ height: '250px' }}>
            <div className="flex items-center gap-2 mb-4">
              <h4 className="text-lg font-semibold text-gray-700">Demanda por Región</h4>
              <Tooltip content={tooltips.demandaRegion} {...tooltipStyles}>
                <FaQuestionCircle className="text-gray-400 hover:text-gray-600 cursor-help" />
              </Tooltip>
            </div>
            <Doughnut
              data={{
                labels: ['Costa', 'Sierra', 'Selva'],
                datasets: [
                  {
                    label: 'Demanda',
                    data: [
                      data.regionConMayorDemanda?.COSTA,
                      data.regionConMayorDemanda?.SIERRA,
                      data.regionConMayorDemanda?.SELVA,
                    ],
                    backgroundColor: ['#4BC0C0', '#FF9F40', '#9966FF'],
                  },
                ],
              }}
              options={doughnutOptions}
            />
          </div>

          {/* Gráfico de Top 5 Ciudades Populares */}
          <div className="chart-container" style={{ height: '300px' }}>
            <div className="flex items-center gap-2 mb-4">
              <h4 className="text-lg font-semibold text-gray-700">Top 5 Ciudades Populares</h4>
              <Tooltip content={tooltips.topCiudades} {...tooltipStyles}>
                <FaQuestionCircle className="text-gray-400 hover:text-gray-600 cursor-help" />
              </Tooltip>
            </div>
            <Bar
              data={{
                labels: barLabels,
                datasets: [
                  {
                    label: 'Demanda',
                    data: barDataValues,
                    backgroundColor: '#284BCC',
                  },
                ],
              }}
              options={barOptions}
            />
          </div>

          {/* Gráfico de Averías por Tipo */}
          <div className="chart-container" style={{ height: '250px' }}>
            <div className="flex items-center gap-2 mb-4">
              <h4 className="text-lg font-semibold text-gray-700">Averías por Tipo</h4>
              <Tooltip content={tooltips.averias} {...tooltipStyles}>
                <FaQuestionCircle className="text-gray-400 hover:text-gray-600 cursor-help" />
              </Tooltip>
            </div>
            <Bar
              data={{
                labels: averiasData.labels,
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
              }}
              options={barOptions}
            />
          </div>

          {/* Gráfico de Demanda por Almacén */}
          <div className="chart-container" style={{ height: '250px' }}>
            <div className="flex items-center gap-2 mb-4">
              <h4 className="text-lg font-semibold text-gray-700">Demanda por Almacén</h4>
              <Tooltip content={tooltips.demandaAlmacen} {...tooltipStyles}>
                <FaQuestionCircle className="text-gray-400 hover:text-gray-600 cursor-help" />
              </Tooltip>
            </div>
            <Bar
              data={{
                labels: ['Trujillo', 'Lima', 'Arequipa'],
                datasets: [
                  {
                    label: 'Demanda por Almacén',
                    data: almacenesData.values,
                    backgroundColor: '#284BCC',
                  },
                ],
              }}
              options={barOptions}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

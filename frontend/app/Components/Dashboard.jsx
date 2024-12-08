import React, { useEffect, useState } from 'react';
import { Pie, Bar, Doughnut } from "react-chartjs-2";
import { FaDownload, FaInfoCircle } from 'react-icons/fa';
import { Tooltip } from "@nextui-org/react";
import 'chart.js/auto';

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? process.env.NEXT_PUBLIC_API_BASE_URL_PROD
  : process.env.NEXT_PUBLIC_API_BASE_URL;

const MetricCard = ({ title, value, tooltip, trend, icon: Icon }) => (
  <div className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="text-blue-500 text-lg" />}
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      </div>
      <Tooltip content={tooltip}>
        <FaInfoCircle className="text-gray-400 text-sm cursor-help" />
      </Tooltip>
    </div>
    <div className="flex items-baseline justify-between">
      <span className="text-2xl font-bold text-gray-900">{value}</span>
    </div>
  </div>
);

const ChartCard = ({ title, tooltip, children, className }) => (
  <div className={`bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      <Tooltip content={tooltip}>
        <FaInfoCircle className="text-gray-400 cursor-help" />
      </Tooltip>
    </div>
    {children}
  </div>
);

const TopCitiesList = ({ cities }) => (
  <div className="space-y-4">
    {cities.map(([city, value], index) => (
      <div key={city} className="group">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">
            {index + 1}. {city}
          </span>
          <span className="text-sm font-semibold text-gray-900">{value}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all group-hover:bg-blue-600"
            style={{
              width: `${(value / Math.max(...cities.map(([_, v]) => v))) * 100}%`
            }}
          />
        </div>
      </div>
    ))}
  </div>
);

// Chart options
const baseChartOptions = {
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        padding: 20,
        usePointStyle: true,
        font: {
          size: 11,
          family: 'Inter, system-ui, sans-serif'
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { display: false },
      ticks: { font: { size: 11 } }
    },
    x: {
      grid: { display: false },
      ticks: { font: { size: 11 } }
    }
  }
};

const doughnutOptions = {
  ...baseChartOptions,
  cutout: '65%',
  plugins: {
    ...baseChartOptions.plugins,
    legend: {
      ...baseChartOptions.plugins.legend,
      position: 'bottom'
    }
  },
  scales: {
    x: {
      display: false
    },
    y: {
      display: false
    }
  }
};

// Tooltips definitions
const tooltips = {
  capacidadEfectiva: "Promedio acumulado del porcentaje de capacidad utilizada por los vehículos durante el transporte de pedidos.",
  pedidosAtendidos: "Número total de pedidos que han sido procesados y atendidos durante la simulación.",
  eficienciaRutas: "Medida de la eficiencia en la planificación de rutas, calculada como la relación entre el tiempo diferencial del tiempo estimado y del tiempo límite de entrega.",
  promedioPedidos: "Promedio diario de pedidos procesados durante toda la simulación.",
  demandaRegion: "Distribución de pedidos por región natural del Perú.",
  topCiudades: "Las ciudades con mayor cantidad de pedidos registrados.",
  averias: "Cantidad de averías registradas por tipo de avería.",
  demandaAlmacen: "Distribución de pedidos procesados por cada almacén principal."
};

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

export default function Dashboard({ shipment, onClose, tiempos }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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
      } catch (error) {
        console.error('Error fetching data:', error);
        onClose();
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [onClose]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-gray-600">Cargando datos...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-600 flex items-center gap-2">
          <FaInfoCircle />
          Error al cargar los datos.
        </div>
      </div>
    );
  }

  // Data processing
  const allCities = Object.entries(data.demandasPorCiudad)
    .sort((a, b) => b[1] - a[1]);

  const regionData = {
    labels: ['Costa', 'Sierra', 'Selva'],
    datasets: [{
      data: [
        data.regionConMayorDemanda?.COSTA ?? 0,
        data.regionConMayorDemanda?.SIERRA ?? 0,
        data.regionConMayorDemanda?.SELVA ?? 0,
      ],
      backgroundColor: ['#60A5FA', '#34D399', '#A78BFA'],
      borderWidth: 0
    }]
  };

  const averiasData = {
    labels: Object.keys(data.averiasPorTipo || {}),
    datasets: [{
      label: 'Número de Averías',
      data: Object.values(data.averiasPorTipo || {}),
      backgroundColor: '#F87171',
      borderRadius: 6
    }]
  };

  const almacenesData = {
    labels: Object.keys(data.demandasEnAlmacenes || {}),
    datasets: [{
      label: 'Demanda por Almacén',
      data: Object.values(data.demandasEnAlmacenes || {}),
      backgroundColor: '#34D399',
      borderRadius: 6
    }]
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
      <div>
        {tiempos && (
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
        )}
      </div>
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Capacidad Efectiva"
            value={`${data.capacidadEfectiva.toFixed(1)}%`}
            tooltip={tooltips.capacidadEfectiva}
            trend="up"
          />
          <MetricCard
            title="Pedidos Atendidos"
            value={data.pedidosAtendidos}
            tooltip={tooltips.pedidosAtendidos}
          />
          <MetricCard
            title="Eficiencia de Rutas"
            value={`${data.eficienciaRutas.toFixed(1)}%`}
            tooltip={tooltips.eficienciaRutas}
          />
          <MetricCard
            title="Promedio Diario"
            value={data.promedioPedidos.toFixed(0)}
            tooltip={tooltips.promedioPedidos}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Charts */}
          <div className="lg:col-span-2 space-y-6">
            <ChartCard 
              title="Demanda por Almacén" 
              tooltip={tooltips.demandaAlmacen}
            >
              <div className="h-72">
                <Bar data={almacenesData} options={baseChartOptions} />
              </div>
            </ChartCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ChartCard 
                title="Averías por Tipo" 
                tooltip={tooltips.averias}
              >
                <div className="h-64">
                  <Bar data={averiasData} options={baseChartOptions} />
                </div>
              </ChartCard>

              <ChartCard 
                title="Demanda Regional" 
                tooltip={tooltips.demandaRegion}
              >
                <div className="h-64">
                  <Doughnut data={regionData} options={doughnutOptions} />
                </div>
              </ChartCard>
            </div>
          </div>

          {/* Right Column - Cities & Additional Info */}
          <div className="lg:col-span-1">
            <ChartCard 
              title="Top Ciudades" 
              tooltip={tooltips.topCiudades}
              className="h-full"
            >
              <TopCitiesList cities={allCities} />
            </ChartCard>
          </div>
        </div>
      </div>
    </div>
  );
}
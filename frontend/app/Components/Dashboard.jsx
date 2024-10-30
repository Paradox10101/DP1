"use client";
import { Pie, Bar } from "react-chartjs-2";
import 'chart.js/auto';
import { useDisclosure } from "@nextui-org/react";
import ModalContainer from "@/app/Components/ModalContainer";
import { useState, useEffect } from "react";

export default function Dashboard({ shipment }) {
  // Hook para controlar el modal
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  
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

  // Datos de los gráficos
  const pieData = {
    labels: ['Paquetes en Almacén', 'Paquetes en Oficina', 'Paquetes en Entrega'],
    datasets: [
      {
        data: [data.paquetesAlmacen, data.paquetesOficina, data.paquetesEntrega],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
      },
    ],
  };

  const barData = {
    labels: ['Lima', 'Arequipa', 'Trujillo', 'Junín', 'Huancayo'],
    datasets: [
      {
        label: 'Demandas por Ciudad',
        data: [
          data.demandasPorCiudad?.Lima,
          data.demandasPorCiudad?.Arequipa,
          data.demandasPorCiudad?.Trujillo,
          data.demandasPorCiudad?.Junín,
          data.demandasPorCiudad?.Huancayo,
        ],
        backgroundColor: '#284BCC',
      },
    ],
  };

  const almacenParadasData = {
    labels: ['Trujillo', 'Lima', 'Arequipa'],
    datasets: [
      {
        label: 'Cantidad de paradas en almacén',
        data: [
          data.paradasEnAlmacenes?.Trujillo,
          data.paradasEnAlmacenes?.Lima,
          data.paradasEnAlmacenes?.Arequipa,
        ],
        backgroundColor: '#284BCC',
      },
    ],
  };

  return (
    <>
      <button className="w-full" onClick={onOpen}>
        <div className="flex flex-col p-4 border-2 stroke-black rounded-xl gap-1">
          <div className="flex flex-row justify-between items-center">
            <div className="font-bold text-lg">Ver Reporte del Dashboard</div>
          </div>
        </div>
      </button>
      <ModalContainer
        isOpen={isOpen}
        onOpen={onOpen}
        onOpenChange={onOpenChange}
        header={
          <div className="flex flex-row gap-2">
            <div className="text-xl font-bold">Reporte a partir de {data.startDate} hasta {data.endDate}</div>
          </div>
        }
        body={
          <div className="dashboard-container">
            <div className="grid grid-cols-4 gap-4">
              {/* Tarjetas de información */}
              <div className="col-span-1 flex flex-col gap-4">
                <div className="card">
                  <p>Proporción de Capacidad Efectiva transportada</p>
                  <h3>{data.capacidadEfectiva}%</h3>
                </div>
                <div className="card">
                  <p>Cantidad Total de Pedidos Atendidos</p>
                  <h3>{data.pedidosAtendidos}</h3>
                </div>
                <div className="card">
                  <p>Eficiencia de Planificación de Rutas</p>
                  <h3>{data.eficienciaRutas}%</h3>
                </div>
                <div className="card">
                  <p>Cantidad Promedio de Pedidos por Día</p>
                  <h3>{data.promedioPedidos}</h3>
                </div>
              </div>

              {/* Gráficos */}
              <div className="col-span-3 grid grid-cols-2 gap-4">
                <div className="chart-container">
                  <h4>Ciudades con mayor demanda de pedidos</h4>
                  <Bar data={barData} />
                </div>
                <div className="chart-container">
                  <h4>Estado de Paquetes</h4>
                  <Pie data={pieData} />
                </div>
                <div className="chart-container">
                  <h4>Cantidad de paradas en almacén</h4>
                  <Bar data={almacenParadasData} />
                </div>
              </div>
            </div>
          </div>
        }
      />
    </>
  );
}

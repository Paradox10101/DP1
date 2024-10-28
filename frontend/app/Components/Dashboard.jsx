import React, { useState, useEffect } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import { Button } from '@nextui-org/react';

const Dashboard = () => {
  // 2. **State to Manage Data**:
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  // 3. **Fetching Data for the Dashboard**:
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboardData'); // Assume this endpoint gives you the data you need
        const result = await response.json();
        setData(result);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  // 4. **Dashboard Components**:

  // Example data formatting for charts
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
        data: [data.demandas.lima, data.demandas.arequipa, data.demandas.trujillo, data.demandas.junin, data.demandas.huancayo],
        backgroundColor: '#284BCC',
      },
    ],
  };

  const almacenParadasData = {
    labels: ['Trujillo', 'Lima', 'Arequipa'],
    datasets: [
      {
        label: 'Cantidad de paradas',
        data: [data.paradas.trujillo, data.paradas.lima, data.paradas.arequipa],
        backgroundColor: '#284BCC',
      },
    ],
  };

  return (
    <div className="dashboard-container">
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Reporte a partir de {data.startDate} hasta {data.endDate}</h1>
        <Button color="primary" auto>Exportar CSV</Button>
      </header>

      <div className="grid grid-cols-4 gap-4">
        {/* **Cards on the Left** */}
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

        {/* **Graphs on the Right** */}
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
  );
};

export default Dashboard;
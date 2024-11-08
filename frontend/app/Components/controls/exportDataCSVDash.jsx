import { saveAs } from 'file-saver';

export function exportDataToCSV(data) {
  // Crear el contenido del CSV
  const headers = [
    "Capacidad Efectiva (%)",
    "Pedidos Atendidos",
    "Eficiencia de Rutas (%)",
    "Promedio de Pedidos por Día"
  ];

  let csvContent = headers.join(",") + "\n";
  csvContent += `${data.capacidadEfectiva.toFixed(2)},${data.pedidosAtendidos},${data.eficienciaRutas.toFixed(2)},${data.promedioPedidos.toFixed(2)}\n`;

  csvContent += "\nDemanda por Ciudad:\n";
  csvContent += "Ciudad,Demanda\n";
  for (const [ciudad, demandas] of Object.entries(data.demandasPorCiudad)) {
    csvContent += `${ciudad},${demandas}\n`;
  }

  csvContent += "\nDemanda por Almacen:\n";
  csvContent += "Almacen,Demanda\n";
  for (const [almacen, demandas] of Object.entries(data.demandasEnAlmacenes)) {
    csvContent += `${almacen},${demandas}\n`;
  }

  csvContent += "\nAverias por Tipo:\n";
  csvContent += "Tipo,Averias\n";
  for (const [tipo, averias] of Object.entries(data.averiasPorTipo)) {
    csvContent += `${tipo},${averias}\n`;
  }

  csvContent += "\nDemanda por Region:\n";
  csvContent += "Región,Demanda\n";
  for (const [region, demandas] of Object.entries(data.regionConMayorDemanda)) {
    csvContent += `${region},${demandas}\n`;
  }

  // Crear un archivo Blob con el contenido CSV
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, "reporte_simulacion.csv");
}

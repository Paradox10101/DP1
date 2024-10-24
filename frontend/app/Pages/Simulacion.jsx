"use client";
import PanelSimulacion from "@/app/Components/PanelSimulacion";
import MapView from "@/app/Components/MapView";
import MapLegend from "@/app/Components/MapLegend";
import { useEffect, useState } from "react";
import Switch from "@/app/Components/Switch";


export default function Simulacion(){
    ///ESTO ES LO QUE SE USA PARA EL MAPVIEW
    const vehiculosInicial = [{id:1 , geocode: [-77.030495, -12.045919], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 90,estado: 'En Tránsito', codigo: 'A001' , velocidad: 30, tipo: 'A'},{id:2 , geocode: [-77.030495, -12.045919], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 90,estado: 'En Tránsito', codigo: 'A002' , velocidad: 30, tipo: 'A'},{id:3 , geocode: [-77.030495, -12.045919], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 90,estado: 'En Tránsito', codigo: 'A003' , velocidad: 30, tipo: 'A'},{id:4 , geocode: [-77.030495, -12.045919], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 90,estado: 'En Tránsito', codigo: 'A004' , velocidad: 30, tipo: 'A'},{id:5 , geocode: [-77.030495, -12.045919], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 45,estado: 'En Tránsito', codigo: 'B001' , velocidad: 30, tipo: 'B'},{id:6 , geocode: [-77.030495, -12.045919], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 45,estado: 'En Tránsito', codigo: 'B002' , velocidad: 30, tipo: 'B'},{id:7 , geocode: [-77.030495, -12.045919], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 45,estado: 'En Tránsito', codigo: 'B003' , velocidad: 30, tipo: 'B'},{id:8 , geocode: [-77.030495, -12.045919], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 45,estado: 'En Tránsito', codigo: 'B004' , velocidad: 30, tipo: 'B'},{id:9 , geocode: [-77.030495, -12.045919], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 45,estado: 'En Tránsito', codigo: 'B005' , velocidad: 30, tipo: 'B'},{id:10 , geocode: [-77.030495, -12.045919], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 45,estado: 'En Tránsito', codigo: 'B006' , velocidad: 30, tipo: 'B'},{id:11 , geocode: [-77.030495, -12.045919], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 45,estado: 'En Tránsito', codigo: 'B007' , velocidad: 30, tipo: 'B'},{id:12 , geocode: [-77.030495, -12.045919], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 30,estado: 'En Tránsito', codigo: 'C001' , velocidad: 30, tipo: 'C'},{id:13 , geocode: [-77.030495, -12.045919], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 30,estado: 'En Tránsito', codigo: 'C002' , velocidad: 30, tipo: 'C'},{id:14 , geocode: [-77.030495, -12.045919], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 30,estado: 'En Tránsito', codigo: 'C003' , velocidad: 30, tipo: 'C'},{id:15 , geocode: [-77.030495, -12.045919], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 30,estado: 'En Tránsito', codigo: 'C004' , velocidad: 30, tipo: 'C'},{id:16 , geocode: [-77.030495, -12.045919], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 30,estado: 'En Tránsito', codigo: 'C005' , velocidad: 30, tipo: 'C'},{id:17 , geocode: [-77.030495, -12.045919], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 30,estado: 'En Tránsito', codigo: 'C006' , velocidad: 30, tipo: 'C'},{id:18 , geocode: [-77.030495, -12.045919], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 30,estado: 'En Tránsito', codigo: 'C007' , velocidad: 30, tipo: 'C'},{id:19 , geocode: [-77.030495, -12.045919], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 30,estado: 'En Tránsito', codigo: 'C008' , velocidad: 30, tipo: 'C'},{id:20 , geocode: [-77.030495, -12.045919], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 30,estado: 'En Tránsito', codigo: 'C009' , velocidad: 30, tipo: 'C'},{id:21 , geocode: [-77.030495, -12.045919], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 30,estado: 'En Tránsito', codigo: 'C010' , velocidad: 30, tipo: 'C'},{id:22 , geocode: [-79.02869, -8.111764], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 90,estado: 'En Tránsito', codigo: 'A005' , velocidad: 30, tipo: 'A'},{id:23 , geocode: [-79.02869, -8.111764], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 45,estado: 'En Tránsito', codigo: 'B008' , velocidad: 30, tipo: 'B'},{id:24 , geocode: [-79.02869, -8.111764], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 45,estado: 'En Tránsito', codigo: 'B009' , velocidad: 30, tipo: 'B'},{id:25 , geocode: [-79.02869, -8.111764], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 45,estado: 'En Tránsito', codigo: 'B010' , velocidad: 30, tipo: 'B'},{id:26 , geocode: [-79.02869, -8.111764], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 30,estado: 'En Tránsito', codigo: 'C011' , velocidad: 30, tipo: 'C'},{id:27 , geocode: [-79.02869, -8.111764], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 30,estado: 'En Tránsito', codigo: 'C012' , velocidad: 30, tipo: 'C'},{id:28 , geocode: [-79.02869, -8.111764], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 30,estado: 'En Tránsito', codigo: 'C013' , velocidad: 30, tipo: 'C'},{id:29 , geocode: [-79.02869, -8.111764], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 30,estado: 'En Tránsito', codigo: 'C014' , velocidad: 30, tipo: 'C'},{id:30 , geocode: [-79.02869, -8.111764], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 30,estado: 'En Tránsito', codigo: 'C015' , velocidad: 30, tipo: 'C'},{id:31 , geocode: [-79.02869, -8.111764], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 30,estado: 'En Tránsito', codigo: 'C016' , velocidad: 30, tipo: 'C'},{id:32 , geocode: [-71.53702, -16.398815], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 90,estado: 'En Tránsito', codigo: 'A006' , velocidad: 30, tipo: 'A'},{id:33 , geocode: [-71.53702, -16.398815], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 45,estado: 'En Tránsito', codigo: 'B011' , velocidad: 30, tipo: 'B'},{id:34 , geocode: [-71.53702, -16.398815], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 45,estado: 'En Tránsito', codigo: 'B012' , velocidad: 30, tipo: 'B'},{id:35 , geocode: [-71.53702, -16.398815], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 45,estado: 'En Tránsito', codigo: 'B013' , velocidad: 30, tipo: 'B'},{id:36 , geocode: [-71.53702, -16.398815], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 45,estado: 'En Tránsito', codigo: 'B014' , velocidad: 30, tipo: 'B'},{id:37 , geocode: [-71.53702, -16.398815], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 45,estado: 'En Tránsito', codigo: 'B015' , velocidad: 30, tipo: 'B'},{id:38 , geocode: [-71.53702, -16.398815], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 30,estado: 'En Tránsito', codigo: 'C017' , velocidad: 30, tipo: 'C'},{id:39 , geocode: [-71.53702, -16.398815], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 30,estado: 'En Tránsito', codigo: 'C018' , velocidad: 30, tipo: 'C'},{id:40 , geocode: [-71.53702, -16.398815], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 30,estado: 'En Tránsito', codigo: 'C019' , velocidad: 30, tipo: 'C'},{id:41 , geocode: [-71.53702, -16.398815], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 30,estado: 'En Tránsito', codigo: 'C020' , velocidad: 30, tipo: 'C'},{id:42 , geocode: [-71.53702, -16.398815], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 30,estado: 'En Tránsito', codigo: 'C021' , velocidad: 30, tipo: 'C'},{id:43 , geocode: [-71.53702, -16.398815], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 30,estado: 'En Tránsito', codigo: 'C022' , velocidad: 30, tipo: 'C'},{id:44 , geocode: [-71.53702, -16.398815], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 30,estado: 'En Tránsito', codigo: 'C023' , velocidad: 30, tipo: 'C'},{id:45 , geocode: [-71.53702, -16.398815], ubicacionActual: 'Arequipa', ubicacionSiguiente: 'Putumayo', fechaDeInicio: '26/08/2024, 03:45 PM', tiempoRestante: '1d 3h', capacidadUsada: 20, capacidadMaxima: 30,estado: 'En Tránsito', codigo: 'C024' , velocidad: 30, tipo: 'C'}]
    const [ws, setWs] = useState(null);
    const [estadoSimulacion, setEstadoSimulacion] = useState("INICIAL");
    const [datos, setDatos] = useState({ vehiculos: vehiculosInicial });///ESTO ES LO QUE SE USA PARA EL MAPVIEW
    const [mostrarRutas, setMostrarRutas] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // useEffect para asegurar que el componente está montado (para evitar problemas de hidratación)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // useEffect para la conexión WebSocket
  useEffect(() => {
    if (!isMounted) return;

    if (estadoSimulacion !== "EJECUCION") {
      setDatos({ vehiculos: vehiculosInicial });
      setWs(null);
      return;
    }

    const socket = new WebSocket(process.env.NEXT_PUBLIC_WS_URL);

    socket.onopen = () => {
      console.log("Conectado al servidor WebSocket");
      setWs(socket); // Guardar la conexión en el estado
    };

    socket.onmessage = (event) => {
      const message = event.data;
      setDatos(JSON.parse(message));
      console.log(JSON.parse(message).vehiculos);
    };

    socket.onerror = (error) => {
      console.log("Error en el WebSocket:", error);
    };

    socket.onclose = () => {
      console.log("Conexión WebSocket cerrada");
      setWs(null); // Limpiar la conexión
    };

    // Limpiar la conexión WebSocket al desmontar el componente
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [estadoSimulacion, isMounted]);

  // Renderizar solo cuando el componente esté montado
  if (!isMounted) {
    return null;
  }

  return (
    <div className="relative">
      <PanelSimulacion
        estadoSimulacion={estadoSimulacion}
        setEstadoSimulacion={setEstadoSimulacion}
        datos={datos}
      />
      <MapView
        datos={datos}
        mostrarRutas={mostrarRutas}
        estadoSimulacion={estadoSimulacion}
      />
      <div className="absolute bottom-10 right-10 bg-white rounded-lg flex flex-col p-2">
        <MapLegend />
        <Switch isOn={mostrarRutas} setIsOn={setMostrarRutas} />
      </div>
    </div>
  );
}

"use client"
import PanelSimulacion from "@/app/Components/PanelSimulacion"
import MapView from "@/app/Components/MapView"
import MapLegend from "@/app/Components/MapLegend"
import { useEffect, useState } from "react";



export default function Simulacion(){
    const vehiculosInicial = [{id:1 , geocode: [-12.045919, -77.030495]},{id:2 , geocode: [-12.045919, -77.030495]},{id:3 , geocode: [-12.045919, -77.030495]},{id:4 , geocode: [-12.045919, -77.030495]},{id:5 , geocode: [-12.045919, -77.030495]},{id:6 , geocode: [-12.045919, -77.030495]},{id:7 , geocode: [-12.045919, -77.030495]},{id:8 , geocode: [-12.045919, -77.030495]},{id:9 , geocode: [-12.045919, -77.030495]},{id:10 , geocode: [-12.045919, -77.030495]},{id:11 , geocode: [-12.045919, -77.030495]},{id:12 , geocode: [-12.045919, -77.030495]},{id:13 , geocode: [-12.045919, -77.030495]},{id:14 , geocode: [-12.045919, -77.030495]},{id:15 , geocode: [-12.045919, -77.030495]},{id:16 , geocode: [-12.045919, -77.030495]},{id:17 , geocode: [-12.045919, -77.030495]},{id:18 , geocode: [-12.045919, -77.030495]},{id:19 , geocode: [-12.045919, -77.030495]},{id:20 , geocode: [-12.045919, -77.030495]},{id:21 , geocode: [-12.045919, -77.030495]},{id:22 , geocode: [-8.111764, -79.02869]},{id:23 , geocode: [-8.111764, -79.02869]},{id:24 , geocode: [-8.111764, -79.02869]},{id:25 , geocode: [-8.111764, -79.02869]},{id:26 , geocode: [-8.111764, -79.02869]},{id:27 , geocode: [-8.111764, -79.02869]},{id:28 , geocode: [-8.111764, -79.02869]},{id:29 , geocode: [-8.111764, -79.02869]},{id:30 , geocode: [-8.111764, -79.02869]},{id:31 , geocode: [-8.111764, -79.02869]},{id:32 , geocode: [-16.398815, -71.53702]},{id:33 , geocode: [-16.398815, -71.53702]},{id:34 , geocode: [-16.398815, -71.53702]},{id:35 , geocode: [-16.398815, -71.53702]},{id:36 , geocode: [-16.398815, -71.53702]},{id:37 , geocode: [-16.398815, -71.53702]},{id:38 , geocode: [-16.398815, -71.53702]},{id:39 , geocode: [-16.398815, -71.53702]},{id:40 , geocode: [-16.398815, -71.53702]},{id:41 , geocode: [-16.398815, -71.53702]},{id:42 , geocode: [-16.398815, -71.53702]},{id:43 , geocode: [-16.398815, -71.53702]},{id:44 , geocode: [-16.398815, -71.53702]},{id:45 , geocode: [-16.398815, -71.53702]}]
    const [ws, setWs] = useState(null)
    const [estadoSimulacion, setEstadoSimulacion] = useState("INICIAL");
    const [datos, setDatos] = useState({vehiculos:vehiculosInicial})

    useEffect(() => {
        if(estadoSimulacion!=="EJECUCION"){
            setDatos({vehiculos:vehiculosInicial})
            setWs(null);
            return;
        }
        
        const socket = new WebSocket(process.env.NEXT_PUBLIC_WS_URL);
    
        socket.onopen = () => {
          console.log('Conectado al servidor WebSocket');
          setWs(socket); // Guardar la conexión en el estado
        };
    
        socket.onmessage = (event) => {
          const message = event.data;
          setDatos(JSON.parse(message))
          console.log(JSON.parse(message).vehiculos)
          
        };
    
        socket.onerror = (error) => {
          console.log('Error en el WebSocket:', error);
        };
    
        socket.onclose = () => {
          console.log('Conexión WebSocket cerrada');
          setWs(null); // Limpiar la conexión
        };
    
        // Limpiar la conexión WebSocket al desmontar el componente
        return () => {
          if (socket) {
            socket.close();
          }
        };
      }, [estadoSimulacion]);
    

    return(
      <div className="relative">
        <PanelSimulacion estadoSimulacion={estadoSimulacion} setEstadoSimulacion={setEstadoSimulacion} datos={datos}/>
        <MapView datos={datos}/>
        <MapLegend />
      </div>
    )
}
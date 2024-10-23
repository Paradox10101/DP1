
"use client"
import PanelSimulacion from "@/app/Components/PanelSimulacion"
import MapView from "@/app/Components/MapView"
import MapLegend from "@/app/Components/MapLegend"
import { useEffect, useState } from "react";

export default function Simulacion(){
    const [ws, setWs] = useState(null)
    const [estadoSimulacion, setEstadoSimulacion] = useState("INICIAL");
    

    useEffect(() => {
        if(estadoSimulacion!=="EJECUCION"){
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
          console.log(`Mensaje recibido: ${message}`);
          
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
        <PanelSimulacion estadoSimulacion={estadoSimulacion} setEstadoSimulacion={setEstadoSimulacion}/>
        <MapView />
        <MapLegend />          
      </div>
    )
}
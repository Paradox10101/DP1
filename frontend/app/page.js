"use client"
import PanelSimulacion from "@/app/Components/PanelSimulacion"
import MapView from "@/app/Components/MapView"
import MapLegend from "@/app/Components/MapLegend"
import { DatePicker } from "@nextui-org/react"
import PruebaSocket from "@/app/Components/PruebaSocket"
import Simulacion from "@/app/Pages/Simulacion"
import { useState } from "react"
import VehicleMap from "./components/VehicleMap";
import { Play, Pause, Square, X, PanelRightClose } from "lucide-react";



//AQUI ES DESDE DONDE SE LLAMA LO PRINCIPAL
export default function App(){
  const [showControls, setShowControls] = useState(true);
  const [simulationStatus, setSimulationStatus] = useState('stopped'); // 'stopped', 'running', 'paused'
  const [error, setError] = useState(null);

  const toggleControls = () => setShowControls(!showControls);

  const handleSimulationControl = async (action) => {
    try {
      const response = await fetch(`http://localhost:4567/api/v1/simulation/${action}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || `Failed to ${action} simulation`);
      }

      switch (action) {
        case 'start':
          setSimulationStatus('running');
          break;
        case 'pause':
          setSimulationStatus('paused');
          break;
        case 'stop':
          setSimulationStatus('stopped');
          break;
      }
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error(`Error ${action}ing simulation:`, err);
    }
  };
  
  return(
    <div>
        <div className="relative w-screen h-screen">
      <VehicleMap simulationStatus={simulationStatus} />
      

      {/* Floating Control Panel */}
      {
        showControls ? (
          <PanelSimulacion simulationStatus={simulationStatus} handleSimulationControl={handleSimulationControl} datos={[]} toggleControls={toggleControls} error={error}/>
        ) :
        /* Control Panel Toggle Button */
        (
          <button onClick={toggleControls} className="bg-white w-[11vw] px-[22px] py-[11px] rounded text-principal encabezado absolute left-5 top-5 z-50 cursor-pointer flex flex-row justify-between items-center">
              <div>        
                  <span className="text-principal encabezado">Mostrar Panel</span>
              </div>
              <PanelRightClose size={40} className="stroke-principal inline"/>
          </button>
        )
      }
      <MapLegend cornerPosition={showControls?"left-[24vw]":"left-[2vw]"}/>
    </div>
    </div>
  )

}

"use client"
import PanelSimulacion from "@/app/Components/PanelSimulacion"
import MapView from "@/app/Components/MapView"
import MapLegend from "@/app/Components/MapLegend"
import { DatePicker } from "@nextui-org/react"



export default function App(){
  return(
    <div className="relative bg-red-500">
      <PanelSimulacion />
      <MapView />
      <MapLegend />
      </div>


      
    
  )

}

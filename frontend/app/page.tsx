"use client"
import PanelSimulacion from "@/app/Components/PanelSimulacion"
import MapView from "@/app/Components/MapView"
import MapLegend from "@/app/Components/MapLegend"

export default function App(){
  return(
    <div className="relative">
      <PanelSimulacion />
      <MapView />
      <MapLegend />
    </div>
  )

}


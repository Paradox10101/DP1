"use client"
import PanelSimulacion from "@/app/Components/PanelSimulacion"
import MapView from "@/app/Components/MapView"
import MapLegend from "@/app/Components/MapLegend"
export default function Home() {
  return (
  <div className="flex justify-between">
      <div className="w-[20%] 100vh">
        <PanelSimulacion />
      </div>
      <div className="w-[80%] 100vh relative">
        <MapView />
        <MapLegend position={"absolute bottom-6 right-6 z-10"}/>
      </div>
    </div>
  );
}

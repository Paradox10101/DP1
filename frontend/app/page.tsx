"use client"
import PanelSimulacion from "@/app/Components/PanelSimulacion"
import MapView from "@/app/Components/MapView"
import MapLegend from "@/app/Components/MapLegend"
import { DatePicker } from "@nextui-org/react"
import PruebaSocket from "@/app/Components/PruebaSocket"
import Simulacion from "@/app/Pages/Simulacion"

//AQUI ES DESDE DONDE SE LLAMA LO PRINCIPAL
export default function App(){
  return(
    <div className="relative">
        <Simulacion />
    </div>
  )

}

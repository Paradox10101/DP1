import { Button } from "@nextui-org/react"
import { AlertTriangle, Building, Check, Circle, Clock, Eye, Filter, Flag, Globe, MapPin, Package, Truck, Warehouse } from "lucide-react"
import BarraProgreso from "./BarraProgreso"
import IconoEstado from "./IconoEstado"

export default function ModalRutaVehiculoEnvio({selectedVehicle}){
    
    return (
        <div className="flex flex-col gap-6">
            
            <div className="flex flex-row w-full items-center align-middle gap-2">
                    <div>
                        <IconoEstado Icono={Truck} classNameContenedor={"bg-blue-500 w-[25px] h-[25px] relative rounded-full flex items-center justify-center"} classNameContenido={"w-[15px] h-[15px] stroke-blanco z-10"}/>
                    </div>
                    <div>
                        <div>{"TRUCK-LC1"} | Capacidad: {"15" + " paquetes"}</div>
                    </div>
            </div>

            <div className="max-h-[415px] overflow-y-auto">

                <div className="flex flex-row gap-2 items-center">
                    <div>
                        <IconoEstado Icono={Warehouse} classNameContenedor={"bg-black w-[36px] h-[36px] relative rounded-full flex items-center justify-center"} classNameContenido={"w-[20px] h-[20px] stroke-blanco z-10"}/>
                    </div>
                    <div className="flex flex-col">
                        <div className="text-left regular_bold">{"Lima"+" -> "+"Huancayo"}</div>
                        <div className="text-left text-[#B9B9B9] pequenno">Ubigeo: {"150101"}</div>
                    </div>
                </div>

                <div className="flex items-center bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
                    <AlertTriangle className="mr-3 text-yellow-500" />
                    <span className="text-sm">Bloqueo en la ruta.</span>
                </div>

                <div className="flex flex-row gap-2 items-center">
                    <div>
                        <IconoEstado Icono={Check} classNameContenedor={"bg-blue-500 w-[36px] h-[36px] relative rounded-full flex items-center justify-center"} classNameContenido={"w-[20px] h-[20px] stroke-blanco z-10"}/>
                    </div>
                    <div className="flex flex-col">
                        <div className="text-left regular_bold">{"Lima"+" -> "+"Huancayo"}</div>
                        <div className="text-left text-[#B9B9B9] pequenno">Ubigeo: {"150101"}</div>
                        <div className="text-left text-[#B9B9B9] pequenno">Distancia: {"298"+" km"}</div>
                    </div>
                </div>

                <div className="flex flex-row gap-2 items-center">
                    <div>
                        <IconoEstado Icono={Check} classNameContenedor={"bg-blue-500 w-[36px] h-[36px] relative rounded-full flex items-center justify-center"} classNameContenido={"w-[20px] h-[20px] stroke-blanco z-10"}/>
                    </div>
                    <div className="flex flex-col">
                        <div className="text-left regular_bold">{"Lima"+" -> "+"Huancayo"}</div>
                        <div className="text-left text-[#B9B9B9] pequenno">Ubigeo: {"150101"}</div>
                        <div className="text-left text-[#B9B9B9] pequenno">Distancia: {"298"+" km"}</div>
                    </div>
                </div>

                <div className="flex flex-row gap-2 items-center">
                    <div>
                        <IconoEstado Icono={Check} classNameContenedor={"bg-blue-500 w-[36px] h-[36px] relative rounded-full flex items-center justify-center"} classNameContenido={"w-[20px] h-[20px] stroke-blanco z-10"}/>
                    </div>
                    <div className="flex flex-col">
                        <div className="text-left regular_bold">{"Lima"+" -> "+"Huancayo"}</div>
                        <div className="text-left text-[#B9B9B9] pequenno">Ubigeo: {"150101"}</div>
                        <div className="text-left text-[#B9B9B9] pequenno">Distancia: {"298"+" km"}</div>
                    </div>
                </div>

                <div className="flex flex-row gap-2 items-center">
                    <div>
                        <IconoEstado Icono={Check} classNameContenedor={"bg-blue-500 w-[36px] h-[36px] relative rounded-full flex items-center justify-center"} classNameContenido={"w-[20px] h-[20px] stroke-blanco z-10"}/>
                    </div>
                    <div className="flex flex-col">
                        <div className="text-left regular_bold">{"Lima"+" -> "+"Huancayo"}</div>
                        <div className="text-left text-[#B9B9B9] pequenno">Ubigeo: {"150101"}</div>
                        <div className="text-left text-[#B9B9B9] pequenno">Distancia: {"298"+" km"}</div>
                    </div>
                </div>

                <div className="flex flex-row gap-2">
                    <div>
                        <Circle size={36}/>
                    </div>
                    <div className="flex flex-col">
                        <div className="text-left regular_bold">{"Lima"+" -> "+"Huancayo"}</div>
                        <div className="text-left text-[#B9B9B9] pequenno">Ubigeo: {"150101"}</div>
                        <div className="text-left text-[#B9B9B9] pequenno">Distancia: {"298"+" km"}</div>
                    </div>
                </div>
                <div className="flex flex-row gap-2">
                    <div>
                        <IconoEstado Icono={Building} classNameContenedor={"bg-[#2ACF58] w-[36px] h-[36px] relative rounded-full flex items-center justify-center"} classNameContenido={"w-[20px] h-[20px] stroke-blanco z-10"}/>
                    </div>
                    <div className="flex flex-col">
                        <div className="text-left regular_bold">{"Lima"+" -> "+"Huancayo"}</div>
                        <div className="text-left text-[#B9B9B9] pequenno">Ubigeo: {"150101"}</div>
                    </div>
                </div>
            </div>
            <div className="flex flex-col gap-1 text-center">
            <BarraProgreso porcentaje={70/95*100} uniqueColor={true}/>
                <div>{parseFloat(70/95*100).toFixed(2)}% de la ruta completada</div>
            </div>
                

        </div>
    )
}

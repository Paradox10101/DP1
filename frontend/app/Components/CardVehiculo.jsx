import { NextUIProvider, Progress } from "@nextui-org/react";
import { Building, Car, CarFront, Clock, Gauge, Hash, MapPin, Package, Truck, Warehouse } from "lucide-react";
import BarraProgreso from "@/app/Components/BarraProgreso"

export default function CardVehiculo({vehiculo}){
    return (
        <div className="flex flex-col p-4 border-2 stroke-black rounded-xl gap-1">
            <div className="flex flex-row justify-between">
                <div className="flex flex-row gap-2 items-center">
                    {vehiculo.tipo=="A"?
                    <Truck size={16} className="stroke-blue-500"/>
                    :
                    vehiculo.tipo=="B"?
                    <CarFront size={16} className="stroke-blue-500"/>
                    :
                    vehiculo.tipo=="C"?
                    <Car size={16} className="stroke-blue-500"/>
                    :
                    <></>
                    }
                    <div className="pequenno_bold">
                        {vehiculo.codigo}
                    </div>
                </div>
                <div className={"pequenno border " +
                    (
                    vehiculo.estado==="En Tránsito"?"bg-[#284BCC] text-[#BECCFF] rounded-xl w-[140px] text-center" :
                    vehiculo.estado==="En Preparación"?"bg-[#DEA71A] text-[#F9DF9B] rounded-xl w-[140px] text-center" :
                    vehiculo.estado==="Averiado"?"bg-[#BE0627] text-[#FFB9C1] rounded-xl w-[140px] text-center" :
                    vehiculo.estado==="En Mantenimiento"?"bg-[#7B15FA] text-[#D0B0F8] rounded-xl w-[140px] text-center" :
                    ""
                    )
                }>
                    {vehiculo.estado}
                </div>
            </div>
            <div className="flex flex-row gap-2 items-center">
                <MapPin size={16}/>
                <div className="pequenno">{"Tramo actual: " + vehiculo.ubicacionActual + " -> " + vehiculo.ubicacionSiguiente}</div>
            </div>
            <div className="flex flex-row gap-2 items-center">
                <Gauge size={16}/>
                <div className="pequenno">{"Velocidad: " + vehiculo.velocidad} Km/h</div>
            </div>
            <div className="flex flex-row gap-2 items-center">
                <Package size={16}/>
                <div 
                className="pequenno">{"Capacidad utilizada: " + vehiculo.capacidadUsada + " / " + vehiculo.capacidadMaxima}</div>
            </div>
            <div className="flex flex-col gap-1">
                <BarraProgreso porcentaje={vehiculo.capacidadUsada/vehiculo.capacidadMaxima*100}/>
                <span className="pequenno text-[#555555]">{parseFloat((vehiculo.capacidadUsada/vehiculo.capacidadMaxima*100).toFixed(2))}% ocupado</span>
            </div>
               
        </div>
    )
}
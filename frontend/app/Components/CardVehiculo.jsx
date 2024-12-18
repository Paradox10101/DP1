import { Button, Progress } from "@nextui-org/react";
import { Car, CarFront, Truck, MapPin, Calendar, Package, AlertCircle, Target, Crosshair } from "lucide-react";
import BarraProgreso from "@/app/Components/BarraProgreso";
import IconoEstado from "./IconoEstado";
import { useEffect, useState } from "react";
import { followLocationAtom } from "@/atoms/locationAtoms";
import { useAtom, useAtomValue } from "jotai";
import BreakdownModal from "./VehiclePopUp/BreakdownModal";
import { el } from "date-fns/locale";
import { simulationStatusAtom, simulationTypeAtom } from "@/atoms/simulationAtoms";

export default function CardVehiculo({ vehiculo, RenderStatus, coordinates, setIsBreakdownModalOpen, setVehicleCodeSelected}) {

    const [,setFollowLocation] = useAtom(followLocationAtom)
    const simulationType = useAtomValue(simulationTypeAtom)

    
    return (
        
        <div className="flex flex-col p-4 border-2 stroke-black rounded-xl gap-1 w-full">
            <div className="flex flex-row justify-between">
                <div className="flex flex-row gap-2 items-center">
                    {vehiculo.tipo === "A" ? (
                        <IconoEstado Icono={Truck} classNameContenedor="bg-blue-500 w-[25px] h-[25px] relative rounded-full flex items-center justify-center" classNameContenido="w-[15px] h-[15px] stroke-blanco z-10"/>
                    ) : vehiculo.tipo === "B" ? (
                        <IconoEstado Icono={CarFront} classNameContenedor="bg-blue-500 w-[25px] h-[25px] relative rounded-full flex items-center justify-center" classNameContenido="w-[15px] h-[15px] stroke-blanco z-10"/>
                    ) : vehiculo.tipo === "C" ? (
                        <IconoEstado Icono={Car} classNameContenedor="bg-blue-500 w-[25px] h-[25px] relative rounded-full flex items-center justify-center" classNameContenido="w-[15px] h-[15px] stroke-blanco z-10"/>
                    ) : null}
                    <div className="pequenno_bold">{vehiculo.vehicleCode}</div>
                </div>
                
                <RenderStatus status={vehiculo.status}/>
                
            </div>
            <div className="flex flex-row gap-2 items-center">
                <MapPin size={16} />
                <div className="pequenno">Tramo actual: {vehiculo.ubicacionActual + (vehiculo.ubicacionSiguiente!==" "?" -> " + vehiculo.ubicacionSiguiente:"")}</div>
            </div>
            <div className="flex flex-row gap-2 items-center">
                <Calendar size={16} />
                <div className="pequenno">Velocidad: {parseFloat(vehiculo.velocidad).toFixed(0)} km/h</div>
            </div>
            <div className="flex flex-row gap-2 items-center">
                <Package size={16} />
                <div className="pequenno">Capacidad utilizada: {vehiculo.capacidadUsada} / {vehiculo.capacidadMaxima}</div>
            </div>
            <div className="flex flex-col gap-1">
                <BarraProgreso porcentaje={(vehiculo.capacidadUsada / vehiculo.capacidadMaxima) * 100} />
                <span className="pequenno text-[#555555]">
                    {parseFloat((vehiculo.capacidadUsada / vehiculo.capacidadMaxima * 100).toFixed(2))}% ocupado
                </span>
            </div>
            <div className="flex flex-row gap-2 items-center justify-between">
            {simulationType&&simulationType!=='colapso'&&
            <div
                onMouseDown={(event) => {
                    event.stopPropagation();
                    if(vehiculo.status === "EN_TRANSITO_ORDEN"){
                        setVehicleCodeSelected(vehiculo.vehicleCode)
                        setIsBreakdownModalOpen(true);
                    }
                    
                }}
                className={"font-medium flex flex-row justify-center items-center gap-2 rounded-lg  p-1 cursor-pointer " + (vehiculo.status === "EN_TRANSITO_ORDEN"?"text-red-800 bg-red-300":"text-red-800 bg-red-300 bg-opacity-50  text-opacity-50")}
                //{}
                >
                    
                <div className="flex items-center">
                    <AlertCircle className="w-3 h-3" color="red" />
                </div>
                
                    <div className="text-sm">
                        Provocar Avería
                    </div>
                
            </div>
            }
            <div
                onMouseDown={(event) => {
                    event.stopPropagation();
                    setFollowLocation(coordinates)
                }}
                className="font-medium flex flex-row justify-center items-center gap-2 rounded-lg  p-1 cursor-pointer text-orange-800 bg-orange-300"
                //{}
                >
                <div className="flex items-center">
                    <Crosshair className="w-3 h-3" color="white" />
                </div>
                <div className="text-sm">
                    Seguir Vehículo
                </div>
            </div>
                
            </div>
            
        </div>
        
        
    );
}
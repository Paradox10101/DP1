"use client"

import { Button } from "@nextui-org/react";
import { AlertTriangle, Building, Car, CarFront, TriangleAlert, Truck, Warehouse } from "lucide-react";
import { useState } from "react";
import IconoEstado from "@/app/Components/IconoEstado"

export default function MapLegend({cornerPosition}){
    const [hideLegend, setHideLegend] = useState(true);
    return (
        <>
            <div className={"bg-white w-fit p-3 rounded absolute bottom-6 " + cornerPosition}>
                <div className="flex flex-col justify-between gap-4">
                {!hideLegend&&(
                    <div className="flex flex-col justify-between gap-4">
                        <div className="encabezado text-center">Leyenda</div>
                        <div className="flex flex-col gap-3">
                            <div className="regular_bold">Ubicaciones</div>
                            <div className="flex flex-col gap-2 justify-between">
                                <div className="flex flex-row gap-2">
                                    <IconoEstado Icono={Warehouse} classNameContenedor={"bg-black w-[25px] h-[25px] relative rounded-full flex items-center justify-center"} classNameContenido={"w-[15px] h-[15px] stroke-blanco z-10"}/>
                                    <div className="inline-block">Almacén</div>
                                </div>
                                <div className="flex flex-row gap-2">
                                    <IconoEstado Icono={Building} classNameContenedor={"bg-blue-500 w-[25px] h-[25px] relative rounded-full flex items-center justify-center"} classNameContenido={"w-[15px] h-[15px] stroke-blanco z-10"}/>
                                    <div className="inline-block">Oficina</div>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            <div className="regular_bold">Vehiculos</div>
                            <div className="flex flex-col gap-2">
                                
                                <div className="flex flex-row gap-2">
                                <IconoEstado Icono={Truck} classNameContenedor={"bg-blue-500 w-[25px] h-[25px] relative rounded-full flex items-center justify-center"} classNameContenido={"w-[15px] h-[15px] stroke-blanco z-10"}/>
                                    <div className="inline-block">Vehiculo Tipo 1</div>
                                </div>
                                <div className="flex flex-row gap-2">
                                <IconoEstado Icono={CarFront} classNameContenedor={"bg-blue-500 w-[25px] h-[25px] relative rounded-full flex items-center justify-center"} classNameContenido={"w-[15px] h-[15px] stroke-blanco z-10"}/>
                                    <div className="inline-block">Vehiculo Tipo 2</div>
                                </div>
                                <div className="flex flex-row gap-2">
                                <IconoEstado Icono={Car} classNameContenedor={"bg-blue-500 w-[25px] h-[25px] relative rounded-full flex items-center justify-center"} classNameContenido={"w-[15px] h-[15px] stroke-blanco z-10"}/>
                                    <div className="inline-block">Vehiculo Tipo 3</div>
                                </div>
                                <div className="flex flex-row gap-2">
                                    <IconoEstado Icono={AlertTriangle} classNameContenedor={"bg-yellow-500 w-[25px] h-[25px] relative rounded-full flex items-center justify-center"} classNameContenido={"w-[15px] h-[15px] stroke-[#ff0000] z-10"} />
                                    <div className="inline-block">Camion averiado</div>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            <div className="regular_bold">Capacidad de Vehículos</div>
                            <div className="flex flex-col gap-2">
                                <div className="flex flex-row gap-2">
                                    <div className="bg-capacidadDisponible w-4 h-4 rounded inline-block"></div>
                                    <div className="inline-block">0-40%</div>
                                </div>
                                <div className="flex flex-row gap-2">
                                    <div className="bg-capacidadSaturada w-4 h-4 rounded inline-block"></div>
                                    <div className="inline-block">41-80%</div>
                                </div>
                                <div className="flex flex-row gap-2">
                                    <div className="bg-capacidadLlena w-4 h-4 rounded inline-block"></div>
                                    <div className="inline-block">81-100%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    )}
                    <div className="bg-[#F4F4F4] w-[180px] text-center rounded text-black focus:outline-none">
                        <Button disableRipple={true} onClick={()=>{setHideLegend((prev)=>!prev)}}>
                            {!hideLegend?"Ocultar Leyenda": "Mostrar Leyenda"}
                        </Button>
                    </div>
                </div>
                
                

            </div>
            
            
            
            
        </>

    )
}
/*

*/
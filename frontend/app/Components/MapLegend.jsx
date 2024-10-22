"use client"

import { Button } from "@nextui-org/react";
import { Building, TriangleAlert, Truck, Warehouse } from "lucide-react";
import { useState } from "react";

export default function MapLegend(){
    const [hideLegend, setHideLegend] = useState(true);
    return (
        <>
            <div className={"bg-white w-fit absolute bottom-6 right-10 p-3 rounded"}>
                <div className="flex flex-col justify-between gap-4">
                {!hideLegend&&(
                    <div className="flex flex-col justify-between gap-4">
                        <div>
                            <div className="regular_bold">Leyenda</div>
                            <div className="flex flex-col gap-4 justify-between">
                                <div className="flex flex-row gap-2">
                                    <Warehouse className="inline-block"/>
                                    <div className="inline-block">Almacén</div>
                                </div>
                                <div className="flex flex-row gap-2">
                                    <Building className="inline-block"/>
                                    <div className="inline-block">Oficina</div>
                                </div>
                                <div className="flex flex-row gap-2">
                                    <Truck className="inline-block"/>
                                    <div className="inline-block">Camion</div>
                                </div>
                                <div className="flex flex-row gap-2">
                                    <TriangleAlert className="inline-block"/>
                                    <div className="inline-block">Camion averiado</div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <div className="regular_bold">Capacidad</div>
                            <div className="py-2">
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
                    <div className="bg-[#F4F4F4] w-[180px] text-center p-2 rounded text-black">
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
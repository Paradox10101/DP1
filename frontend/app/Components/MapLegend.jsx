"use client"


import { Building, TriangleAlert, Truck, Warehouse } from "lucide-react";
import { useState } from "react";

export default function MapLegend({position}){
    const [hideLegend, setHideLegend] = useState(true);
    return (
        <>
            {!hideLegend ? (<div className={"bg-white w-[180px] "+position}>
                <div>
                    <div>
                        <div>Leyenda</div>
                        <div>
                            <div>
                                <Building />
                                <Warehouse className="inline-block"/>
                                <div className="inline-block">Almacén</div>
                            </div>
                            <div>
                                <Building className="inline-block"/>
                                <div className="inline-block">Oficina</div>
                            </div>
                            <div>
                                <Truck className="inline-block"/>
                                <div className="inline-block">Camion</div>
                            </div>
                            <div>
                                <TriangleAlert className="inline-block"/>
                                <div className="inline-block">Camion averiado</div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div>Capacidad</div>
                        <div>
                            <div>
                                <div className="bg-capacidadDisponible w-4 h-4 rounded inline-block"></div>
                                <div className="inline-block">0-40%</div>
                            </div>
                            <div>
                                <div className="bg-capacidadSaturada w-4 h-4 rounded inline-block"></div>
                                <div className="inline-block">41-80%</div>
                            </div>
                            <div>
                                <div className="bg-capacidadLlena w-4 h-4 rounded inline-block"></div>
                                <div className="inline-block">81-100%</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>):<></>
            }

            <div className={"bg-white w-[180px] text-center "+position}>
                <Button disableRipple={true} onClick={()=>{setHideLegend((prev)=>!prev)}}>
                    {hideLegend?"Mostrar leyenda":"Ocultar leyenda"}
                </Button>
            </div>
        </>

    )
}
/*

*/
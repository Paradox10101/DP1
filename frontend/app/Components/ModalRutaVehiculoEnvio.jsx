import { Button } from "@nextui-org/react"
import { AlertTriangle, Building, Car, CarFront, Check, Circle, Clock, Eye, Filter, Flag, Globe, MapPin, Package, Truck, Warehouse } from "lucide-react"
import BarraProgreso from "./BarraProgreso"
import IconoEstado from "./IconoEstado"
import { useMemo } from "react"

export default function ModalRutaVehiculoEnvio({selectedVehicle}){
    const percentage = useMemo(() => {
        if (selectedVehicle.routes && selectedVehicle.routes.length > 0) {
          const traveledDistance = selectedVehicle.routes.reduce((sum, route) => route?.status && route.status === 'TRAVELED' ? sum + (route?.distance?route.distance:0) : sum, 0);
          const totalDistance = selectedVehicle.routes.reduce((sum, route) => sum + (route?.distance?route.distance:0), 0);
          return (traveledDistance / totalDistance) * 100;
        }
        return 0; // Retorna 0 si no hay rutas
      }, [selectedVehicle.routes, selectedVehicle]);

    return (
        <div className="flex flex-col gap-2 justify-between h-full ">
            
            <div className="flex flex-col gap-4">
            <div className="flex flex-row w-full items-center align-middle gap-2">
                    <div>
                        {
                            selectedVehicle.vehicleType==="A"?
                            <IconoEstado Icono={Truck} classNameContenedor={"bg-blue-500 w-[25px] h-[25px] relative rounded-full flex items-center justify-center"} classNameContenido={"w-[15px] h-[15px] stroke-blanco z-10"}/>
                            :
                            selectedVehicle.vehicleType==="B"?
                            <IconoEstado Icono={CarFront} classNameContenedor={"bg-blue-500 w-[25px] h-[25px] relative rounded-full flex items-center justify-center"} classNameContenido={"w-[15px] h-[15px] stroke-blanco z-10"}/>
                            :
                            <IconoEstado Icono={Car} classNameContenedor={"bg-blue-500 w-[25px] h-[25px] relative rounded-full flex items-center justify-center"} classNameContenido={"w-[15px] h-[15px] stroke-blanco z-10"}/>
                        }
                        
                    </div>
                    <div>
                        <div>{selectedVehicle.vehicleCode} | Capacidad: {selectedVehicle.vehicleCapacity + " paquete(s)"}</div>
                    </div>
            </div>


            <div className="max-h-[590px] overflow-y-auto flex flex-col gap-4 align-top scroll-area">
                {selectedVehicle.routes && selectedVehicle.routes.map((route)=>
                    route?.originUbigeo&&route?.destinationUbigeo?
                    <div className="flex flex-row gap-2">
                        <div>
                            {
                            (route?.status)&&
                            (
                            route.status==="IN_TRAVEL"?
                            <Circle size={36} className="stroke-principal"/>
                            :
                            route.status==="TRAVELED"?
                            <IconoEstado Icono={Check} classNameContenedor={"bg-blue-500 w-[36px] h-[36px] relative rounded-full flex items-center justify-center"} classNameContenido={"w-[20px] h-[20px] stroke-blanco z-10"}/>
                            :
                            route.status==="NO_TRAVELED"?
                            <Circle size={36}/>
                            :
                            <></>
                            )
                            }
                        </div>
                        <div className="flex flex-col">
                            <div className="text-left regular_bold">{route.originCity+" -> "+route.destinationCity}</div>
                            <div className="text-left text-black pequenno">{route.originUbigeo + " -> "+route.destinationUbigeo}</div>
                            <div className="text-left text-black pequenno">Distancia: {route.distance+" km"}</div>
                        </div>
                    </div>
                    :
                    route?.originUbigeo&&!route?.destinationUbigeo?
                    <div className="flex flex-row gap-2 items-center">
                        <div>
                            <IconoEstado Icono={Warehouse} classNameContenedor={"bg-black w-[36px] h-[36px] relative rounded-full flex items-center justify-center"} classNameContenido={"w-[20px] h-[20px] stroke-blanco z-10"}/>
                        </div>
                        <div className="flex flex-col">
                            <div className="text-left regular_bold">{route.originCity}</div>
                            <div className="text-left text-black pequenno">Ubigeo: {route.originUbigeo}</div>
                        </div>
                    </div>
                    :
                    <div className="flex flex-row gap-2">
                        <div>
                            <IconoEstado Icono={Building} classNameContenedor={"bg-[#2ACF58] w-[36px] h-[36px] relative rounded-full flex items-center justify-center"} classNameContenido={"w-[20px] h-[20px] stroke-blanco z-10"}/>
                        </div>
                        <div className="flex flex-col">
                            <div className="text-left regular_bold">{route.destinationCity}</div>
                            <div className="text-left text-black pequenno">Ubigeo: {route.destinationUbigeo}</div>
                        </div>
                    </div>
                )
                }
            </div>

                
                
            </div>
            {selectedVehicle?.routes&&
                <div className="flex flex-col gap-1 text-center">
                    <BarraProgreso porcentaje={percentage} uniqueColor={true}/>
                    <div>{parseFloat(percentage).toFixed(2)}% de la ruta completada</div>
                </div>
            }
                

        </div>
    )
}

//<div>{parseFloat(selectedVehicle.routes.reduce((sum, route) => sum + route.distance, 0)).toFixed(2)}% de la ruta completada</div>


//Se tomara el siguente codigo cuando un vehiculo este pasando por una ruta bloqueada y se detenga a esperar,
//sera solo en caso de que si o si se de la espera de desbloqueo de la ruta en su trayecto
/*
<div className="flex items-center bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
                    <AlertTriangle className="mr-3 text-yellow-500" />
                    <span className="text-sm">Bloqueo en la ruta.</span>
</div>
*/


//Se tomara en cuenta cuando en la verificacion del trayecto actual del vehiculo
/*
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

*/
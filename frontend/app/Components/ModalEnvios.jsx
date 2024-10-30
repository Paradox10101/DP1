import { Button } from "@nextui-org/react"
import { Calendar, Clock, Eye, Filter, Flag, Globe, MapPin, Package } from "lucide-react"

export default function ModalEnvios({shipment, setSelectedVehicle}){
    
    return ( shipment&&
        <div className="flex flex-col gap-6">
            <div className="flex flex-row justify-between">
                <div className="flex flex-col gap-1">
                    <div className="flex flex-row gap-1">
                        <MapPin size={16}/>
                        <div className="regular">Ruta {"(" + shipment.originUbigeo  + " -> "+  + shipment.destinyUbigeo + ")"}</div>
                    </div>
                    <div className="regular_bold">
                        {"Almacén "+ shipment.originCity +" -> "+"Oficina "+ shipment.destinyCity }
                    </div>
                    <div className="regular_bold">
                        
                    </div>
                </div>
                <div className="flex flex-col gap-1 text-center">
                    <div className="flex flex-row gap-1">
                        <Clock size={16}/>
                        <div className="regular">Tiempo transcurrido</div>
                    </div>
                    <div className="regular_bold">
                        {shipment.elapsedTimeDays+" d "+ shipment.elapsedTimeHours +" h"}
                    </div>
                </div>
            </div>
            <div className="bg-[#F7F7F7] p-4 rounded flex flex-row justify-between">
                <div className="flex flex-col justify-center">
                    <Package size={32} className="stroke-[#ADADAD] self-center"/>
                    <div className="regular">{shipment.totalPackages}</div>
                    <div className="text-[#8E8D8D] pequenno">Paquetes</div>
                </div>
                <div className="flex flex-col justify-center">
                    <Calendar size={32} className="stroke-[#ADADAD] self-center"/>
                    <div className="regular">{shipment.limitTime}</div>
                    <div className="text-[#8E8D8D] pequenno">Fecha límite</div>
                </div>
                <div className="flex flex-col justify-center">
                    <Globe size={32} className="stroke-[#ADADAD] self-center"/>
                    <div className="regular">{shipment.destinyRegion}</div>
                    <div className="text-[#8E8D8D] pequenno">Region Destino</div>
                </div>
            </div>
            
            <div className="flex flex-col gap-4">
                <div className="flex flex-row justify-between">
                    <div className="text-black regular_bold">Paquetes en envío</div>
                    <Button
                    disableRipple={true}
                    startContent={<Filter className="size-2"/>}
                    className="focus:outline-none border stroke-black rounded h-8 pequenno w-[22%] bg-[#F4F4F4]"
                    >
                    Filtros
                    </Button>
                </div>
                
                <div className="overflow-x-auto max-h-[350px]">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow overflow-y-auto">
                        <thead>
                        <tr className="bg-gray-50 text-gray-500 uppercase text-sm leading-normal">
                            <th className="py-3 px-6 text-left">CAMIÓN ACTUAL</th>
                            <th className="py-3 px-6 text-left"># PAQUETES</th>
                            <th className="py-3 px-6 text-left">ESTADO</th>
                            <th className="py-3 px-6 text-left">ACCIÓN</th>
                        </tr>
                        </thead>
                        <tbody className="text-gray-700 text-sm font-light">
                        
                        {
                        shipment.transportPlans.map((vehicle)=>{
                            return(
                                <tr className="border-b border-gray-200 hover:bg-gray-100">
                                    <td className="py-3 px-6 text-left">{vehicle.vehicleCode}</td>
                                    <td className="py-3 px-6 text-left whitespace-nowrap">{vehicle.inTransportPackages}</td>
                                    <td className="py-3 px-6 text-left">
                                    <span className="px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-600">
                                        En tránsito
                                    </span>
                                    </td>
                                    
                                    <td className="py-3 px-6 text-left flex items-center">
                                    <button className="bg-principal flex flex-row items-center p-2 rounded"
                                    onClick={()=>{setSelectedVehicle("1")}}>
                                        <Eye className="w-4 h-4 mr-1 text-white" />
                                        <span className=" cursor-pointer text-white">Ver ruta</span>
                                    </button>
                                    </td>
                                </tr>
                            )
                        })
                            
                        }
                        
                        
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="text-right text-[#939393] regular">Cantidad de vehiculos: {shipment.transportPlans.len|0}</div>


        </div>
    )
}


/*

            <div className="flex flex-row items-center gap-4 ml-auto justify-end w-full">
                <Button
                    disableRipple={true}
                    className="focus:outline-none border stroke-black rounded h-8 pequenno w-[22%] bg-[#F4F4F4] max-w-[85px]"
                    >
                    Previo
                </Button>
                <div>1</div>
                <Button
                    disableRipple={true}
                    className="focus:outline-none border stroke-black rounded h-8 pequenno w-[22%] bg-[#F4F4F4] max-w-[85px]"
                    >
                    Siguiente
                </Button>
            </div>

*/
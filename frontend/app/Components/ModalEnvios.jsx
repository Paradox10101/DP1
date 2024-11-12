import { selectedShipmentAtom } from "@/atoms/shipmentAtoms";
import { Button } from "@nextui-org/react"
<<<<<<< HEAD
import { Calendar, Clock, Eye, Filter, Flag, Globe, MapPin, Package } from "lucide-react"

export default function ModalEnvios({shipment, setSelectedVehicle}){
    
    return ( shipment&&
=======
import { useAtomValue } from "jotai";
import { Calendar, Clock, Eye, Filter, Flag, Globe, MapPin, Package } from "lucide-react"

export default function ModalEnvios({shipmentVehicles, setSelectedVehicleIndex, sendMessage, shipment}){
    return (
>>>>>>> 3ea7c0fccae3d4027d771983996a2ada537b7fba
        <div className="flex flex-col gap-6">
            <div className="flex flex-row justify-between">
                <div className="flex flex-col gap-1">
                    <div className="flex flex-row gap-1">
                        <MapPin size={16}/>
<<<<<<< HEAD
                        <div className="regular">Ruta {"(" + shipment.originUbigeo  + " -> "+  + shipment.destinyUbigeo + ")"}</div>
                    </div>
                    <div className="regular_bold">
                        {"Almacén "+ shipment.originCity +" -> "+"Oficina "+ shipment.destinyCity }
                    </div>
                    <div className="regular_bold">
                        
=======
                        <div className="regular">Ruta de envío</div>
                    </div>
                    <div className="regular_bold">
                        {"Almacen "+ shipment.originCity +" -> "+"Oficina "+ shipment.destinationCity}
>>>>>>> 3ea7c0fccae3d4027d771983996a2ada537b7fba
                    </div>
                </div>
                <div className="flex flex-col gap-1 text-center">
                    <div className="flex flex-row gap-1">
                        <Clock size={16}/>
                        <div className="regular">Tiempo transcurrido</div>
                    </div>
                    <div className="regular_bold">
<<<<<<< HEAD
                        {shipment.elapsedTimeDays+" d "+ shipment.elapsedTimeHours +" h"}
=======
                        {shipment.timeRemainingDays +"d "+ shipment.timeRemainingHours +"h"}
>>>>>>> 3ea7c0fccae3d4027d771983996a2ada537b7fba
                    </div>
                </div>
            </div>
            <div className="bg-[#F7F7F7] p-4 rounded flex flex-row justify-around">
                <div className="flex flex-col justify-center text-center">
                    <Package size={32} className="stroke-[#ADADAD] self-center"/>
<<<<<<< HEAD
                    <div className="regular">{shipment.totalPackages}</div>
                    <div className="text-[#8E8D8D] pequenno">Paquetes</div>
                </div>
                <div className="flex flex-col justify-center">
                    <Calendar size={32} className="stroke-[#ADADAD] self-center"/>
                    <div className="regular">{shipment.limitTime}</div>
                    <div className="text-[#8E8D8D] pequenno">Fecha límite</div>
=======
                    <div className="regular">{shipment.quantity}</div>
                    <div className="text-[#8E8D8D] pequenno">Paquetes</div>
                </div>
                <div className="flex flex-col justify-center text-center">
                    <Calendar size={32} className="stroke-[#ADADAD] self-center"/>
                    <div className="regular">{new Date(shipment.dueTime).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '')}</div>
                    <div className="text-[#8E8D8D] pequenno">Fecha Límite</div>
>>>>>>> 3ea7c0fccae3d4027d771983996a2ada537b7fba
                </div>
                <div className="flex flex-col justify-center text-center">
                    <Globe size={32} className="stroke-[#ADADAD] self-center"/>
<<<<<<< HEAD
                    <div className="regular">{shipment.destinyRegion}</div>
=======
                    <div className="regular">{shipment.destinationRegion}</div>
>>>>>>> 3ea7c0fccae3d4027d771983996a2ada537b7fba
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
<<<<<<< HEAD
                
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
                        
                        
=======
                <div className="overflow-x-auto min-h-[350px] border stroke-black rounded w-full">
                    <table className="bg-white border border-gray-200 rounded-lg shadow w-full">
                        <thead className="w-full">
                            <tr className="bg-gray-50 text-gray-500 uppercase text-sm leading-normal w-full">
                                <th className="py-3 px-6 text-center w-1/4">CAMIÓN ACTUAL</th>
                                <th className="py-3 px-6 text-center w-1/4">CANTIDAD DE PAQUETES</th>
                                <th className="py-3 px-6 text-center w-1/4">ESTADO</th>
                                <th className="py-3 px-6 text-center w-1/4">ACCIÓN</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700 text-sm font-light overflow-y-auto min-h-[325px] w-full">
                            {shipmentVehicles &&
                                shipmentVehicles.map((vehicle, index) => (
                                    <tr className="border border-gray-200 w-full " key={vehicle.vehicleCode}>
                                        <td className="py-3 px-6 text-center w-1/4 whitespace-nowrap">{vehicle.vehicleCode}</td>
                                        <td className="py-3 px-6 text-center w-1/4 whitespace-nowrap">{vehicle.packageQuantity}</td>
                                        <td className="py-3 px-6 text-center w-1/4">
                                            {(vehicle.status)&&(
                                                vehicle.status === "ATTENDED"?
                                                <span className="px-3 py-1 rounded-full text-xs bg-capacidadDisponible text-white">
                                                    ATENDIDO
                                                </span>
                                                :
                                                vehicle.status === "NO_ATTENDED"?
                                                <span className="px-3 py-1 rounded-full text-xs bg-capacidadSaturada text-white">
                                                    PENDIENTE
                                                </span>
                                                :
                                                <></>
                                            )}
                                        </td>
                                        <td className="py-3 px-6 text-center w-[250px] flex justify-center ">
                                            <button
                                                className="bg-principal items-center p-2 rounded text-center flex flex-center justify-center"
                                                onClick={() => {
                                                    setSelectedVehicleIndex(index);
                                                    sendMessage({ orderId: shipment.id, vehicleCode: vehicle.vehicleCode });
                                                }}
                                            >
                                                <Eye className="w-4 h-4 mr-1 text-white" />
                                                <span className="cursor-pointer text-white">Ver ruta</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
>>>>>>> 3ea7c0fccae3d4027d771983996a2ada537b7fba
                        </tbody>
                    </table>
                </div>
                
            </div>
<<<<<<< HEAD
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
=======
            <div className="text-right text-[#939393] regular">Cantidad de vehiculos: {shipment.vehicles.length | 0}</div>

>>>>>>> 3ea7c0fccae3d4027d771983996a2ada537b7fba

*/
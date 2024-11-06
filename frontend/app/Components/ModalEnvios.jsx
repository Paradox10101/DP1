import { selectedShipmentAtom } from "@/atoms/shipmentAtoms";
import { Button } from "@nextui-org/react"
import { useAtomValue } from "jotai";
import { Calendar, Clock, Eye, Filter, Flag, Globe, MapPin, Package } from "lucide-react"

export default function ModalEnvios({shipmentVehicles, setSelectedVehicleIndex, sendMessage, shipment}){
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-row justify-between">
                <div className="flex flex-col gap-2">
                    <div className="flex flex-row gap-1">
                        <MapPin size={16}/>
                        <div className="regular">Ruta de envío</div>
                    </div>
                    <div className="regular_bold">
                        {"Almacen "+ shipment.originCity +" -> "+"Oficina "+ shipment.destinationCity}
                    </div>
                </div>
                <div className="flex flex-col gap-2 text-center">
                    <div className="flex flex-row gap-1">
                        <Clock size={16}/>
                        <div className="regular">Tiempo restante</div>
                    </div>
                    <div className="regular_bold">
                        {shipment.timeRemainingDays +"d "+ shipment.timeRemainingHours +"h"}
                    </div>
                </div>
            </div>
            <div className="bg-[#F7F7F7] p-4 rounded flex flex-row justify-around">
                <div className="flex flex-col justify-center text-center">
                    <Package size={32} className="stroke-[#ADADAD] self-center"/>
                    <div className="regular">{shipment.quantity}</div>
                    <div className="text-[#8E8D8D] pequenno">Paquetes</div>
                </div>
                <div className="flex flex-col justify-center text-center">
                    <Calendar size={32} className="stroke-[#ADADAD] self-center"/>
                    <div className="regular">{new Date(shipment.dueTime).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '')}</div>
                    <div className="text-[#8E8D8D] pequenno">Fecha Límite</div>
                </div>
                <div className="flex flex-col justify-center text-center">
                    <Globe size={32} className="stroke-[#ADADAD] self-center"/>
                    <div className="regular">{shipment.destinationRegion}</div>
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
                        </tbody>
                    </table>
                </div>
                
            </div>
            <div className="text-right text-[#939393] regular">Cantidad de vehiculos: {shipment.vehicles.length | 0}</div>


        </div>
    )
}

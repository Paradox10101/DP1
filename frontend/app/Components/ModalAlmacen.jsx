import { Button } from "@nextui-org/react"
import { AlertTriangle, ArrowRight, Building, Building2Icon, Calendar, Car, CarFront, Check, Circle, CircleAlert, CircleAlertIcon, Clock, Eye, Filter, Flag, Gauge, Globe, Globe2, GlobeIcon, MapPin, Package, Pin, Truck, Warehouse } from "lucide-react"
import BarraProgreso from "./BarraProgreso"
import IconoEstado from "./IconoEstado"
import { useMemo } from "react"

export default function ModalAlmacen({warehouse}){
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-row justify-between">
                <div className="flex flex-col gap-2">
                    <div className="flex flex-row gap-1">
                        <MapPin size={16}/>
                        <div className="regular">Detalle de ubicación</div>
                    </div>
                    <div className="flex flex-col gap-2 pl-2">
                        <div className="pequenno flex flex-row gap-2">
                            <Building2Icon size={16}/>
                            <p>{"Departamento: " + warehouse.department}</p>
                        </div>
                        <div className="pequenno flex flex-row gap-2">
                            <Pin size={16}/>
                            <p>{"Coordenadas(latitud, longitud): " + warehouse.latitude + ", " + warehouse.longitude}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="flex flex-row justify-between">
                <div className="text-black regular_bold">Envíos atendidos</div>
                <Button
                disableRipple={true}
                startContent={<Filter className="size-2"/>}
                className="focus:outline-none border stroke-black rounded h-8 pequenno w-[22%] bg-[#F4F4F4]"
                >
                Filtros
                </Button>
            </div>
            
            <div className="border stroke-black rounded w-full relative">
                <table className="bg-white border border-gray-200 rounded-lg shadow w-full">
                    <thead className="w-full">
                        <tr className="bg-gray-50 text-gray-500 uppercase text-sm leading-normal w-full">
                            <th className="py-3 px-6 text-center w-1/5">Código de Envío</th>
                            <th className="py-3 px-6 text-center w-1/5">VEHÍCULO</th>
                            <th className="py-3 px-6 text-center w-1/5">CANTIDAD DE PAQUETES</th>
                            <th className="py-3 px-6 text-center w-1/5">ESTADO</th>
                            <th className="py-3 px-6 text-center w-1/5">ACCIÓN</th>
                        </tr>
                    </thead>
                    </table>
                    <div className="border stroke-black rounded w-full overflow-y-auto h-[375px]">
                    <table className="bg-white border border-gray-200 rounded-lg shadow w-full">
                    <tbody className="text-gray-700 text-sm font-light w-full">
                        <tr className="border border-gray-200 w-full" key={1}>
                            <td className="py-3 px-6 text-center w-1/5 whitespace-nowrap">{""}</td>
                            <td className="py-3 px-6 text-center w-1/5 whitespace-nowrap">{""}</td>
                            <td className="py-3 px-6 text-center w-1/5 whitespace-nowrap">{""}</td>
                            <td className="py-3 px-6 text-center w-1/5">
                                {(true)&&(
                                    //vehicle.status === "ATTENDED"?
                                    true?
                                    <span className="py-1 px-2 rounded-full text-xs bg-capacidadDisponible text-white">
                                        ATENDIDO
                                    </span>
                                    :
                                    //vehicle.status === "NO_ATTENDED"?
                                    true?
                                    <span className="py-1 px-2 rounded-full text-xs bg-capacidadSaturada text-white">
                                        PENDIENTE
                                    </span>
                                    :
                                    <></>
                                )}
                            </td>
                            <td className="py-3 px-6 text-center w-1/5 flex justify-center">
                                <button
                                    className="bg-principal items-center p-2 rounded text-center flex flex-center justify-center"
                                    onClick={() => {
                                        //setSelectedVehicleIndex(index);
                                        //sendMessage({ orderId: shipment.id, vehicleCode: vehicle.vehicleCode });
                                    }}
                                >
                                    <Eye className="w-4 h-4 mr-1 text-white" />
                                    <span className="cursor-pointer text-white">Ver ruta</span>
                                </button>
                            </td>
                        </tr>
                        <tr className="border border-gray-200 w-full " key={2}>
                            <td className="py-3 px-6 text-center w-1/4 whitespace-nowrap">{""}</td>
                            <td className="py-3 px-6 text-center w-1/4 whitespace-nowrap">{""}</td>
                            <td className="py-3 px-6 text-center w-1/4">
                                {(true)&&(
                                    //vehicle.status === "ATTENDED"?
                                    true?
                                    <span className="py-1 px-2 rounded-full text-xs bg-capacidadDisponible text-white">
                                        ATENDIDO
                                    </span>
                                    :
                                    //vehicle.status === "NO_ATTENDED"?
                                    true?
                                    <span className="py-1 px-2 rounded-full text-xs bg-capacidadSaturada text-white">
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
                                        //setSelectedVehicleIndex(index);
                                        //sendMessage({ orderId: shipment.id, vehicleCode: vehicle.vehicleCode });
                                    }}
                                >
                                    <Eye className="w-4 h-4 mr-1 text-white" />
                                    <span className="cursor-pointer text-white">Ver ruta</span>
                                </button>
                            </td>
                        </tr>
                        <tr className="border border-gray-200 w-full " key={3}>
                            <td className="py-3 px-6 text-center w-1/4 whitespace-nowrap">{""}</td>
                            <td className="py-3 px-6 text-center w-1/4 whitespace-nowrap">{""}</td>
                            <td className="py-3 px-6 text-center w-1/4">
                                {(true)&&(
                                    //vehicle.status === "ATTENDED"?
                                    true?
                                    <span className="py-1 px-2 rounded-full text-xs bg-capacidadDisponible text-white">
                                        ATENDIDO
                                    </span>
                                    :
                                    //vehicle.status === "NO_ATTENDED"?
                                    true?
                                    <span className="py-1 px-2 rounded-full text-xs bg-capacidadSaturada text-white">
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
                                        //setSelectedVehicleIndex(index);
                                        //sendMessage({ orderId: shipment.id, vehicleCode: vehicle.vehicleCode });
                                    }}
                                >
                                    <Eye className="w-4 h-4 mr-1 text-white" />
                                    <span className="cursor-pointer text-white">Ver ruta</span>
                                </button>
                            </td>
                        </tr>
                        <tr className="border border-gray-200 w-full " key={4}>
                            <td className="py-3 px-6 text-center w-1/4 whitespace-nowrap">{""}</td>
                            <td className="py-3 px-6 text-center w-1/4 whitespace-nowrap">{""}</td>
                            <td className="py-3 px-6 text-center w-1/4">
                                {(true)&&(
                                    //vehicle.status === "ATTENDED"?
                                    true?
                                    <span className="py-1 px-2 rounded-full text-xs bg-capacidadDisponible text-white">
                                        ATENDIDO
                                    </span>
                                    :
                                    //vehicle.status === "NO_ATTENDED"?
                                    true?
                                    <span className="py-1 px-2 rounded-full text-xs bg-capacidadSaturada text-white">
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
                                        //setSelectedVehicleIndex(index);
                                        //sendMessage({ orderId: shipment.id, vehicleCode: vehicle.vehicleCode });
                                    }}
                                >
                                    <Eye className="w-4 h-4 mr-1 text-white" />
                                    <span className="cursor-pointer text-white">Ver ruta</span>
                                </button>
                            </td>
                        </tr>
                        <tr className="border border-gray-200 w-full " key={5}>
                            <td className="py-3 px-6 text-center w-1/4 whitespace-nowrap">{""}</td>
                            <td className="py-3 px-6 text-center w-1/4 whitespace-nowrap">{""}</td>
                            <td className="py-3 px-6 text-center w-1/4">
                                {(true)&&(
                                    //vehicle.status === "ATTENDED"?
                                    true?
                                    <span className="py-1 px-2 rounded-full text-xs bg-capacidadDisponible text-white">
                                        ATENDIDO
                                    </span>
                                    :
                                    //vehicle.status === "NO_ATTENDED"?
                                    true?
                                    <span className="py-1 px-2 rounded-full text-xs bg-capacidadSaturada text-white">
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
                                        //setSelectedVehicleIndex(index);
                                        //sendMessage({ orderId: shipment.id, vehicleCode: vehicle.vehicleCode });
                                    }}
                                >
                                    <Eye className="w-4 h-4 mr-1 text-white" />
                                    <span className="cursor-pointer text-white">Ver ruta</span>
                                </button>
                            </td>
                        </tr>
                        <tr className="border border-gray-200 w-full " key={6}>
                            <td className="py-3 px-6 text-center w-1/4 whitespace-nowrap">{""}</td>
                            <td className="py-3 px-6 text-center w-1/4 whitespace-nowrap">{""}</td>
                            <td className="py-3 px-6 text-center w-1/4">
                                {(true)&&(
                                    //vehicle.status === "ATTENDED"?
                                    true?
                                    <span className="py-1 px-2 rounded-full text-xs bg-capacidadDisponible text-white">
                                        ATENDIDO
                                    </span>
                                    :
                                    //vehicle.status === "NO_ATTENDED"?
                                    true?
                                    <span className="py-1 px-2 rounded-full text-xs bg-capacidadSaturada text-white">
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
                                        //setSelectedVehicleIndex(index);
                                        //sendMessage({ orderId: shipment.id, vehicleCode: vehicle.vehicleCode });
                                    }}
                                >
                                    <Eye className="w-4 h-4 mr-1 text-white" />
                                    <span className="cursor-pointer text-white">Ver ruta</span>
                                </button>
                            </td>
                        </tr>
                        <tr className="border border-gray-200 w-full " key={7}>
                            <td className="py-3 px-6 text-center w-1/4 whitespace-nowrap">{""}</td>
                            <td className="py-3 px-6 text-center w-1/4 whitespace-nowrap">{""}</td>
                            <td className="py-3 px-6 text-center w-1/4">
                                {(true)&&(
                                    //vehicle.status === "ATTENDED"?
                                    true?
                                    <span className="py-1 px-2 rounded-full text-xs bg-capacidadDisponible text-white">
                                        ATENDIDO
                                    </span>
                                    :
                                    //vehicle.status === "NO_ATTENDED"?
                                    true?
                                    <span className="py-1 px-2 rounded-full text-xs bg-capacidadSaturada text-white">
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
                                        //setSelectedVehicleIndex(index);
                                        //sendMessage({ orderId: shipment.id, vehicleCode: vehicle.vehicleCode });
                                    }}
                                >
                                    <Eye className="w-4 h-4 mr-1 text-white" />
                                    <span className="cursor-pointer text-white">Ver ruta</span>
                                </button>
                            </td>
                        </tr>
                            
                    </tbody>
                </table>
                </div>
            </div>
                
            
            <div className="text-right text-[#939393] regular">Cantidad de envíos: {50}</div>
        </div>
    )
}

import { Button } from "@nextui-org/react"
import { AlertTriangle, ArrowRight, Building, Building2, Building2Icon, Calendar, Car, CarFront, Check, Circle, CircleAlert, CircleAlertIcon, Clock, Eye, Filter, Flag, Gauge, Globe, Globe2, GlobeIcon, MapPin, Package, Pin, Truck, Warehouse } from "lucide-react"
import BarraProgreso from "./BarraProgreso"
import IconoEstado from "./IconoEstado"
import { useMemo } from "react"

export default function ModalOficina({office}){
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
                            <p>{"Departamento: " + office.department}</p>
                        </div>
                        <div className="pequenno flex flex-row gap-2">
                            <Pin size={16}/>
                            <p>{"Coordenadas(latitud, longitud): " + office.latitude + ", " + office.longitude}</p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-2 text-left">
                    <div className="flex flex-row gap-1">
                        <Package size={16}/>
                        <div className="regular">Capacidad Total</div>
                    </div>
                    <div className="regular_bold">
                        {office.capacity + " paquetes"}
                    </div>
                </div>
            </div>
            <div className="bg-[#F7F7F7] p-4 rounded flex flex-row justify-around">
                <div className="flex flex-col justify-center text-center">
                    <Package size={32} className="stroke-[#ADADAD] self-center"/>
                    <div className="regular">{"40"}</div>
                    <div className="text-[#8E8D8D] pequenno">Envíos Realizados</div>
                </div>
                <div className="flex flex-col justify-center text-center">
                    <CircleAlertIcon size={32} className="stroke-[#ADADAD] self-center"/>
                    <div className="regular">{Math.ceil(office.capacity*office.occupiedPercentage/100) + " / " + office.capacity}</div>
                    <div className="text-[#8E8D8D] pequenno">Paquetes recibidos / Capacidad</div>
                </div>
                <div className="flex flex-col justify-center text-center">
                    <GlobeIcon size={32} className="stroke-[#ADADAD] self-center"/>
                    <div className="regular">{office.region}</div>
                    <div className="text-[#8E8D8D] pequenno">Región</div>
                </div>
            </div>
            
            <div className="flex flex-row justify-between">
                <div className="text-black regular_bold">Envíos recibidos</div>
                <Button
                disableRipple={true}
                startContent={<Filter className="size-2"/>}
                className="focus:outline-none border stroke-black rounded h-8 pequenno w-[22%] bg-[#F4F4F4]"
                >
                Filtros
                </Button>
            </div>
            
                
            <div className="border stroke-black rounded w-full">
                <table className="bg-white border border-gray-200 rounded-lg shadow w-full">
                    <thead className="w-full">
                        <tr className="bg-gray-50 text-gray-500 uppercase text-sm leading-normal w-full">
                            <th className="py-3 px-6 text-left w-1/4">CAMIÓN ACTUAL</th>
                            <th className="py-3 px-6 text-leftr w-1/4">CANTIDAD DE PAQUETES</th>
                            <th className="py-3 px-6 text-left w-1/4">ESTADO</th>
                            <th className="py-3 px-6 text-left w-1/4">ACCIÓN</th>
                        </tr>
                    </thead>
                    </table>
                    <div className="border stroke-black rounded w-full overflow-y-auto h-[255px] scroll-area">
                    <table className="bg-white border border-gray-200 rounded-lg shadow w-full">
                    <tbody className="text-gray-700 text-sm font-light w-full overflow-y-auto min-h-[275px]">
                        <tr className="border border-gray-200 w-full" key={1}>
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
                        <tr className="border border-gray-200 w-full " key={1}>
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
                        <tr className="border border-gray-200 w-full " key={1}>
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
                        <tr className="border border-gray-200 w-full " key={1}>
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
                        <tr className="border border-gray-200 w-full " key={1}>
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
                        <tr className="border border-gray-200 w-full " key={1}>
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
                        <tr className="border border-gray-200 w-full " key={1}>
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

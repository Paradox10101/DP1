import { Button } from "@nextui-org/react"
import { Clock, Eye, Filter, Flag, Globe, MapPin, Package } from "lucide-react"

export default function ModalEnvios({shipment, setSelectedVehicle}){
    
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-row justify-between">
                <div className="flex flex-col gap-2">
                    <div className="flex flex-row gap-1">
                        <MapPin size={16}/>
                        <div className="regular">Ruta</div>
                    </div>
                    <div className="regular_bold">
                        {"Almacen "+"Trujillo" +" -> "+"Oficina "+"Piura"}
                    </div>
                </div>
                <div className="flex flex-col gap-2 text-center">
                    <div className="flex flex-row gap-1">
                        <Clock size={16}/>
                        <div className="regular">Tiempo restante</div>
                    </div>
                    <div className="regular_bold">
                        {"1"+"d "+"22"+"h:"+"33"+"m"}
                    </div>
                </div>
            </div>
            <div className="bg-[#F7F7F7] p-4 rounded flex flex-row justify-around">
                <div className="flex flex-col justify-center text-center">
                    <Package size={32} className="stroke-[#ADADAD] self-center"/>
                    <div className="regular">50</div>
                    <div className="text-[#8E8D8D] pequenno">Paquetes</div>
                </div>
                <div className="flex flex-col justify-center text-center">
                    <Flag size={32} className="stroke-[#ADADAD] self-center"/>
                    <div className="regular">Media</div>
                    <div className="text-[#8E8D8D] pequenno">Prioridad</div>
                </div>
                <div className="flex flex-col justify-center text-center">
                    <Globe size={32} className="stroke-[#ADADAD] self-center"/>
                    <div className="regular">Costa</div>
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
                            <th className="py-3 px-6 text-left">ID PAQUETE</th>
                            <th className="py-3 px-6 text-left">ESTADO</th>
                            <th className="py-3 px-6 text-left">CAMIÓN ACTUAL</th>
                            <th className="py-3 px-6 text-left">ACCIÓN</th>
                        </tr>
                        </thead>
                        <tbody className="text-gray-700 text-sm font-light">
                        <tr className="border-b border-gray-200 hover:bg-gray-100">
                            <td className="py-3 px-6 text-left whitespace-nowrap">PKG001</td>
                            <td className="py-3 px-6 text-left">
                            <span className="px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-600">
                                En tránsito
                            </span>
                            </td>
                            <td className="py-3 px-6 text-left">TRUCK-LC1</td>
                            <td className="py-3 px-6 text-left flex items-center">
                            <button className="bg-principal flex flex-row items-center p-2 rounded"
                            onClick={()=>{setSelectedVehicle("1")}}>
                                <Eye className="w-4 h-4 mr-1 text-white" />
                                <span className=" cursor-pointer text-white">Ver ruta</span>
                            </button>
                            </td>
                        </tr>
                        <tr className="border-b border-gray-200 hover:bg-gray-100">
                            <td className="py-3 px-6 text-left whitespace-nowrap">PKG001</td>
                            <td className="py-3 px-6 text-left">
                            <span className="px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-600">
                                En tránsito
                            </span>
                            </td>
                            <td className="py-3 px-6 text-left">TRUCK-LC1</td>
                            <td className="py-3 px-6 text-left flex items-center">
                            <button className="bg-principal flex flex-row items-center p-2 rounded"
                            onClick={()=>{setSelectedVehicle("1")}}>
                                <Eye className="w-4 h-4 mr-1 text-white" />
                                <span className=" cursor-pointer text-white">Ver ruta</span>
                            </button>
                            </td>
                        </tr>
                        <tr className="border-b border-gray-200 hover:bg-gray-100">
                            <td className="py-3 px-6 text-left whitespace-nowrap">PKG001</td>
                            <td className="py-3 px-6 text-left">
                            <span className="px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-600">
                                En tránsito
                            </span>
                            </td>
                            <td className="py-3 px-6 text-left">TRUCK-LC1</td>
                            <td className="py-3 px-6 text-left flex items-center">
                            <button className="bg-principal flex flex-row items-center p-2 rounded"
                            onClick={()=>{setSelectedVehicle("1")}}>
                                <Eye className="w-4 h-4 mr-1 text-white" />
                                <span className=" cursor-pointer text-white">Ver ruta</span>
                            </button>
                            </td>
                        </tr>
                        <tr className="border-b border-gray-200 hover:bg-gray-100">
                            <td className="py-3 px-6 text-left whitespace-nowrap">PKG001</td>
                            <td className="py-3 px-6 text-left">
                            <span className="px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-600">
                                En tránsito
                            </span>
                            </td>
                            <td className="py-3 px-6 text-left">TRUCK-LC1</td>
                            <td className="py-3 px-6 text-left flex items-center">
                            <button className="bg-principal flex flex-row items-center p-2 rounded"
                            onClick={()=>{setSelectedVehicle("1")}}>
                                <Eye className="w-4 h-4 mr-1 text-white" />
                                <span className=" cursor-pointer text-white">Ver ruta</span>
                            </button>
                            </td>
                        </tr>
                        <tr className="border-b border-gray-200 hover:bg-gray-100">
                            <td className="py-3 px-6 text-left whitespace-nowrap">PKG001</td>
                            <td className="py-3 px-6 text-left">
                            <span className="px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-600">
                                En tránsito
                            </span>
                            </td>
                            <td className="py-3 px-6 text-left">TRUCK-LC1</td>
                            <td className="py-3 px-6 text-left flex items-center">
                            <button className="bg-principal flex flex-row items-center p-2 rounded"
                            onClick={()=>{setSelectedVehicle("1")}}>
                                <Eye className="w-4 h-4 mr-1 text-white" />
                                <span className=" cursor-pointer text-white">Ver ruta</span>
                            </button>
                            </td>
                        </tr>
                        <tr className="border-b border-gray-200 hover:bg-gray-100">
                            <td className="py-3 px-6 text-left whitespace-nowrap">PKG001</td>
                            <td className="py-3 px-6 text-left">
                            <span className="px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-600">
                                En tránsito
                            </span>
                            </td>
                            <td className="py-3 px-6 text-left">TRUCK-LC1</td>
                            <td className="py-3 px-6 text-left flex items-center">
                            <button className="bg-principal flex flex-row items-center p-2 rounded"
                            onClick={()=>{setSelectedVehicle("1")}}>
                                <Eye className="w-4 h-4 mr-1 text-white" />
                                <span className=" cursor-pointer text-white">Ver ruta</span>
                            </button>
                            </td>
                        </tr>
                        <tr className="border-b border-gray-200 hover:bg-gray-100">
                            <td className="py-3 px-6 text-left whitespace-nowrap">PKG001</td>
                            <td className="py-3 px-6 text-left">
                            <span className="px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-600">
                                En tránsito
                            </span>
                            </td>
                            <td className="py-3 px-6 text-left">TRUCK-LC1</td>
                            <td className="py-3 px-6 text-left flex items-center">
                            <button className="bg-principal flex flex-row items-center p-2 rounded"
                            onClick={()=>{setSelectedVehicle("1")}}>
                                <Eye className="w-4 h-4 mr-1 text-white" />
                                <span className=" cursor-pointer text-white">Ver ruta</span>
                            </button>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="text-right text-[#939393] regular">Cantidad de paquetes: 50</div>
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

        </div>
    )
}

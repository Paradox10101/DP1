import { Button } from "@nextui-org/react"
import { Clock, Eye, Filter, Flag, Globe, MapPin, Package, Truck } from "lucide-react"

export default function ModalRutaVehiculoEnvio({shipment, setModalContentType}){
    
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-row w-full">
                <div>
                    <Truck />
                    <div>{"TRUCK-LC1"} | </div>
                </div>
                <div>
                    <div>Capacidad: {"TRUCK-LC1" + " paquetes"}</div>
                </div>
            </div>
            <div className="bg-[#F7F7F7] p-4 rounded flex flex-row justify-between">
                <div className="flex flex-col justify-center">
                    <Package size={32} className="stroke-[#ADADAD] self-center"/>
                    <div className="regular">50</div>
                    <div className="text-[#8E8D8D] pequenno">Paquetes</div>
                </div>
                <div className="flex flex-col justify-center">
                    <Flag size={32} className="stroke-[#ADADAD] self-center"/>
                    <div className="regular">Media</div>
                    <div className="text-[#8E8D8D] pequenno">Prioridad</div>
                </div>
                <div className="flex flex-col justify-center">
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
                
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow">
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
                            <Eye className="w-4 h-4 mr-1 text-gray-500" />
                            <span className="text-gray-500 cursor-pointer">Ver ruta</span>
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

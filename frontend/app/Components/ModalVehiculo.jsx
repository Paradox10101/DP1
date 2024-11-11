import { Button } from "@nextui-org/react"
import { AlertTriangle, ArrowRight, Building, Calendar, Car, CarFront, Check, Circle, CircleAlert, CircleAlertIcon, Clock, Eye, Filter, Flag, Gauge, Globe, MapPin, Package, Truck, Warehouse } from "lucide-react"
import BarraProgreso from "./BarraProgreso"
import IconoEstado from "./IconoEstado"
import { useMemo } from "react"

export default function ModalVehiculo({vehicle}){
    

    return (
        <div className="flex flex-col gap-6 justify-between overflow-y-auto max-h-[650px] scroll-area">
            <div className="bg-[#F7F7F7] p-4 rounded flex flex-row justify-around">
                <div className="flex flex-col justify-center text-center">
                    <Package size={32} className="stroke-[#ADADAD] self-center"/>
                    <div className="regular">{vehicle.tipo}</div>
                    <div className="text-[#8E8D8D] pequenno">Tipo de vehículo</div>
                </div>
                <div className="flex flex-col justify-center text-center">
                    <CircleAlertIcon size={32} className="stroke-[#ADADAD] self-center"/>
                    <div className="regular">{vehicle.capacidadUsada+ " / " + vehicle.capacidadMaxima}</div>
                    <div className="text-[#8E8D8D] pequenno">Paquetes recibidos / Capacidad</div>
                </div>
                <div className="flex flex-col justify-center text-center">
                    <Gauge size={32} className="stroke-[#ADADAD] self-center"/>
                    <div className="regular">{vehicle.velocidad + " Km/h"}</div>
                    <div className="text-[#8E8D8D] pequenno">Velocidad actual</div>
                </div>
            </div>
            <div className="flex flex-col gap-4 w-full">
                <div className="flex flex-row justify-between w-full">
                    <div className="text-black regular_bold">Ruta del Camión</div>
                    <Button
                    disableRipple={true}
                    className="focus:outline-none border stroke-black px-2 py-1 pequenno text-black bg-[#FFA500] rounded-2xl items-center"
                    >
                    Reportar Avería
                    </Button>
                </div>
                
                <div className="flex flex-row border overflow-x-auto stroke-black rounded gap-4 px-2 py-4 max-w-full mx-auto">
                    <div className="inline-flex flex-col gap-2 items-center">
                        <div className="text-center mx-auto">
                            <IconoEstado Icono={Warehouse} classNameContenedor={"bg-black w-[36px] h-[36px] relative rounded-full flex items-center justify-center"} classNameContenido={"w-[20px] h-[20px] stroke-blanco z-10"}/>
                        </div>
                        <div className="flex flex-col">
                            <div className="text-center regular_bold">{"Almacen " + "LIMA"}</div>
                            <div className="text-center text-black pequenno">Inicio</div>
                        </div>
                    </div>
                    <div className="flex flex-col justify-center">
                        <ArrowRight />
                    </div>
                    <div className="inline-flex flex-col gap-2 text-center">
                        <div className="text-center mx-auto">
                            <IconoEstado Icono={Check} classNameContenedor={"bg-blue-500 w-[36px] h-[36px] relative rounded-full flex items-center justify-center"} classNameContenido={"w-[20px] h-[20px] stroke-blanco z-10"}/>
                        </div>
                        <div className="flex flex-col">
                            <div className="text-center regular_bold">{"Oficina " + "AYACUCHO"}</div>
                            <div className="text-center text-black pequenno">Recorrido</div>
                        </div>
                    </div>

                    <div className="flex flex-col justify-center">
                        <ArrowRight />
                    </div>
                    <div className="inline-flex flex-col gap-2 text-center">
                        <div className="text-center mx-auto">
                            <Circle size={36} className="stroke-principal" strokeWidth={4}/>
                        </div>
                        <div className="flex flex-col">
                            <div className="text-center regular_bold">{"Oficina " + "AYACUCHO"}</div>
                            <div className="text-center text-black pequenno">En curso</div>
                        </div>
                    </div>

                    <div className="flex flex-col justify-center">
                        <ArrowRight />
                    </div>
                    <div className="inline-flex flex-col gap-2 text-center">
                        <div className="text-center mx-auto">
                        <Circle size={36}/>
                        </div>
                        <div className="flex flex-col">
                            <div className="text-center regular_bold">{"Oficina " + "AYACUCHO"}</div>
                            <div className="text-center text-black pequenno">Por recorrer</div>
                        </div>
                    </div>

                    <div className="flex flex-col justify-center">
                        <ArrowRight />
                    </div>
                    <div className="inline-flex flex-col gap-2 text-center">
                        <div className="text-center mx-auto">
                        <Circle size={36}/>
                        </div>
                        <div className="flex flex-col">
                            <div className="text-center regular_bold">{"Oficina " + "AYACUCHO"}</div>
                            <div className="text-center text-black pequenno">Por recorrer</div>
                        </div>
                    </div>

                    <div className="flex flex-col justify-center">
                        <ArrowRight />
                    </div>
                    <div className="inline-flex flex-col gap-2 text-center">
                        <div className="text-center mx-auto">
                        <Circle size={36}/>
                        </div>
                        <div className="flex flex-col">
                            <div className="text-center regular_bold">{"Oficina " + "AYACUCHO"}</div>
                            <div className="text-center text-black pequenno">Por recorrer</div>
                        </div>
                    </div>

                    <div className="flex flex-col justify-center">
                        <ArrowRight />
                    </div>
                    
                    <div className="inline-flex flex-col gap-2 text-center">
                        <div className="text-center mx-auto">
                        <Circle size={36}/>
                        </div>
                        <div className="flex flex-col">
                            <div className="text-center regular_bold">{"Oficina " + "AYACUCHO"}</div>
                            <div className="text-center text-black pequenno">Por recorrer</div>
                        </div>
                    </div>

                </div>
                
            </div>
            
            <div className="flex flex-col gap-4">
                <div className="flex flex-row justify-between">
                    <div className="text-black regular_bold">Lista de Envíos</div>
                    <Button
                    disableRipple={true}
                    startContent={<Filter className="size-2"/>}
                    className="focus:outline-none border stroke-black rounded h-8 pequenno w-[22%] bg-[#F4F4F4]"
                    >
                    Filtros
                    </Button>
                </div>
                
                <div className="overflow-y-auto max-h-[320px] border stroke-black rounded w-full scroll-area">
                    <table className="bg-white border border-gray-200 rounded-lg shadow w-full">
                        <thead className="w-full">
                            <tr className="bg-gray-50 text-gray-500 uppercase text-sm leading-normal w-full">
                                <th className="py-3 px-2 text-center w-1/8">CÓDIGO DE ENVÍO</th>
                                <th className="py-3 px-2 text-center w-1/8">CANTIDAD DE PAQUETES</th>
                                <th className="py-3 px-2 text-center w-1/8">ESTADO</th>
                                <th className="py-3 px-2 text-center w-1/8">FECHA LÍMITE</th>
                                <th className="py-3 px-2 text-center w-1/8">ORIGEN</th>
                                <th className="py-3 px-2 text-center w-1/8">DESTINO</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700 text-sm font-light overflow-y-auto min-h-[325px] w-full">
                            <tr className="border border-gray-200 w-full " key={1}>
                                <td className="py-3 px-2 text-center w-1/8 whitespace-nowrap">{"A-505"}</td>
                                <td className="py-3 px-2 text-center w-1/8 whitespace-nowrap">{"45"}</td>
                                <td className="py-3 px-2 text-center w-1/8">            
                                    <span className="px-2 py-1 rounded-full text-xs bg-capacidadDisponible text-white">
                                        ATENDIDO
                                    </span>
                                </td>
                                <td className="py-3 px-2 text-center w-1/8">{"22/05/2024"}</td>
                                <td className="py-3 px-2 text-center w-1/8 break-all hyphens-auto overflow-hidden">{"ALMACEN LIMA AAAAAAAAAAAAAA"}</td>
                                <td className="py-3 px-2 text-center w-1/8 break-all hyphens-auto overflow-hidden">{"NOMBREEJEMPaaaaaaaaaaaaaLOEXTRALARGO"}</td>
                                
                            </tr>

                            <tr className="border border-gray-200 w-full " key={2}>
                                <td className="py-3 px-6 text-center w-1/5 whitespace-nowrap">{"A-505"}</td>
                                <td className="py-3 px-6 text-center w-1/5 whitespace-nowrap">{"45"}</td>
                                <td className="py-3 px-6 text-center w-1/5">            
                                    <span className="px-3 py-1 rounded-full text-xs bg-capacidadDisponible text-white">
                                        ATENDIDO
                                    </span>
                                </td>
                                <td className="py-3 px-6 text-center w-1/5">{"22/05/2024"}</td>
                                <td className="py-3 px-6 text-center w-[150px] flex justify-center ">
                                    <button
                                        className="bg-principal items-center p-2 rounded text-center flex flex-center justify-center w-[100px]"
                                        onClick={() => {
                                            alert("notsu")
                                        }}
                                    >
                                        <Eye className="w-4 h-4 mr-1 text-white" />
                                        <span className="cursor-pointer text-white">Ver ruta</span>
                                    </button>
                                </td>
                            </tr>

                            <tr className="border border-gray-200 w-full " key={3}>
                                <td className="py-3 px-6 text-center w-1/5 whitespace-nowrap">{"A-505"}</td>
                                <td className="py-3 px-6 text-center w-1/5 whitespace-nowrap">{"45"}</td>
                                <td className="py-3 px-6 text-center w-1/5">            
                                    <span className="px-3 py-1 rounded-full text-xs bg-capacidadDisponible text-white">
                                        ATENDIDO
                                    </span>
                                </td>
                                <td className="py-3 px-6 text-center w-1/5">{"22/05/2024"}</td>
                                <td className="py-3 px-6 text-center w-[150px] flex justify-center ">
                                    <button
                                        className="bg-principal items-center p-2 rounded text-center flex flex-center justify-center w-[100px]"
                                        onClick={() => {
                                            alert("notsu")
                                        }}
                                    >
                                        <Eye className="w-4 h-4 mr-1 text-white" />
                                        <span className="cursor-pointer text-white">Ver ruta</span>
                                    </button>
                                </td>
                            </tr>

                            <tr className="border border-gray-200 w-full " key={4}>
                                <td className="py-3 px-6 text-center w-1/5 whitespace-nowrap">{"A-505"}</td>
                                <td className="py-3 px-6 text-center w-1/5 whitespace-nowrap">{"45"}</td>
                                <td className="py-3 px-6 text-center w-1/5">            
                                    <span className="px-3 py-1 rounded-full text-xs bg-capacidadDisponible text-white">
                                        ATENDIDO
                                    </span>
                                </td>
                                <td className="py-3 px-6 text-center w-1/5">{"22/05/2024"}</td>
                                <td className="py-3 px-6 text-center w-[150px] flex justify-center ">
                                    <button
                                        className="bg-principal items-center p-2 rounded text-center flex flex-center justify-center w-[100px]"
                                        onClick={() => {
                                            alert("notsu")
                                        }}
                                    >
                                        <Eye className="w-4 h-4 mr-1 text-white" />
                                        <span className="cursor-pointer text-white">Ver ruta</span>
                                    </button>
                                </td>
                            </tr>

                            <tr className="border border-gray-200 w-full " key={5}>
                                <td className="py-3 px-6 text-center w-1/5 whitespace-nowrap">{"A-505"}</td>
                                <td className="py-3 px-6 text-center w-1/5 whitespace-nowrap">{"45"}</td>
                                <td className="py-3 px-6 text-center w-1/5">            
                                    <span className="px-3 py-1 rounded-full text-xs bg-capacidadDisponible text-white">
                                        ATENDIDO
                                    </span>
                                </td>
                                <td className="py-3 px-6 text-center w-1/5">{"22/05/2024"}</td>
                                <td className="py-3 px-6 text-center w-[150px] flex justify-center ">
                                    <button
                                        className="bg-principal items-center p-2 rounded text-center flex flex-center justify-center w-[100px]"
                                        onClick={() => {
                                            alert("notsu")
                                        }}
                                    >
                                        <Eye className="w-4 h-4 mr-1 text-white" />
                                        <span className="cursor-pointer text-white">Ver ruta</span>
                                    </button>
                                </td>
                            </tr>
                                
                        </tbody>
                    </table>
                    <div></div>
                    
                </div>
                
            </div>
            <div className="text-right text-[#939393] regular">Cantidad de envíos atendidos: {19}</div>
        </div>
    )
}

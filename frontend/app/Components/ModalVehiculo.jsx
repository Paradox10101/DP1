import { Button, DatePicker, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input } from "@nextui-org/react"
import { AlertTriangle, ArrowRight, Building, Calendar, Car, CarFront, Check, ChevronDown, Circle, CircleAlert, CircleAlertIcon, Clock, Eye, Filter, Flag, Gauge, Globe, MapPin, Package, Truck, Warehouse, X } from "lucide-react"
import BarraProgreso from "./BarraProgreso"
import IconoEstado from "./IconoEstado"
import { useEffect, useMemo, useRef, useState } from "react"
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList as List } from 'react-window';

export default function ModalVehiculo({vehicle}){
    const [isFilterModalVisible, setFilterModalVisible] = useState(false);
    const modalRef = useRef(null); // Referencia para el modal de filtros
    const [selectedKeys, setSelectedKeys] = useState(new Set());
    const selectedValue = selectedKeys.size > 0 
          ? Array.from(selectedKeys).join(", ") 
          : "Seleccione un estado";
    // Cierra el modal si se hace clic fuera de él
    useEffect(() => {
        function handleClickOutside(event) {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                setFilterModalVisible(false);
            }
        }

        // Añade el listener al montar
        document.addEventListener("mousedown", handleClickOutside);
        
        // Limpia el listener al desmontar
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const Row = ({ index, style }) => {
        const shipment = vehicle.shipmentsVehicle[index];
        return (
            <div key={shipment.code} style={style} className="grid grid-cols-10 w-full items-center p-1 border-b-3">
                <div className="text-center col-span-1 pequenno">{shipment.code}</div>
                <div className="text-center col-span-1 pequenno">{shipment.quantity}</div>
                {
                    shipment.status==="REGISTERED"?
                    <div className={"p-1 col-span-2 items-center pequenno border text-center justify-center bg-[#B0F8F4] text-[#4B9490] rounded-xl"}>REGISTRADO</div>
                    :
                    shipment.status==="DELIVERED"||shipment.status==="PENDING_PICKUP"?
                    <div className={"p-1 col-span-2 items-center pequenno border text-center justify-center bg-[#D0B0F8] text-[#7B15FA] rounded-xl"}>ENTREGADO</div>
                    :
                    <div className={"p-1 col-span-2 items-center pequenno border text-center justify-center bg-[#284BCC] text-[#BECCFF] rounded-xl" }>EN TRÁNSITO</div>
                }
                <div className="text-center col-span-2 pequenno">{new Date(shipment.dueTime).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', '')}</div>
                <div className="text-center col-span-2 pequenno">{shipment.originCity}</div>
                <div className="text-center col-span-2 break-all pequenno">{shipment.destinationCity}</div>
            </div>
            
        );
    };

    return (
        <div className="flex flex-col gap-6 justify-between overflow-y-auto max-h-[840px] scroll-area">
            <div className="bg-[#F7F7F7] p-4 rounded flex flex-row justify-around">
                <div className="flex flex-col justify-center text-center">
                    {vehicle.tipo==="A"?
                    <Truck size={32} className="stroke-[#ADADAD] self-center"/>
                    :
                    vehicle.tipo==="B"?
                    <CarFront size={32} className="stroke-[#ADADAD] self-center"/>
                    :
                    <Car size={32} className="stroke-[#ADADAD] self-center"/>
                    }
                    
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
                    <div className="regular">{parseFloat(vehicle.velocidad).toFixed(0) + " Km/h"}</div>
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
                
                <div className="flex flex-row border overflow-x-auto stroke-black rounded gap-4 px-2 py-4 w-full ">
                    {vehicle&&vehicle.currentRoute&&vehicle.currentRoute.length>1?
                    vehicle.currentRoute.map((location, index) => (
                        <>
                            {index!==0&&
                                <div className="flex flex-col justify-center mx-3 px-2">
                                    <ArrowRight />
                                </div>
                                
                            }
                            {index!==0?
                            <div className="inline-flex flex-col gap-2 items-center mx-3 px-2 min-w-[100px]">
                                <div className="text-center mx-auto">
                                    
                                    {location.status==="Recorrido"?
                                    <IconoEstado Icono={Check} classNameContenedor={"bg-blue-500 w-[36px] h-[36px] relative rounded-full flex items-center justify-center"} classNameContenido={"w-[20px] h-[20px] stroke-blanco z-10"}/>
                                    :
                                    location.status==="Por Recorrer"?
                                    <Circle size={36}/>
                                    :
                                    location.status==="Actual"?
                                    <Circle size={36} className="stroke-principal" strokeWidth={4}/>
                                    :
                                    <></>
                                    }
                                </div>
                                <div className="w-full flex flex-col justify-between">
                                    <div className="text-center pequenno_bold">{(location.type==="office"?"Oficina ":"Almacén ") + location.city}</div>
                                    <div className="text-center text-black pequenno">{location.status}</div>
                                </div>
                            </div>
                            :
                            <div className="inline-flex flex-col gap-2 items-center mx-3 px-2 min-w-[100px] max-w-[300px]">
                                {location.type==="office"?
                                <>
                                    <div className="text-center mx-auto">
                                        <IconoEstado Icono={Building} classNameContenedor={"bg-[#2ACF58] w-[36px] h-[36px] relative rounded-full flex items-center justify-center"} classNameContenido={"w-[20px] h-[20px] stroke-blanco z-10"}/>
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="text-center pequenno_bold">{("Oficina ") + location.city}</div>
                                        <div className="text-center text-black pequenno">Inicio</div>
                                    </div>
                                </>
                                :
                                <>
                                    <div className="text-center mx-auto">
                                        <IconoEstado Icono={Warehouse} classNameContenedor={"bg-black w-[36px] h-[36px] relative rounded-full flex items-center justify-center"} classNameContenido={"w-[20px] h-[20px] stroke-blanco z-10"}/>
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="text-center pequenno_bold">{("Almacén ") + location.city}</div>
                                        <div className="text-center text-black pequenno">Inicio</div>
                                    </div>
                                </>
                                
                                }
                            </div>
                            }
                        </>
                    )
                    )
                    :
                    vehicle.currentRoute.length==1?
                    <div className="inline-flex flex-col gap-2 items-center mx-3 px-2 min-w-[100px] max-w-[200px]">
                        {vehicle.currentRoute[0].type==="office"?
                        <>
                            <div className="text-center mx-auto">
                                <IconoEstado Icono={Building} classNameContenedor={"bg-black w-[36px] h-[36px] relative rounded-full flex items-center justify-center"} classNameContenido={"w-[20px] h-[20px] stroke-blanco z-10"}/>
                            </div>
                            <div className="flex flex-col">
                                <div className="text-center regular_bold">{("Oficina ") + vehicle.currentRoute[0].city}</div>
                                <div className="text-center text-black pequenno">Inicio</div>
                            </div>
                        </>
                        :
                        <>
                            <div className="text-center mx-auto">
                                <IconoEstado Icono={Warehouse} classNameContenedor={"bg-black w-[36px] h-[36px] relative rounded-full flex items-center justify-center"} classNameContenido={"w-[20px] h-[20px] stroke-blanco z-10"}/>
                            </div>
                            <div className="flex flex-col">
                                <div className="text-center regular_bold">{("Almacén ") + vehicle.currentRoute[0].city}</div>
                                <div className="text-center text-black pequenno">Inicio</div>
                            </div>
                        </>
                        
                        }
                    </div>
                    :
                    <></>
                    
                }
                </div>
                
            </div>
            <div className="flex flex-col gap-4 relative">
                <div className="flex flex-row justify-between ">
                    <div className="text-black regular_bold">Lista de Envíos</div>
                    <Button
                    disableRipple={true}
                    startContent={<Filter className="size-2"/>}
                    className="focus:outline-none border stroke-black rounded h-8 pequenno w-[22%] bg-[#F4F4F4]"
                    onClick={() => setFilterModalVisible(!isFilterModalVisible)}
                    >
                    Filtros
                    </Button>
                    {/* Modal de Filtros */}
                                    
                {isFilterModalVisible && (
                    <div
                        ref={modalRef} // Asigna la referencia al contenedor del modal
                        className="absolute top-10 right-1 bg-white shadow-lg rounded border p-4 w-[475px] z-50"
                    >
                        <div className="w-full flex flex-row justify-between items-center">
                            <div className="text-black subEncabezado_bold">Opciones de Filtro</div>
                            <button
                                onClick={() => setFilterModalVisible(false)}
                                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-300 transition duration-200"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        
                        <div className="flex flex-col gap-4">
                            {/* Contenido de filtros */}
                            <div className="h-[190px] overflow-y-auto scroll-area">
                            <div className="w-full flex flex-row gap-4">
                                <div className="flex flex-col gap-1 w-full">
                                    <div className="regular_bold">
                                        Estado:
                                    </div>
                                    <Dropdown className="w-full">
                                        <DropdownTrigger>
                                            <Button
                                                variant="bordered"
                                                className="capitalize w-full relative"
                                                disableRipple={true}
                                            >
                                                <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                    {selectedValue}
                                                </span>
                                                <ChevronDown size={18} className="absolute right-4" />
                                            </Button>
                                        </DropdownTrigger>
                                        <DropdownMenu
                                            closeOnSelect={true}
                                            selectionMode="single"
                                            selectedKeys={selectedKeys}
                                            onSelectionChange={setSelectedKeys}
                                            disableRipple={true}
                                            className="w-full"
                                        >
                                            <DropdownItem key="REGISTERED">Registrado</DropdownItem>
                                            <DropdownItem key="DELIVERED">Entregado</DropdownItem>
                                            <DropdownItem key="IN_TRANSIT">En tránsito</DropdownItem>
                                        </DropdownMenu>
                                    </Dropdown>
                                </div>
                            </div>
                            <div className="w-full flex flex-row gap-4">
                                <div className="flex flex-col gap-1 w-full">
                                    <div className="regular_bold">
                                        Almacén origen:
                                    </div>
                                    <Dropdown className="w-full">
                                        <DropdownTrigger>
                                            <Button
                                                variant="bordered"
                                                className="capitalize w-full relative"
                                                disableRipple={true}
                                            >
                                                <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                    {selectedValue}
                                                </span>
                                                <ChevronDown size={18} className="absolute right-4" />
                                            </Button>
                                        </DropdownTrigger>
                                        <DropdownMenu
                                            closeOnSelect={true}
                                            selectionMode="single"
                                            selectedKeys={selectedKeys}
                                            onSelectionChange={setSelectedKeys}
                                            disableRipple={true}
                                            className="w-full"
                                        >
                                            <DropdownItem key="REGISTERED">Registrado</DropdownItem>
                                            <DropdownItem key="DELIVERED">Entregado</DropdownItem>
                                            <DropdownItem key="IN_TRANSIT">En tránsito</DropdownItem>
                                        </DropdownMenu>
                                    </Dropdown>
                                </div>
                                <div className="flex flex-col gap-1 w-full">
                                    <div className="regular_bold">
                                        Oficina destino:
                                    </div>
                                    <Dropdown className="w-full">
                                        <DropdownTrigger>
                                            <Button
                                                variant="bordered"
                                                className="capitalize w-full relative"
                                                disableRipple={true}
                                            >
                                                <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                    {selectedValue}
                                                </span>
                                                <ChevronDown size={18} className="absolute right-4" />
                                            </Button>
                                        </DropdownTrigger>
                                        <DropdownMenu
                                            closeOnSelect={true}
                                            selectionMode="single"
                                            selectedKeys={selectedKeys}
                                            onSelectionChange={setSelectedKeys}
                                            disableRipple={true}
                                            className="w-full"
                                        >
                                            <DropdownItem key="REGISTERED">Registrado</DropdownItem>
                                            <DropdownItem key="DELIVERED">Entregado</DropdownItem>
                                            <DropdownItem key="IN_TRANSIT">En tránsito</DropdownItem>
                                        </DropdownMenu>
                                    </Dropdown>
                                </div>
                            </div>



                            <div className="w-full flex flex-row gap-4">
                                <div className="flex flex-col gap-1 w-full">
                                    <div className="regular_bold">
                                        Cantidad de paquetes:
                                    </div>
                                    <div className="w-full flex flex-row justify-between gap-2">
                                        <Input
                                            type="number"
                                            defaultValue={0}
                                            min={0}
                                            step="1"
                                            className="w-full text-right"
                                        />
                                        <div className="flex items-center">hasta</div>
                                        <Input
                                            type="number"
                                            defaultValue={0}
                                            min={0}
                                            step="1"
                                            className="w-full text-right"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="w-full flex flex-row gap-4">
                                    <div className="flex flex-col gap-1 w-full">
                                        <div className="regular_bold">
                                            Fecha desde:
                                        </div>
                                        <div className="w-full flex flex-row justify-between gap-2">
                                            <DatePicker className="" />
                                            <Input
                                                type="time"
                                                defaultValue="12:00"
                                                className="w-full"
                                                aria-label="Time Input"
                                            />
                                        </div>
                                    </div>
                            </div>
                            <div className="w-full flex flex-row gap-4">
                                    <div className="flex flex-col gap-1 w-full">
                                        <div className="regular_bold">
                                            Fecha hasta:
                                        </div>
                                        <div className="w-full flex flex-row justify-between gap-2">
                                            <DatePicker className="" />
                                            <Input
                                                type="time"
                                                defaultValue="12:00"
                                                className="w-full"
                                                aria-label="Time Input"
                                            />
                                        </div>
                                    </div>
                            </div>
                            </div>
                            

                            <div className="w-full flex flex-row justify-between gap-4">
                                <Button
                                    onClick={() => setFilterModalVisible(false)}
                                >
                                    Eliminar Filtros
                                </Button>
                                <Button
                                    onClick={() => setFilterModalVisible(false)}
                                    className="bg-principal text-white"
                                >
                                    Aplicar Filtros
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
                </div>

                
                <div className="flex flex-col gap-0">
                    <div className="bg-gray-50 text-gray-500 uppercase text-sm leading-normal w-full grid grid-cols-10 items-center">
                        <div className="py-3 px-2 text-center col-span-1">CÓDIGO DE ENVÍO</div>
                        <div className="py-3 px-2 text-center col-span-1">CANTIDAD DE PAQUETES</div>
                        <div className="py-3 px-2 text-center col-span-2">ESTADO</div>
                        <div className="py-3 px-2 text-center col-span-2">FECHA LÍMITE</div>
                        <div className="py-3 px-2 text-center col-span-2">ORIGEN</div>
                        <div className="py-3 px-2 text-center col-span-2">DESTINO</div>
                    </div>

                <div className="overflow-y-auto h-[175px] border stroke-black rounded w-full scroll-area overflow-x-hidden">
                    <AutoSizer>
                        {({ height, width }) => (
                            <List
                                height={height}
                                itemCount={vehicle.shipmentsVehicle.length}
                                itemSize={60}
                                width={width}
                                className="scroll-area"
                            >
                                    {Row}
                            </List>
                        )}
                    </AutoSizer>
                                
                    
                    
                    
                    
                </div>
                </div>
                
            </div>
            <div className="text-right text-[#939393] regular">Cantidad de envíos atendidos: {vehicle.shipmentsVehicle.length}</div>
        </div>
    )
}
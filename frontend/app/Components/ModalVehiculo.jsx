import { Button, DatePicker, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input } from "@nextui-org/react"
import { AlertTriangle, ArrowRight, Building, Calendar, Car, CarFront, Check, ChevronDown, Circle, CircleAlert, CircleAlertIcon, Clock, Eye, Filter, Flag, Gauge, Globe, MapPin, Package, Truck, Warehouse, X } from "lucide-react"
import BarraProgreso from "./BarraProgreso"
import IconoEstado from "./IconoEstado"
import { useEffect, useMemo, useRef, useState } from "react"
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList as List } from 'react-window';
import { parseDate } from "@internationalized/date"
import BreakdownModal from "./VehiclePopUp/BreakdownModal"

export default function ModalVehiculo({vehicle}){
    const [isFilterModalVisible, setFilterModalVisible] = useState(false);
    const modalRef = useRef(null); // Referencia para el modal de filtros
    const [loadingFilters, setLoadingFilters] = useState(true);
    const [officeCities, setOfficeCities] = useState(null);
    const [warehouseCities, setWarehouseCities] = useState(null);
    const [statusesShipment, setStatusesShipment] = useState(null);
    const [filteredShipments, setFilteredShipments] = useState([]);
    const [tiposAveria, setTiposAveria] = useState([])
    const [tipoAveriaSeleccionado, setTipoAveriaSeleccionado] = useState(null)
    const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);
    const initialStateRef = useRef(
        {
        originCity: "",
        destinationCity: "",
        statusShipment: "",
        minQuantity: 0,
        maxQuantity: null,
        fromDate: null,
        toDate: null
        }
    )
    const [shipmentsFilter, setShipmentsFilter] = useState(initialStateRef.current);

    const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_API_BASE_URL_PROD
    : process.env.NEXT_PUBLIC_API_BASE_URL;


    const handleBreakdownClick = (e) => {
        e.stopPropagation();
        setIsBreakdownModalOpen(true);
      };
    
      const handleBreakdownSuccess = () => {
        // Aquí puedes actualizar el estado del vehículo o recargar los datos
        
        // Manejar el reporte de avería
        //onReportIssue?.(vehicleData);
      };


    useEffect(() => {
        if(!isFilterModalVisible)return;
        setLoadingFilters(true)
        const fetchLocations = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/locations`);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const data = await response.json();
                const officeCities = data.features
                    .filter((feature) => !["150101", "040101", "130101"].includes(feature.properties.ubigeo)) // Filtra los no excluidos
                    .map((feature) => feature.properties.name) // Extrae los nombres
                    .sort((a, b) => a.localeCompare(b));
                const warehouseCities = data.features
                    .filter((feature) => ["150101", "040101", "130101"].includes(feature.properties.ubigeo)) // Filtra los no excluidos
                    .map((feature) => feature.properties.name) // Extrae los nombres
                    .sort((a, b) => a.localeCompare(b));
                setOfficeCities(officeCities);
                setWarehouseCities(warehouseCities);
                setStatusesShipment(["EN TRANSITO", "ENTREGADO", "REGISTRADO"]);
                
            }
            catch(err){
                return;
            }
            finally {
                setLoadingFilters(false);
            }
        };
    
        fetchLocations();
        setLoadingFilters(false)
    }, [isFilterModalVisible]);

    useEffect(() => {
        
        if(!vehicle.shipmentsVehicle){
            setFilteredShipments([]);
            return
        }
        
        if(shipmentsFilter === initialStateRef.current){
            setFilteredShipments(vehicle.shipmentsVehicle)
            return
        }
            
        const filtered = vehicle.shipmentsVehicle.filter((shipment) => {
            // Filtrar por originCity
            const matchesOriginCity = shipmentsFilter.originCity
            ? shipment.originCity === shipmentsFilter.originCity
            : true;
          
            // Filtrar por destinationCity
            const matchesDestinationCity = shipmentsFilter.destinationCity
            ? shipment.destinationCity === shipmentsFilter.destinationCity
            : true;
        
            // Filtrar por minQuantity (si se tiene un valor en shipmentsFilter.minQuantity)
            const matchesStatus = shipmentsFilter.statusShipment
            ?
            ((shipmentsFilter.statusShipment === "ENTREGADO" && (shipment.status === "DELIVERED" || shipment.status === "PENDING_PICKUP")) ||
            (shipmentsFilter.statusShipment === "EN TRANSITO" && (shipment.status === "FULLY_ASSIGNED" || shipment.status === "IN_TRANSIT" || shipment.status === "PARTIALLY_ASSIGNED" || shipment.status === "PARTIALLY_ARRIVED")) ||
            (shipmentsFilter.statusShipment === "REGISTRADO" && (shipment.status === "REGISTERED"))
            )
            : true;


            // Filtrar por minQuantity (si se tiene un valor en shipmentsFilter.minQuantity)
            const matchesMinQuantity = shipmentsFilter.minQuantity
            ? shipment.quantity >= shipmentsFilter.minQuantity
            : true;

            // Filtrar por maxQuantity (si se tiene un valor en shipmentsFilter.maxQuantity)
            const matchesMaxQuantity = shipmentsFilter.maxQuantity
                ? shipment.quantity <= shipmentsFilter.maxQuantity
                : true;

            const isAfterFromDate = shipmentsFilter.fromDate
                ? new Date(Date.parse(shipment.dueTime + 'Z')).getTime() >= new Date(shipmentsFilter.fromDate).getTime()
                : true;
            
            const isBeforeToDate = shipmentsFilter.toDate
                ? new Date(Date.parse(shipment.dueTime + 'Z')).getTime() <= new Date(shipmentsFilter.toDate).getTime()
                : true;

          // Retornar true solo si todos los filtros coinciden
          return matchesOriginCity && matchesDestinationCity && matchesStatus && matchesMinQuantity && matchesMaxQuantity && isAfterFromDate && isBeforeToDate
        });
      
        // Establecer la lista filtrada en filteredShipments
        setFilteredShipments(filtered);
    }, [vehicle, shipmentsFilter]);



    // Cierra el modal si se hace clic fuera de él
    useEffect(() => {
        setTiposAveria(["1","2","3"]);



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
        const shipment = filteredShipments[index];
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
                    shipment.status==="FULLY_ASSIGNED" || shipment.status==="IN_TRANSIT" || shipment.status==="PARTIALLY_ARRIVED" || shipment.status==="PARTIALLY_ASSIGNED"?
                    <div className={"p-1 col-span-2 items-center pequenno border text-center justify-center bg-[#284BCC] text-[#BECCFF] rounded-xl" }>EN TRÁNSITO</div>
                    :
                    <></>
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
                    <div className="text-black regular_bold block w-[120px]">Ruta del Camión</div>
                    <Button
                        disableRipple={true}
                        className={"focus:outline-none border stroke-black w-[120px] pequenno text-black  rounded-2xl items-center block bg-[#FFA500]"}
                        isDisabled={vehicle.status !== "EN_TRANSITO_ORDEN"}
                        onClick={handleBreakdownClick}
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
                    {shipmentsFilter === initialStateRef.current?
                        (
                        <Button
                            disableRipple={true}
                            startContent={<Filter size="18" />}
                            className="bg-[#F4F4F4] text-black"
                            onClick={
                                ()=>{
                                    setFilterModalVisible(true)
                                }
                            }
                        >
                            Filtros
                        </Button>
                        )
                        :
                        (
                            <div className="w-full flex flex-row justify-end items-center">
                                <Button
                                    disableRipple={true}
                                    startContent={<Filter size="18" />}
                                    className="bg-principal text-white"
                                    onClick={
                                        ()=>{
                                            setFilterModalVisible(true)
                                        }
                                    }
                                >
                                    Filtros
                                </Button>
                                <div 
                                    className="hover:bg-gray-100 hover:rounded-full cursor-pointer transition-all duration-200"
                                    onClick={() => setShipmentsFilter(initialStateRef.current)}
                                >
                                <X size="18" />
                                </div>
                            </div>
                        )
                        }
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
                                    <Dropdown className="my-dropdown">
                                            <DropdownTrigger>
                                                <Button
                                                variant="bordered"
                                                className="capitalize w-full relative"
                                                disableRipple={true}
                                                >
                                                <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                    {shipmentsFilter.statusShipment || "Selecciona un estado"}
                                                </span>
                                                <ChevronDown size={18} className="absolute right-4" />
                                                </Button>
                                            </DropdownTrigger>
                                            <DropdownMenu
                                                closeOnSelect={true}
                                                selectionMode="single"
                                                onSelectionChange={(keys) => {
                                                const value = Array.from(keys).join(', '); // Obtén el valor seleccionado
                                                setShipmentsFilter((prev) => ({
                                                    ...prev,
                                                    statusShipment: value,
                                                }));
                                                }}
                                                disableRipple={true}
                                                className="max-h-[500px] overflow-y-auto w-full"
                                            >
                                                {statusesShipment && statusesShipment.length > 0 && statusesShipment.map((status) => (
                                                <DropdownItem key={status}>{status}</DropdownItem>
                                                ))}
                                            </DropdownMenu>
                                    </Dropdown>
                                </div>
                            </div>
                            <div className="w-full flex flex-row gap-4">
                                <div className="flex flex-col gap-1 w-full">
                                    <div className="regular_bold">
                                        Almacén origen:
                                    </div>
                                    <Dropdown className="my-dropdown">
                                            <DropdownTrigger>
                                                <Button
                                                variant="bordered"
                                                className="capitalize w-full relative"
                                                disableRipple={true}
                                                >
                                                <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                    {shipmentsFilter.originCity || "Selecciona una ubicación"}
                                                </span>
                                                <ChevronDown size={18} className="absolute right-4" />
                                                </Button>
                                            </DropdownTrigger>
                                            <DropdownMenu
                                                closeOnSelect={true}
                                                selectionMode="single"
                                                onSelectionChange={(keys) => {
                                                const value = Array.from(keys).join(', '); // Obtén el valor seleccionado
                                                setShipmentsFilter((prev) => ({
                                                    ...prev,
                                                    originCity: value,
                                                }));
                                                }}
                                                disableRipple={true}
                                                className="max-h-[500px] overflow-y-auto w-full"
                                            >
                                                {warehouseCities && warehouseCities.length > 0 && warehouseCities.map((city) => (
                                                <DropdownItem key={city}>{city}</DropdownItem>
                                                ))}
                                            </DropdownMenu>
                                        </Dropdown>
                                </div>
                                <div className="flex flex-col gap-1 w-full">
                                    <div className="regular_bold">
                                        Oficina destino:
                                    </div>
                                    <Dropdown className="my-dropdown">
                                            <DropdownTrigger>
                                                <Button
                                                variant="bordered"
                                                className="capitalize w-full relative"
                                                disableRipple={true}
                                                >
                                                <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                    {shipmentsFilter.destinationCity || "Selecciona una ubicación"}
                                                </span>
                                                <ChevronDown size={18} className="absolute right-4" />
                                                </Button>
                                            </DropdownTrigger>
                                            <DropdownMenu
                                                closeOnSelect={true}
                                                selectionMode="single"
                                                onSelectionChange={(keys) => {
                                                const value = Array.from(keys).join(', '); // Obtén el valor seleccionado
                                                setShipmentsFilter((prev) => ({
                                                    ...prev,
                                                    destinationCity: value,
                                                }));
                                                }}
                                                disableRipple={true}
                                                className="max-h-[500px] overflow-y-auto w-full"
                                            >
                                                {officeCities && officeCities.length > 0 && officeCities.map((city) => (
                                                <DropdownItem key={city}>{city}</DropdownItem>
                                                ))}
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
                                            value={shipmentsFilter.minQuantity || 0}
                                            min={0}
                                            step="1"
                                            className="w-full text-right"
                                            onChange={(e) => {
                                                const value = parseInt(e.target.value, 10) || 0; // Convertir a número, manejar valores vacíos
                                                
                                                setShipmentsFilter((prev) => ({
                                                    ...prev,
                                                    minQuantity: value,
                                                }));
                                                
                                            }}
                                        />
                                        <div className="flex items-center">hasta</div>
                                        <Input
                                            type="number"
                                            value={shipmentsFilter.maxQuantity === null ? "" : shipmentsFilter.maxQuantity}
                                            min={0}
                                            step="1"
                                            className="w-full text-right"
                                            onChange={(e) => {
                                                const value = e.target.value === "" ? 0 : parseInt(e.target.value, 10) || 0; // Convertir a número, manejar valores vacíos
                                                
                                                setShipmentsFilter((prev) => ({
                                                    ...prev,
                                                    maxQuantity: value,
                                                }));
                                                
                                                
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="w-full flex flex-row gap-4">
                            <div className="flex flex-col gap-1 w-full">
                                        <div className="regular_bold">
                                            Fecha de registro desde:
                                        </div>
                                        <div className="w-full flex flex-row justify-between gap-2">
                                        <DatePicker
                                        className={`w-full`}
                                        value={shipmentsFilter.fromDate 
                                            ? parseDate(shipmentsFilter.fromDate instanceof Date 
                                                ? shipmentsFilter.fromDate.toISOString().split('T')[0] // Solo la fecha sin la hora
                                                : shipmentsFilter.fromDate)
                                            : null}
                                        onChange={(date) => {
                                            if (date) {
                                            // Crear una nueva fecha en UTC con la hora a las 00:00
                                            const updatedDate = new Date(date);
                                            updatedDate.setUTCHours(0, 0, 0, 0); // Establecer la hora a las 00:00 en UTC

                                            // Actualizar fromDate con la nueva fecha en UTC
                                            setShipmentsFilter((prev) => ({
                                                ...prev,
                                                fromDate: updatedDate,
                                            }));
                                            }
                                        }}
                                        />

                                        <Input
                                        type="time"
                                        value={shipmentsFilter.fromDate
                                            ? `${shipmentsFilter.fromDate.getUTCHours().toString().padStart(2, '0')}:${shipmentsFilter.fromDate.getUTCMinutes().toString().padStart(2, '0')}`
                                            : ''}
                                        className={`w-full ${!shipmentsFilter.fromDate ? 'opacity-50' : ''}`} // Reducir opacidad si fromDate es null
                                        aria-label="Time Input"
                                        disabled={!shipmentsFilter.fromDate} // Deshabilitar si fromDate es null
                                        onChange={(e) => {
                                            if (shipmentsFilter.fromDate) {
                                            // Obtener las horas y minutos del input de tiempo
                                            const [hours, minutes] = e.target.value.split(':').map(Number);

                                            setShipmentsFilter((prev) => {
                                                // Crear una nueva fecha basada en fromDate en UTC
                                                const updatedDate = new Date(prev.fromDate);

                                                // Establecer la hora y minutos en fromDate en UTC
                                                updatedDate.setUTCHours(hours, minutes, 0, 0); // Establecer las horas, minutos, segundos y milisegundos en UTC

                                                return { ...prev, fromDate: updatedDate }; // Actualizar fromDate con la nueva hora en UTC
                                            });
                                            }
                                        }}
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
                                        <DatePicker
                                    className={`w-full`} // Reducir opacidad si fromDate es null
                                    value={shipmentsFilter.toDate 
                                        ? parseDate(shipmentsFilter.toDate instanceof Date 
                                            ? shipmentsFilter.toDate.toISOString().split('T')[0] // Solo la fecha sin la hora
                                            : shipmentsFilter.toDate)
                                        : null}
                                    //isDisabled={!shipmentsFilter.fromDate} // Deshabilitar si fromDate es null
                                    onChange={(date) => {
                                        if (date) {
                                        // Si se selecciona una fecha, establecerla con hora 00:00
                                        const updatedDate = new Date(date);
                                        updatedDate.setUTCHours(0, 0, 0, 0); // Hora 00:00 en UTC para evitar problemas de zona horaria
                                        setShipmentsFilter((prev) => ({ ...prev, toDate: updatedDate }));
                                        }
                                    }}
                                    />

                                    <Input
                                    type="time"
                                    value={shipmentsFilter.toDate
                                        ? `${shipmentsFilter.toDate.getUTCHours().toString().padStart(2, '0')}:${shipmentsFilter.toDate.getUTCMinutes().toString().padStart(2, '0')}`
                                        : ''}
                                    className={`w-full ${!shipmentsFilter.toDate || !shipmentsFilter.fromDate ? 'opacity-50' : ''}`} // Reducir opacidad si toDate es null
                                    aria-label="Time Input"
                                    disabled={!shipmentsFilter.toDate||!shipmentsFilter.fromDate} // Deshabilitar si toDate es null o fromDate es nulo
                                    onChange={(e) => {
                                        if (shipmentsFilter.toDate) {
                                        // Obtener las horas y minutos del input de tiempo
                                        const [hours, minutes] = e.target.value.split(':').map(Number);

                                        setShipmentsFilter((prev) => {
                                            // Crear una nueva fecha basada en toDate en UTC
                                            const updatedDate = new Date(prev.toDate);

                                            // Establecer la hora y minutos en toDate en UTC
                                            updatedDate.setUTCHours(hours, minutes, 0, 0); // Establecer las horas, minutos, segundos y milisegundos en UTC

                                            return { ...prev, toDate: updatedDate }; // Actualizar toDate con la nueva hora en UTC
                                        });
                                        }
                                    }}
                                    />
                                        </div>
                                    </div>
                            </div>
                            </div>
                            

                            <div className="w-full flex flex-row justify-start gap-4">
                                <Button
                                    onClick={() => setShipmentsFilter(initialStateRef.current)}
                                >
                                    Eliminar Filtros
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
                                itemCount={filteredShipments.length}
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
            <BreakdownModal 
                isOpen={isBreakdownModalOpen}
                onClose={() => setIsBreakdownModalOpen(false)}
                vehicleCode={vehicle.vehicleCode}
                onSuccess={handleBreakdownSuccess}
            />
        </div>
        
    )
}

import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input } from "@nextui-org/react";
import { useState, useEffect, useRef } from "react";
import { Calendar, ChevronDown, Clock, Eye, Filter, Globe, MapPin, Package, X } from "lucide-react";

export default function ModalEnvios({ shipmentVehicles, setSelectedVehicleIndex, sendMessage, shipment }) {
    const [isFilterModalVisible, setFilterModalVisible] = useState(false);
    const modalRef = useRef(null); // Referencia para el modal de filtros
    const [filteredVehicles, setFilteredVehicles] = useState([]);
    const initialFilterStateRef = useRef(
        {
        status: "",
        minQuantity: 0,
        maxQuantity: null
        }
    )
    const [vehiclesFilter, setVehiclesFilter] = useState(initialFilterStateRef.current);
    
    useEffect(() => {
        
        if(!shipmentVehicles){
            setFilteredVehicles([]);
            return
        }
        
        if(vehiclesFilter === initialFilterStateRef.current){
            setFilteredVehicles(shipmentVehicles)
            return
        }
            
        const filtered = shipmentVehicles.filter((vehicle) => {
            
          

            
            // Filtrar por status
            const matchesStatus = vehiclesFilter.status
            ?
            (vehiclesFilter.status === "ATENDIDO" && vehicle.status === "ATTENDED" ) ||
            (vehiclesFilter.status === "PENDIENTE" && vehicle.status !== "ATTENDED")
            : true;
            


            // Filtrar por minQuantity (si se tiene un valor en shipmentsFilter.minQuantity)
            const matchesMinQuantity = vehiclesFilter.minQuantity
            ? vehicle.packageQuantity >= vehiclesFilter.minQuantity
            : true;

            // Filtrar por maxQuantity (si se tiene un valor en shipmentsFilter.maxQuantity)
            const matchesMaxQuantity = vehiclesFilter.maxQuantity
                ? vehicle.packageQuantity <= vehiclesFilter.maxQuantity
                : true;


          // Retornar true solo si todos los filtros coinciden
          return  matchesMinQuantity && matchesMaxQuantity && matchesStatus
        });
      
        // Establecer la lista filtrada en filteredShipments
        setFilteredVehicles(filtered);
    }, [vehiclesFilter, shipmentVehicles]);
    
    
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

    return (
        <div className="flex flex-col gap-6">
            {/* Encabezado del modal */}
            <div className="flex flex-row justify-between">
                <div className="flex flex-col gap-2">
                    <div className="flex flex-row gap-1">
                        <MapPin size={16} />
                        <div className="regular">Ruta de envío</div>
                    </div>
                    <div className="regular_bold">
                        {"Almacén " + shipment.originCity + " -> " + "Oficina " + shipment.destinationCity}
                    </div>
                </div>
                <div className="flex flex-col gap-2 text-center">
                    <div className="flex flex-row gap-1">
                        <Clock size={16} />
                        <div className="regular">Tiempo restante</div>
                    </div>
                    <div className="regular_bold">
                        {shipment.timeRemainingDays + "d " + shipment.timeRemainingHours + "h"}
                    </div>
                </div>
            </div>

            {/* Resumen del envío */}
            <div className="bg-[#F7F7F7] p-4 rounded flex flex-row justify-around">
                <div className="flex flex-col justify-center text-center">
                    <Package size={32} className="stroke-[#ADADAD] self-center" />
                    <div className="regular">{shipment.quantity}</div>
                    <div className="text-[#8E8D8D] pequenno">Paquetes</div>
                </div>
                <div className="flex flex-col justify-center text-center">
                    <Calendar
                        size={32}
                        className="stroke-[#ADADAD] self-center"
                    />
                    <div className="regular">
                        {new Date(shipment.dueTime).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                        }).replace(",", "")}
                    </div>
                    <div className="text-[#8E8D8D] pequenno">Fecha Límite</div>
                </div>
                <div className="flex flex-col justify-center text-center">
                    <Globe size={32} className="stroke-[#ADADAD] self-center" />
                    <div className="regular">{shipment.destinationRegion}</div>
                    <div className="text-[#8E8D8D] pequenno">Región Destino</div>
                </div>
            </div>

            {/* Tabla con filtros */}
            <div className="flex flex-col gap-4 w-full">
                <div className="flex flex-row justify-between relative w-full">
                    <div className="text-black regular_bold">Paquetes en envío</div>
                        {vehiclesFilter === initialFilterStateRef.current?
                        (
                        <Button
                            disableRipple={true}
                            startContent={<Filter size="18" />}
                            className="bg-[#F4F4F4] text-black"
                            onClick={
                                ()=>{
                                    setFilterModalVisible(!isFilterModalVisible)
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
                                    setFilterModalVisible(!isFilterModalVisible)
                                }
                            }
                        >
                            Filtros
                        </Button>
                        <div 
                            className="hover:bg-gray-100 hover:rounded-full cursor-pointer transition-all duration-200 flex items-center"
                            onClick={() => setVehiclesFilter(initialFilterStateRef.current)}
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
                                className="absolute top-10 right-0 bg-white shadow-lg rounded border p-4 w-64 z-50"
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
                                <div className="w-full flex flex-row gap-4">
                                    <div className="flex flex-col gap-1 w-full">
                                        <div className="regular_bold">
                                            Estado:
                                        </div>
                                        <Dropdown
                                            className>
                                            <DropdownTrigger>
                                                <Button
                                                    variant="bordered"
                                                    className="capitalize w-full relative"
                                                    disableRipple={true}
                                                >
                                                    <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                        {vehiclesFilter.status || "Selecciona un estado"}
                                                    </span>
                                                    <ChevronDown size={18} className="absolute right-4" />
                                                </Button>
                                            </DropdownTrigger>
                                            <DropdownMenu
                                                closeOnSelect={true}
                                                selectionMode="single"
                                                onSelectionChange={(keys) => {
                                                const value = Array.from(keys).join(', '); // Obtén el valor seleccionado
                                                setVehiclesFilter((prev) => ({
                                                    ...prev,
                                                    status: value,
                                                }));
                                                }}
                                                disableRipple={true}
                                                className="max-h-[500px] overflow-y-auto w-full"
                                            >
                                                <DropdownItem key="PENDIENTE">PENDIENTE</DropdownItem>
                                                <DropdownItem key="ATENDIDO">ATENDIDO</DropdownItem>
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
                                                value={vehiclesFilter.minQuantity || 0}
                                                min={0}
                                                step="1"
                                                className="w-full text-right"
                                                onChange={(e) => {
                                                    const value = parseInt(e.target.value, 10) || 0; // Convertir a número, manejar valores vacíos
                                                    
                                                    setVehiclesFilter((prev) => ({
                                                        ...prev,
                                                        minQuantity: value,
                                                    }));
                                                    
                                                }}
                                            />
                                            <div className="flex items-center">hasta</div>
                                            <Input
                                                type="number"
                                                value={vehiclesFilter.maxQuantity || 0}
                                                min={0}
                                                step="1"
                                                className="w-full text-right"
                                                onChange={(e) => {
                                                    const value = parseInt(e.target.value, 10) || 0; // Convertir a número, manejar valores vacíos
                                                    
                                                    setVehiclesFilter((prev) => ({
                                                        ...prev,
                                                        maxQuantity: value,
                                                    }));
                                                    
                                                    
                                                }}
                                            />

                                        </div>
                                    </div>
                            </div>
                            <div className="w-full flex flex-row justify-end gap-4">
                            <Button
                                onClick={() => setVehiclesFilter(initialFilterStateRef.current)}
                            >
                                Eliminar Filtros
                            </Button>
                        </div>
                        </div>
                        
                        
                    </div>
                    )}
                    </div>
                </div>

                {/* Tabla */}
                <div className="overflow-x-auto min-h-[350px] border stroke-black rounded w-full">
                    <table className="bg-white border border-gray-200 rounded-lg shadow w-full">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 uppercase text-sm leading-normal">
                                <th className="py-3 px-6 text-center">CAMIÓN ACTUAL</th>
                                <th className="py-3 px-6 text-center">CANTIDAD DE PAQUETES</th>
                                <th className="py-3 px-6 text-center">ESTADO</th>
                                <th className="py-3 px-6 text-center">ACCIÓN</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700 text-sm font-light">
                            {filteredVehicles &&
                                filteredVehicles.map((vehicle, index) => (
                                    <tr className="border border-gray-200" key={vehicle.vehicleCode}>
                                        <td className="py-3 px-6 text-center">{vehicle.vehicleCode}</td>
                                        <td className="py-3 px-6 text-center">{vehicle.packageQuantity}</td>
                                        <td className="py-3 px-6 text-center">
                                            {vehicle.status === "ATTENDED" ? (
                                                <span className="px-3 py-1 rounded-full text-xs bg-capacidadDisponible text-white">
                                                    ATENDIDO
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 rounded-full text-xs bg-capacidadSaturada text-white">
                                                    PENDIENTE
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-6 text-center">
                                            <button
                                                className="bg-principal items-center p-2 rounded text-center"
                                                onClick={() => {
                                                    setSelectedVehicleIndex(index);
                                                    sendMessage({
                                                        orderId: shipment.id,
                                                        vehicleCode: vehicle.vehicleCode,
                                                    });
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
            

            {/* Cantidad de vehículos */}
            <div className="text-right text-[#939393] regular">
                Cantidad de vehículos: {filteredVehicles.length || 0}
            </div>
        </div>
    );
}
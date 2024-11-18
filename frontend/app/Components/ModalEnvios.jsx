import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input } from "@nextui-org/react";
import { useState, useEffect, useRef } from "react";
import { Calendar, ChevronDown, Clock, Eye, Filter, Globe, MapPin, Package, X } from "lucide-react";

export default function ModalEnvios({ shipmentVehicles, setSelectedVehicleIndex, sendMessage, shipment }) {
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
            <div className="flex flex-col gap-4">
                <div className="flex flex-row justify-between relative">
                    <div className="text-black regular_bold">Paquetes en envío</div>
                    <div>
                        <Button
                            disableRipple={true}
                            startContent={<Filter className="size-4" />}
                            className="focus:outline-none border stroke-black rounded h-8 pequenno w-full bg-[#F4F4F4]"
                            onClick={() => setFilterModalVisible(!isFilterModalVisible)}
                        >
                            Filtros
                        </Button>

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
                                                <DropdownItem key="text">Oficina</DropdownItem>
                                                <DropdownItem key="number">Almacén Principal</DropdownItem>
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
                            {shipmentVehicles &&
                                shipmentVehicles.map((vehicle, index) => (
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
            </div>

            {/* Cantidad de vehículos */}
            <div className="text-right text-[#939393] regular">
                Cantidad de vehículos: {shipment.vehicles.length || 0}
            </div>
        </div>
    );
}
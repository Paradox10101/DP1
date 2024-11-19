import { Button, DatePicker, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input } from "@nextui-org/react"
import { X, ChevronDown, MapPin, Building2Icon, Pin, Filter } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { filteredShipmentsAtom } from "@/atoms/shipmentAtoms"
import { useAtomValue } from "jotai"
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList as List } from 'react-window'

export default function ModalAlmacen({ warehouse }) {
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

    const shipments = useAtomValue(filteredShipmentsAtom);
    const [shipmentsPerWarehouse, setShipmentsPerWarehouse] = useState([]);

    useEffect(() => {
        if (shipments != null)
            setShipmentsPerWarehouse(shipments.filter(shipment => shipment.originCity === warehouse.province));
    }, [shipments]);

    const Row = ({ index, style }) => {
        const shipment = shipmentsPerWarehouse[index];
        return (
            <div key={shipment.code} style={style} className="grid grid-cols-8 w-full items-center p-1 border-b-3">
                <div className="text-center col-span-1 pequenno">{shipment.orderCode}</div>
                <div className="text-center col-span-1 pequenno">{shipment.quantity}</div>
                <div className="text-center col-span-2 pequenno break-all">{shipment.destinationCity}</div>
                <div className="text-center col-span-2 pequenno">{new Date(shipment.dueTime).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', '')}</div>
                <div className={`p-1 col-span-2 items-center pequenno border text-center justify-center rounded-xl ${shipment.status === "REGISTERED" ? 'bg-[#B0F8F4] text-[#4B9490]' : shipment.status === "DELIVERED" || shipment.status === "PENDING_PICKUP" ? 'bg-[#D0B0F8] text-[#7B15FA]' : 'bg-[#284BCC] text-[#BECCFF]'}`}>
                    {shipment.status === "REGISTERED" ? "REGISTRADO" : shipment.status === "DELIVERED" || shipment.status === "PENDING_PICKUP" ? "ENTREGADO" : "EN TRÁNSITO"}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-row justify-between">
                <div className="flex flex-col gap-2">
                    <div className="flex flex-row gap-1">
                        <MapPin size={16} />
                        <div className="regular">Detalle de ubicación</div>
                    </div>
                    <div className="flex flex-col gap-2 pl-2">
                        <div className="pequenno flex flex-row gap-2">
                            <Building2Icon size={16} />
                            <p>{"Departamento: " + warehouse.department}</p>
                        </div>
                        <div className="pequenno flex flex-row gap-2">
                            <Pin size={16} />
                            <p>{"Coordenadas(latitud, longitud): " + warehouse.latitude + ", " + warehouse.longitude}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-row justify-between relative">
                <div className="text-black regular_bold">Envíos atendidos</div>
                <Button
                    disableRipple={true}
                    startContent={<Filter className="size-2" />}
                    className="focus:outline-none border stroke-black rounded h-8 pequenno w-[22%] bg-[#F4F4F4]"
                    onClick={() => setFilterModalVisible(!isFilterModalVisible)}
                >
                    Filtros
                </Button>
                {/* Modal de Filtros */}
                {isFilterModalVisible && (
                    <div
                        ref={modalRef} // Asigna la referencia al contenedor del modal
                        className="absolute top-10 right-0 bg-white shadow-lg rounded border p-4 w-[400px] z-50"
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
                <div className="bg-gray-50 text-gray-500 uppercase text-sm leading-normal w-full grid grid-cols-8 items-center">
                    <div className="py-3 px-2 text-center col-span-1">CÓDIGO DE ENVÍO</div>
                    <div className="py-3 px-2 text-center col-span-1">CANTIDAD DE PAQUETES</div>
                    <div className="py-3 px-2 text-center col-span-2">DESTINO</div>
                    <div className="py-3 px-2 text-center col-span-2">FECHA LÍMITE</div>
                    <div className="py-3 px-2 text-center col-span-2">ESTADO</div>
                </div>

                <div className="overflow-y-auto h-[350px] border stroke-black rounded w-full scroll-area overflow-x-hidden">
                    <AutoSizer>
                        {({ height, width }) => (
                            <List
                                height={height}
                                width={width}
                                itemCount={shipmentsPerWarehouse.length}
                                itemSize={60} // Ajusta el tamaño de cada fila según el contenido
                            >
                                {Row}
                            </List>
                        )}
                    </AutoSizer>
                </div>
            </div>
        </div>
    )
}

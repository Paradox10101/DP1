import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure, Dropdown, DropdownMenu, DropdownItem, DropdownTrigger, DatePicker } from "@nextui-org/react";
import { filteredShipmentsAtom, searchInputAtom, searchQueryAtom, selectedShipmentAtom } from '../../atoms/shipmentAtoms';
import { ChevronDown, Filter, FilterIcon, Map, MoveLeft, SearchX, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CardEnvio from "@/app/Components/CardEnvio";
import { useAtom, useAtomValue } from "jotai";
import { useShipmentWebSocket } from '../../hooks/useShipmentWebSocket';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList as List } from 'react-window';
import ModalEnvios from "./ModalEnvios";
import ModalRutaVehiculoEnvio from "./ModalRutaVehiculoEnvio";
import {parseDate, getLocalTimeZone} from "@internationalized/date";



export default function OpcionEnvios() {
    const { sendMessage } = useShipmentWebSocket();
    const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();
    const shipments = useAtomValue(filteredShipmentsAtom);
    const [searchInput, setSearchInput] = useAtom(searchInputAtom);
    const [, setSearchQuery] = useAtom(searchQueryAtom);
    const [selectedShipmentIndex, setSelectedShipmentIndex] = useState(null);
    const [selectedVehicleIndex, setSelectedVehicleIndex] = useState(null); // Define selectedVehicle
    const [isFilterModalOpen, setFilterModalOpen] = useState(false); // Estado para el modal de filtros
    const [loadingFilters, setLoadingFilters] = useState(true);
    const [officeCities, setOfficeCities] = useState(null);
    const [warehouseCities, setWarehouseCities] = useState(null);
    const [statusesShipment, setStatusesShipment] = useState(null);
    const [filteredShipments, setFilteredShipments] = useState([]);
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

    useEffect(() => {
        if(!isFilterModalOpen)return;
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
    }, [isFilterModalOpen]);


    useEffect(() => {
        
        if(!shipments){
            setFilteredShipments([]);
            return
        }
        
        if(shipmentsFilter === initialStateRef.current){
            setFilteredShipments(shipments)
            return
        }
            
        const filtered = shipments.filter((shipment) => {
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
            (shipmentsFilter.statusShipment === "EN TRANSITO" && (shipment.status === "IN_TRANSIT" || shipment.status === "PARTIALLY_ARRIVED" || shipment.status === "FULLY_ASSIGNED" || shipment.status === "PARTIALLY_ASSIGNED")) ||
            (shipmentsFilter.statusShipment === "REGISTRADO" && (shipment.status === "REGISTERED" )))
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
                ? new Date(Date.parse(shipment.orderTime + 'Z')).getTime() >= new Date(shipmentsFilter.fromDate).getTime()
                : true;
            
            const isBeforeToDate = shipmentsFilter.toDate
                ? new Date(Date.parse(shipment.orderTime + 'Z')).getTime() <= new Date(shipmentsFilter.toDate).getTime()
                : true;

          // Retornar true solo si todos los filtros coinciden
          return matchesOriginCity && matchesDestinationCity && matchesStatus && matchesMinQuantity && matchesMaxQuantity && isAfterFromDate && isBeforeToDate
        });
      
        // Establecer la lista filtrada en filteredShipments
        setFilteredShipments(filtered);
    }, [shipments, shipmentsFilter]);


    useEffect(() => {
        const debounceTimeout = setTimeout(() => {
            setSearchQuery(searchInput);
        }, 300);

        return () => clearTimeout(debounceTimeout);
    }, [searchInput, setSearchQuery]);

    const handleSearchChange = useCallback((e) => {
        setSearchInput(e.target.value);
    }, [setSearchInput]);



    const NoDataMessage = () => (
        <div className="flex flex-col items-center justify-center p-8 text-gray-500">
            <Map size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium">No hay envíos registrados</p>
        </div>
    );

    const NoResultsMessage = () => (
        <div className="flex flex-col items-center justify-center p-8 text-gray-500">
            <SearchX size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium">No se encontraron resultados</p>
            <p className="text-sm">Intenta con otros términos de búsqueda</p>
        </div>
    );

    const shipmentsCount = filteredShipments?.length || 0;
    const hasInitialData = Array.isArray(filteredShipments);
    const hasSearchResults = hasInitialData && filteredShipments.length > 0;
    const isSearching = searchInput.length > 0;

    const Row = ({ index, style }) => {
        const shipment = filteredShipments[index];
        return (
            <div style={style}
                className={`p-2 border-2 rounded-xl stroke-black `}
                onMouseDown={() => {
                    const indexS =  shipments.findIndex(shipmentL => shipmentL.id === shipment.id);
                    if(indexS!==-1)
                        setSelectedShipmentIndex(indexS);
                    else
                        setSelectedShipmentIndex(index);
                    sendMessage({ orderId: shipment.id, vehicleCode: "" }); // Enviar mensaje al WebSocket
                    onOpen(); // Abrir modal
                }}
            >
                <CardEnvio key={shipment.id} {...shipment} />
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full gap-4 w-full">
            {!hasInitialData ? (
                <NoDataMessage />
            ) : (
                <>
                    <div className="flex flex-row justify-between items-center gap-2">
                        <Input
                            type="text"
                            placeholder="Buscar un envío..."
                            startContent={<Map size="18" />}
                            className="w-3/4"
                            value={searchInput}
                            onChange={handleSearchChange}
                            onClear={() => setSearchInput('')}
                            isClearable
                        />
                        {shipmentsFilter === initialStateRef.current?
                        (
                        <Button
                            disableRipple={true}
                            startContent={<Filter size="18" />}
                            className="bg-[#F4F4F4] text-black"
                            onClick={
                                ()=>{
                                    setFilterModalOpen(true)
                                }
                            }
                        >
                            Filtros
                        </Button>
                        )
                        :
                        (
                            <>
                            <Button
                                disableRipple={true}
                                startContent={<Filter size="18" />}
                                className="bg-principal text-white"
                                onClick={
                                    ()=>{
                                        setFilterModalOpen(true)
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
                            </>
                        )
                        }
                        </div>

                    
                    <div className="text-right text-sm text-[#939393]">
                        Cantidad de envíos: {shipmentsCount}
                    </div>
                    <div className="h-full w-full">
                        {!hasSearchResults && isSearching ? (
                            <NoResultsMessage />
                        ) : (
                            <AutoSizer>
                                {({ height, width }) => (
                                    <List
                                        height={height}
                                        itemCount={filteredShipments.length}
                                        itemSize={165}
                                        width={width}
                                        className="scroll-area"
                                    >
                                        {Row}
                                    </List>
                                )}
                            </AutoSizer>
                        )}
                    </div>
                </>
            )}
            
            {/* Modal */}
            {(selectedShipmentIndex!==null&&selectedVehicleIndex===null) && (
                <Modal
                    closeButton
                    isOpen={isOpen}
                    onOpenChange={onOpenChange}
                    isDismissable={true}
                    blur
                >
                    <ModalContent className="h-[775px] min-w-[850px]">
                        <ModalHeader>
                        {shipments[selectedShipmentIndex]&&
                            <div className="flex flex-row gap-2">
                                
                                <div className="subEncabezado">Información del envío {shipments[selectedShipmentIndex].orderCode}</div>
                                {
                                    shipments[selectedShipmentIndex].status === "REGISTERED"? (
                                        <div className={"flex w-[95px] items-center pequenno border text-center justify-center bg-[#B0F8F4] text-[#4B9490] rounded-xl"}>REGISTRADO</div>
                                    ) : shipments[selectedShipmentIndex].status === "DELIVERED" || shipments[selectedShipmentIndex].status === "PENDING_PICKUP" ? (
                                        <div className={"flex w-[95px] items-center pequenno border text-center justify-center bg-[#D0B0F8] text-[#7B15FA] rounded-xl"}>ENTREGADO</div>
                                    ) : shipments[selectedShipmentIndex].status === "IN_TRANSIT" || shipments[selectedShipmentIndex].status === "PARTIALLY_ARRIVED" || shipments[selectedShipmentIndex].status === "FULLY_ASSIGNED" || shipments[selectedShipmentIndex].status === "PARTIALLY_ASSIGNED"? (
                                        <div className={"flex w-[95px] items-center pequenno border text-center justify-center bg-[#284BCC] text-[#BECCFF] rounded-xl"}>EN TRÁNSITO</div>
                                    ) : (
                                        <></>
                                    )
                                }   
                            </div>
                            }
                        </ModalHeader>
                        <ModalBody>
                            {shipments&&shipments[selectedShipmentIndex]&&
                            <ModalEnvios shipmentVehicles={shipments[selectedShipmentIndex].vehicles} shipment={shipments[selectedShipmentIndex]} setSelectedVehicleIndex={setSelectedVehicleIndex} sendMessage={sendMessage}/>
                            }
                        </ModalBody>
                    </ModalContent>
                </Modal>
            )}
            {/* Modal de Vehiculos */}
            {(selectedShipmentIndex!==null&&selectedVehicleIndex!==null) && (
                <Modal
                    closeButton
                    isOpen={isOpen}
                    onOpenChange={onOpenChange}
                    onClose={()=>{setSelectedVehicleIndex(null)}}
                    isDismissable={true}
                    blur
                >
                    <ModalContent className="h-[775px] min-w-[850px]">
                        <ModalHeader>
                            {shipments[selectedShipmentIndex]&&shipments[selectedShipmentIndex].vehicles&&shipments[selectedShipmentIndex].vehicles[selectedVehicleIndex]&&
                            <div className="flex flex-row gap-3">
                                <button onClick={()=>{setSelectedVehicleIndex(null)}}>
                                <MoveLeft className="inline"/>
                                </button>    
                                <span className="subEncabezado">Información del vehiculo {shipments[selectedShipmentIndex].vehicles[selectedVehicleIndex].vehicleCode}</span>
                            </div>
                            }
                      
                        </ModalHeader>
                        <ModalBody>
                            {shipments[selectedShipmentIndex]&&shipments[selectedShipmentIndex].vehicles&&shipments[selectedShipmentIndex].vehicles[selectedVehicleIndex]&&
                            <ModalRutaVehiculoEnvio selectedVehicle={shipments[selectedShipmentIndex].vehicles[selectedVehicleIndex]}/>
                            }
                        </ModalBody>
                    </ModalContent>
                </Modal>
            )}
            {/* Modal de Filtros */}
            {isFilterModalOpen && (
                <Modal
                    closeButton
                    isOpen={isFilterModalOpen}
                    onOpenChange={setFilterModalOpen}
                    blur
                >
                    <ModalContent className="h-[450px] min-w-[650px]">
                        <ModalHeader>
                            <span className="subEncabezado">Opciones de Filtro para Envíos</span>
                        </ModalHeader>
                        <ModalBody>
                            {!loadingFilters?
                            <div className="flex flex-col gap-4">
                                {/* Contenido de filtros */}
                                <div className="w-full flex flex-row gap-4">
                                    <div className="flex flex-col gap-1 w-full">
                                        <div className="regular_bold">
                                            Ciudad de origen:
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
                                            Ciudad de destino:
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
                                            Estado de envío:
                                        </div>
                                        <div className="w-full flex flex-row justify-between gap-2">
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
                                                const value = e.target.value === "" ? 0 : parseInt(e.target.value, 10) || 0;
                                                setShipmentsFilter((prev) => ({
                                                    ...prev,
                                                    maxQuantity: value,
                                                }));
                                            }}
                                            onBlur={(e) => {
                                                if (e.target.value === "") {
                                                    setShipmentsFilter((prev) => ({
                                                        ...prev,
                                                        maxQuantity: 0,
                                                    }));
                                                }
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

                                <div className="flex flex-col gap-1 w-full">
                                    <div className="regular_bold">
                                        Fecha de registro hasta:
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
                            :
                            <>Cargando filtros...</>}
                        </ModalBody>
                        <ModalFooter>
                            <div className="w-full flex flex-row justify-start">
                                <Button
                                    onClick={() => {
                                        setShipmentsFilter(initialStateRef.current)
                                        //setFilterModalOpen(false)
                                        }
                                    }
                                >
                                    Eliminar Filtros
                                </Button>
                            </div>
                            
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}


        </div>
    );
}

import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure, Dropdown, DropdownMenu, DropdownItem, DropdownTrigger, DatePicker } from "@nextui-org/react";
import { filteredShipmentsAtom, searchInputAtom, searchQueryAtom, selectedShipmentAtom } from '../../atoms/shipmentAtoms';
import { ChevronDown, Filter, FilterIcon, Map, MoveLeft, SearchX } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import CardEnvio from "@/app/Components/CardEnvio";
import { useAtom, useAtomValue } from "jotai";
import { useShipmentWebSocket } from '../../hooks/useShipmentWebSocket';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList as List } from 'react-window';
import ModalEnvios from "./ModalEnvios";
import ModalRutaVehiculoEnvio from "./ModalRutaVehiculoEnvio";

export default function OpcionEnvios() {
    const { sendMessage } = useShipmentWebSocket();
    const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();
    const shipments = useAtomValue(filteredShipmentsAtom);
    const [searchInput, setSearchInput] = useAtom(searchInputAtom);
    const [, setSearchQuery] = useAtom(searchQueryAtom);
    const [selectedShipmentIndex, setSelectedShipmentIndex] = useState(null);
    const [selectedVehicleIndex, setSelectedVehicleIndex] = useState(null); // Define selectedVehicle
    const [isFilterModalOpen, setFilterModalOpen] = useState(false); // Estado para el modal de filtros
    const [selectedKeys, setSelectedKeys] = useState(new Set());

    const selectedValue = selectedKeys.size > 0 
        ? Array.from(selectedKeys).join(", ") 
        : "Seleccione una ubicación";

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

    const shipmentsCount = shipments?.length || 0;
    const hasInitialData = Array.isArray(shipments);
    const hasSearchResults = hasInitialData && shipments.length > 0;
    const isSearching = searchInput.length > 0;

    const Row = ({ index, style }) => {
        const shipment = shipments[index];
        return (
            <div style={style}
                className={`p-2 border-2 rounded-xl stroke-black ${shipments[selectedShipmentIndex]?.id && shipments[selectedShipmentIndex].id === shipment.id && isOpen ? 'border-3 border-principal' : ''}`}
                onMouseDown={() => {
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
                        <Button
                            disableRipple={true}
                            startContent={<Filter size="18" />}
                            className="bg-[#F4F4F4]"
                            onClick={
                                ()=>{
                                    setFilterModalOpen(true)
                                }
                            }
                        >
                            Filtros
                        </Button>
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
                                        itemCount={shipments.length}
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
                                    shipments[selectedShipmentIndex].status === "REGISTERED" || shipments[selectedShipmentIndex].quantityVehicles===0 ? (
                                        <div className={"flex w-[95px] items-center pequenno border text-center justify-center bg-[#B0F8F4] text-[#4B9490] rounded-xl"}>REGISTRADO</div>
                                    ) : shipments[selectedShipmentIndex].status === "DELIVERED" || shipments[selectedShipmentIndex].status === "PENDING_PICKUP" ? (
                                        <div className={"flex w-[95px] items-center pequenno border text-center justify-center bg-[#D0B0F8] text-[#7B15FA] rounded-xl"}>ENTREGADO</div>
                                    ) : shipments[selectedShipmentIndex].status === "FULLY_ASSIGNED" ? (
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
                            <div className="flex flex-col gap-4">
                                {/* Contenido de filtros */}
                                <div className="w-full flex flex-row gap-4">
                                    <div className="flex flex-col gap-1 w-full">
                                        <div className="regular_bold">
                                            Ciudad de origen:
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
                                                <DropdownItem key="text">Text</DropdownItem>
                                                <DropdownItem key="number">Number</DropdownItem>
                                                <DropdownItem key="date">Date</DropdownItem>
                                                <DropdownItem key="single_date">Single Date</DropdownItem>
                                                <DropdownItem key="iteration">Iteration</DropdownItem>
                                            </DropdownMenu>
                                    </Dropdown>
                                    </div>

                                    <div className="flex flex-col gap-1 w-full">
                                        <div className="regular_bold">
                                            Ciudad de destino:
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
                                                <DropdownItem key="text">Text</DropdownItem>
                                                <DropdownItem key="number">Number</DropdownItem>
                                                <DropdownItem key="date">Date</DropdownItem>
                                                <DropdownItem key="single_date">Single Date</DropdownItem>
                                                <DropdownItem key="iteration">Iteration</DropdownItem>
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
                                                        <DropdownItem key=">">{">"}</DropdownItem>
                                                        <DropdownItem key="<">{"<"}</DropdownItem>
                                                        <DropdownItem key="=">{"="}</DropdownItem>
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
                            
                        </ModalBody>
                        <ModalFooter>
                            <div className="w-full flex flex-row justify-between">
                                <Button
                                    onClick={() => setFilterModalOpen(false)}
                                >
                                    Eliminar Filtros
                                </Button>
                                <Button
                                    onClick={() => setFilterModalOpen(false)}
                                    className="bg-principal text-white"
                                >
                                    Aplicar Filtros
                                </Button>
                            </div>
                            
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}


        </div>
    );
}

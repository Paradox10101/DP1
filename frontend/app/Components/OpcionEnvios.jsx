import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@nextui-org/react";
import { filteredShipmentsAtom, searchInputAtom, searchQueryAtom, selectedShipmentAtom } from '../../atoms/shipmentAtoms';
import { Filter, Map, MoveLeft, SearchX } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
    const [selectedShipment, setSelectedShipment] = useAtom(selectedShipmentAtom); // Usar el átomo
    const [selectedVehicle, setSelectedVehicle] = useState(null); // Define selectedVehicle

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
                className={`p-2 border-2 rounded-xl stroke-black ${selectedShipment?.id && selectedShipment.id === shipment.id && isOpen ? 'border-3 border-principal' : ''}`}
                onMouseDown={() => {
                    setSelectedShipment(shipment);
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
            {(selectedShipment&&selectedVehicle===null) && (
                <Modal
                    closeButton
                    isOpen={isOpen}
                    onOpenChange={onOpenChange}
                    isDismissable={true}
                    blur
                >
                    <ModalContent className="h-[775px] min-w-[850px]">
                        <ModalHeader>
                            <div className="flex flex-row gap-2">
                                <div className="subEncabezado">Información del envío {selectedShipment.orderCode}</div>
                                {
                                    selectedShipment.status === "REGISTERED" ? (
                                        <div className={"flex w-[95px] items-center pequenno border text-center justify-center bg-[#B0F8F4] text-[#4B9490] rounded-xl"}>REGISTRADO</div>
                                    ) : selectedShipment.status === "DELIVERED" || selectedShipment.status === "PENDING_PICKUP" ? (
                                        <div className={"flex w-[95px] items-center pequenno border text-center justify-center bg-[#D0B0F8] text-[#7B15FA] rounded-xl"}>ENTREGADO</div>
                                    ) : selectedShipment.status === "FULLY_ASSIGNED" ? (
                                        <div className={"flex w-[95px] items-center pequenno border text-center justify-center bg-[#284BCC] text-[#BECCFF] rounded-xl"}>EN TRÁNSITO</div>
                                    ) : (
                                        <></>
                                    )
                                }
                            </div>
                        </ModalHeader>
                        <ModalBody>
                            <ModalEnvios shipmentVehicles={selectedShipment.vehicles} shipment={selectedShipment} setSelectedVehicle={setSelectedVehicle} sendMessage={sendMessage}/>
                        </ModalBody>
                    </ModalContent>
                </Modal>
            )}
            {(selectedShipment&&selectedVehicle) && (
                <Modal
                    closeButton
                    isOpen={isOpen}
                    onOpenChange={onOpenChange}
                    onClose={()=>{setSelectedVehicle(null)}}
                    isDismissable={true}
                    blur
                >
                    <ModalContent className="h-[775px] min-w-[850px]">
                        <ModalHeader>
                            <div className="flex flex-row gap-3">
                                <button onClick={()=>{setSelectedVehicle(null)}}>
                                <MoveLeft className="inline"/>
                                </button>    
                                <span className="subEncabezado">Información del vehiculo {selectedVehicle.vehicleCode}</span>
                            </div>
                      
                        </ModalHeader>
                        <ModalBody>
                            <ModalRutaVehiculoEnvio selectedVehicle={selectedVehicle}/>
                        </ModalBody>
                    </ModalContent>
                </Modal>
            )}
        </div>
    );
}

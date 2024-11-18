import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@nextui-org/react";
import { ChevronDown, Filter, Map, SearchX } from "lucide-react";
import { useAtom } from "jotai";
import { useState, useEffect, useCallback } from "react";
import { vehiclePositionsAtom, loadingAtom } from "../atoms";
import BarraProgreso from "./BarraProgreso";
import CardVehiculo from "@/app/Components/CardVehiculo";
import { useWebSocket } from "../../hooks/useWebSocket"; // WebSocket hook
import { FixedSizeList as List } from 'react-window';
import ModalVehiculo from "./ModalVehiculo";
import AutoSizer from 'react-virtualized-auto-sizer';


export default function OpcionVehiculos() {
  
  const vehiculos = useAtom(vehiclePositionsAtom);
  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();
  const [searchInput, setSearchInput] = useState("");
  const [selectedVehicleIndex, setSelectedVehicleIndex] = useState(null);
  const [isFilterModalOpen, setFilterModalOpen] = useState(false); // Estado para el modal de filtros
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const selectedValue = selectedKeys.size > 0 
        ? Array.from(selectedKeys).join(", ") 
        : "Seleccione una ubicación";
  

  // Ensure vehiculos is an array to avoid TypeError
  const vehiculosArray = vehiculos[0] && vehiculos[0]?.features && Array.isArray(vehiculos[0].features) ? vehiculos[0].features : [];

  // Filter vehiculosArray based on search input
  const filteredVehiculosArray = vehiculosArray.filter((vehiculo) =>
    vehiculo.properties.vehicleCode.toLowerCase().includes(searchInput.toLowerCase())
  );

  // Calculate total used and max capacity
  const capacidadUsadaTotal = filteredVehiculosArray.reduce(
    (total, vehiculo) => total + (vehiculo.properties.capacidadUsada || 0), 0
  );
  const capacidadTotalMaxima = filteredVehiculosArray.reduce(
    (total, vehiculo) => total + (vehiculo.properties.capacidadMaxima || 0), 0
  );
  
  const NoDataMessage = () => (
    <div className="flex flex-col items-center justify-center p-8 text-gray-500">
      <Map size={48} className="mb-4 opacity-50" />
      <p className="text-lg font-medium">No hay vehiculos disponibles</p>
      <p className="text-sm">Por favor, intente más tarde</p>
    </div>
  );

  const NoResultsMessage = () => (
    <div className="flex flex-col items-center justify-center p-8 text-gray-500">
      <SearchX size={48} className="mb-4 opacity-50" />
      <p className="text-lg font-medium">No se encontraron resultados</p>
      <p className="text-sm">Intenta con otros términos de búsqueda</p>
    </div>
  );

  
  const renderStatus = (status) => {
    switch (status) {
        case "EN_ALMACEN":
            return (
                <div className="pequenno border rounded-xl w-[140px] text-center bg-[#DEA71A] text-[#F9DF9B]">
                    En Almacén
                </div>
            );
        case "AVERIADO":
            return (
                <div className="pequenno border rounded-xl w-[140px] text-center bg-[#BE0627] text-[#FFB9C1]">
                    Averiado
                </div>
            );
        case "EN_MANTENIMIENTO":
            return (
                <div className="pequenno border rounded-xl w-[140px] text-center bg-[#7B15FA] text-[#D0B0F8]">
                    En Mantenimiento
                </div>
            );
        default:
            return (
                <div className="pequenno border rounded-xl w-[140px] text-center bg-[#284BCC] text-[#BECCFF]">
                    En Tránsito
                </div>
            );
    }
};
  
  const hasInitialData = Array.isArray(vehiculos);
  const hasSearchResults = hasInitialData && vehiculos.length > 0;
  const isSearching = searchInput.length > 0;

  const Row = ({ index, style}) => {
    const vehicle = filteredVehiculosArray[index];
    console.log(vehicle)
    return (
      (vehicle&&vehicle?.properties)&&
      <div
        style={style}
        key={vehicle.properties.vehicleCode}
        //className={`p-2 border-2 rounded-xl stroke-black ${filteredVehiculosArray[selectedShipmentIndex]?.id && shipments[selectedShipmentIndex].id === shipment.id && isOpen ? 'border-3 border-principal' : ''}`}
        onMouseDown={() => {
            setSelectedVehicleIndex(index);
            console.log("==============================================")
            console.log(vehicle)
            //sendMessage({ vehicleCode: "", orderId: "" }); // Enviar mensaje al WebSocket
            onOpen(); // Abrir modal
        }}
      >

        <CardVehiculo vehiculo={vehicle.properties} renderStatus={renderStatus(vehicle.properties.status)} />
      </div>
    )
  }


  return (
    <div className="h-full w-full flex flex-col gap-4">
      {!hasInitialData ? (
        <NoDataMessage />
      ) : (
        <>
          <div className="flex flex-row justify-between items-center gap-2">
            <Input
              type="text"
              placeholder="Buscar por código"
              startContent={<Map size="18" />}
              className="focus:outline-none  rounded-xl pequenno w-3/4"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)} // Update search input on change
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

          <div className="text-right pequenno text-[#939393]">
            Cantidad de vehículos: {filteredVehiculosArray.length}
          </div>

          <div className="flex flex-col gap-2">
            <div className="pequenno_bold text-center">Capacidad Total de los Vehículos</div>
            <div className="flex flex-col gap-1">
              <BarraProgreso porcentaje={(capacidadUsadaTotal / capacidadTotalMaxima) * 100} />
              <div className="flex flex-row justify-between">
                <div className="pequenno">Ocupado: {capacidadUsadaTotal}</div>
                <div className="pequenno_bold">
                  {capacidadTotalMaxima ? parseFloat(((capacidadUsadaTotal / capacidadTotalMaxima) * 100).toFixed(2)) : 0}%
                </div>
                <div className="pequenno">Máximo: {capacidadTotalMaxima}</div>
              </div>
            </div>
          </div>
          <div className="h-3/4 w-full overflow-y-auto scroll-area">
                {!hasSearchResults && isSearching ? (
                  <NoResultsMessage />
                ) : (
                  <AutoSizer>
                    {({ height, width }) => (
                      <List
                        height={height}
                        itemCount={filteredVehiculosArray.length}
                        itemSize={180}
                        width={width}
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
        {(true) && (
          <Modal
              closeButton
              isOpen={isOpen}
              onOpenChange={onOpenChange}
              isDismissable={true}
              blur
          >
              <ModalContent className="h-[790px] min-w-[850px] overflow-y-auto scroll-area">
                  <ModalHeader>

                  {filteredVehiculosArray&&filteredVehiculosArray[selectedVehicleIndex]&&filteredVehiculosArray[selectedVehicleIndex]?.properties&&
                    
                    <div className="flex flex-row gap-2">
                        
                        <div className="subEncabezado">Información del vehiculo {filteredVehiculosArray[selectedVehicleIndex].properties.vehicleCode}</div>
                        {renderStatus(filteredVehiculosArray[selectedVehicleIndex].properties.status)}
                    </div>
                    }
                  </ModalHeader>
                  <ModalBody>
                  {filteredVehiculosArray&&filteredVehiculosArray[selectedVehicleIndex]&&filteredVehiculosArray[selectedVehicleIndex]?.properties&&
                      <ModalVehiculo vehicle={filteredVehiculosArray[selectedVehicleIndex].properties}/>
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
                <ModalContent className="h-[450px] min-w-[550px]">
                    <ModalHeader>
                        <span className="subEncabezado">Opciones de Filtro para Vehículos</span>
                    </ModalHeader>
                    <ModalBody>
                        <div className="flex flex-col gap-4">
                            {/* Contenido de filtros */}
                            <div className="w-1/2 flex flex-row gap-4">
                                <div className="flex flex-col gap-1 w-full">
                                    <div className="regular_bold">
                                        Tipo de vehículo:
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

                            <div className="w-1/2 flex flex-row gap-4">
                                <div className="flex flex-col gap-1 w-full">
                                    <div className="regular_bold">
                                        Estado:
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
                                  
                            </div>
                            <div className="w-1/2 flex flex-row gap-4">
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

/*

{isLoading ? (
        <div className="text-center text-gray-500">Cargando vehículos...</div>
      ) : (
        <div className="flex flex-col gap-3 overflow-y-scroll max-h-[65vh] scroll-area">
          {filteredVehiculosArray.map((vehiculo) => (
            <CardVehiculo key={vehiculo.properties.vehicleCode} vehiculo={vehiculo.properties} />
          ))}
        </div>
      )}

      {error && (
        <div className="text-center text-red-500 mt-4">
          {error} <Button onClick={handleRetry}>Reintentar</Button>
        </div>
      )}

*/


//<CardVehiculo key={vehicle.properties.vehicleCode} vehiculo={vehicle.properties} />
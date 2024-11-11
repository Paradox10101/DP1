import { Button, Input, Modal, ModalBody, ModalContent, ModalHeader, useDisclosure } from "@nextui-org/react";
import { Filter, Map, SearchX } from "lucide-react";
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

  const hasInitialData = Array.isArray(vehiculos);
  const hasSearchResults = hasInitialData && vehiculos.length > 0;
  const isSearching = searchInput.length > 0;

  const Row = ({ index, style}) => {
    const vehicle = filteredVehiculosArray[index];
    console.log(vehicle)
    return (
      (vehicle&&vehicle?.properties)&&
      <div style={style}
        //className={`p-2 border-2 rounded-xl stroke-black ${filteredVehiculosArray[selectedShipmentIndex]?.id && shipments[selectedShipmentIndex].id === shipment.id && isOpen ? 'border-3 border-principal' : ''}`}
        onMouseDown={() => {
            setSelectedVehicleIndex(index);
            //sendMessage({ vehicleCode: "", orderId: "" }); // Enviar mensaje al WebSocket
            onOpen(); // Abrir modal
        }}
      >

        <CardVehiculo key={vehicle.properties.vehicleCode} vehiculo={vehicle.properties} />
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
          <div className="h-3/4 w-full overflow-y-auto">
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
              <ModalContent className="h-[750px] min-w-[850px]">
                  <ModalHeader>

                  {filteredVehiculosArray&&filteredVehiculosArray[selectedVehicleIndex]&&filteredVehiculosArray[selectedVehicleIndex]?.properties&&
                    <div className="flex flex-row gap-2">
                        
                        <div className="subEncabezado">Información del vehiculo {filteredVehiculosArray[selectedVehicleIndex].properties.vehicleCode}</div>
                        {
                              filteredVehiculosArray[selectedVehicleIndex].properties.status === "EN_TRANSITO_ORDEN"|| filteredVehiculosArray[selectedVehicleIndex].properties.status === "HACIA_ALMACEN"? (
                              <div className={"flex w-[95px] items-center pequenno border text-center justify-center bg-[#B0F8F4] text-[#4B9490] rounded-xl"}>EN TRANSITO</div>
                          ) : filteredVehiculosArray[selectedVehicleIndex].properties.status === "EN_MANTENIMIENTO"? (
                              <div className={"flex w-[95px] items-center pequenno border text-center justify-center bg-[#D0B0F8] text-[#7B15FA] rounded-xl"}>ENTREGADO</div>
                          ) : filteredVehiculosArray[selectedVehicleIndex].properties.status.includes("AVERIADO_")? (
                              <div className={"flex w-[95px] items-center pequenno border text-center justify-center bg-[#284BCC] text-[#BECCFF] rounded-xl"}>AVERIADO</div>
                          ) : (
                            <div className={"flex w-[95px] items-center pequenno border text-center justify-center bg-gray text-black rounded-xl"}>INACTIVO</div>
                          )
                        }   
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
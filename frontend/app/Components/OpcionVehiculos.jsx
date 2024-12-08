import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@nextui-org/react";
import { ChevronDown, Filter, Map, SearchX, X } from "lucide-react";
import { useAtom } from "jotai";
import { useState, useEffect, useCallback, useRef } from "react";
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
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [statusesVehicle, setStatusesVehicle] = useState(null);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const initialFilterStateRef = useRef(
      {
      vehicleType: "",
      minQuantity: 0,
      maxQuantity: null,
      status: null
      }
  )
  const [vehiclesFilter, setVehiclesFilter] = useState(initialFilterStateRef.current);
  // Ensure vehiculos is an array to avoid TypeError
  const vehiculosArray = vehiculos[0] && vehiculos[0]?.features && Array.isArray(vehiculos[0].features) ? vehiculos[0].features : [];

  // Filter vehiculosArray based on search input
  const filteredVehiculosArray = vehiculosArray.filter((vehiculo) =>
    vehiculo.properties.vehicleCode.toLowerCase().includes(searchInput.toLowerCase())
  );

  // Calculate total used and max capacity
  const capacidadUsadaTotal = filteredVehicles.reduce(
    (total, vehiculo) => total + (vehiculo.properties.capacidadUsada || 0), 0
  );
  const capacidadTotalMaxima = filteredVehicles.reduce(
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

  useEffect(() => {
    if(!isFilterModalOpen)return;
    setLoadingFilters(true)
    setVehicleTypes(["A", "B","C"]);
    setStatusesVehicle(["AVERIADO LEVE", "AVERIADO MODERADO", "AVERIADO GRAVE", "EN ALMACEN", "EN ESPERA", "EN MANTENIMIENTO", "EN TRANSITO"]);
    setLoadingFilters(false)
}, [isFilterModalOpen]);


useEffect(() => {
  if (!vehiculos || !Array.isArray(filteredVehiculosArray)) {
    setFilteredVehicles([]);
    return;
  }

  // Verificar si es el estado inicial del filtro
  const isInitialFilter = JSON.stringify(vehiclesFilter) === JSON.stringify(initialFilterStateRef.current);
  if (isInitialFilter) {
    // Prevenir actualizaciones innecesarias
    if (JSON.stringify(filteredVehicles) !== JSON.stringify(filteredVehiculosArray)) {
      setFilteredVehicles(filteredVehiculosArray);
    }
    return;
  }

  // Filtrar basado en filtros activos
  const filtered = filteredVehiculosArray.filter((vehiculo) => {
    if (!vehiculo || !vehiculo.properties) return false;

    // Filtrar por tipo de vehículo
    const matchesType = vehiclesFilter.vehicleType
      ? vehiculo.properties.tipo === vehiclesFilter.vehicleType
      : true;

    // Filtrar por estado
    const matchesStatus = vehiclesFilter.status
      ? ((vehiculo.properties.status === "EN_ALMACEN" || vehiculo.properties.status === "ORDENES_CARGADAS") && vehiclesFilter.status === "EN ALMACEN") ||
        (vehiculo.properties.status === "AVERIADO_1" && vehiclesFilter.status === "AVERIADO LEVE") ||
        (vehiculo.properties.status === "AVERIADO_2" && vehiclesFilter.status === "AVERIADO MODERADO") ||
        (vehiculo.properties.status === "AVERIADO_3" && vehiclesFilter.status === "AVERIADO GRAVE") ||
        ((vehiculo.properties.status === "EN_MANTENIMIENTO" || vehiculo.properties.status === "EN_REPARACION") && vehiclesFilter.status === "EN MANTENIMIENTO") ||
        ((vehiculo.properties.status === "EN_ESPERA_EN_OFICINA" || vehiculo.properties.status === "LISTO_PARA_RETORNO" || vehiculo.properties.status === "EN_REEMPLAZO") && vehiclesFilter.status === "EN ESPERA") ||
        ((vehiculo.properties.status === "EN_TRANSITO_ORDEN" || vehiculo.properties.status === "HACIA_ALMACEN") && vehiclesFilter.status === "EN TRANSITO")
      : true;

    // Filtrar por cantidad mínima
    const matchesMinQuantity = vehiclesFilter.minQuantity
      ? vehiculo.properties.capacidadUsada >= vehiclesFilter.minQuantity
      : true;

    // Filtrar por cantidad máxima
    const matchesMaxQuantity = vehiclesFilter.maxQuantity
      ? vehiculo.properties.capacidadUsada <= vehiclesFilter.maxQuantity
      : true;

    // Combinar todas las condiciones
    return matchesType && matchesStatus && matchesMinQuantity && matchesMaxQuantity;
  });

  // Actualizar solo si el resultado cambió
  if (JSON.stringify(filteredVehicles) !== JSON.stringify(filtered)) {
    setFilteredVehicles(filtered);
  }
}, [vehiculos, vehiclesFilter, filteredVehiculosArray]);


const StatusBadge = ({ status }) => {
  switch (status) {
      case "EN_ALMACEN":
      case "ORDENES_CARGADAS":
          return (
              <div className="pequenno border rounded-xl w-[140px] text-center bg-[#DEA71A] text-[#F9DF9B]">
                  En Almacén
              </div>
          );
      case "AVERIADO_1":
          return (
              <div className="pequenno border rounded-xl w-[140px] text-center bg-[#BE0627] text-[#FFB9C1]">
                  Avería Leve
              </div>
          );
      case "AVERIADO_2":
        return (
            <div className="pequenno border rounded-xl w-[140px] text-center bg-[#BE0627] text-[#FFB9C1]">
                Averia Moderada
            </div>
        );
      case "AVERIADO_3":
        return (
            <div className="pequenno border rounded-xl w-[140px] text-center bg-[#BE0627] text-[#FFB9C1]">
                Averiado Grave
            </div>
        );
      case "EN_MANTENIMIENTO":
      case "EN_REPARACION":
          return (
              <div className="pequenno border rounded-xl w-[140px] text-center bg-[#7B15FA] text-[#D0B0F8]">
                  En Mantenimiento
              </div>
          );
      case "EN_ESPERA_EN_OFICINA":
      case "LISTO_PARA_RETORNO":
      case "EN_REEMPLAZO":
        return (
            <div className="pequenno border rounded-xl w-[140px] text-center bg-[#7B15FA] text-[#D0B0F8]">
                En Espera
            </div>
        );
      case "EN_TRANSITO_ORDEN":
      case "HACIA_ALMACEN":
        return (
          <div className="pequenno border rounded-xl w-[140px] text-center bg-[#284BCC] text-[#BECCFF]">
            En Tránsito
          </div>
        );
      default:
        return (
            <></>
        );
  }
};
  
  const hasInitialData = Array.isArray(vehiculos);
  const hasSearchResults = hasInitialData && vehiculos.length > 0;
  const isSearching = searchInput.length > 0;

  const Row = ({ index, style}) => {
    const vehicle = filteredVehicles[index];
    return (
      (vehicle&&vehicle?.properties)&&
      <div
        style={style}
        onMouseDown={() => {          
          const indexS = vehiculosArray.findIndex(vehiculoL => vehiculoL.properties.vehicleCode === vehicle.properties.vehicleCode);  
            if(indexS!==-1)
              setSelectedVehicleIndex(indexS);
            else
              setSelectedVehicleIndex(index);
            onOpen(); // Abrir modal
        }}
      >

        <CardVehiculo vehiculo={vehicle.properties} RenderStatus={StatusBadge} key={vehicle.properties.vehicleCode}/>
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
                          {vehiclesFilter === initialFilterStateRef.current?
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
                                onClick={() => setVehiclesFilter(initialFilterStateRef.current)}
                            >
                            <X size="18" />
                            </div>
                            </>
                        )
              }
          </div>

          <div className="text-right pequenno text-[#939393]">
            Cantidad de vehículos: {filteredVehicles.length}
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
          <div className="h-3/4 w-full ">
                {!hasSearchResults && isSearching ? (
                  <NoResultsMessage />
                ) : (
                  <AutoSizer>
                    {({ height, width }) => (
                      <List
                        height={height}
                        itemCount={filteredVehicles.length}
                        itemSize={180}
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
        {(true) && (
          <Modal
              closeButton
              isOpen={isOpen}
              onOpenChange={onOpenChange}
              isDismissable={true}
              blur="true"
          >
              <ModalContent className="h-[790px] min-w-[850px] overflow-y-auto scroll-area">
                  <ModalHeader>

                  {vehiculosArray&&vehiculosArray[selectedVehicleIndex]&&vehiculosArray[selectedVehicleIndex]?.properties&&
                    
                    <div className="flex flex-row gap-2">
                        
                        <div className="subEncabezado">Información del vehiculo {vehiculosArray[selectedVehicleIndex].properties.vehicleCode}</div>
                        <StatusBadge status = {vehiculosArray[selectedVehicleIndex].properties.status} />
                    </div>
                    }
                  </ModalHeader>
                  <ModalBody>
                  {vehiculosArray&&vehiculosArray[selectedVehicleIndex]&&vehiculosArray[selectedVehicleIndex]?.properties&&
                      <ModalVehiculo vehicle={vehiculosArray[selectedVehicleIndex].properties}/>
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
                    blur="true"
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
                                                    {vehiclesFilter.vehicleType || "Selecciona un tipo"}
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
                                                  vehicleType: value,
                                              }));
                                              }}
                                            disableRipple={true}
                                            className="w-full"
                                        >
                                          {vehicleTypes && vehicleTypes.length > 0 && vehicleTypes.map((vehicleType) => (
                                                <DropdownItem key={vehicleType}>{vehicleType}</DropdownItem>
                                          ))}
                                        </DropdownMenu>
                                </Dropdown>
                                </div>
                            </div>

                            <div className="w-1/2 flex flex-row gap-4">
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
                                            className="w-full"
                                        >
                                          {statusesVehicle && statusesVehicle.length > 0 && statusesVehicle.map((vehicleStatus) => (
                                                <DropdownItem key={vehicleStatus}>{vehicleStatus}</DropdownItem>
                                          ))}
                                        </DropdownMenu>
                                </Dropdown>
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
                                          value={vehiclesFilter.maxQuantity === null ? "" : vehiclesFilter.maxQuantity}
                                          min={0}
                                          step="1"
                                          className="w-full text-right"
                                          onChange={(e) => {
                                            const value =  e.target.value === "" ? 0 : parseInt(e.target.value, 10) || 0; // Convertir a número, manejar valores vacíos
                                            
                                            setVehiclesFilter((prev) => ({
                                                ...prev,
                                                maxQuantity: value,
                                            }));
                                            
                                            
                                        }}
                                      />

                                  </div>
                              </div>
                            </div>
                        </div>
                        
                    </ModalBody>
                    <ModalFooter>
                        <div className="w-full flex flex-row justify-start">
                            <Button
                                onClick={() => setVehiclesFilter(initialFilterStateRef.current)}
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

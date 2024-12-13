import { useAtomValue, useAtom } from "jotai";
import { filteredLocationsAtom, searchInputAtom, searchQueryAtom } from '../../atoms/locationAtoms';
import { Button, DatePicker, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@nextui-org/react";
import { ChevronDown, Filter, Map, SearchX, X } from "lucide-react";
import { useEffect, useCallback, useState, useRef } from 'react';
import CapacidadTotalAlmacenes from '../Components/CapacidadTotalAlmacenes';
import LocationCard from './LocationCard';
import { useWarehouseWebSocket } from '../../hooks/useWarehouseWebSocket';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import ModalOficina from './ModalOficina'
import ModalAlmacen from './ModalAlmacen'
import { useShipmentWebSocket } from "@/hooks/useShipmentWebSocket";

export default function OpcionAlmacenes() {
  useWarehouseWebSocket();
  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();
  const locations = useAtomValue(filteredLocationsAtom);
  const [searchInput, setSearchInput] = useAtom(searchInputAtom);
  const [selectedLocationIndex, setSelectedLocationtIndex] = useState(null);
  const [, setSearchQuery] = useAtom(searchQueryAtom);
  const [isFilterModalOpen, setFilterModalOpen] = useState(false); // Estado para el modal de filtros
  const [departments, setDepartments] = useState(null);
  const [storageTypes, setStorageTypes] = useState(null);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([])
  
  const initialFilterStateRef = useRef(
      {
      storageType: "",
      department: "",
      minQuantity: 0,
      maxQuantity: null,
      }
  )
  const [locationsFilter, setLocationsFilter] = useState(initialFilterStateRef.current);

  
  useEffect(() => {
    if(!isFilterModalOpen)return;
    setLoadingFilters(true)
    setDepartments(Array.isArray(locations) ? [...new Set(locations.map(location => location.department))].sort((a, b) => a.localeCompare(b)): []);
    setStorageTypes(["PRINCIPAL", "OFICINA"]);
    setLoadingFilters(false)
}, [isFilterModalOpen]);
    

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [searchInput, setSearchQuery]);



  useEffect(() => {
        
    if(!locations){
        setFilteredLocations([]);
        return
    }
    
    if(locationsFilter === initialFilterStateRef.current){
        setFilteredLocations(locations)
        return
    }
        
    const filtered = locations.filter((location) => {
        
      // Filtrar por departamento
        const matchesType = locationsFilter.storageType
        ? (location.type === "warehouse" && locationsFilter.storageType === "PRINCIPAL")||
        (location.type === "office" && locationsFilter.storageType === "OFICINA")
        : true;
      
        // Filtrar por departamento
        const matchesDepartment = locationsFilter.department
        ? location.department === locationsFilter.department
        : true;
    
        // Filtrar por minQuantity (si se tiene un valor en shipmentsFilter.minQuantity)
        const matchesMinQuantity = locationsFilter.minQuantity
        ? location.capacity >= locationsFilter.minQuantity
        : true;

        // Filtrar por maxQuantity (si se tiene un valor en shipmentsFilter.maxQuantity)
        const matchesMaxQuantity = locationsFilter.maxQuantity
            ? location.capacity <= locationsFilter.maxQuantity
            : true;


      // Retornar true solo si todos los filtros coinciden
      return matchesType && matchesDepartment && matchesMinQuantity && matchesMaxQuantity
    });
  
    // Establecer la lista filtrada en filteredShipments
    setFilteredLocations(filtered);
}, [locations, locationsFilter]);

  const handleSearchChange = useCallback((e) => {
    setSearchInput(e.target.value);
  }, [setSearchInput]);

  const NoDataMessage = () => (
    <div className="flex flex-col items-center justify-center p-8 text-gray-500">
      <Map size={48} className="mb-4 opacity-50" />
      <p className="text-lg font-medium">No hay almacenes disponibles</p>
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

  //const warehouseCount = filteredLocations?.filter(l => l?.type === 'warehouse').length || 0;

  const hasInitialData = Array.isArray(locations);
  const hasSearchResults = hasInitialData && filteredLocations.length > 0;
  const isSearching = searchInput.length > 0;

  const Row = ({ index, style }) => {
    const location = filteredLocations.filter((feature) => !feature.ubigeo.startsWith("TEMP"))[index];
    return (
      <div style={style}
      onMouseDown={() => {
        setSelectedLocationtIndex(index);
        console.log(location)
        
        onOpen();
    }}>
        <LocationCard
          key={location.ubigeo}
          {...location}
        />
      </div>
    );
  };
  
  return (
    <div className="flex flex-col gap-4 h-full w-full">
      {!hasInitialData ? (
        <NoDataMessage />
      ) : (
        <>
          <div className="flex flex-row justify-between items-center gap-2">
            <Input
              type="text"
              placeholder="Buscar una ubicación..."
              startContent={<Map size="18" />}
              className="w-3/4"
              value={searchInput}
              onChange={handleSearchChange}
              onClear={() => setSearchInput('')}
              isClearable
            />
              {locationsFilter === initialFilterStateRef.current?
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
                                onClick={() => setLocationsFilter(initialFilterStateRef.current)}
                            >
                            <X size="18" />
                            </div>
                            </>
                        )
              }
          </div>

          <div className="text-right text-sm text-[#939393]">
            Cantidad de almacenes: {filteredLocations.filter((feature) => !feature.ubigeo.startsWith("TEMP")).length}
          </div>

          <CapacidadTotalAlmacenes />

          <div className="h-3/4 w-full">
            {!hasSearchResults && isSearching ? (
              <NoResultsMessage />
            ) : (
              <AutoSizer>
                {({ height, width }) => (
                  <List
                    height={height}
                    itemCount={filteredLocations.filter((feature) => !feature.ubigeo.startsWith("TEMP")).length}
                    itemSize={200}
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
      {(
          <Modal
              closeButton
              isOpen={isOpen}
              onOpenChange={onOpenChange}
              onClose={()=>{
                setSelectedLocationtIndex(null);
                
              }}
              isDismissable={true}
              blur="true"
          >
              <ModalContent className="h-[800px] min-w-[850px]">
                  <ModalHeader>
                      {"Información de " + (filteredLocations && filteredLocations[selectedLocationIndex] && filteredLocations[selectedLocationIndex].type==="office" ?
                      `oficina ${filteredLocations[selectedLocationIndex].province}`
                      :
                      filteredLocations && filteredLocations[selectedLocationIndex] && filteredLocations[selectedLocationIndex].type==="warehouse" ?
                      `almacén ${filteredLocations[selectedLocationIndex].province}`
                      :
                      ""
                      )}
                  </ModalHeader>
                  <ModalBody>
                      {filteredLocations && filteredLocations[selectedLocationIndex] && filteredLocations[selectedLocationIndex].type==="office" ?
                      <ModalOficina office={filteredLocations[selectedLocationIndex]} />
                      :
                      filteredLocations && filteredLocations[selectedLocationIndex] && filteredLocations[selectedLocationIndex].type==="warehouse" ?
                      <ModalAlmacen warehouse={filteredLocations[selectedLocationIndex]}/>
                      :
                      <></>
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
                <ModalContent className="h-[450px] min-w-[650px]">
                    <ModalHeader>
                        <span className="subEncabezado">Opciones de Filtro para Almacenes</span>
                    </ModalHeader>
                    <ModalBody>
                    {!loadingFilters?
                        <div className="flex flex-col gap-4">
                            {/* Contenido de filtros */}
                            <div className="w-1/2 flex flex-row gap-4">
                                <div className="flex flex-col gap-1 w-full">
                                    <div className="regular_bold">
                                        Tipo de almacén:
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
                                                {locationsFilter.storageType || "Selecciona un tipo"}
                                                </span>
                                                <ChevronDown size={18} className="absolute right-4" />
                                            </Button>
                                        </DropdownTrigger>
                                        <DropdownMenu
                                            closeOnSelect={true}
                                            selectionMode="single"
                                            onSelectionChange={(keys) => {
                                              const value = Array.from(keys).join(', '); // Obtén el valor seleccionado
                                              setLocationsFilter((prev) => ({
                                                  ...prev,
                                                  storageType: value,
                                              }));
                                              }}
                                            disableRipple={true}
                                            className="max-h-[400px] overflow-y-auto w-full"
                                        >
                                            {storageTypes && storageTypes.length > 0 && storageTypes.map((storageType) => (
                                                  <DropdownItem key={storageType}>{storageType}</DropdownItem>
                                            ))}
                                        </DropdownMenu>
                                </Dropdown>
                                </div>

                            </div>

                            <div className="w-full flex flex-row gap-4">
                                <div className="flex flex-col gap-1 w-1/2">
                                    <div className="regular_bold">
                                        Departamento:
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
                                                      {locationsFilter.department || "Selecciona una ubicación"}
                                                  </span>
                                                  <ChevronDown size={18} className="absolute right-4" />
                                                  </Button>
                                              </DropdownTrigger>
                                              <DropdownMenu
                                                  closeOnSelect={true}
                                                  selectionMode="single"
                                                  onSelectionChange={(keys) => {
                                                  const value = Array.from(keys).join(', '); // Obtén el valor seleccionado
                                                  setLocationsFilter((prev) => ({
                                                      ...prev,
                                                      department: value,
                                                  }));
                                                  }}
                                                  disableRipple={true}
                                                  className="max-h-[400px] overflow-y-auto w-full"
                                              >
                                                  {departments && departments.length > 0 && departments.map((department) => (
                                                  <DropdownItem key={department}>{department}</DropdownItem>
                                                  ))}
                                              </DropdownMenu>
                                          </Dropdown>

                                </div>
                                </div>
                                  
                            </div>
                            <div className="w-1/2 flex flex-row gap-4">
                              <div className="flex flex-col gap-1 w-full">
                                  <div className="regular_bold">
                                      Capacidad de oficina (paquetes):
                                  </div>
                                  <div className="w-full flex flex-row justify-between gap-2">
                                      <Input
                                          type="number"
                                          value={locationsFilter.minQuantity || 0}
                                          min={0}
                                          step="1"
                                          className="w-full text-right"
                                          onChange={(e) => {
                                            const value = parseInt(e.target.value, 10) || 0; // Convertir a número, manejar valores vacíos
                                            
                                            setLocationsFilter((prev) => ({
                                                ...prev,
                                                minQuantity: value,
                                            }));
                                            
                                        }}
                                      />
                                      <div className="flex items-center">hasta</div>
                                      <Input
                                          type="number"
                                          value={locationsFilter.maxQuantity === null ? "" : locationsFilter.maxQuantity}
                                          min={0}
                                          step="1"
                                          className="w-full text-right"
                                          onChange={(e) => {
                                            const value = e.target.value === "" ? 0 : parseInt(e.target.value, 10) || 0; // Convertir a número, manejar valores vacíos
                                            
                                            setLocationsFilter((prev) => ({
                                                ...prev,
                                                maxQuantity: value,
                                            }));
                                            
                                            
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
                                onClick={() => setLocationsFilter(initialFilterStateRef.current)}
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

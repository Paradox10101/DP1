import { useAtomValue, useAtom } from "jotai";
import { filteredLocationsAtom, searchInputAtom, searchQueryAtom } from '../../atoms/locationAtoms';
import { Button, DatePicker, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@nextui-org/react";
import { ChevronDown, Filter, Map, SearchX } from "lucide-react";
import { useEffect, useCallback, useState } from 'react';
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
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const selectedValue = selectedKeys.size > 0 
        ? Array.from(selectedKeys).join(", ") 
        : "Seleccione una ubicación";

  // Estado para la lista ordenada de ubicaciones
  const [sortedLocations, setSortedLocations] = useState([]);

  // Actualizar la lista ordenada cada vez que `locations` cambie
  useEffect(() => {
    
    const sorted = [...locations].sort((a, b) => {
      if (a.type === 'warehouse' && b.type !== 'warehouse') return -1;
      if (a.type !== 'warehouse' && b.type === 'warehouse') return 1;
      return a.province.localeCompare(b.province);
    });
    setSortedLocations(sorted);
      
  }, [locations]);

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

  const warehouseCount = sortedLocations?.filter(l => l?.type === 'warehouse').length || 0;

  const hasInitialData = Array.isArray(sortedLocations);
  const hasSearchResults = hasInitialData && sortedLocations.length > 0;
  const isSearching = searchInput.length > 0;

  const Row = ({ index, style }) => {
    const location = sortedLocations[index];
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
            Cantidad de almacenes: {warehouseCount}
          </div>

          <CapacidadTotalAlmacenes />

          <div className="h-3/4 w-full overflow-y-auto scroll-area">
            {!hasSearchResults && isSearching ? (
              <NoResultsMessage />
            ) : (
              <AutoSizer>
                {({ height, width }) => (
                  <List
                    height={height}
                    itemCount={sortedLocations.length}
                    itemSize={200}
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
      {(
          <Modal
              closeButton
              isOpen={isOpen}
              onOpenChange={onOpenChange}
              onClose={()=>{
                setSelectedLocationtIndex(null);
                
              }}
              isDismissable={true}
              blur
          >
              <ModalContent className="h-[800px] min-w-[850px]">
                  <ModalHeader>
                      {"Información de " + (sortedLocations && sortedLocations[selectedLocationIndex] && sortedLocations[selectedLocationIndex].type==="office" ?
                      `oficina ${sortedLocations[selectedLocationIndex].province}`
                      :
                      sortedLocations && sortedLocations[selectedLocationIndex] && sortedLocations[selectedLocationIndex].type==="warehouse" ?
                      `almacén ${sortedLocations[selectedLocationIndex].province}`
                      :
                      ""
                      )}
                  </ModalHeader>
                  <ModalBody>
                      {sortedLocations && sortedLocations[selectedLocationIndex] && sortedLocations[selectedLocationIndex].type==="office" ?
                      <ModalOficina office={sortedLocations[selectedLocationIndex]} />
                      :
                      sortedLocations && sortedLocations[selectedLocationIndex] && sortedLocations[selectedLocationIndex].type==="warehouse" ?
                      <ModalAlmacen warehouse={sortedLocations[selectedLocationIndex]}/>
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
                    blur
            >
                <ModalContent className="h-[450px] min-w-[650px]">
                    <ModalHeader>
                        <span className="subEncabezado">Opciones de Filtro para Almacenes</span>
                    </ModalHeader>
                    <ModalBody>
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
                                        Departamento:
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
                                        Provincia:
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

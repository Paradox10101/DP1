import { useAtomValue, useAtom } from "jotai";
import { filteredLocationsAtom, searchInputAtom, searchQueryAtom } from '../../atoms/locationAtoms';
import { Button, Input, Modal, ModalBody, ModalContent, ModalHeader, useDisclosure } from "@nextui-org/react";
import { Filter, Map, SearchX } from "lucide-react";
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
    </div>
  );
}

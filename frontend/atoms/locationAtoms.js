import { atom } from 'jotai';

// Átomo para almacenar las ubicaciones base
export const locationsAtom = atom(null);

export const followLocationAtom = atom(null);

// Átomo para almacenar los porcentajes de ocupación actualizados por WebSocket
export const occupancyUpdatesAtom = atom({});

// Átomo para el query de búsqueda inmediato (lo que el usuario escribe)
export const searchInputAtom = atom('');

// Átomo para el query de búsqueda con debounce (el que se usa para filtrar)
export const searchQueryAtom = atom('');

// Nuevo átomo para estadísticas totales
export const totalStatsAtom = atom({
  totalOccupancy: 0,
  warehouseCount: 0,
  timestamp: 0
});

// Átomo derivado para calcular estadísticas totales
export const warehouseStatsAtom = atom((get) => {
  const locations = get(formattedLocationsAtom);
  const occupancyUpdates = get(occupancyUpdatesAtom);
  
  if (!locations) return {
    currentPackages: 0,
    maxCapacity: 0,
    totalOccupancy: 0
  };

  return locations.reduce((stats, location) => {
    if (location.type === 'warehouse') return stats;
    
    const capacity = location.capacity || 0;
    const occupancy = occupancyUpdates[location.ubigeo]?.occupiedPercentage || location.occupiedPercentage || 0;
    const currentPackages = Math.round(capacity * (occupancy / 100));

    return {
      currentPackages: stats.currentPackages + currentPackages,
      maxCapacity: stats.maxCapacity + capacity,
      totalOccupancy: stats.maxCapacity > 0 
        ? ((stats.currentPackages + currentPackages) / (stats.maxCapacity + capacity)) * 100 
        : 0
    };
  }, { currentPackages: 0, maxCapacity: 0, totalOccupancy: 0 });
});

// Átomo derivado que combina las ubicaciones con los updates de ocupación
export const formattedLocationsAtom = atom((get) => {
  const locations = get(locationsAtom);
  const occupancyUpdates = get(occupancyUpdatesAtom);

  if (!locations?.features) return null;

  return locations.features.map(feature => {
    const properties = feature.properties;
    const ubigeo = properties.ubigeo;
    const update = occupancyUpdates[ubigeo];

    return {
      type: properties.type,
      province: properties.province,
      department: properties.department,
      ubigeo: properties.ubigeo,
      region: properties.region,
      latitude: feature.geometry.coordinates[1],
      longitude: feature.geometry.coordinates[0],
      capacity: properties.capacity,
      occupiedPercentage: update ? update.occupiedPercentage : (properties.occupiedPercentage || 0),
      shipments: properties?.message?properties.message:[]
    };
  });
});

// Función de búsqueda optimizada
const searchLocation = (location, searchQuery) => {
  const query = searchQuery.toLowerCase();
  const searchableFields = [
    location?.province,
    location?.ubigeo,
    location?.department,
    location?.region
  ];
  
  return searchableFields.some(field => 
    field?.toLowerCase().includes(query)
  );
};

// Átomo derivado para ubicaciones filtradas con búsqueda optimizada
export const filteredLocationsAtom = atom((get) => {
  try {
    const locations = get(formattedLocationsAtom);
    const searchQuery = get(searchQueryAtom);

    if (!locations) return null;
    if (!searchQuery) return locations;

    console.log("OBJETIVO: ELIMINAR PUNTOS DE AVERIA", locations)
    return locations.filter(location => searchLocation(location, searchQuery));
  } catch (error) {
    console.error('Error filtrando ubicaciones:', error);
    return null;
  }
});
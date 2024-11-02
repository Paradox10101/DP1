import { atom } from 'jotai';

// Átomo para almacenar las ubicaciones base
export const locationsAtom = atom(null);

// Átomo para almacenar los porcentajes de ocupación actualizados por WebSocket
export const occupancyUpdatesAtom = atom({});

// Átomo para el query de búsqueda inmediato (lo que el usuario escribe)
export const searchInputAtom = atom('');

// Átomo para el query de búsqueda con debounce (el que se usa para filtrar)
export const searchQueryAtom = atom('');

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
      occupiedPercentage: update ? update.occupiedPercentage : (properties.occupiedPercentage || 0)
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

    return locations.filter(location => searchLocation(location, searchQuery));
  } catch (error) {
    console.error('Error filtrando ubicaciones:', error);
    return null;
  }
});
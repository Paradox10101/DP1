const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? process.env.NEXT_PUBLIC_API_BASE_URL_PROD
  : process.env.NEXT_PUBLIC_API_BASE_URL;

const fetchLocations = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/locations/info`);
    const data = await response.json();
    return data.locations.reduce((acc, location) => {
      acc[location.ubigeo] = {
        ...location,
        name: location.province
      };
      return acc;
    }, {});
  } catch (error) {
    console.error('Error fetching locations:', error);
    return {};
  }
};

const calculateDueDate = (orderDateTime, destinationUbigeo, locations) => {
  // Validar que todos los parámetros necesarios estén presentes
  if (!orderDateTime || !destinationUbigeo || !locations) {
    console.warn('Missing required parameters for calculateDueDate', {
      hasOrderDateTime: !!orderDateTime,
      hasDestinationUbigeo: !!destinationUbigeo,
      hasLocations: !!locations
    });
    return addDays(new Date(), 1); // Fecha por defecto
  }

  const destination = locations[destinationUbigeo];
  if (!destination) {
    console.warn('Destination not found in locations data', { destinationUbigeo });
    return addDays(orderDateTime, 1); // Default due date
  }

  const naturalRegion = (destination.naturalRegion || '').toUpperCase();
  
  switch (naturalRegion) {
    case 'COSTA':
      return addDays(orderDateTime, 1);
    case 'SIERRA':
      return addDays(orderDateTime, 2);
    case 'SELVA':
      return addDays(orderDateTime, 3);
    default:
      console.warn('Unknown natural region', { naturalRegion });
      return addDays(orderDateTime, 1);
  }
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const formatDateTime = (date) => {
  if (!date) return '-';
  return new Intl.DateTimeFormat('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(date);
};

export const locationService = {
  fetchLocations,
  calculateDueDate,
  formatDateTime
};
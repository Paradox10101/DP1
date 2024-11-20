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
    console.log("ubicaciones: ", locations);
    
    const destination = locations[destinationUbigeo];
    if (!destination) {
      return addDays(orderDateTime, 1); // Default due date
    }
  
    const naturalRegion = destination.naturalRegion?.toUpperCase();
    console.log("region es: ", naturalRegion);

    switch (naturalRegion) {
      case 'COSTA':
        return addDays(orderDateTime, 1);
      case 'SIERRA':
        return addDays(orderDateTime, 2);
      case 'SELVA':
        return addDays(orderDateTime, 3);
      default:
        return addDays(orderDateTime, 1);
    }
  };
  
  const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };
  
  const formatDateTime = (date) => {
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
import { atom } from 'jotai';

// Átomo para almacenar los envios base
export const shipmentsAtom = atom(null);

// Átomo para el query de búsqueda inmediato (lo que el usuario escribe)
export const searchInputAtom = atom('');

// Átomo para el query de búsqueda con debounce (el que se usa para filtrar)
export const searchQueryAtom = atom('');

// Nuevo átomo para estadísticas totales
export const totalStatsAtom = atom({
  shipmentCount: 0,
});

// Nuevo átomo para almacenar el envío seleccionado
export const selectedShipmentAtom = atom(null);

// Átomo derivado que combina las ubicaciones con los updates de ocupación
export const formattedShipmentsAtom = atom((get) => {
  const shipments = get(shipmentsAtom);

  if (!shipments?.features) return null;

  return shipments.features.map(feature => {
    const order = feature.order;
    
    return {
      id: order.id,
      orderCode: order.orderCode,
      status: order.status,
      quantity: order.quantity,
      originCity: order.originCity,
      destinationCity: order.destinationCity,
      destinationRegion: order.destinationRegion,
      status: order.status,
      orderTime: order.orderTime,
      dueTime: order.dueTime,
      timeElapsedDays: order.timeElapsedDays !== -1 ? order.timeElapsedDays : feature.timeElapsedDays,
      timeElapsedHours: order.timeElapsedHours !== -1 ? order.timeElapsedHours : feature.timeElapsedHours,
      quantityVehicles: order.quantityVehicles,
      vehicles: feature.vehicles
    };
  });
});

// Función de búsqueda optimizada
const searchShipment = (order, searchQuery) => {
  const query = searchQuery.toLowerCase();
  const searchableFields = [
    order?.originCity,
    order?.destinationCity,
    order?.orderCode,
  ];
  
  return searchableFields.some(field => 
    field?.toLowerCase().includes(query)
  );
};

// Átomo derivado para envios filtrados con búsqueda optimizada
export const filteredShipmentsAtom = atom((get) => {
  try {
    const shipments = get(formattedShipmentsAtom);
    const searchQuery = get(searchQueryAtom);

    if (!shipments) return null;
    if (!searchQuery) return shipments;

    return shipments.filter(shipment => searchShipment(shipment, searchQuery));
  } catch (error) {
    console.error('Error filtrando envíos:', error);
    return null;
  }
});

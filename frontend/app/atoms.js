import { atom } from 'jotai';

// Átomo para la posición de los vehículos
export const vehiclePositionsAtom = atom({
    type: 'FeatureCollection',
    features: [],
  });

export const vehiclePositionsListAtom = atom({
  type: 'FeatureCollection',
  features: [],
});

// Átomo para el estado de carga
export const loadingAtom = atom('idle');

// Átomo para errores
export const errorAtom = atom(null);

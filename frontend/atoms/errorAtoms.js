// atoms/errorAtoms.js
import { atom } from 'jotai';

// Estructura simplificada de error
export const errorAtom = atom(null);

// Tipos de error constantes
export const ErrorTypes = {
  CONNECTION: 'CONNECTION',
  SIMULATION: 'SIMULATION',
  WEBSOCKET: 'WEBSOCKET'
};

// Mensajes de error predefinidos
export const ERROR_MESSAGES = {
  [ErrorTypes.CONNECTION]: {
    title: 'Servidor no disponible',
    message: 'No se puede conectar con el servidor. Por favor, verifica que el servidor esté en funcionamiento.',
    action: 'Intentar reconectar'
  },
  [ErrorTypes.SIMULATION]: {
    title: 'Error de simulación',
    message: 'Ha ocurrido un error en la simulación.',
    action: 'Reintentar'
  }
};
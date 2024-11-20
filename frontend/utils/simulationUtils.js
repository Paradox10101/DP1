const SimulationStatus = {
    RUNNING: 'running',
    PAUSED: 'paused',
    STOPPED: 'stopped',
    DISCONNECTED: 'disconnected'
};

const STATUS_CONFIG = {
    [SimulationStatus.RUNNING]: {
      color: 'text-green-600',
      text: 'En ejecución'
    },
    [SimulationStatus.PAUSED]: {
      color: 'text-yellow-600',
      text: 'Pausado'
    },
    [SimulationStatus.STOPPED]: {
      color: 'text-red-600',
      text: 'Detenido'
    },
    [SimulationStatus.DISCONNECTED]: {
      color: 'text-gray-600',
      text: 'Desconectado'
    }
  };
  
  export const getStatusConfig = (status, isServerAvailable) => {
    if (!isServerAvailable) {
      return {
        color: 'text-gray-600',
        text: 'Servidor no disponible'
      };
    }
    return STATUS_CONFIG[status] || {
      color: 'text-gray-600',
      text: 'Desconocido'
    };
  };
  
export const ANIMATION_CONFIG = {
    // Configuración base
    BASE: {
      BUFFER_SIZE: 3,
      MIN_UPDATE_INTERVAL: 16,
      INTERPOLATION_SMOOTHING: 0.1,
      BATCH_SIZE: 10,
      DISTANCE_THRESHOLD: 0.0001, // Umbral mínimo para actualizar posición
      MAX_VEHICLES: 100, // Límite máximo de vehículos
      CLUSTER_THRESHOLD: 50 // Número de vehículos para activar clustering
    },
  
    // Configuración adaptativa
    PERFORMANCE: {
      LOW: {
        UPDATE_INTERVAL: 33,
        BUFFER_SIZE: 2,
        SMOOTHING: 0.2,
        BATCH_SIZE: 5
      },
      MEDIUM: {
        UPDATE_INTERVAL: 24,
        BUFFER_SIZE: 3,
        SMOOTHING: 0.15,
        BATCH_SIZE: 8
      },
      HIGH: {
        UPDATE_INTERVAL: 16,
        BUFFER_SIZE: 4,
        SMOOTHING: 0.1,
        BATCH_SIZE: 12
      }
    }
  };
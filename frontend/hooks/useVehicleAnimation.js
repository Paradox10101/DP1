import { useRef, useCallback, useEffect } from 'react';

const ANIMATION_CONFIG = {
  BASE: {
    BUFFER_SIZE: 4,
    MIN_UPDATE_INTERVAL: 16,
    INTERPOLATION_SMOOTHING: 0.15,
    BATCH_SIZE: 15,
    DISTANCE_THRESHOLD: 0.00005,
    MAX_VEHICLES: 150,
    CLUSTER_THRESHOLD: 75,
    FPS_SAMPLE_SIZE: 10,
    PERFORMANCE_HYSTERESIS: 5,
    DAMPING_FACTOR: 0.85,          // Nuevo factor de amortiguación
    VELOCITY_THRESHOLD: 0.0001,    // Nuevo umbral de velocidad
    POSITION_TOLERANCE: 0.00001    // Nueva tolerancia de posición
  },
  PERFORMANCE: {
    LOW: {
      UPDATE_INTERVAL: 33,
      BUFFER_SIZE: 3,
      SMOOTHING: 0.20,            // Ajustado para ser más suave
      BATCH_SIZE: 8,
      DAMPING: 0.9               // Mayor amortiguación en bajo rendimiento
    },
    MEDIUM: {
      UPDATE_INTERVAL: 24,
      BUFFER_SIZE: 4,
      SMOOTHING: 0.17,            // Ajustado para ser más suave
      BATCH_SIZE: 12,
      DAMPING: 0.87             // Amortiguación media
    },
    HIGH: {
      UPDATE_INTERVAL: 24,
      BUFFER_SIZE: 5,
      SMOOTHING: 0.15,          // Ajustado para ser más suave
      BATCH_SIZE: 15,
      DAMPING: 0.85            // Amortiguación estándar
    }
  }
};

class PerformanceManager {
  constructor() {
    this.metrics = {
      fps: 0,
      frameTime: 0,
      vehicleCount: 0,
      lastUpdate: performance.now(),
      frames: 0,
      fpsHistory: new Array(ANIMATION_CONFIG.BASE.FPS_SAMPLE_SIZE).fill(60)
    };
    this.performanceLevel = 'MEDIUM';
    this.lastLevelChange = performance.now();
    this.monitor();
  }

  monitor() {
    const currentTime = performance.now();
    const delta = currentTime - this.metrics.lastUpdate;

    if (delta >= 1000) {
      const currentFps = (this.metrics.frames * 1000) / delta;
      this.metrics.fpsHistory.shift();
      this.metrics.fpsHistory.push(currentFps);
      this.metrics.fps = this.metrics.fpsHistory.reduce((a, b) => a + b) / 
                        ANIMATION_CONFIG.BASE.FPS_SAMPLE_SIZE;
      
      if (currentTime - this.lastLevelChange > 2000) {
        this.updatePerformanceLevel();
      }
      
      this.metrics.frames = 0;
      this.metrics.lastUpdate = currentTime;
    }

    this.metrics.frames++;
    requestAnimationFrame(() => this.monitor());
  }

  updatePerformanceLevel() {
    const currentFps = this.metrics.fps;
    const hysteresis = ANIMATION_CONFIG.BASE.PERFORMANCE_HYSTERESIS;
    
    if (currentFps < 30 - hysteresis && this.performanceLevel !== 'LOW') {
      this.performanceLevel = 'LOW';
      this.lastLevelChange = performance.now();
    } else if (currentFps > 30 + hysteresis && currentFps < 45 - hysteresis && 
               this.performanceLevel !== 'MEDIUM') {
      this.performanceLevel = 'MEDIUM';
      this.lastLevelChange = performance.now();
    } else if (currentFps > 45 + hysteresis && this.performanceLevel !== 'HIGH') {
      this.performanceLevel = 'HIGH';
      this.lastLevelChange = performance.now();
    }
  }

  getConfig() {
    return {
      ...ANIMATION_CONFIG.BASE,
      ...ANIMATION_CONFIG.PERFORMANCE[this.performanceLevel]
    };
  }
}

class OptimizedVehicleState {
  constructor(initialPosition) {
    this.positionBuffer = new Float32Array(4);    // x, y, prevX, prevY
    this.velocity = new Float32Array(2);          // vx, vy
    this.targetPosition = new Float32Array(2);    // targetX, targetY
    this.acceleration = new Float32Array(2);      // ax, ay
    this.lastUpdateTime = performance.now();
    this.active = true;
    
    if (initialPosition) {
      this.positionBuffer[0] = initialPosition[0];
      this.positionBuffer[1] = initialPosition[1];
      this.positionBuffer[2] = initialPosition[0];
      this.positionBuffer[3] = initialPosition[1];
      this.targetPosition[0] = initialPosition[0];
      this.targetPosition[1] = initialPosition[1];
    }
  }

  updatePosition(newPosition, deltaTime, config) {
    // Actualizar posición objetivo
    this.targetPosition[0] = newPosition[0];
    this.targetPosition[1] = newPosition[1];
  
    // Calcular diferencia al objetivo
    const dx = this.targetPosition[0] - this.positionBuffer[0];
    const dy = this.targetPosition[1] - this.positionBuffer[1];
    const distanceSquared = dx * dx + dy * dy;
  
    // Si la distancia es muy pequeña, simplemente mantener la posición actual
    if (distanceSquared < config.POSITION_TOLERANCE * config.POSITION_TOLERANCE) {
      this.velocity[0] = 0;
      this.velocity[1] = 0;
      this.positionBuffer[0] = this.targetPosition[0];
      this.positionBuffer[1] = this.targetPosition[1];
      return false;
    }
  
    // Calcular velocidades usando la función de suavizado actualizada
    const smoothing = config.SMOOTHING;
    this.velocity[0] = calculateSmoothVelocity(
      this.positionBuffer[0],
      this.targetPosition[0],
      smoothing
    );
    this.velocity[1] = calculateSmoothVelocity(
      this.positionBuffer[1],
      this.targetPosition[1],
      smoothing
    );
  
    // Aplicar amortiguación
    this.velocity[0] *= config.DAMPING_FACTOR;
    this.velocity[1] *= config.DAMPING_FACTOR;
  
    // Actualizar posiciones previas
    this.positionBuffer[2] = this.positionBuffer[0];
    this.positionBuffer[3] = this.positionBuffer[1];
  
    // Actualizar posición actual con la velocidad suavizada
    this.positionBuffer[0] += this.velocity[0];
    this.positionBuffer[1] += this.velocity[1];
  
    // Verificar si hemos pasado la posición objetivo y ajustar si es necesario
    const newDx = this.targetPosition[0] - this.positionBuffer[0];
    const newDy = this.targetPosition[1] - this.positionBuffer[1];
  
    // Si el producto de las diferencias cambia de signo, hemos sobrepasado el objetivo
    if ((dx * newDx + dy * newDy) <= 0) {
      // Establecer la posición actual a la posición objetivo
      this.positionBuffer[0] = this.targetPosition[0];
      this.positionBuffer[1] = this.targetPosition[1];
      this.velocity[0] = 0;
      this.velocity[1] = 0;
      return false;
    }
  
    return true;
  }  

  getPosition() {
    return [this.positionBuffer[0], this.positionBuffer[1]];
  }
}

// Función auxiliar para el cálculo de la velocidad
function calculateSmoothVelocity(current, target, smoothing) {
  const difference = target - current;
  return difference * smoothing;
}

export const useVehicleAnimation = (mapRef, updatePopups) => {
  const workerRef = useRef(null);
  const performanceManagerRef = useRef(new PerformanceManager());
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    if (typeof window !== 'undefined') {
      workerRef.current = new Worker(
        new URL('../workers/vehicleWorker.js', import.meta.url)
      );

      workerRef.current.onmessage = (e) => {
        if (!isMountedRef.current) return;

        const { type, features } = e.data;
        if (type === 'update') {
          const source = mapRef.current.getSource('vehicles');
          if (source) {
            source.setData({
              type: 'FeatureCollection',
              features,
            });
            updatePopups({ type: 'FeatureCollection', features });
          }
        }
      };
    }

    return () => {
      isMountedRef.current = false;
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [mapRef, updatePopups]);

  const animateTransition = useCallback((data) => {
    if (!workerRef.current || !data?.features?.length) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - (performanceManagerRef.current.lastFrameTime || currentTime);
    performanceManagerRef.current.lastFrameTime = currentTime;

    const config = performanceManagerRef.current.getConfig();
    config.deltaTime = deltaTime;

    workerRef.current.postMessage({ data, config });
  }, []);

  return {
    animateTransition,
    performanceManager: performanceManagerRef.current,
  };
};
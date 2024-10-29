// /utils/AnimationManager.js
import { ANIMATION_CONFIG } from './animationConfig';
import PerformanceManager from '../utils/PerformanceManager';

class AnimationManager {
    constructor(map) {
      this.map = map;
      this.performanceManager = new PerformanceManager();
      this.vehicleStates = new Map();
      this.workerPool = this.initializeWorkerPool();
      this.lastFrameTime = performance.now();
      this.isAnimating = false;
    }
  
    initializeWorkerPool() {
        const workerCount = navigator.hardwareConcurrency || 2;
        const pool = [];
        
        for (let i = 0; i < workerCount; i++) {
          // Utilizar new URL para importar el worker
          const worker = new Worker(new URL('../workers/animation-worker.js', import.meta.url), { type: 'module' });
          pool.push(worker);
        }
        
        return pool;
    }
  
    updateVehicles(vehiclesData) {
      const config = this.performanceManager.getConfig();
      const currentTime = performance.now();
      const deltaTime = currentTime - this.lastFrameTime;
  
      if (deltaTime < config.UPDATE_INTERVAL) {
        return;
      }
  
      // Procesar vehículos en lotes para mejor rendimiento
      const batches = this.createBatches(vehiclesData.features, config.BATCH_SIZE);
      
      batches.forEach((batch, index) => {
        const worker = this.workerPool[index % this.workerPool.length];
        
        worker.postMessage({
          batch,
          deltaTime,
          config
        });
      });
  
      this.lastFrameTime = currentTime;
    }
  
    createBatches(vehicles, batchSize) {
      const batches = [];
      for (let i = 0; i < vehicles.length; i += batchSize) {
        batches.push(vehicles.slice(i, i + batchSize));
      }
      return batches;
    }
  
    processWorkerResult(result) {
      const updatedFeatures = result.features.filter(feature => feature.updated);
      
      if (updatedFeatures.length > 0) {
        // Actualizar source de MapLibre solo si hay cambios
        if (this.map.getSource('vehicles')) {
          this.map.getSource('vehicles').setData({
            type: 'FeatureCollection',
            features: updatedFeatures
          });
        }
      }
    }
  
    cleanup() {
      this.isAnimating = false;
      this.workerPool.forEach(worker => worker.terminate());
      this.vehicleStates.clear();
    }
}

export default AnimationManager;
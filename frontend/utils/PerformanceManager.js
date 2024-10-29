import { ANIMATION_CONFIG } from './animationConfig';
import { useEffect } from 'react';

class PerformanceManager {
  constructor() {
    this.metrics = {
      fps: 0,
      frameTime: 0,
      vehicleCount: 0,
      lastUpdate: typeof window !== 'undefined' ? performance.now() : 0,
      frames: 0
    };
    this.performanceLevel = 'MEDIUM';
    
    // Solo iniciar el monitor si estamos en el cliente
    if (typeof window !== 'undefined') {
      this.monitor();
    }
  }

  monitor() {
    // Verificar que estamos en el cliente
    if (typeof window === 'undefined') return;

    const currentTime = performance.now();
    const delta = currentTime - this.metrics.lastUpdate;

    if (delta >= 1000) {
      this.metrics.fps = (this.metrics.frames * 1000) / delta;
      this.updatePerformanceLevel();
      this.metrics.frames = 0;
      this.metrics.lastUpdate = currentTime;
    }

    this.metrics.frames++;
    window.requestAnimationFrame(() => this.monitor());
  }

  updatePerformanceLevel() {
    if (this.metrics.fps < 30) {
      this.performanceLevel = 'LOW';
    } else if (this.metrics.fps < 45) {
      this.performanceLevel = 'MEDIUM';
    } else {
      this.performanceLevel = 'HIGH';
    }
  }

  getConfig() {
    return {
      ...ANIMATION_CONFIG.BASE,
      ...ANIMATION_CONFIG.PERFORMANCE[this.performanceLevel]
    };
  }
}

export default PerformanceManager;

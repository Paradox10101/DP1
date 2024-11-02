// src/utils/VehicleAnimation.js
export const ANIMATION_CONFIG = {
    BASE: {
      BUFFER_SIZE: 3,
      MIN_UPDATE_INTERVAL: 16,
      INTERPOLATION_SMOOTHING: 0.1,
      BATCH_SIZE: 10,
      DISTANCE_THRESHOLD: 0.0001,
      MAX_VEHICLES: 100,
      CLUSTER_THRESHOLD: 50
    },
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
  
  export class VehicleAnimationState {
    constructor(initialPosition) {
      this.position = initialPosition ? [...initialPosition] : [0, 0];
      this.velocity = [0, 0];
      this.buffer = new Array(ANIMATION_CONFIG.BASE.BUFFER_SIZE).fill().map(() => 
        [...(initialPosition || [0, 0])]
      );
      this.lastUpdateTime = performance.now();
      this.active = true;
      this.visible = true;
    }
  
    updatePosition(newPosition, deltaTime, config) {
      const dx = newPosition[0] - this.position[0];
      const dy = newPosition[1] - this.position[1];
      
      if (Math.hypot(dx, dy) > config.DISTANCE_THRESHOLD) {
        this.velocity[0] += (dx * config.SMOOTHING - this.velocity[0]) * 0.1;
        this.velocity[1] += (dy * config.SMOOTHING - this.velocity[1]) * 0.1;
  
        this.position[0] += this.velocity[0] * (deltaTime / 1000);
        this.position[1] += this.velocity[1] * (deltaTime / 1000);
        
        this.buffer.unshift([...this.position]);
        this.buffer.pop();
        
        return true;
      }
      return false;
    }
}
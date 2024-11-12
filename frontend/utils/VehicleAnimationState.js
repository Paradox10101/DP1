import { ANIMATION_CONFIG } from './animationConfig';

class VehicleAnimationState {
    constructor(initialPosition) {
      // Usar SharedArrayBuffer si está disponible para mejor rendimiento
      const bufferConstructor = typeof SharedArrayBuffer !== 'undefined' ? 
        SharedArrayBuffer : ArrayBuffer;
  
      this.positionBuffer = new Float32Array(new bufferConstructor(ANIMATION_CONFIG.BASE.BUFFER_SIZE * 2));
      this.velocity = new Float32Array(new bufferConstructor(2));
      this.acceleration = new Float32Array(new bufferConstructor(2));
      
      this.lastUpdateTime = performance.now();
      this.active = true;
      this.visible = true;
      
      if (initialPosition) {
        this.positionBuffer[0] = initialPosition[0];
        this.positionBuffer[1] = initialPosition[1];
      }
    }
  
    updatePosition(newPosition, deltaTime) {
      const dx = newPosition[0] - this.positionBuffer[0];
      const dy = newPosition[1] - this.positionBuffer[1];
      
      // Solo actualizar si el movimiento es significativo
      if (Math.hypot(dx, dy) > ANIMATION_CONFIG.BASE.DISTANCE_THRESHOLD) {
        // Actualizar velocidad con suavizado
        const config = performanceManager.getConfig();
        
        this.velocity[0] += (dx * config.SMOOTHING - this.velocity[0]) * 0.1;
        this.velocity[1] += (dy * config.SMOOTHING - this.velocity[1]) * 0.1;
  
        // Actualizar posición
        this.positionBuffer[0] += this.velocity[0] * (deltaTime / 1000);
        this.positionBuffer[1] += this.velocity[1] * (deltaTime / 1000);
        
        return true;
      }
      return false;
    }
}

export default VehicleAnimationState;

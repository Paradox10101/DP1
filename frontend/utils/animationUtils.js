export class VehicleAnimationState {
    constructor() {
      this.positionBuffer = [];
      this.lastUpdateTime = 0;
      this.currentAnimation = null;
      this.velocity = { x: 0, y: 0 };
      this.acceleration = { x: 0, y: 0 };
    }
  }
  
  export const getOrCreateVehicleState = (vehicleCode, stateRef) => {
    if (!stateRef.current.has(vehicleCode)) {
      stateRef.current.set(vehicleCode, new VehicleAnimationState());
    }
    return stateRef.current.get(vehicleCode);
  };
  
  export const isAnimationComplete = (interpolatedFeatures, targetData) => {
    return interpolatedFeatures.every((feature, index) => {
      const target = targetData.features[index];
      const coords = feature.geometry.coordinates;
      const targetCoords = target.geometry.coordinates;
      const distance = Math.hypot(
        coords[0] - targetCoords[0],
        coords[1] - targetCoords[1]
      );
      return distance < 0.0001;
    });
  };
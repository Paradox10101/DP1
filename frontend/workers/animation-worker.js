// /workers/animation-worker.js
import { ANIMATION_CONFIG } from '../utils/animationConfig';

let vehicleStates = new Map();

const updateVehiclePosition = (vehicleCode, newPosition, deltaTime, config) => {
  let state = vehicleStates.get(vehicleCode);
  
  if (!state) {
    state = {
      position: [...newPosition],
      velocity: [0, 0]
    };
    vehicleStates.set(vehicleCode, state);
  }

  const dx = newPosition[0] - state.position[0];
  const dy = newPosition[1] - state.position[1];

  if (Math.hypot(dx, dy) > config.DISTANCE_THRESHOLD) {
    state.velocity[0] += (dx * config.SMOOTHING - state.velocity[0]) * 0.1;
    state.velocity[1] += (dy * config.SMOOTHING - state.velocity[1]) * 0.1;

    state.position[0] += state.velocity[0] * (deltaTime / 1000);
    state.position[1] += state.velocity[1] * (deltaTime / 1000);

    return {
      coordinates: [...state.position],
      updated: true
    };
  }

  return {
    coordinates: [...state.position],
    updated: false
  };
};

self.onmessage = function(e) {
  const { batch, deltaTime, config } = e.data;

  const updatedFeatures = batch.map(feature => {
    const result = updateVehiclePosition(
      feature.properties.vehicleCode,
      feature.geometry.coordinates,
      deltaTime,
      config
    );

    return {
      ...feature,
      geometry: {
        ...feature.geometry,
        coordinates: result.coordinates
      },
      updated: result.updated
    };
  });

  self.postMessage({ features: updatedFeatures });
};
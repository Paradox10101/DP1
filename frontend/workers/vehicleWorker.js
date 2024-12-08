const vehicleStates = new Map();

class OptimizedVehicleState {
  constructor(initialPosition) {
    this.position = initialPosition.slice();
    this.velocity = [0, 0];
    this.targetPosition = initialPosition.slice();
  }

  updatePosition(newPosition, deltaTime, config) {
    this.targetPosition = newPosition.slice();

    const dx = this.targetPosition[0] - this.position[0];
    const dy = this.targetPosition[1] - this.position[1];
    const distanceSquared = dx * dx + dy * dy;

    if (distanceSquared < config.POSITION_TOLERANCE * config.POSITION_TOLERANCE) {
      this.velocity[0] = 0;
      this.velocity[1] = 0;
      this.position[0] = this.targetPosition[0];
      this.position[1] = this.targetPosition[1];
      return false;
    }

    const smoothing = config.SMOOTHING;
    this.velocity[0] = calculateSmoothVelocity(
      this.position[0],
      this.targetPosition[0],
      smoothing
    );
    this.velocity[1] = calculateSmoothVelocity(
      this.position[1],
      this.targetPosition[1],
      smoothing
    );

    this.velocity[0] *= config.DAMPING_FACTOR;
    this.velocity[1] *= config.DAMPING_FACTOR;

    this.position[0] += this.velocity[0];
    this.position[1] += this.velocity[1];

    const newDx = this.targetPosition[0] - this.position[0];
    const newDy = this.targetPosition[1] - this.position[1];

    if ((dx * newDx + dy * newDy) <= 0) {
      this.position[0] = this.targetPosition[0];
      this.position[1] = this.targetPosition[1];
      this.velocity[0] = 0;
      this.velocity[1] = 0;
      return false;
    }

    return true;
  }

  getPosition() {
    return this.position.slice();
  }
}

function calculateSmoothVelocity(current, target, smoothing) {
  const difference = target - current;
  return difference * smoothing;
}

self.onmessage = (e) => {
  const { data, config } = e.data;

  if(!(data&&data.features)) return;

  const updatedFeatures = data.features.map(feature => {
    const vehicleCode = feature.properties.vehicleCode;
    let state = vehicleStates.get(vehicleCode);

    if (!state) {
      state = new OptimizedVehicleState(feature.geometry.coordinates);
      vehicleStates.set(vehicleCode, state);
    }

    state.updatePosition(feature.geometry.coordinates, config.deltaTime, config);

    return {
      ...feature,
      geometry: {
        ...feature.geometry,
        coordinates: state.getPosition()
      }
    };
  });

  self.postMessage({
    type: 'update',
    features: updatedFeatures,
  });
};

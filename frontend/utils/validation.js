export const isValidGeoJSON = (data) => {
    try {
      return (
        data &&
        data.type === 'FeatureCollection' &&
        Array.isArray(data.features) &&
        data.features.every(feature => 
          feature.type === 'Feature' &&
          feature.geometry &&
          Array.isArray(feature.geometry.coordinates) &&
          feature.properties
        )
      );
    } catch (error) {
      return false;
    }
  };
  
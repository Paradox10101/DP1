// src/utils/mapUtils.js
import maplibregl from 'maplibre-gl';

export const loadCustomImage = async (map, name, url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const blob = await response.blob();
    const imageBitmap = await createImageBitmap(blob);
    if (!map.hasImage(name)) {
      map.addImage(name, imageBitmap);
    }
  } catch (error) {
    console.error(`Error al cargar icono ${name}:`, error);
    throw new Error(`Error al cargar icono ${name}`);
  }
};

export const createCenterControl = () => {
  class CenterControl {
    onAdd(map) {
      this.map = map;
      this.container = document.createElement('button');
      this.container.className = 'maplibregl-ctrl-icon';
      this.container.type = 'button';
      this.container.title = 'Centrar mapa en Perú';

      this.container.style.backgroundImage = 'url(data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 0l3 6h6l-5 4 2 6-6-4-6 4 2-6-5-4h6z" fill="#000"/>
        </svg>
      `) + ')';
      this.container.style.backgroundSize = '18px';
      this.container.style.border = 'none';
      this.container.style.cursor = 'pointer';

      this.container.onclick = () => {
        map.flyTo({ 
          center: MAP_CONFIG.DEFAULT_CENTER, 
          zoom: MAP_CONFIG.DEFAULT_ZOOM 
        });
      };

      return this.container;
    }

    onRemove() {
      this.container.parentNode.removeChild(this.container);
      this.map = undefined;
    }
  }

  return new CenterControl();
};

export const fitMapToVehicles = (map, geojson) => {
  if (!map) return;

  const bounds = new maplibregl.LngLatBounds();

  geojson.features.forEach((feature) => {
    bounds.extend(feature.geometry.coordinates);
  });

  map.fitBounds(bounds, { padding: 50, animate: true });
};
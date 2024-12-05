// src/config/mapConfig.js

export const MAP_CONFIG = {
    // Configuración básica del mapa
    STYLE_URL: 'https://api.maptiler.com/maps/openstreetmap/style.json?key=i1ya2uBOpNFu9czrsnbD',
    DEFAULT_CENTER: [-76.991, -12.046],
    DEFAULT_ZOOM: 6,
    
    // Configuración de fuentes
    SOURCES: {
      VEHICLES: {
        id: 'vehicles',
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      },
      LOCATIONS: {
        id: 'locations',
        type: 'geojson',
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
        data: { type: 'FeatureCollection', features: [] }
      }
    },
  
    // Configuración de capas
    LAYERS: {
      VEHICLES: {
        SYMBOL: 'vehicles-symbol-layer',
        CIRCLE: 'vehicles-circle-layer',
        TEXT: 'vehicles-text-layer'
      },
      LOCATIONS: {
        CLUSTERS: 'clusters',
        CLUSTER_COUNT: 'cluster-count',
        WAREHOUSES: 'unclustered-warehouses',
        OFFICES: 'unclustered-offices'
      }
    },
  
    // Configuración de imágenes
    IMAGES: {
      WAREHOUSE: {
        id: 'warehouse-icon',
        url: '/warehouse-icon.png'
      },
      OFFICE: {
        id: 'office-icon',
        url: '/office-icon.png'
      },
      CAR_FRONT: {
        id: 'car-front-icon',
        url: '/car-front.png'
      },
      CAR2: {
        id: 'car2-icon',
        url: '/car2.png'
      },
      CAR_BREAK: {
        id: 'carBreak-icon',
        url: '/carBreak.png'
      },
      TRUCK: {
        id: 'truck-icon',
        url: '/truck.png'
      }      
    }
  };
  
  export const LAYER_STYLES = {
    vehicles: {
      circle: {
        id: MAP_CONFIG.LAYERS.VEHICLES.CIRCLE,
        type: 'circle',
        source: MAP_CONFIG.SOURCES.VEHICLES.id,
        paint: {
          // Adjust radius dynamically based on zoom level and vehicle type
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            5, // At zoom level 5
            [
              'match',
              ['get', 'tipo'],
              'A', 14, // Larger circle for type A (90 capacity)
              'B', 12, // Medium circle for type B (45 capacity)
              'C', 8,  // Smaller circle for type C (30 capacity)
              6        // Default size if no match
            ],
            15, // At zoom level 15
            [
              'match',
              ['get', 'tipo'],
              'A', 22, // Larger at higher zoom for type A
              'B', 20, // Medium at higher zoom for type B
              'C', 16, // Smaller at higher zoom for type C
              14       // Default size if no match
            ],
          ],
          // Use distinct colors for each vehicle type (avoiding red and green)
          'circle-color': [
            'match',
            ['get', 'tipo'],
            'A', '#1E90FF', // Dodger blue for type A
            'B', '#FFD700', // Gold for type B
            'C', '#8A2BE2', // Blue violet for type C
            '#888888'       // Gray as fallback
          ],
          // Apply consistent stroke for all circles
          'circle-stroke-color': '#FFFFFF', // White border
          'circle-stroke-width': 2,         // Border width
        }        
      },
      text: {
        id: MAP_CONFIG.LAYERS.VEHICLES.TEXT,
        type: 'symbol',
        source: MAP_CONFIG.SOURCES.VEHICLES.id,
        layout: {
          'text-field': ['get', 'vehicleCode'],
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            5, 12,
            10, 14,
            15, 16,
          ],
          'text-offset': [0, 0],
          'text-anchor': 'center',
        },
        paint: {
          'text-color': '#FFFFFF',
          'text-halo-color': '#000000',
          'text-halo-width': 1,
        }
      }
    },
    locations: {
      clusters: {
        id: MAP_CONFIG.LAYERS.LOCATIONS.CLUSTERS,
        type: 'circle',
        source: MAP_CONFIG.SOURCES.LOCATIONS.id,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#08CA57',
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            15,
            10, 20,
            30, 25,
          ],
          'circle-opacity': 0.6,
        }
      },
      clusterCount: {
        id: MAP_CONFIG.LAYERS.LOCATIONS.CLUSTER_COUNT,
        type: 'symbol',
        source: MAP_CONFIG.SOURCES.LOCATIONS.id,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 12,
          'text-anchor': 'center',
        },
        paint: {
          'text-color': '#ffffff',
        }
      },
      warehouses: {
        id: MAP_CONFIG.LAYERS.LOCATIONS.WAREHOUSES,
        type: 'symbol',
        source: MAP_CONFIG.SOURCES.LOCATIONS.id,
        filter: ['all', 
          ['==', ['get', 'type'], 'warehouse'], 
          ['!', ['has', 'point_count']]
        ],
        layout: {
          'icon-image': MAP_CONFIG.IMAGES.WAREHOUSE.id,
          'icon-size': 0.8,
          'icon-allow-overlap': false,
          'text-field': ['get', 'name'],
          'text-font': ['Open Sans Bold'],
          'text-size': 12,
          'text-offset': [0, 1.5],
          'text-anchor': 'top',
        },
        paint: {
          'text-color': '#000000',
          'text-halo-color': '#FFFFFF',
          'text-halo-width': 1,
        }
      },
      offices: {
        id: MAP_CONFIG.LAYERS.LOCATIONS.OFFICES,
        type: 'symbol',
        source: MAP_CONFIG.SOURCES.LOCATIONS.id,
        filter: ['all', 
          ['==', ['get', 'type'], 'office'], 
          ['!', ['has', 'point_count']]
        ],
        layout: {
          'icon-image': MAP_CONFIG.IMAGES.OFFICE.id,
          'icon-size': 0.6,
          'icon-allow-overlap': false,
          'text-field': ['get', 'name'],
          'text-font': ['Open Sans Regular'],
          'text-size': 10,
          'text-offset': [0, 1.2],
          'text-anchor': 'top',
        },
        paint: {
          'text-color': '#000000',
          'text-halo-color': '#FFFFFF',
          'text-halo-width': 1,
        }
      }
    }
  };
  
  export const POPUP_CONFIG = {
    OFFSET: 15,
    ANCHOR: 'top',
    CLOSE_BUTTON: true,
    CLOSE_ON_CLICK: true
  };
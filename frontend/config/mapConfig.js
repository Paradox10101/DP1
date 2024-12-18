// src/config/mapConfig.js
// Añadir estas constantes al inicio del archivo
const VEHICLE_CAPACITIES = {
  A: 90,
  B: 45,
  C: 30
};

// Función para obtener el color según el porcentaje
const getColorByPercentage = (percentage) => {
  if (percentage >= 90) return '#EF4444'; // Rojo (equivalente a red-500)
  if (percentage >= 75) return '#F97316'; // Naranja (equivalente a orange-400)
  if (percentage >= 50) return '#EAB308'; // Amarillo (equivalente a yellow-400)
  return '#22C55E'; // Verde (equivalente a green-500)
};

export const MAP_CONFIG = {
    // Configuración básica del mapa
    STYLE_URL: 'https://api.maptiler.com/maps/openstreetmap/style.json?key=i1ya2uBOpNFu9czrsnbD',
    DEFAULT_CENTER: [-76.991, -15],
    DEFAULT_ZOOM: 4,
    BOUNDS: [[-103.4, -25.1], [-48.6, 8.1]], // Limita a que solo aparezca el mapa del Peru

    // Configuración de fuentes
    SOURCES: {
      VEHICLES: {
        id: 'vehicles',
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      },
      OFFICES: {  // Nueva fuente específica para oficinas
        id: 'offices',
        type: 'geojson',
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
        data: { type: 'FeatureCollection', features: [] }
      },
      WAREHOUSES: {  // Nueva fuente específica para almacenes
        id: 'warehouses',
        type: 'geojson',
        cluster: false, // Sin clustering
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
            14, // Tamaño estandarizado para todos los vehículos
            15, // At zoom level 15
            22, // Tamaño estandarizado para todos los vehículos
          ],
          // Use distinct colors for each vehicle type (avoiding red and green)
          'circle-color': [
            'case',
            ['==', ['get', 'status'], 'AVERIADO_1'],
            '#FFFFFF', // Blanco para avería leve
            ['==', ['get', 'status'], 'AVERIADO_2'],
            '#808080', // Gris para avería moderada
            ['==', ['get', 'status'], 'AVERIADO_3'],
            '#404040', // Gris oscuro para avería grave
            ['==', ['get', 'status'], 'HACIA_ALMACEN'],
            '#0000FF', // Azul para vehículos en regreso
            ['==', ['get', 'status'], 'EN_REEMPLAZO'],
            '#00BFFF', // Celeste para vehículos en reemplazo
            //'#00FF00', // Verde como color base para el resto de estados            
            // Si no es estado especial, usar color basado en capacidad
            //['all', 
            //  ['>=', ['get', 'capacidadPorcentaje'], 90]
            //],
            //'#EF4444', // Rojo para >= 90%
            ['all',
              ['>=', ['get', 'capacidadPorcentaje'], 81]
            ],
            '#F97316', // Naranja para >= 75%
            ['all',
              ['>=', ['get', 'capacidadPorcentaje'], 41]
            ],
            '#EAB308', // Amarillo para >= 50%
            '#A8D5BA'  // Verde por defecto
          ],
          // Añadir borde negro para estados especiales
          'circle-stroke-color': [
            'case',
            ['any',
              ['==', ['get', 'status'], 'HACIA_ALMACEN'],
              ['==', ['get', 'status'], 'EN_REEMPLAZO'],
              ['==', ['get', 'status'], 'AVERIADO_1'],
              ['==', ['get', 'status'], 'AVERIADO_2'],
              ['==', ['get', 'status'], 'AVERIADO_3']
            ],
            '#000000', // Borde negro para estados especiales
            '#FFFFFF'  // Borde blanco para el resto
          ],
          'circle-stroke-width': [
            'case',
            ['any',
              ['==', ['get', 'status'], 'HACIA_ALMACEN'],
              ['==', ['get', 'status'], 'EN_REEMPLAZO'],
              ['==', ['get', 'status'], 'AVERIADO_1'],
              ['==', ['get', 'status'], 'AVERIADO_2'],
              ['==', ['get', 'status'], 'AVERIADO_3']
            ],
            2, // Ancho del borde para estados especiales
            1  // Ancho del borde para el resto
          ],         // Border width
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
        source: MAP_CONFIG.SOURCES.OFFICES.id, // Cambiar a la fuente de oficinas
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#00D05C',
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
        source: MAP_CONFIG.SOURCES.OFFICES.id, // Cambiar a la fuente de oficinas
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
        source: MAP_CONFIG.SOURCES.WAREHOUSES.id, // Usar la fuente de almacenes
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
        source: MAP_CONFIG.SOURCES.OFFICES.id,
        filter: ['!', ['has', 'point_count']],
        layout: {
          'icon-image': [
            'case',
            ['>=', ['get', 'occupiedPercentage'], 81],
            'office-icon-81',  // Cambiar de 'office-icon-orange' a 'office-icon-81'
            ['>=', ['get', 'occupiedPercentage'], 41],
            'office-icon-41',  // Cambiar de 'office-icon-yellow' a 'office-icon-41'
            'office-icon-0'    // Cambiar de 'office-icon' a 'office-icon-0'
          ],
          'icon-size': 0.6,
          'icon-allow-overlap': true,
          'text-field': ['get', 'name'],
          'text-font': ['Open Sans Regular'],
          'text-size': 10,
          'text-offset': [0, 1.2],
          'text-anchor': 'top',
        },
        paint: {
          'icon-color': '#FFA500',
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
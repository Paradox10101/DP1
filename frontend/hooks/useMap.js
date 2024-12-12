// src/hooks/useMap.js
import { useState, useEffect, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import { MAP_CONFIG, LAYER_STYLES } from '../config/mapConfig';
import { loadCustomImage, createCenterControl } from '../utils/mapUtils';

export const useMap = ({ mapContainer, onMapLoaded, onError }) => {
  const [map, setMap] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const initializeMap = useCallback(async () => {
    if (!mapContainer.current) return;

    try {
      console.log('Inicializando mapa...');
      const newMap = new maplibregl.Map({
        container: mapContainer.current,
        style: MAP_CONFIG.STYLE_URL,
        center: MAP_CONFIG.DEFAULT_CENTER,
        zoom: MAP_CONFIG.DEFAULT_ZOOM,
        attributionControl: false,
      });

      // Agregar controles
      newMap.addControl(new maplibregl.NavigationControl(), 'bottom-right');
      newMap.addControl(createCenterControl(), 'bottom-right');

      // Configurar el mapa cuando esté cargado
      newMap.on('load', async () => {
        console.log('Mapa completamente cargado');

        // Cargar imágenes personalizadas
        for (const image of MAP_CONFIG.CUSTOM_IMAGES) {
          await loadCustomImage(newMap, image.name, image.url);
        }

        // Configurar fuentes y capas
        await setupSources(newMap);
        await setupLayers(newMap);
        await setupEventListeners(newMap);

        setMapLoaded(true);
        onMapLoaded?.(newMap);
      });

      setMap(newMap);
    } catch (error) {
      console.error('Error al inicializar el mapa:', error);
      onError?.('Error al inicializar el mapa');
    }
  }, [mapContainer, onMapLoaded, onError]);

  const setupSources = useCallback(async (map) => {
    // Configurar fuente de vehículos
    if (!map.getSource(MAP_CONFIG.LAYERS.VEHICLES.SOURCE_ID)) {
      map.addSource(MAP_CONFIG.LAYERS.VEHICLES.SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
    }

    // Configurar fuente de ubicaciones
    if (!map.getSource(MAP_CONFIG.LAYERS.LOCATIONS.SOURCE_ID)) {
      map.addSource(MAP_CONFIG.LAYERS.LOCATIONS.SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 20,
      });
    }
  }, []);

  const setupLayers = useCallback(async (map) => {
    const { VEHICLES, LOCATIONS } = MAP_CONFIG.LAYERS;

    // Agregar capas de vehículos
    if (!map.getLayer(VEHICLES.CIRCLE_LAYER_ID)) {
      map.addLayer({
        id: VEHICLES.CIRCLE_LAYER_ID,
        source: VEHICLES.SOURCE_ID,
        ...LAYER_STYLES.vehiclesCircle
      });
    }

    if (!map.getLayer(VEHICLES.TEXT_LAYER_ID)) {
      map.addLayer({
        id: VEHICLES.TEXT_LAYER_ID,
        source: VEHICLES.SOURCE_ID,
        ...LAYER_STYLES.vehiclesText
      });
    }

    // Agregar capa de clusters
    if (!map.getLayer(LOCATIONS.CLUSTER_LAYER_ID)) {
      map.addLayer({
        id: LOCATIONS.CLUSTER_LAYER_ID,
        type: 'circle',
        source: LOCATIONS.SOURCE_ID,
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
      });
    }

    // Agregar capa de conteo de clusters
    if (!map.getLayer(LOCATIONS.CLUSTER_COUNT_LAYER_ID)) {
      map.addLayer({
        id: LOCATIONS.CLUSTER_COUNT_LAYER_ID,
        type: 'symbol',
        source: LOCATIONS.SOURCE_ID,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 12,
          'text-anchor': 'center',
          'text-offset': [0, 0],
        },
        paint: {
          'text-color': '#ffffff',
        }
      });
    }

    // Agregar capa de almacenes no agrupados
    if (!map.getLayer(LOCATIONS.WAREHOUSES_LAYER_ID)) {
      map.addLayer({
        id: LOCATIONS.WAREHOUSES_LAYER_ID,
        type: 'symbol',
        source: LOCATIONS.SOURCE_ID,
        filter: ['all', 
          ['==', ['get', 'type'], 'warehouse'], 
          ['!', ['has', 'point_count']]
        ],
        layout: {
          'icon-image': 'warehouse-icon',
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
      });
    }

    // Agregar capa de oficinas no agrupadas
    if (!map.getLayer(LOCATIONS.OFFICES_LAYER_ID)) {
      map.addLayer({
        id: LOCATIONS.OFFICES_LAYER_ID,
        type: 'symbol',
        source: LOCATIONS.SOURCE_ID,
        filter: ['all', 
          ['==', ['get', 'type'], 'office'], 
          ['!', ['has', 'point_count']]
        ],
        layout: {
          'icon-image': 'office-icon',
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
      });
    }
  }, []);

  const setupEventListeners = useCallback((map) => {
    const { VEHICLES, LOCATIONS } = MAP_CONFIG.LAYERS;

    // Eventos para vehículos
    map.on('click', VEHICLES.CIRCLE_LAYER_ID, (e) => {
      map.getCanvas().style.cursor = 'pointer';
      // El manejo del click se realiza en el componente principal
    });

    map.on('mouseenter', VEHICLES.CIRCLE_LAYER_ID, () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', VEHICLES.CIRCLE_LAYER_ID, () => {
      map.getCanvas().style.cursor = '';
    });

    // Eventos para clusters
    map.on('click', LOCATIONS.CLUSTER_LAYER_ID, (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: [LOCATIONS.CLUSTER_LAYER_ID]
      });
      
      if (!features.length) return;
      
      const clusterId = features[0].properties.cluster_id;
      map.getSource(LOCATIONS.SOURCE_ID).getClusterExpansionZoom(
        clusterId,
        (err, zoom) => {
          if (err) return;

          map.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom
          });
        }
      );
    });

    map.on('mouseenter', LOCATIONS.CLUSTER_LAYER_ID, () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', LOCATIONS.CLUSTER_LAYER_ID, () => {
      map.getCanvas().style.cursor = '';
    });
  }, []);

  useEffect(() => {
    initializeMap();

    return () => {
      if (map) {
        console.log('Limpiando mapa...');
        map.remove();
        setMap(null);
        setMapLoaded(false);
      }
    };
  }, [initializeMap]);

  // Métodos públicos del hook
  const setSourceData = useCallback((sourceId, data) => {
    if (map && map.getSource(sourceId)) {
      map.getSource(sourceId).setData(data);
    }
  }, [map]);

  const flyTo = useCallback((coordinates, zoom) => {
    if (map) {
      map.flyTo({
        center: coordinates,
        zoom: zoom || map.getZoom()
      });
    }
  }, [map]);

  const fitBounds = useCallback((bounds, options = {}) => {
    if (map) {
      map.fitBounds(bounds, { padding: 50, animate: true, ...options });
    }
  }, [map]);

  return {
    map,
    mapLoaded,
    setSourceData,
    flyTo,
    fitBounds
  };
};
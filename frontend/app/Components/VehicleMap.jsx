'use client';
import { useAtom } from 'jotai';
import { useState, useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import {
  vehiclePositionsAtom,
  loadingAtom
} from '../atoms';
import { performanceMetricsAtom } from '@/atoms/simulationAtoms';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useVehicleAnimation } from '../../hooks/useVehicleAnimation';
import { useWebSocket } from '../../hooks/useWebSocket';
import { MAP_CONFIG, LAYER_STYLES, POPUP_CONFIG } from '../../config/mapConfig';
import ErrorDisplay from '../Components/ErrorDisplay';
import { errorAtom, ErrorTypes, ERROR_MESSAGES } from '@/atoms/errorAtoms';
import { locationsAtom } from '../../atoms/locationAtoms';

const VehicleMap = ({ simulationStatus, setShipments, setVehicles }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const popupsRef = useRef({});
  const socketRefVehicles = useRef(null);
  const socketRefShipments = useRef(null);
  const socketRefVehiclesInfo = useRef(null);
  const [positions, setPositions] = useAtom(vehiclePositionsAtom);
  const [loading, setLoading] = useAtom(loadingAtom);
  const [error, setError] = useAtom(errorAtom);
  const [previousPositions, setPreviousPositions] = useState(null);
  const [reconnectAttemptsWSVehicles, setReconnectAttemptsWSVehicles] = useState(0);
  const [reconnectAttemptsWSShipments, setReconnectAttemptsWSShipments] = useState(0);
  const [reconnectAttemptsWSSVehiclesInfo, setReconnectAttemptsWSVehiclesInfo] = useState(0);
  const [locations, setLocations] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [, setPerformanceMetrics] = useAtom(performanceMetricsAtom);
  const [locationError, setLocationError] = useState(null);
  const locationRetryTimeoutRef = useRef(null);

   // Función auxiliar para crear mensajes de error
   const createError = (type, customMessage = null) => ({
    ...ERROR_MESSAGES[type],
    message: customMessage || ERROR_MESSAGES[type].message
  });
  
   // Obtener y actualizar ubicaciones con reintentos
   const fetchLocations = useCallback(async (retryCount = 0, maxRetries = 3) => {
    try {
      const response = await fetch('http://localhost:4567/api/v1/locations');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("ubicaciones: ", data);
      if (data && data.type === 'FeatureCollection' && Array.isArray(data.features)) {
        setLocations(data); // Actualizar el átomo compartido
        setError(null);
        return true;
      } else {
        throw new Error('Datos de ubicaciones no son un FeatureCollection válido');
      }
    } catch (err) {
      console.error('Error al obtener las ubicaciones:', err);
      setError(createError(ErrorTypes.CONNECTION, 'No se pudieron cargar las ubicaciones de oficinas y almacenes.'));

      if (retryCount < maxRetries) {
        console.log(`Reintentando carga de ubicaciones (${retryCount + 1}/${maxRetries})...`);
        locationRetryTimeoutRef.current = setTimeout(() => {
          fetchLocations(retryCount + 1, maxRetries);
        }, 2000 * (retryCount + 1));
      }
      return false;
    }
  }, [setLocations, setError]);

  // Limpiar timeout de reintento si existe
  const clearLocationRetryTimeout = useCallback(() => {
    if (locationRetryTimeoutRef.current) {
      clearTimeout(locationRetryTimeoutRef.current);
      locationRetryTimeoutRef.current = null;
    }
  }, []);

  // Manejar la reconexión exitosa
  const handleConnectionSuccess = useCallback(() => {
    clearLocationRetryTimeout();
    if (!locations) {
      fetchLocations();
    }
  }, [fetchLocations, locations, clearLocationRetryTimeout]);

  // Actualizar posición de popups
  const updatePopups = (geojson) => {
    geojson.features.forEach((feature) => {
      const vehicleCode = feature.properties.vehicleCode;
      const popup = popupsRef.current[vehicleCode];
      if (popup) {
        popup.setLngLat(feature.geometry.coordinates);
      }
    });
  };

  const { 
    animateTransition, 
    performanceManager 
  } = useVehicleAnimation(mapRef, updatePopups);

  // Actualizar las métricas de rendimiento
  useEffect(() => {
    if (performanceManager) {
      const updateInterval = setInterval(() => {
        setPerformanceMetrics({
          fps: performanceManager.metrics.fps,
          frameTime: performanceManager.metrics.frameTime,
          vehicleCount: performanceManager.metrics.vehicleCount,
          performanceLevel: performanceManager.performanceLevel
        });
      }, 1000 / 5); // 5 actualizaciones por segundo

      return () => clearInterval(updateInterval);
    }
  }, [performanceManager, setPerformanceMetrics]);

  // Manejador de mensajes WebSocket
  const handleWebSocketMessage = useCallback((data) => {
    setPositions(data);
  }, [setPositions]);

  // Manejador de cambios de conexión
  const handleConnectionChange = useCallback((status) => {
    setLoading(status === 'loading');
    if (status === 'failed') {
      setError(createError(ErrorTypes.CONNECTION));
    }
  }, [setLoading, setError]);

  // Usar el nuevo hook de WebSocket
  const { 
    connect,
    disconnect,
    checkStatus,
    isRetrying
  } = useWebSocket({
    onMessage: handleWebSocketMessage,
    onConnectionChange: handleConnectionChange,
  });

  // Verificar estado inicial
  useEffect(() => {
    checkStatus();
  }, []);

  // Función personalizada para cargar imágenes
  const loadCustomImage = async (name, url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      const imageBitmap = await createImageBitmap(blob);
      if (!mapRef.current.hasImage(name)) {
        mapRef.current.addImage(name, imageBitmap);
      }
    } catch (error) {
      console.error(`Error al cargar icono ${name}:`, error);
      setError(createError(ErrorTypes.SIMULATION, `Error al cargar icono ${name}`));
    }
  };

  // Inicializar el mapa
  useEffect(() => {
    if (mapRef.current) return;
    try {
      console.log('Inicializando mapa...');
      mapRef.current = new maplibregl.Map({
        container: mapContainerRef.current,
        style: MAP_CONFIG.STYLE_URL,
        center: MAP_CONFIG.DEFAULT_CENTER,
        zoom: MAP_CONFIG.DEFAULT_ZOOM,
        attributionControl: false,
      });

      mapRef.current.addControl(new maplibregl.NavigationControl(), 'bottom-right');

      // Botón para centrar en Perú
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

      mapRef.current.addControl(new CenterControl(), 'bottom-right');

      mapRef.current.on('load', async () => {
        console.log('Mapa completamente cargado');

        // Cargar imágenes definidas en la configuración
        for (const [key, image] of Object.entries(MAP_CONFIG.IMAGES)) {
          await loadCustomImage(image.id, image.url);
        }

        // Configurar la fuente de vehículos
        if (!mapRef.current.getSource(MAP_CONFIG.SOURCES.VEHICLES.id)) {
          mapRef.current.addSource(MAP_CONFIG.SOURCES.VEHICLES.id, {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
          });
        }
        
        // Configurar capas de vehículos
        if (!mapRef.current.getLayer(MAP_CONFIG.LAYERS.VEHICLES.CIRCLE)) {
          mapRef.current.addLayer({
            id: MAP_CONFIG.LAYERS.VEHICLES.CIRCLE,
            type: 'circle',
            source: MAP_CONFIG.SOURCES.VEHICLES.id,
            paint: LAYER_STYLES.vehicles.circle.paint
          });
        }
        
        if (!mapRef.current.getLayer(MAP_CONFIG.LAYERS.VEHICLES.TEXT)) {
          mapRef.current.addLayer({
            id: MAP_CONFIG.LAYERS.VEHICLES.TEXT,
            type: 'symbol',
            source: MAP_CONFIG.SOURCES.VEHICLES.id,
            layout: LAYER_STYLES.vehicles.text.layout,
            paint: LAYER_STYLES.vehicles.text.paint
          });
        }
        
        // Configurar eventos
        mapRef.current.on('click', MAP_CONFIG.LAYERS.VEHICLES.CIRCLE, handleVehicleClick);
        mapRef.current.on('mouseenter', MAP_CONFIG.LAYERS.VEHICLES.CIRCLE, () => {
          mapRef.current.getCanvas().style.cursor = 'pointer';
        });
        mapRef.current.on('mouseleave', MAP_CONFIG.LAYERS.VEHICLES.CIRCLE, () => {
          mapRef.current.getCanvas().style.cursor = '';
        });
        
        setMapLoaded(true);
      });
    } catch (error) {
      console.error('Error al inicializar el mapa:', error);
      setError('Error al inicializar el mapa');
    }

    // Limpieza al desmontar el componente
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Manejar click en vehículo
  const handleVehicleClick = (e) => {
    const features = mapRef.current.queryRenderedFeatures(e.point, {
      layers: [MAP_CONFIG.LAYERS.VEHICLES.CIRCLE],
    });
    if (!features.length) return;

    const feature = features[0];
    const vehicleCode = feature.properties.vehicleCode;

    if (popupsRef.current[vehicleCode]) {
      popupsRef.current[vehicleCode].remove();
      delete popupsRef.current[vehicleCode];
      return;
    }

    const popupContent = document.createElement('div');
    popupContent.style.display = 'flex';
    popupContent.style.flexDirection = 'column';
    popupContent.style.alignItems = 'flex-start';

    const vehicleInfo = document.createElement('div');
    vehicleInfo.innerHTML = `<strong>Vehículo:</strong> ${vehicleCode}`;

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Cerrar';
    closeButton.style.marginTop = '5px';
    closeButton.style.padding = '2px 5px';
    closeButton.style.fontSize = '12px';
    closeButton.style.cursor = 'pointer';

    closeButton.addEventListener('click', () => {
      popupsRef.current[vehicleCode].remove();
      delete popupsRef.current[vehicleCode];
    });

    popupContent.appendChild(vehicleInfo);
    popupContent.appendChild(closeButton);

    const popup = new maplibregl.Popup(POPUP_CONFIG)
      .setLngLat(feature.geometry.coordinates)
      .setDOMContent(popupContent)
      .addTo(mapRef.current);

    popupsRef.current[vehicleCode] = popup;
  };

  // Efecto para cargar ubicaciones cuando el mapa está listo
  useEffect(() => {
    if (mapLoaded && !locations) {
      fetchLocations();
    }
  }, [mapLoaded, locations, fetchLocations]);

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      clearLocationRetryTimeout();
    };
  }, [clearLocationRetryTimeout]);

  // Actualizar ubicaciones en el mapa
  useEffect(() => {
    const updateMap = async () => {
      if (!mapRef.current || !mapLoaded || !locations) {
        console.log('Condición no cumplida para actualizar ubicaciones:', {
          mapExists: !!mapRef.current,
          mapLoaded,
          locationsExist: !!locations
        });
        return;
      }
      try {
        if (!mapRef.current.getSource('locations')) {
          mapRef.current.addSource('locations', {
            type: 'geojson',
            data: locations,
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50,
          });
          console.log('Fuente de datos de ubicaciones añadida con clustering');
          await addLocationLayers(); // Asegurarse de esperar a que las capas se añadan
        } else {
          if (locations.type === 'FeatureCollection' && Array.isArray(locations.features)) {
            mapRef.current.getSource('locations').setData(locations);
            console.log('Datos de ubicaciones actualizados:', locations);
          } else {
            throw new Error('Datos de ubicaciones no son un FeatureCollection válido');
          }
        }
      } catch (error) {
        console.error('Error al actualizar ubicaciones:', error);
        setError('Error al actualizar ubicaciones en el mapa');
      }
    };

    updateMap();
  }, [locations, mapLoaded]);
  

  // Modificar la función addLocationLayers para configurar los eventos después de añadir las capas
  const addLocationLayers = async () => {
    try {
      // Agregar capas de clusters y conteo de clusters
      if (!mapRef.current.getLayer('clusters')) {
        // Capa de círculos para clusters usando color verde
        mapRef.current.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'locations',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': '#08CA57', // Verde
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              15, // Radio base
              10, 20, // Radio mayor para clusters con más puntos
              30, 25,
            ],
            'circle-opacity': 0.6,
          },
        });

        // **Configurar eventos para clusters después de añadir la capa**
        // Evento de clic en clusters para hacer zoom
        mapRef.current.on('click', 'clusters', (e) => {
          const features = mapRef.current.queryRenderedFeatures(e.point, {
            layers: ['clusters'],
          });
          if (!features.length) return;
          const clusterId = features[0].properties.cluster_id;
          mapRef.current.getSource('locations').getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err) return;
            mapRef.current.easeTo({
              center: features[0].geometry.coordinates,
              zoom: zoom,
            });
          });
        });

        // Cambiar el cursor al pasar sobre clusters
        mapRef.current.on('mouseenter', 'clusters', () => {
          mapRef.current.getCanvas().style.cursor = 'pointer';
        });
        mapRef.current.on('mouseleave', 'clusters', () => {
          mapRef.current.getCanvas().style.cursor = '';
        });
      }

      if (!mapRef.current.getLayer('cluster-count')) {
        // Capa de símbolos para el conteo de clusters
        mapRef.current.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'locations',
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
          },
        });
      }

      // Capas para ubicaciones no agrupadas (almacenes y oficinas)
      if (!mapRef.current.getLayer('unclustered-warehouses')) {
        mapRef.current.addLayer({
          id: 'unclustered-warehouses',
          type: 'symbol',
          source: 'locations',
          filter: ['all', ['==', ['get', 'type'], 'warehouse'], ['!', ['has', 'point_count']]],
          layout: {
            'icon-image': 'warehouse-icon',
            'icon-size': 0.8,
            'icon-allow-overlap': false, // Evita solapamiento
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
          },
        });
      }

      if (!mapRef.current.getLayer('unclustered-offices')) {
        mapRef.current.addLayer({
          id: 'unclustered-offices',
          type: 'symbol',
          source: 'locations',
          filter: ['all', ['==', ['get', 'type'], 'office'], ['!', ['has', 'point_count']]],
          layout: {
            'icon-image': 'office-icon',
            'icon-size': 0.6,
            'icon-allow-overlap': false, // Evita solapamiento
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
          },
        });
      }
    } catch (error) {
      console.error('Error al agregar capas de ubicaciones:', error);
      setError('Error al agregar capas de ubicaciones');
    }
  };

  // Conexión WebSocket de vehiculos
  const connectWebSocketVehicles = () => {
    socketRefVehicles.current = new WebSocket('ws://localhost:4567/wsVehicles');
    socketRefVehicles.current.onopen = () => {
      console.log('Conectado al WebSocket de vehiculos');
      setLoading('succeeded');
      setReconnectAttemptsWSVehicles(0);
      setError(null);
    };

    socketRefVehicles.current.onmessage = (event) => {
      try {
        
        const data = JSON.parse(event.data);
        if (data && data.type === 'FeatureCollection' && Array.isArray(data.features)) {
          setPositions(data);
          setError(null);
        } else {
          throw new Error('Formato GeoJSON inválido');
        }
      } catch (err) {
        console.error('Error al procesar mensaje WebSocket:', err);
        setError('Error al procesar datos del WebSocket de vehiculos');
      }
    };

    socketRefVehicles.current.onclose = () => {
      console.log('WebSocket de vehiculos cerrado');
      setLoading('failed');
      setError('WebSocket de vehiculos cerrado');
      attemptReconnect("wsVehicles");
    };

    socketRefVehicles.current.onerror = (error) => {
      console.error('Error en WebSocket de vehiculos:', error);
      setError('Error en WebSocket de vehiculos');
      setLoading('failed');
      attemptReconnect("wsVehicles");
    };
  };

  // Conexión WebSocket de vehiculos info
  const connectWebSocketVehiclesInfo = () => {
    socketRefVehiclesInfo.current = new WebSocket('ws://localhost:4567/wsVehiclesInfo');
    socketRefVehiclesInfo.current.onopen = () => {
      console.log('Conectado al WebSocket de vehiculos info');
      setLoading('succeeded');
      setReconnectAttemptsWSVehiclesInfo(0);
      setError(null);
    };

    socketRefVehiclesInfo.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && data.type === 'FeatureCollection' && Array.isArray(data.features)) {
          setVehicles(data.features);
          setError(null);
        } else {
          throw new Error('Formato GeoJSON inválido');
        }
      } catch (err) {
        console.error('Error al procesar mensaje WebSocket:', err);
        setError('Error al procesar datos del WebSocket de vehiculos info');
      }
    };

    socketRefVehiclesInfo.current.onclose = () => {
      console.log('WebSocket de vehiculos info cerrado');
      setLoading('failed');
      setError('WebSocket de vehiculos info cerrado');
      attemptReconnect("wsVehiclesInfo");
    };

    socketRefVehiclesInfo.current.onerror = (error) => {
      console.error('Error en WebSocket de vehiculos info:', error);
      setError('Error en WebSocket de vehiculos info');
      setLoading('failed');
      attemptReconnect("wsVehiclesInfo");
    };
  };

  // Conexión WebSocket de Envios
  const connectWebSocketShipments = () => {
    socketRefShipments.current = new WebSocket('ws://localhost:4567/wsShipments');
    socketRefShipments.current.onopen = () => {
      console.log('Conectado al WebSocket de envíos');
      setLoading('succeeded');
      setReconnectAttemptsWSShipments(0);
      setError(null);
    };

    socketRefShipments.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && data.type === 'FeatureCollection' && Array.isArray(data.features)) {
          setShipments(data.features);
          setError(null);
        } else {
          throw new Error('Formato GeoJSON inválido');
        }
        
      } catch (err) {
        console.error('Error al procesar mensaje WebSocket de envíos:', err);
        setError('Error al procesar datos del WebSocket de envios');
      }
    };

    socketRefShipments.current.onclose = () => {
      console.log('WebSocket de envios cerrado');
      setLoading('failed');
      setError('WebSocket de envios cerrado');
      attemptReconnect("wsShipments");
    };

    socketRefShipments.current.onerror = (error) => {
      console.error('Error en WebSocket de envios:', error);
      setError('Error en WebSocket de envios');
      setLoading('failed');
      attemptReconnect("wsShipments");
    };
  };


  // Reconexión WebSocket
  const attemptReconnect = (wsType) => {
    const maxReconnectAttempts = 5;
    const reconnectDelay = 3000;
    switch(wsType){
      case "wsVehicles":
        if (reconnectAttemptsWSVehicles < maxReconnectAttempts) {
          setTimeout(() => {
            console.log(`Intentando reconectar... (Intento ${reconnectAttemptsWSVehicles + 1})`);
            setReconnectAttemptsWSVehicles((prev) => prev + 1);
            connectWebSocketVehicles();
          }, reconnectDelay);
        } else {
          console.log('Se alcanzó el máximo de intentos de reconexión a WebSocket vehiculos' + wsType);
          setError('No se pudo reconectar al WebSocket ' + wsType);
        }
        break;
      case "wsShipments":
        if (reconnectAttemptsWSShipments < maxReconnectAttempts) {  
          setTimeout(() => {
            console.log(`Intentando reconectar... (Intento ${reconnectAttemptsWSShipments + 1})`);
            setReconnectAttemptsWSShipments((prev) => prev + 1);
            connectWebSocketShipments();
          }, reconnectDelay);
        } else {
          console.log('Se alcanzó el máximo de intentos de reconexión a WebSocket envios' + wsType);
          setError('No se pudo reconectar al WebSocket ' + wsType);
        }
        break;
      case "wsVehiclesInfo":
        if (reconnectAttemptsWSSVehiclesInfo < maxReconnectAttempts) {  
          setTimeout(() => {
            console.log(`Intentando reconectar... (Intento ${reconnectAttemptsWSSVehiclesInfo + 1})`);
            setReconnectAttemptsWSVehiclesInfo((prev) => prev + 1);
            connectWebSocketVehiclesInfo();
          }, reconnectDelay);
        } else {
          console.log('Se alcanzó el máximo de intentos de reconexión a WebSocket vehiculos info' + wsType);
          setError('No se pudo reconectar al WebSocket ' + wsType);
        }
        break;
    };
  }

  // Gestionar conexión WebSocket
  useEffect(() => {
    if (simulationStatus === 'running') {
      console.log('Conectando a los servidores WebSocket...');
      connectWebSocketVehicles();
      connectWebSocketShipments();
      connectWebSocketVehiclesInfo();
    }
    return () => {
      if (socketRefVehicles.current) {
        socketRefVehicles.current.close();
        socketRefVehicles.current = null;
      }
      if (socketRefShipments.current) {
        socketRefShipments.current.close();
        socketRefShipments.current = null;
      }
    };
  }, [simulationStatus]);

  // Actualizar posiciones de vehículos
  useEffect(() => {
    if (!mapRef.current || !positions?.features) return;

    try {
      animateTransition(positions);
    } catch (error) {
      console.error('Error al actualizar posiciones:', error);
      setError('Error al actualizar posiciones de vehículos');
    }
  }, [positions, animateTransition]);

  const handleRetry = useCallback(() => {
    const currentError = error;
    if (!currentError) return;

    switch (currentError.type) {
      case ErrorTypes.CONNECTION:
        connect();
        break;
      case ErrorTypes.SIMULATION:
        checkStatus();
        break;
      default:
        // Si el error está relacionado con ubicaciones, intentar cargar nuevamente
        if (currentError.message?.includes('ubicaciones')) {
          fetchLocations();
        }
    }
  }, [error, connect, checkStatus, fetchLocations]);


  return (
    <div className="relative w-full h-full">
      {loading === 'loading' && (
        <div className="absolute top-0 left-0 z-10 flex items-center justify-center w-full h-full bg-white bg-opacity-50">
          <div className="text-gray-800">Cargando mapa...</div>
        </div>
      )}

      <ErrorDisplay 
        error={error}
        onRetry={handleRetry}
        isRetrying={isRetrying}
      />

      {performanceManager && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded">
          FPS: {Math.round(performanceManager.metrics.fps)}
        </div>
      )}
      
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};

export default VehicleMap;
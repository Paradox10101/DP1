'use client';
import { useAtom } from 'jotai';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
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
import { AlmacenPopUp, OficinaPopUp, VehiculoPopUp } from './PopUps'
import ReactDOM from 'react-dom';
import { Truck, CarFront, Car, AlertTriangle } from 'lucide-react'; // Asegúrate de que estos íconos están importados
import IconoEstado from './IconoEstado';
import { renderToStaticMarkup } from 'react-dom/server';
import throttle from 'lodash/throttle';

// Función para generar el SVG con fondo azul y borde blanco para los vehículos
/*const getSvgString = (IconComponent) => {
  const svgString = renderToStaticMarkup(
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
      <circle cx="20" cy="20" r="20" fill="#1E90FF" />
      <g transform="translate(8, 8)">
        <IconComponent color="#FFFFFF" size={24} />
      </g>
    </svg>
  );
  return `data:image/svg+xml;base64,${btoa(svgString)}`;
};*/

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? process.env.NEXT_PUBLIC_API_BASE_URL_PROD || 'https://fallback-production-url.com' // Optional: Fallback URL for production
  : process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'; // Optional: Local development fallback


const VehicleMap = ({ simulationStatus, setSimulationStatus }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const popupsRef = useRef({});
  const [positions, setPositions] = useAtom(vehiclePositionsAtom);
  const [loading, setLoading] = useAtom(loadingAtom);
  const [error, setError] = useAtom(errorAtom);
  const [locations, setLocations] = useAtom(locationsAtom);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [, setPerformanceMetrics] = useAtom(performanceMetricsAtom);
  const [locationError, setLocationError] = useState(null);
  const locationRetryTimeoutRef = useRef(null);
  
  const positionsRef = useRef();

  const vehiculosArray = positions && positions.features && Array.isArray(positions.features) ? positions.features : [];
  
  console.log('vehiculosArray PRIMER LISTADO DE TODOS LOS VEHICULOS:', vehiculosArray);


  // Ensure vehiculos is an array to avoid TypeError
  //const vehiculosArray = vehiculos[0] && vehiculos[0]?.features && Array.isArray(vehiculos[0].features) ? vehiculos[0].features : [];


   // Función auxiliar para crear mensajes de error
   const createError = (type, customMessage = null) => ({
    ...ERROR_MESSAGES[type],
    message: customMessage || ERROR_MESSAGES[type].message
  });
  
   // Obtener y actualizar ubicaciones con reintentos
   const fetchLocations = useCallback(async (retryCount = 0, maxRetries = 3) => {
    try {
      const response = await fetch(`${API_BASE_URL}/locations`);
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

  
  const normalizeVehicleProperties = (properties) => {
    return {
      ...properties, // Spread original properties first
      vehicleCode: String(properties.vehicleCode || properties.id || '').trim().toUpperCase(),
      capacidadMaxima: properties.capacidadMaxima || "No especificada",
      capacidadUsada: properties.capacidadUsada ?? "No especificada",
      status: properties.status || 'Desconocido',
      ubicacionActual: properties.ubicacionActual || "No especificada",
      velocidad: properties.velocidad ?? "No especificada",
      // Add more properties here if needed
    };
  };
  
  // Agrega la función de actualización con throttle
  const updateVehiclePositions = throttle((data) => {
    try {
      if (mapRef.current) {
        const vehiclesSource = mapRef.current.getSource(MAP_CONFIG.SOURCES.VEHICLES.id);
        if (vehiclesSource) {
          vehiclesSource.setData(data);
        }
      }
    } catch (error) {
      console.error('Error al actualizar posiciones:', error);
      setError('Error al actualizar posiciones de vehículos');
    }
  }, 1000); // Cada 500 ms, ajustar según sea necesario

// En handleWebSocketMessage // Manejador de mensajes WebSocket
const handleWebSocketMessage = useCallback((data) => {
  const updatedData = {
    ...data,
    features: data.features.map((feature) => ({
      ...feature,
      properties: normalizeVehicleProperties(feature.properties),
    })),
  };
  console.log('Datos del WebSocket procesados:', updatedData);
  setPositions(updatedData);
  updateVehiclePositions(updatedData); // Utiliza la versión con throttle
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

        // Añadir los íconos de Lucide al mapa con el fondo azul y borde blanco
        /*if (!mapRef.current.hasImage('truck-icon')) {
          const svgString = getSvgString(Truck);
          const image = new Image();
          image.src = svgString;
          image.onload = () => {
            mapRef.current.addImage('truck-icon', image);
          };
        }

        if (!mapRef.current.hasImage('car-front-icon')) {
          const svgString = getSvgString(CarFront);
          const image = new Image();
          image.src = svgString;
          image.onload = () => {
            mapRef.current.addImage('car-front-icon', image);
          };
        }

        if (!mapRef.current.hasImage('car-icon')) {
          const svgString = getSvgString(Car);
          const image = new Image();
          image.src = svgString;
          image.onload = () => {
            mapRef.current.addImage('car-icon', image);
          };
        }

        if (!mapRef.current.hasImage('alert-triangle-icon')) {
          const svgString = getSvgString(AlertTriangle);
          const image = new Image();
          image.src = svgString;
          image.onload = () => {
            mapRef.current.addImage('alert-triangle-icon', image);
          };
        }*/

        // Añadir imágenes de oficina y almacén del archivo de configuración
        for (const [key, imageConfig] of Object.entries(MAP_CONFIG.IMAGES)) {
          if (!mapRef.current.hasImage(imageConfig.id)) {
            await loadCustomImage(imageConfig.id, imageConfig.url);
          }
        }

        // Configurar la fuente de vehículos
        if (!mapRef.current.getSource(MAP_CONFIG.SOURCES.VEHICLES.id)) {
          mapRef.current.addSource(MAP_CONFIG.SOURCES.VEHICLES.id, {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
          });
        }

        // Configurar la capa de vehículos
        if (!mapRef.current.getLayer(MAP_CONFIG.LAYERS.VEHICLES.SYMBOL)) {
          mapRef.current.addLayer({
            id: MAP_CONFIG.LAYERS.VEHICLES.SYMBOL,
            type: 'symbol',
            source: MAP_CONFIG.SOURCES.VEHICLES.id,
            layout: {
              'icon-image': [
                'match',
                ['get', 'tipo'],
                'A', MAP_CONFIG.IMAGES.TRUCK.id,
                'B', MAP_CONFIG.IMAGES.CAR_FRONT.id,
                'C', MAP_CONFIG.IMAGES.CAR2.id,
                MAP_CONFIG.IMAGES.CAR_BREAK.id // default icon
              ],
              'icon-size': 0.5,
              'icon-allow-overlap': true,
              'text-field': ['get', 'vehicleCode'],
              'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
              'text-size': 12,
              'text-offset': [0, 2],
              'text-anchor': 'top'
            },
            paint: {
              'text-color': '#FFFFFF',
              'text-halo-color': '#000000',
              'text-halo-width': 1
            }
          });
        }

        addVehicleLayerEvents();

        // Restaurar las capas de agrupación, oficinas y almacenes
        if (!mapRef.current.getSource('locations')) {
          mapRef.current.addSource('locations', {
            type: 'geojson',
            data: locations || { type: 'FeatureCollection', features: [] },
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50,
          });
        }

        // Capa de agrupación (clusters)
        if (!mapRef.current.getLayer(MAP_CONFIG.LAYERS.LOCATIONS.CLUSTERS)) {
          mapRef.current.addLayer(LAYER_STYLES.locations.clusters);
        }

        // Capa para mostrar el conteo de puntos en los clusters
        if (!mapRef.current.getLayer(MAP_CONFIG.LAYERS.LOCATIONS.CLUSTER_COUNT)) {
          mapRef.current.addLayer(LAYER_STYLES.locations.clusterCount);
        }

        // Capas de almacenes y oficinas no agrupadas
        if (!mapRef.current.getLayer(MAP_CONFIG.LAYERS.LOCATIONS.WAREHOUSES)) {
          mapRef.current.addLayer(LAYER_STYLES.locations.warehouses);
        }

        if (!mapRef.current.getLayer(MAP_CONFIG.LAYERS.LOCATIONS.OFFICES)) {
          mapRef.current.addLayer(LAYER_STYLES.locations.offices);
        }

        // Configurar eventos
        mapRef.current.on('click', MAP_CONFIG.LAYERS.VEHICLES.SYMBOL, handleVehicleClick);
        mapRef.current.on('mouseenter', MAP_CONFIG.LAYERS.VEHICLES.SYMBOL, () => {
          mapRef.current.getCanvas().style.cursor = 'pointer';
        });
        mapRef.current.on('mouseleave', MAP_CONFIG.LAYERS.VEHICLES.SYMBOL, () => {
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

  
  useEffect(() => {
    positionsRef.current = positions;
  }, [positions]);

/* // Función para obtener el ícono HTML según el tipo de vehículo
const getVehicleIconHtml = (vehicleType) => {
  switch (vehicleType) {
    case "A":
      return `<div class="bg-blue-500 w-[25px] h-[25px] relative rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-[15px] h-[15px] stroke-white z-10">
                  <!-- Icono de camión (Truck) aquí -->
                  <rect x="4" y="4" width="16" height="16" fill="white"/>
                </svg>
              </div>`;
    case "B":
      return `<div class="bg-blue-500 w-[25px] h-[25px] relative rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-[15px] h-[15px] stroke-white z-10">
                  <!-- Icono de auto frontal (CarFront) aquí -->
                  <circle cx="12" cy="12" r="6" fill="white"/>
                </svg>
              </div>`;
    case "C":
      return `<div class="bg-blue-500 w-[25px] h-[25px] relative rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-[15px] h-[15px] stroke-white z-10">
                  <!-- Icono de auto (Car) aquí -->
                  <polygon points="5,5 19,5 12,19" fill="white"/>
                </svg>
              </div>`;
    default:
      return `<div class="bg-gray-500 w-[25px] h-[25px] relative rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-[15px] h-[15px] stroke-white z-10">
                  <!-- Icono por defecto -->
                  <line x1="2" y1="2" x2="22" y2="22" stroke="white"/>
                </svg>
              </div>`;
  }
};*/


  // Manejar click en vehículo
  const handleVehicleClick = (e) => {
    console.log('handleVehicleClick triggered');

    // Obtener los features del punto clickeado
    const features = mapRef.current.queryRenderedFeatures(e.point, {
      layers: [MAP_CONFIG.LAYERS.VEHICLES.SYMBOL],
    });

    if (!features.length) {
      console.error('No se encontraron vehículos en el punto clickeado.');
      return;
    }

    const feature = features[0];

    // Normalizar y obtener vehicleCode
    const vehicleCode = String(feature.properties.vehicleCode || feature.properties.id || "No especificado").trim().toUpperCase();
    console.log(`Vehicle clicked: ${vehicleCode}`);

    // Obtener el array de vehículos desde la referencia
    const currentPositions = positionsRef.current;
    const vehiculosArray = currentPositions && currentPositions.features && Array.isArray(currentPositions.features) ? currentPositions.features : [];
    console.log('vehiculosArray dentro de handleVehicleClick:', vehiculosArray);

    if (!Array.isArray(vehiculosArray) || vehiculosArray.length === 0) {
      console.error('vehiculosArray está vacío dentro de handleVehicleClick.');
      return;
    }

    // Buscar el vehículo correspondiente en 'vehiculosArray'
    const vehiculo = vehiculosArray.find((v) => {
      const vCode = String(v.properties.vehicleCode || v.properties.id || '').trim().toUpperCase();
      return vCode === vehicleCode;
    });

    if (!vehiculo) {
      console.error(`Vehículo con código ${vehicleCode} no encontrado en vehiculosArray.`);
      // Crear popup con datos limitados ya que no se encontró en vehiculosArray
      const popupContent = document.createElement("div");
      popupContent.textContent = `Información limitada: Código del vehículo - ${vehicleCode}`;

      const popup = new maplibregl.Popup(POPUP_CONFIG)
        .setLngLat(feature.geometry.coordinates)
        .setDOMContent(popupContent)
        .addTo(mapRef.current);

      popupsRef.current[vehicleCode] = popup;
      return;
    }
    console.log('vehiculo encontradooooooooooooooooo: ', vehiculo);

    // Extraer las propiedades importantes del vehículo encontrado
    const capacidadMaxima = vehiculo.properties.capacidadMaxima || "No especificada";
    const capacidadUsada = vehiculo.properties.capacidadUsada ?? "No especificada";
    let status = vehiculo.properties.status || "Desconocido";
    const vehicleType = vehiculo.properties.tipo || "Desconocido";
    const vehicleData = vehiculo.properties;

    // Validar y ajustar el status del vehículo
    switch (status) {
      case "EN_ALMACEN":
        status = "En Almacén";
        break;
      case "AVERIADO":
        status = "Averiado";
        break;
      case "EN_MANTENIMIENTO":
        status = "En mantenimiento";
        break;
      default:
        console.warn(`Status desconocido para vehículo ${vehicleCode}: ${status}`);
        status = "En tránsito";
    }

    // Determinar el ícono según el tipo de vehículo
    let Icono;
    switch (vehicleType) {
      case "A":
        Icono = Truck;
        break;
      case "B":
        Icono = CarFront;
        break;
      case "C":
        Icono = Car;
        break;
      default:
        Icono = AlertTriangle; // Icono por defecto si no se encuentra el tipo
    }

    // Obtener el ícono según el tipo de vehículo
    //const iconoHtmlString = getVehicleIconHtml(vehicleType);

    // Puedes extraer más propiedades si lo deseas
    const ubicacionActual = vehiculo.properties.ubicacionActual || "No especificada";
    const velocidad = vehiculo.properties.velocidad ?? "No especificada";

    // Mostrar el popup con la información completa
    if (popupsRef.current[vehicleCode]) {
      popupsRef.current[vehicleCode].remove();
      delete popupsRef.current[vehicleCode];
      return;
    }

    const popupContent = document.createElement("div");

    const root = createRoot(popupContent);
    root.render(
      <VehiculoPopUp
        title={vehicleCode}
        capacidadMaxima={capacidadMaxima}
        capacidadUtilizada={capacidadUsada}
        estado={status}
        ubicacionActual={ubicacionActual}
        velocidad={velocidad}
        iconoComponent={
          <IconoEstado
            Icono={Icono}
            classNameContenedor="bg-blue-500 w-[25px] h-[25px] relative rounded-full flex items-center justify-center"
            classNameContenido="w-[15px] h-[15px] stroke-white z-10"
          />
        }
        vehicleData={vehicleData}
      />
    );

    const popup = new maplibregl.Popup({
        maxWidth: "none", // Permite que el contenido controle el ancho del pop-up
        closeButton: true,
        closeOnClick: true,
        anchor: 'top', // Ajustar el ancla para mejorar la alineación
        offset: 25, // Asegura que haya suficiente espacio para el pop-up
      })
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

  // Actualizar posiciones de vehículos <- asi estaba antes y nada.
  /*useEffect(() => {
    if (!mapRef.current || !positions?.features) return;

    try {
      animateTransition(positions);
    } catch (error) {
      console.error('Error al actualizar posiciones:', error);
      setError('Error al actualizar posiciones de vehículos');
    }
  }, [positions, animateTransition]);*/
  
    useEffect(() => {
      let animationFrameId;

      const animate = () => {
        if (!mapRef.current || !positions?.features) return;

        try {
          const vehiclesSource = mapRef.current.getSource(MAP_CONFIG.SOURCES.VEHICLES.id);
          if (vehiclesSource) {
            vehiclesSource.setData(positions);
          }
        } catch (error) {
          console.error('Error al actualizar posiciones:', error);
          setError('Error al actualizar posiciones de vehículos');
        }

        animationFrameId = requestAnimationFrame(animate);
      };

      if (positions) {
        animationFrameId = requestAnimationFrame(() => {
          animate();
          addVehicleLayerEvents(); // Vincular eventos inmediatamente después de actualizar
        });
      }

      return () => {
        cancelAnimationFrame(animationFrameId);
      };
    }, [positions]);
   

  // Añadir eventos a la capa de vehículos
  const addVehicleLayerEvents = () => {
    if (mapRef.current.getLayer(MAP_CONFIG.LAYERS.VEHICLES.SYMBOL)) {
      mapRef.current.on('click', MAP_CONFIG.LAYERS.VEHICLES.SYMBOL, handleVehicleClick);
      mapRef.current.on('mouseenter', MAP_CONFIG.LAYERS.VEHICLES.SYMBOL, () => {
        mapRef.current.getCanvas().style.cursor = 'pointer';
      });
      mapRef.current.on('mouseleave', MAP_CONFIG.LAYERS.VEHICLES.SYMBOL, () => {
        mapRef.current.getCanvas().style.cursor = '';
      });
    }
  };


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


  // Función para generar el SVG
  /*const getSvgString = (IconComponent) => {
    return renderToStaticMarkup(<IconComponent size={30} stroke="currentColor" />);
  };*/

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
// VehicleMap.jsx

'use client';
import { useAtomValue, useAtom } from 'jotai';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import maplibregl from 'maplibre-gl';
import {
  vehiclePositionsAtom,
  loadingAtom
} from '../atoms';
import { performanceMetricsAtom, simulationTypeAtom } from '@/atoms/simulationAtoms';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useVehicleAnimation } from '../../hooks/useVehicleAnimation';
import { useWebSocket } from '../../hooks/useWebSocket';
import { MAP_CONFIG, LAYER_STYLES, POPUP_CONFIG } from '../../config/mapConfig';
import ErrorDisplay from '../Components/ErrorDisplay';
import { errorAtom, ErrorTypes, ERROR_MESSAGES } from '@/atoms/errorAtoms';
import { locationsAtom } from '../../atoms/locationAtoms';
import { AlmacenPopUp, OficinaPopUp, VehiculoPopUp } from './PopUps';
import { Truck, CarFront, Car, AlertTriangle } from 'lucide-react'; // Asegúrate de que estos íconos están importados
import IconoEstado, { VEHICLE_CAPACITIES } from './IconoEstado';
import { renderToStaticMarkup } from 'react-dom/server';
import throttle from 'lodash/throttle';
import { Modal, ModalBody, ModalContent, ModalHeader, useDisclosure } from '@nextui-org/react';
import ModalVehiculo from './ModalVehiculo';

// 1. Primero, importa el átomo de ubicaciones filtradas
import { filteredLocationsAtom } from '../../atoms/locationAtoms';
import Dashboard from './Dashboard';
import CollapseDashboard from './CollapseDashboard';
import { useShipmentWebSocket } from '@/hooks/useShipmentWebSocket';
import { useRouteWebSocket } from '@/hooks/useRouteWebSocket';
import { blockageRoutesAtom, formattedRoutesAtom, routesAtom, showBlockagesRoutesAtom, showVehiclesRoutesAtom, vehicleCurrentRoutesAtom } from '@/atoms/routeAtoms';


const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? process.env.NEXT_PUBLIC_API_BASE_URL_PROD || 'https://fallback-production-url.com' // Optional: Fallback URL for production
  : process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'; // Optional: Local development fallback

// Función para generar el SVG con fondo de color personalizado
const getSvgString = (IconComponent, bgColor) => {
  const needsBorder = bgColor === '#FFFFFF' || bgColor === '#808080'; // Añadir borde para blanco y gris
  const svgString = renderToStaticMarkup(
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
      <circle 
        cx="20" 
        cy="20" 
        r="20" 
        fill={bgColor} 
        stroke={needsBorder ? '#000000' : 'none'} 
        strokeWidth={needsBorder ? 2 : 0}
      />
      <g transform="translate(8, 8)">
        <IconComponent color={needsBorder ? "#000000" : "#FFFFFF"} size={24} />
      </g>
    </svg>
  );
  return `data:image/svg+xml;base64,${btoa(svgString)}`;
};


const getVehicleColor = (tipo, capacidadUsada) => {
  const maxCapacity = {
    A: 90,
    B: 45,
    C: 30
  }[tipo] || 30;
  
  const percentageUsed = (capacidadUsada / maxCapacity) * 100;
  
  // Retorna el color según el porcentaje, similar a IconoEstado
  if (percentageUsed >= 90) return '#EF4444';      // Rojo
  if (percentageUsed >= 75) return '#F97316';      // Naranja
  if (percentageUsed >= 50) return '#EAB308';      // Amarillo
  return '#22C55E';                                // Verde
};

const StatusBadge = ({ status }) => {
  switch (status) {
      case "EN_ALMACEN":
      case "ORDENES_CARGADAS":
          return (
              <div className="pequenno border rounded-xl w-[140px] text-center bg-[#DEA71A] text-[#F9DF9B]">
                  En Almacén
              </div>
          );
      case "AVERIADO_1":
        return (
          <div className="pequenno border rounded-xl w-[140px] text-center bg-yellow-100 text-black-600 font-medium">
            Avería Leve
          </div>
        );
      case "AVERIADO_2":
        return (
          <div className="pequenno border rounded-xl w-[140px] text-center bg-orange-100 text-black-600 font-medium">
            Avería Moderada
          </div>
        );
      case "AVERIADO_3":
        return (
          <div className="pequenno border rounded-xl w-[140px] text-center bg-red-100 text-black-600 font-medium">
            Avería Grave
          </div>
        );
      case "EN_MANTENIMIENTO":
      case "EN_REPARACION":
          return (
              <div className="pequenno border rounded-xl w-[140px] text-center bg-[#7B15FA] text-[#D0B0F8]">
                  En Mantenimiento
              </div>
          );
      case "EN_ESPERA_EN_OFICINA":
      case "LISTO_PARA_RETORNO":
      case "EN_REEMPLAZO":
        return (
            <div className="pequenno border rounded-xl w-[140px] text-center bg-[#7B15FA] text-[#D0B0F8]">
                En Espera
            </div>
        );
      case "EN_TRANSITO_ORDEN":
      case "HACIA_ALMACEN":
        return (
          <div className="pequenno border rounded-xl w-[140px] text-center bg-[#284BCC] text-[#BECCFF]">
            En Tránsito
          </div>
        );
      default:
        return (
            <></>
        );
  }
};

const VehicleMap = ({ simulationStatus }) => {
  useShipmentWebSocket();
  useRouteWebSocket();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const popupsRef = useRef({});
  const [positions, setPositions] = useAtom(vehiclePositionsAtom);
  const [loading, setLoading] = useAtom(loadingAtom);
  const [error, setError] = useAtom(errorAtom);
  const [locations, setLocations] = useAtom(locationsAtom);
  const [blockageRoutes,] = useAtom(blockageRoutesAtom)
  const [vehicleCurrentRoutes,] = useAtom(vehicleCurrentRoutesAtom)
  const [mapLoaded, setMapLoaded] = useState(false);
  const [, setPerformanceMetrics] = useAtom(performanceMetricsAtom);
  const locationRetryTimeoutRef = useRef(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showBlockageRoutes,] = useAtom(showBlockagesRoutesAtom)
  const [showVehiclesRoutes,] = useAtom(showVehiclesRoutesAtom)
  const positionsRef = useRef();
  const locoRef = useRef();
  const lineCurrentRouteRef = useRef()

  // Referencias agregadas para animacion
  const currentPositionsRef = useRef(null); 
  const startPositionsRef = useRef(null);
  const endPositionsRef = useRef(null);
  const animationStartRef = useRef(null);
  const animationDuration = 1500;
  const currentAnimationFrameRef = useRef(null);
  
  // Función para crear un mapa { vehicleCode: { ...featureData } }
  const featuresToMap = (geojson) => {
    const mapFeatures = {};
    geojson.features.forEach(feat => {
      const id = feat.properties.vehicleCode;
      mapFeatures[id] = feat;
    });
    return mapFeatures;
  };
  
  const mapToFeatures = (mapData) => {
    return {
      type: 'FeatureCollection',
      features: Object.values(mapData)
    };
  };
  
  // Interpolar una posición entre start y end
  const interpolatePosition = (start, end, t) => {
    const lng = start[0] + (end[0] - start[0]) * t;
    const lat = start[1] + (end[1] - start[1]) * t;
    return [lng, lat];
  };
  
  const animatePositions = () => {
    if (!mapRef.current || !startPositionsRef.current || !endPositionsRef.current || !animationStartRef.current) return;
  
    const now = performance.now();
    const elapsed = now - animationStartRef.current;
    const t = Math.min(elapsed / animationDuration, 1);
  
    // Tomamos snapshots de start y end
    const startMap = featuresToMap(startPositionsRef.current);
    const endMap = featuresToMap(endPositionsRef.current);
  
    // Crear un nuevo mapa interpolado
    const interpolatedMap = {};
  
    for (const id in endMap) {
      const endFeature = endMap[id];
      const endCoord = endFeature.geometry.coordinates;
  
      let startCoord = endCoord; // Por si no existe en start
      if (startMap[id]) {
        startCoord = startMap[id].geometry.coordinates;
      }
  
      const newCoord = interpolatePosition(startCoord, endCoord, t);
      interpolatedMap[id] = {
        ...endFeature,
        geometry: {
          ...endFeature.geometry,
          coordinates: newCoord
        }
      };
    }
  
    const interpolatedData = mapToFeatures(interpolatedMap);
  
    // Actualizamos la posición actual mostrada
    currentPositionsRef.current = interpolatedData;
  
    const vehiclesSource = mapRef.current.getSource(MAP_CONFIG.SOURCES.VEHICLES.id);
    if (vehiclesSource) {
      vehiclesSource.setData(interpolatedData);
    }
  
    if (t < 1) {
      currentAnimationFrameRef.current = requestAnimationFrame(animatePositions);
    } else {
      // Animación completó: la posición final es oficial
      positionsRef.current = endPositionsRef.current;
      currentPositionsRef.current = endPositionsRef.current;
    }
  };
  


  //console.log("LAS POSICIONES ENCONTRADAS SON: ", positions) FUERA MRD A CADA RATO ESTO

  const vehiculosArray = positions && positions.features && Array.isArray(positions.features) ? positions.features : [];
  // 2. Usa el átomo para obtener las ubicaciones filtradas
  const locationsUltimo = useAtomValue(filteredLocationsAtom);

  //console.log("LISTADO DE LOCACIONES ENCONTRADAS BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB:"+ JSON.stringify(locationsUltimo, null, 2));
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
      if (data && data.type === 'FeatureCollection' && Array.isArray(data.features)) {
        // Separar features por tipo
        const offices = {
          type: 'FeatureCollection',
          features: data.features.filter(f => f.properties.type === 'office')
        };
        
        const warehouses = {
          type: 'FeatureCollection',
          features: data.features.filter(f => f.properties.type === 'warehouse')
        };

        // Actualizar las fuentes por separado
        if (mapRef.current) {
          const officesSource = mapRef.current.getSource('offices');
          const warehousesSource = mapRef.current.getSource('warehouses');
          
          if (officesSource) officesSource.setData(offices);
          if (warehousesSource) warehousesSource.setData(warehouses);
        }
        
        setLocations(data); // Mantener el estado completo si es necesario
        setError(null);
        return true;
      } else {
        throw new Error('Datos de ubicaciones no son un FeatureCollection válido');
      }
    } catch (err) {
      console.log('Error al obtener las ubicaciones:', err);
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

  //console.log("LISTADO DE LOCACIONES AAAAAAAAAAAAAAAAAAAAAA ENCONTRADOS:",locations)
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

  // Agrega la función de actualización con throttle
  const updateVehiclePositions = throttle((data) => {
    if (!mapRef.current) return;
    try {
      const vehiclesSource = mapRef.current.getSource(MAP_CONFIG.SOURCES.VEHICLES.id);
      if (vehiclesSource) {
        vehiclesSource.setData(data); // Actualiza los datos
      }
    } catch (error) {
      console.error('Error al actualizar posiciones:', error);
      setError('Error al actualizar posiciones de vehículos');
    }
  }, 1000); // Cada 1000 ms, ajustar según sea necesario

  // Manejador de mensajes WebSocket
  const handleWebSocketMessage = useCallback((data) => {
    const updatedData = {
      ...data,
      features: data.features.map((feature) => {
        const capacidadUsada = feature.properties.capacidadUsada || 0;
        const capacidadMaxima = feature.properties.capacidadMaxima || 1; // Evitar divisiones por 0
        const capacidadPorcentaje = (capacidadUsada / capacidadMaxima) * 100;

        // Asignar iconBaseName basado en el tipo de vehículo
        let iconBaseName;
        switch (feature.properties.tipo) {
          case 'A':
            iconBaseName = 'truck-icon';
            break;
          case 'B':
            iconBaseName = 'car-front-icon';
            break;
          case 'C':
            iconBaseName = 'car-icon';
            break;
          default:
            iconBaseName = 'alert-triangle-icon'; // Ícono por defecto
        }

        return {
          ...feature,
          properties: {
            ...feature.properties,
            color: getVehicleColor(
              feature.properties.tipo || 'A',
              feature.properties.capacidadUsada || 0
            ),
            capacidadPorcentaje,
            iconBaseName,
          },
        };
      }),
    };
    console.log('Datos del WebSocket procesados:', updatedData);
    updatePopups(updatedData);
  
    // Si no teníamos posiciones anteriores (primer mensaje)
    if (!positionsRef.current || !positionsRef.current.features) {
      // No hay animación previa, simplemente establecemos las posiciones inicial y final iguales
      positionsRef.current = updatedData;
      currentPositionsRef.current = updatedData;
      startPositionsRef.current = updatedData;
      endPositionsRef.current = updatedData;
      // Actualizamos el mapa una vez sin animación
      const vehiclesSource = mapRef.current?.getSource(MAP_CONFIG.SOURCES.VEHICLES.id);
      if (vehiclesSource) {
        vehiclesSource.setData(updatedData);
      }
      return;
    }
  
    // Cancelar cualquier animación en curso
    if (currentAnimationFrameRef.current) {
      cancelAnimationFrame(currentAnimationFrameRef.current);
    }
  
    // Si estábamos animando, partimos de la posición actual mostrada (interpolada)
    const currentData = currentPositionsRef.current || positionsRef.current;
  
    startPositionsRef.current = currentData;
    endPositionsRef.current = updatedData;
    animationStartRef.current = performance.now();
  
    // Iniciar la animación
    currentAnimationFrameRef.current = requestAnimationFrame(animatePositions);
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

      //mapRef.current.addControl(new maplibregl.NavigationControl(), 'bottom-right');
      mapRef.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
      mapRef.current.dragRotate.disable();
      mapRef.current.setMaxBounds(MAP_CONFIG.BOUNDS);

      // Botón para centrar en Perú
      /*class CenterControl {
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
      }*/
      //mapRef.current.addControl(new CenterControl(), 'bottom-right');

      mapRef.current.on('load', async () => {
        console.log('Mapa completamente cargado');

        // Añadir los íconos de vehículos con colores dinámicos
        const vehicleIcons = [
          { type: 'truck-icon', component: Truck },
          { type: 'car-front-icon', component: CarFront },
          { type: 'car-icon', component: Car },
          { type: 'alert-triangle-icon', component: AlertTriangle },
        ];

        const colors = {
          green: '#08CA57',
          yellow: '#FFC107',
          red: '#FF5252',
          white: '#FFFFFF', // Nuevo color para vehículos en reemplazo
          gray: '#808080',  // Nuevo color para vehículos hacia almacén
        };

        vehicleIcons.forEach(({ type, component }) => {
          for (const [colorName, colorValue] of Object.entries(colors)) {
            const iconName = `${type}-${colorName}`;
            if (!mapRef.current.hasImage(iconName)) {
              const svgString = getSvgString(component, colorValue);
              const image = new Image();
              image.src = svgString;
              image.onload = () => {
                if (!mapRef.current.hasImage(iconName)) {
                  mapRef.current.addImage(iconName, image);
                }
              };
            }
          }
        });

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

        // Primero agregar la fuente de ubicaciones
        /*if (!mapRef.current.getSource('locations')) {
          mapRef.current.addSource('locations', {
            type: 'geojson',
            data: locations || { type: 'FeatureCollection', features: [] },
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50,
          });
        }*/

          // Agregar fuente de oficinas (con clustering)
        if (!mapRef.current.getSource('offices')) {
          mapRef.current.addSource('offices', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: (locations?.features || []).filter(f => f.properties.type === 'office')
            },
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50,
          });
        }

        // Agregar fuente de almacenes (sin clustering)
        if (!mapRef.current.getSource('warehouses')) {
          mapRef.current.addSource('warehouses', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: (locations?.features || []).filter(f => f.properties.type === 'warehouse')
            }
          });
        }

        // Luego agregar las capas en orden específico (de abajo hacia arriba) <------CLUSTERES
        // 1. Clusters y conteo
        // Clusters (solo para oficinas)
        if (!mapRef.current.getLayer('clusters')) {
          mapRef.current.addLayer({
            id: 'clusters',
            type: 'circle',
            source: 'offices', // Cambiar a la fuente de oficinas
            filter: ['has', 'point_count'],
            paint: LAYER_STYLES.locations.clusters.paint
          });
        }

        if (!mapRef.current.getLayer('cluster-count')) {
          mapRef.current.addLayer({
            id: 'cluster-count',
            type: 'symbol',
            source: 'offices', // Cambiar a la fuente de oficinas
            filter: ['has', 'point_count'],
            layout: LAYER_STYLES.locations.clusterCount.layout,
            paint: LAYER_STYLES.locations.clusterCount.paint
          });
        }

        // 2. Almacenes y oficinas       
        if (!mapRef.current.getLayer('unclustered-offices')) {
          mapRef.current.addLayer({
            id: 'unclustered-offices',
            type: 'symbol',
            source: 'offices',
            filter: ['!', ['has', 'point_count']],
            layout: {
              ...LAYER_STYLES.locations.offices.layout,
              'icon-allow-overlap': false,
              'icon-ignore-placement': false,
            }
          });
        }

        if (!mapRef.current.getLayer('unclustered-warehouses')) {
          mapRef.current.addLayer({
            id: 'unclustered-warehouses',
            type: 'symbol',
            source: 'warehouses', // Usar la nueva fuente de almacenes
            layout: {
              ...LAYER_STYLES.locations.warehouses.layout,
              'icon-allow-overlap': false,
              'icon-ignore-placement': false,
            }
          });
        }

        addVehicleLayerEvents();

        // Agregar eventos para almacenes y oficinas
        mapRef.current.on('click', 'unclustered-warehouses', handleLocationClick);
        mapRef.current.on('click', 'unclustered-offices', handleLocationClick);

        // Eventos de cursor
        ['unclustered-warehouses', 'unclustered-offices'].forEach(layer => {
          mapRef.current.on('mouseenter', layer, () => {
            mapRef.current.getCanvas().style.cursor = 'pointer';
          });
          mapRef.current.on('mouseleave', layer, () => {
            mapRef.current.getCanvas().style.cursor = '';
          });
        });

        // Configurar eventos del vehiculo
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

  useEffect(() => {
    positionsRef.current = positions;
  }, [positions]);

  useEffect(() => {
    locoRef.current = locationsUltimo;
  }, [locationsUltimo]);

  // Manejar click en vehículo
  const handleVehicleClick = (e) => {
    console.log('handleVehicleClick triggered');
  
    // Verificar que tengamos un evento válido
    if (!e || !e.point) {
      console.error('Evento de click inválido');
      return;
    }
  
    // Obtener los features del punto clickeado de manera segura
    let features;
    try {
      features = mapRef.current.queryRenderedFeatures(e.point, {
        layers: [MAP_CONFIG.LAYERS.VEHICLES.CIRCLE]
      });
    } catch (error) {
      console.error('Error al consultar features:', error);
      return;
    }
  
    // Verificar si tenemos features
    if (!features || !features.length) {
      console.log('No se encontraron vehículos en el punto clickeado.');
      return;
    }
  
    const feature = features[0];
    
    // Verificar que el feature tenga las propiedades necesarias
    if (!feature || !feature.properties) {
      console.error('Feature inválido o sin propiedades');
      return;
    }
  
    // Normalizar y obtener vehicleCode de manera segura
    const vehicleCode = String(
      feature.properties.vehicleCode || 
      feature.properties.id || 
      "No especificado"
    ).trim().toUpperCase();
  
    console.log(`Vehicle clicked: ${vehicleCode}`);

    // Obtener el array de vehículos desde la referencia
    const currentPositions = positionsRef.current;
    const vehiculosArray = currentPositions && currentPositions.features && Array.isArray(currentPositions.features) ? currentPositions.features : [];

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
    //console.log("LISTADO DE VEHICULOS ENCONTRADOS:",vehiculosArray)
    // Extraer las propiedades importantes del vehículo encontrado
    const capacidadMaxima = vehiculo.properties.capacidadMaxima || "No especificada";
    const capacidadUsada = vehiculo.properties.capacidadUsada ?? "No especificada";
    const status = vehiculo.properties.status || "Desconocido";
    const vehicleType = vehiculo.properties.tipo || "Desconocido";
    const vehicleData = vehiculo.properties;

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
    if(status === 'AVERIADO_1' || status === 'AVERIADO_2' || status === 'AVERIADO_3'){
      Icono = AlertTriangle;
    }


    // Puedes extraer más propiedades si lo deseas
    const ubicacionActual = vehiculo.properties.ubicacionActual || "No especificada";
    const ubicacionSiguiente = vehiculo.properties.ubicacionSiguiente || " ";
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
        ubicacionSiguiente={ubicacionSiguiente}
        velocidad={velocidad}
        iconoComponent={
          <IconoEstado
            Icono={Icono}
            tipo={vehicleType}
            capacidadUsada={capacidadUsada}
          />
        }
        vehicleData={vehicleData}
        onViewDetail={() => {
          setSelectedVehicle(vehicleData); // Establece el vehículo seleccionado
          onOpen(); // Abre el modal
        }}
        onReportIssue={() => {
          // Manejar el reporte de avería
        }}
      />
    );


    if(lineCurrentRouteRef.current){
      mapRef.current.removeLayer(lineCurrentRouteRef.current.layerId);
      mapRef.current.removeSource(lineCurrentRouteRef.current.sourceId);
      // Limpiar la referencia
      lineCurrentRouteRef.current = null;

    }

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

    // Crear una línea horizontal en la ubicación del vehículo
    const lineCoordinates = vehicleData.currentRoute.map(route => route.coordinates);  

    lineCurrentRouteRef.current = {
      sourceId: `linea-${vehicleCode}`,
      layerId: `linea-${vehicleCode}`,
    };

    if (!mapRef.current.getSource(`linea-${vehicleCode}`)) {
      mapRef.current.addSource(`linea-${vehicleCode}`, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: lineCoordinates,
          },
        },
      });

      mapRef.current.addLayer({
        id: `linea-${vehicleCode}`,
        type: 'line',
        source: `linea-${vehicleCode}`,
        paint: {
          'line-color': '#1A37A1', // Color de la línea
          'line-width': 4,         // Grosor de la línea
        },
      });
    }
    
    popup.on('close', () => {
      // Eliminacion de la visualizacion de ruta si se deselecciona el popup
      if(lineCurrentRouteRef.current){
        mapRef.current.removeLayer(lineCurrentRouteRef.current.layerId);
        mapRef.current.removeSource(lineCurrentRouteRef.current.sourceId);
        // Limpiar la referencia
        lineCurrentRouteRef.current = null;

      }
    });

    popupsRef.current[vehicleCode] = popup;
  };

  // Manejar click en almacén u oficina
  const handleLocationClick = (e) => {
    console.log('handleLocationClick triggered');

    // Obtener los features del punto clickeado
    const features = mapRef.current.queryRenderedFeatures(e.point, {
      layers: ['unclustered-warehouses', 'unclustered-offices'], // Asegúrate de usar los nombres correctos de las capas
    });

    if (!features.length) {
      console.error('No se encontraron ubicaciones en el punto clickeado.');
      return;
    }
    //"Locations"
    //const locococococos = locations;
    const locococococos = locoRef.current;
    //const officesArray = locococococos && locococococos.features && Array.isArray(locococococos.features) ? locococococos.features : [];
    //alert("LISTADO DE LOCACIONES ENCONTRADAS:"+ JSON.stringify(locococococos, null, 2));
    //alert("LISTADO DE LOCACIONES ENCONTRADAS:"+ JSON.stringify(features, null, 2));//

    
    

    const feature = features[0];
    const { name, type, ubigeo, capacidadMaxima, capacidadUsada } = feature.properties;

    // Crear el contenido del popup según el tipo de ubicación
    const popupContent = document.createElement("div");
    const root = createRoot(popupContent);

    const locationActualizada = locococococos?.find(loc => 
      loc.ubigeo === ubigeo && loc.type === type
    );
    //alert("UBICACION ENCONTRADA:"+ JSON.stringify(locationActualizada, null, 2));
    if (type === 'warehouse') {
      // Renderizar el popup para almacén
      root.render(
        <AlmacenPopUp
          title={name}
          ubigeo={ubigeo || 'No especificado'}
          warehouseData={locationActualizada}
        />
      );
    } else if (type === 'office') {
      // Buscar el vehículo correspondiente en 'vehiculosArray'
      // 4. Buscar la ubicación actualizada en el átomo de locations      

      if (!locationActualizada) {
        console.error(`No se encontró la ubicación actualizada para ubigeo: ${ubigeo}`);
        return;
      }
      //alert("OFICINA ENCONTRADA:"+ JSON.stringify(locationActualizada, null, 2));//
      // Renderizar el popup para oficina
      root.render(
        <OficinaPopUp
          title={name}
          ubigeo={ubigeo || 'No especificado'}
          capacidadMaxima={locationActualizada.capacity || '0'}
          capacidadUtilizada={Math.ceil(locationActualizada.capacity*locationActualizada.occupiedPercentage/100) || '0'}
          officeData={locationActualizada}
        />
      );
    }

    // Si ya hay un popup abierto para esta ubicación, eliminarlo
    if (popupsRef.current[name]) {
      popupsRef.current[name].remove();
      delete popupsRef.current[name];
      
    }

    // Crear el popup de MapLibre
    const popup = new maplibregl.Popup({
      maxWidth: "none",
      closeButton: true,
      closeOnClick: true,
      anchor: 'top',
      offset: 25,
    })
      .setLngLat(feature.geometry.coordinates)
      .setDOMContent(popupContent)
      .addTo(mapRef.current);

    // Guardar referencia al popup para gestión futura
    popupsRef.current[name] = popup;
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


  // Asegurarse de que los eventos estén correctamente asignados
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    // Eventos para almacenes
    mapRef.current.on('click', 'unclustered-warehouses', handleLocationClick);
    mapRef.current.on('mouseenter', 'unclustered-warehouses', () => {
      mapRef.current.getCanvas().style.cursor = 'pointer';
    });
    mapRef.current.on('mouseleave', 'unclustered-warehouses', () => {
      mapRef.current.getCanvas().style.cursor = '';
    });

    // Eventos para oficinas y clusters
    mapRef.current.on('click', 'clusters', handleClusterClick);
    mapRef.current.on('click', 'unclustered-offices', handleLocationClick);
    
    return () => {
      // Limpiar eventos al desmontar
      if (mapRef.current) {
        mapRef.current.off('click', 'unclustered-warehouses', handleLocationClick);
        mapRef.current.off('click', 'clusters', handleClusterClick);
        mapRef.current.off('click', 'unclustered-offices', handleLocationClick);
        // ... limpiar otros eventos
      }
    };
  }, [mapLoaded]);

  // Agregar esta función junto con los otros manejadores de eventos
  const handleClusterClick = (e) => {
    const features = mapRef.current.queryRenderedFeatures(e.point, {
      layers: ['clusters']
    });

    if (!features.length) return;

    const clusterId = features[0].properties.cluster_id;
    const source = mapRef.current.getSource('offices'); // Usamos la fuente de oficinas

    source.getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err) {
        console.error('Error al expandir cluster:', err);
        return;
      }

      mapRef.current.easeTo({
        center: features[0].geometry.coordinates,
        zoom: zoom,
        duration: 500 // Duración de la animación en milisegundos
      });
    });
  };

  // Actualizar ubicaciones en el mapa
  useEffect(() => {
    const updateMap = async () => {
      if (!mapRef.current || !mapLoaded || !locations) {
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
          await addLocationLayers(); // Asegurarse de esperar a que las capas se añadan
        } else {
          if (locations.type === 'FeatureCollection' && Array.isArray(locations.features)) {
            mapRef.current.getSource('locations').setData(locations);
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
        //CLUSTERES
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
            'icon-allow-overlap': true, // Permitir solapamiento para asegurar que se puedan hacer clic
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

        // Añadir eventos de clic y cursor para almacenes
        mapRef.current.on('click', 'unclustered-warehouses', handleLocationClick);
        mapRef.current.on('mouseenter', 'unclustered-warehouses', () => {
          mapRef.current.getCanvas().style.cursor = 'pointer';
        });
        mapRef.current.on('mouseleave', 'unclustered-warehouses', () => {
          mapRef.current.getCanvas().style.cursor = '';
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
            'icon-allow-overlap': true, // Permitir solapamiento para asegurar que se puedan hacer clic
            'text-field': ['get', 'name'],
            'text-font': ['Open Sans Regular'],
            'text-size': 10,
            'text-offset': [0, 1.2],
            'text-anchor': 'top',
          },
          paint: {
            'text-color': '#FFA500',
            'text-halo-color': '#FFFFFF',
            'text-halo-width': 1,
          },
        });

        // Añadir eventos de clic y cursor para oficinas
        mapRef.current.on('click', 'unclustered-offices', handleLocationClick);
        mapRef.current.on('mouseenter', 'unclustered-offices', () => {
          mapRef.current.getCanvas().style.cursor = 'pointer';
        });
        mapRef.current.on('mouseleave', 'unclustered-offices', () => {
          mapRef.current.getCanvas().style.cursor = '';
        });
      }
    } catch (error) {
      console.error('Error al agregar capas de ubicaciones:', error);
      setError('Error al agregar capas de ubicaciones');
    }
  };

  useEffect(() => {
    if (!mapRef.current || !positions?.features) return;

    try {
      const vehiclesSource = mapRef.current.getSource(MAP_CONFIG.SOURCES.VEHICLES.id);
      if (vehiclesSource) {
        // Actualiza directamente los datos en la fuente GeoJSON existente
        vehiclesSource.setData(positions);
        addVehicleLayerEvents();
      }
    } catch (error) {
      console.error('Error al actualizar posiciones:', error);
      setError('Error al actualizar posiciones de vehículos');
    }
  }, [positions]);

  
  // Agregado de capa de rutas bloqueadas
  useEffect(() => {
    
    const sourceId = 'b-routes'; //blockage routes
    const layerId = 'b-routes';
    
    if (blockageRoutes === null || blockageRoutes === undefined || mapRef.current === null || mapRef.current === undefined) return;
  
    if (showBlockageRoutes === false ){
      if (mapRef.current.getLayer(layerId)) {
        mapRef.current.removeLayer(layerId); // Eliminar la capa si existe
      }
      if (mapRef.current.getSource(sourceId)) {
        mapRef.current.removeSource(sourceId); // Eliminar la fuente si existe
      }
      return
    }
    
  
    // Si la fuente ya existe, simplemente actualiza los datos
    if (mapRef.current.getSource(sourceId)) {
      const source = mapRef.current.getSource(sourceId);
      source.setData({
        type: 'FeatureCollection',
        features: blockageRoutes.features.map(feature => ({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: feature.properties.geometry.coordinates
          }
        }))
      });
    } else {
      // Si la fuente no existe, créala y añade la capa
      mapRef.current.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: blockageRoutes.features.map(feature => ({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: feature.properties.geometry.coordinates
            }
          }))
        }
      });
  
      mapRef.current.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': '#FF0000', // Color rojo
          'line-width': 2,
          'line-opacity': 0.3 // Reduce la opacidad al 30% para mayor transparencia
        }
      });
    }
  }, [blockageRoutes, showBlockageRoutes]);

  // Agregado de capa de rutas actuales de vehiculos
  useEffect(() => {
    //Agregado de rutas actuales de vehiculos
    const sourceId = 'c-routes';
    const layerId = 'c-routes';

    if (vehicleCurrentRoutes === null || vehicleCurrentRoutes === undefined || mapRef.current === null || mapRef.current === undefined) return;

    if (showVehiclesRoutes === false ){
      if (mapRef.current.getLayer(layerId)) {
        mapRef.current.removeLayer(layerId); // Eliminar la capa si existe
      }
      if (mapRef.current.getSource(sourceId)) {
        mapRef.current.removeSource(sourceId); // Eliminar la fuente si existe
      }
      return
    }
  
    // Si la fuente ya existe, simplemente actualiza los datos
    if (mapRef.current.getSource(sourceId)) {
      const source = mapRef.current.getSource(sourceId);
      source.setData({
        type: 'FeatureCollection',
        features: vehicleCurrentRoutes.features.map(feature => ({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: feature.properties.geometry.coordinates
          }
        }))
      });
    } else {
      // Si la fuente no existe, créala y añade la capa
      mapRef.current.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: vehicleCurrentRoutes.features.map(feature => ({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: feature.properties.geometry.coordinates
            }
          }))
        }
      });
  
      mapRef.current.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': '#1A37A1', // Color azul
          'line-width': 3,
          'line-opacity': 0.3
        }
      });
    }
  }, [vehicleCurrentRoutes, showVehiclesRoutes]);
  
  //const [showBlockageRoutes,] = useAtom(showBlockagesRoutesAtom)
  //const [showVehiclesRoutes,] = useAtom(showVehiclesRoutesAtom)


  // Añadir eventos a la capa de vehículos
  const addVehicleLayerEvents = () => {
    if (mapRef.current.getLayer(MAP_CONFIG.LAYERS.VEHICLES.CIRCLE)) {
      mapRef.current.on('click', MAP_CONFIG.LAYERS.VEHICLES.CIRCLE, handleVehicleClick);
      mapRef.current.on('mouseenter', MAP_CONFIG.LAYERS.VEHICLES.CIRCLE, () => {
        mapRef.current.getCanvas().style.cursor = 'pointer';
      });
      mapRef.current.on('mouseleave', MAP_CONFIG.LAYERS.VEHICLES.CIRCLE, () => {
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
      
      {/* Modal para ver detalles */}
      <Modal
          closeButton
          isOpen={isOpen}
          onOpenChange={onClose}
          blur="true"
          aria-labelledby="modal-vehiculo"
        >
          <ModalContent className="h-[790px] min-w-[850px] overflow-y-auto scroll-area">
            <ModalHeader>
              <div className="flex flex-row gap-2">
                <div className="subEncabezado">Información del vehículo {selectedVehicle?.vehicleCode}</div>
                <StatusBadge status={selectedVehicle?.status} />
                {/* Agrega un indicador del estado, si es necesario */}
              </div>
            </ModalHeader>
            <ModalBody>
              {selectedVehicle && (
                <ModalVehiculo vehicle={selectedVehicle} />
              )}
            </ModalBody>
          </ModalContent>
      </Modal>
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};

export default VehicleMap;

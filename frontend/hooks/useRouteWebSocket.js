import { useEffect, useCallback, useRef } from 'react';
import { useSetAtom } from 'jotai';
import { blockageRoutes, blockageRoutesAtom, routesAtom, vehicleCurrentRoutesAtom } from '../atoms/routeAtoms';

const WEBSOCKET_URL = process.env.NODE_ENV === 'production'
  ? `${process.env.NEXT_PUBLIC_WEBSOCKET_URL_PROD}/routes`
  : `${process.env.NEXT_PUBLIC_WEBSOCKET_URL}/routes`;

export const useRouteWebSocket = () => {
  const setBlockageRoutes = useSetAtom(blockageRoutesAtom);
  const setVehicleCurrentRoutesAtom = useSetAtom(vehicleCurrentRoutesAtom);
  
  const websocketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const isUnmountedRef = useRef(false); // Para evitar reconexiones después del desmontaje

  const handleMessage = useCallback(
    (event) => {
      try {
        const data = JSON.parse(event.data);
        setBlockageRoutes({
          type: "FeatureCollection",
          features: data.features.filter(feature => feature.properties.routeType === "blockage")
        });
        setVehicleCurrentRoutesAtom({
          type: "FeatureCollection",
          features: data.features.filter(feature => feature.properties.routeType === "vRoute")
        });
      } catch (error) {
        console.log('Error procesando el mensaje de WebSocket:', error);
      }
    },
    [setBlockageRoutes]
  );

  const connect = useCallback(() => {
    if (websocketRef.current) {
      websocketRef.current.close();
    }

    console.log('Conectando al WebSocket de rutas...');
    const ws = new WebSocket(WEBSOCKET_URL);

    ws.onopen = () => {
      console.log('WebSocket de rutas conectado');
    };

    ws.onclose = (event) => {
      if (!isUnmountedRef.current) {
        console.log('WebSocket de rutas desconectado:', event.code, event.reason);
        reconnect();
      }
    };

    ws.onerror = (error) => {
      console.log('Error en WebSocket de rutas:', error);
      ws.close(); // Cerrar el WebSocket para desencadenar la reconexión
    };

    ws.onmessage = handleMessage;

    websocketRef.current = ws;
  }, [handleMessage, reconnectTimeoutRef]);

  const reconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log('Intentando reconectar al WebSocket de rutas...');
      connect();
    }, 5000); // Intentar reconectar cada 5 segundos
  }, [connect]);

  const sendMessage = useCallback((message) => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket de rutas no está abierto. No se puede enviar el mensaje.');
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      isUnmountedRef.current = true;
      if (websocketRef.current) {
        websocketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return { sendMessage };
};

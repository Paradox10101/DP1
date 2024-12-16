import { useEffect, useCallback, useRef } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { shipmentsAtom } from '../atoms/shipmentAtoms';
import { errorAtom } from '@/atoms/errorAtoms';

const WEBSOCKET_URL = process.env.NODE_ENV === 'production'
  ? `${process.env.NEXT_PUBLIC_WEBSOCKET_URL_PROD}/shipments`
  : `${process.env.NEXT_PUBLIC_WEBSOCKET_URL}/shipments`;

export const useShipmentWebSocket = () => {
  const setShipments = useSetAtom(shipmentsAtom);
  const websocketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const isUnmountedRef = useRef(false); // Para evitar reconexiones después del desmontaje
  const [error, setError] = useAtom(errorAtom);
  const handleMessage = useCallback(
    (event) => {
      try {
        const data = JSON.parse(event.data);
        setShipments(data);
      } catch (error) {
        console.error('Error procesando el mensaje de WebSocket:', error);
      }
    },
    [setShipments]
  );

  const connect = useCallback(() => {
    if (websocketRef.current) {
      websocketRef.current.close();
    }

    console.log('Conectando al WebSocket de envíos...');
    const ws = new WebSocket(WEBSOCKET_URL);

    ws.onopen = () => {
      console.log('WebSocket de envíos conectado');
    };

    ws.onclose = (event) => {
      if (!isUnmountedRef.current) {
        console.log('WebSocket de envíos desconectado:', event.code, event.reason);
        reconnect();
      }
    };

    ws.onerror = (error) => {
      console.log('Error en WebSocket de envíos:', error);
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
      console.log('Intentando reconectar al WebSocket de envíos...');
      connect();
    }, 5000); // Intentar reconectar cada 5 segundos
  }, [connect]);

  const sendMessage = useCallback((message) => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket no está abierto. No se puede enviar el mensaje.');
    }
  }, []);

  useEffect(() => {
    if(error)return;
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
  }, [connect, error]);

  return { sendMessage };
};

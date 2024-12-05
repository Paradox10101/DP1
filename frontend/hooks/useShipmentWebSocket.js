import { useEffect, useCallback, useRef } from 'react';
import { useSetAtom } from 'jotai';
import { shipmentsAtom } from '../atoms/shipmentAtoms';

const WEBSOCKET_URL = process.env.NODE_ENV === 'production'
  ? `${process.env.NEXT_PUBLIC_WEBSOCKET_URL_PROD}/shipments`
  : `${process.env.NEXT_PUBLIC_WEBSOCKET_URL}/shipments`;

export const useShipmentWebSocket = () => {
  const setShipments = useSetAtom(shipmentsAtom);
  const websocketRef = useRef(null); // Ref para manejar el WebSocket
  const reconnectTimeoutRef = useRef(null); // Ref para manejar el timeout de reconexión
  const reconnectAttemptsRef = useRef(0); // Contador de intentos de reconexión

  const handleMessage = useCallback(
    (event) => {
      try {
        const data = JSON.parse(event.data);
        setShipments(data);
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    },
    [setShipments]
  );

  const connect = useCallback(() => {
    if (websocketRef.current) {
      websocketRef.current.close(); // Cerrar conexión existente si hay alguna
    }

    console.log('Connecting to WebSocket de envios...');
    const ws = new WebSocket(WEBSOCKET_URL);

    ws.onopen = () => {
      console.log('WebSocket de envios connected');
      reconnectAttemptsRef.current = 0; // Reiniciar contador de intentos en éxito
    };

    ws.onclose = () => {
      console.log('WebSocket de envios disconnected');
      scheduleReconnect(); // Intentar reconectar
    };

    ws.onerror = (error) => {
      console.error('WebSocket de envios error:', error);
    };

    ws.onmessage = handleMessage;

    websocketRef.current = ws; // Guardar la instancia del WebSocket en el ref
  }, [handleMessage]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const delay = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 30000); // Exponencial con máximo de 30s
    reconnectAttemptsRef.current += 1;

    console.log(`Attempting to reconnect in ${delay / 1000} seconds...`);

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect]);

  const sendMessage = useCallback((message) => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket no está abierto. No se puede enviar el mensaje.');
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return { sendMessage }; // Retornar sendMessage para uso en componentes
};

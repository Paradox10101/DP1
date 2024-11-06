// hooks/useWarehouseWebSocket.js
import { useEffect, useCallback, useRef } from 'react';
import { useSetAtom } from 'jotai';
import { shipmentsAtom } from '../atoms/shipmentAtoms';

const WEBSOCKET_URL = 'ws://1inf54-982-1a.inf.pucp.edu.pe:4567/ws/shipments';

export const useShipmentWebSocket = () => {
  const setShipments = useSetAtom(shipmentsAtom);
  const websocketRef = useRef(null); // Usamos un ref para el WebSocket

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

  const sendMessage = useCallback((message) => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket no está abierto. No se puede enviar el mensaje.');
    }
  }, []);

  useEffect(() => {
    const ws = new WebSocket(WEBSOCKET_URL);
    websocketRef.current = ws; // Guardar la instancia del WebSocket en el ref

    ws.onopen = () => {
      console.log('WebSocket de envios connected');
    };

    ws.onclose = () => {
      console.log('WebSocket de envios disconnected');
    };

    ws.onerror = (error) => {
      console.error('WebSocket de envios error:', error);
    };

    ws.onmessage = handleMessage;

    return () => {
      ws.close();
      websocketRef.current = null;
    };
  }, [handleMessage]);

  return { sendMessage }; // Retornar sendMessage para que se pueda usar en componentes
};


// hooks/useWarehouseWebSocket.js
import { useEffect, useCallback } from 'react';
import { useSetAtom } from 'jotai';
import { shipmentsAtom } from '../atoms/shipmentAtoms';

const WEBSOCKET_URL = 'ws://localhost:4567/ws/shipments';

export const useShipmentWebSocket = () => {
  const setShipments = useSetAtom(shipmentsAtom);

  const handleMessage = useCallback(
    (event) => {
      try {
        const data = JSON.parse(event.data);          
          setShipments(data)
          
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    },
    [setShipments]
  );

  useEffect(() => {
    const ws = new WebSocket(WEBSOCKET_URL);

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
    };
  }, [handleMessage]);
};

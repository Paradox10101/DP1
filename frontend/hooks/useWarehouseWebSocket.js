import { useEffect, useCallback, useRef } from 'react';
import { useSetAtom } from 'jotai';
import { occupancyUpdatesAtom, totalStatsAtom } from '../atoms/locationAtoms';

const WEBSOCKET_URL = process.env.NODE_ENV === 'production'
  ? `${process.env.NEXT_PUBLIC_WEBSOCKET_URL_PROD}/occupancy`
  : `${process.env.NEXT_PUBLIC_WEBSOCKET_URL}/occupancy`;

export const useWarehouseWebSocket = () => {
  const setOccupancyUpdates = useSetAtom(occupancyUpdatesAtom);
  const setTotalStats = useSetAtom(totalStatsAtom);
  const wsRef = useRef(null); // Usamos una referencia para manejar la instancia del WebSocket
  const reconnectTimeoutRef = useRef(null); // Para manejar el timeout de reconexión

  const handleMessage = useCallback(
    (event) => {
      console.log('WebSocket Occupancy message received:', event.data);
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'occupancy_update') {
          setOccupancyUpdates((prev) => ({
            ...prev,
            [data.ubigeo]: {
              occupiedPercentage: data.occupiedPercentage,
            },
          }));
          setTotalStats({
            totalOccupancy: data.totalOccupancy,
            warehouseCount: data.warehouseCount,
            timestamp: data.timestamp,
          });
        } else if (data.type === 'occupancy_update_batch') {
          setOccupancyUpdates((prev) => ({
            ...prev,
            ...Object.entries(data.states).reduce(
              (acc, [ubigeo, percentage]) => ({
                ...acc,
                [ubigeo]: { occupiedPercentage: percentage },
              }),
              {}
            ),
          }));
          setTotalStats({
            totalOccupancy: data.totalOccupancy,
            warehouseCount: data.warehouseCount,
            timestamp: data.timestamp,
          });
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    },
    [setOccupancyUpdates, setTotalStats]
  );

  const connect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    console.log('Connecting to WebSocket...');
    const ws = new WebSocket(WEBSOCKET_URL);

    ws.onopen = () => {
      console.log('WebSocket Capacidad connected');
    };

    ws.onclose = () => {
      console.log('WebSocket Capacidad disconnected');
      reconnect(); // Intentar reconectar al desconectarse
    };

    ws.onerror = (error) => {
      console.log('WebSocket Capacidad error:', error);
    };

    ws.onmessage = handleMessage;

    wsRef.current = ws; // Guardar referencia del WebSocket
  }, [handleMessage]);

  const reconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, 5000); // Intentar reconectar cada 5 segundos
  }, [connect]);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect, reconnect]);

  return null; // Este hook no tiene UI, solo maneja lógica
};

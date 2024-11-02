// hooks/useWarehouseWebSocket.js
import { useEffect, useCallback } from 'react';
import { useSetAtom } from 'jotai';
import { occupancyUpdatesAtom } from '../atoms/locationAtoms';

const WEBSOCKET_URL = 'ws://localhost:4567/ws/occupancy';

export const useWarehouseWebSocket = () => {
  const setOccupancyUpdates = useSetAtom(occupancyUpdatesAtom);

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
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    },
    [setOccupancyUpdates]
  );

  useEffect(() => {
    const ws = new WebSocket(WEBSOCKET_URL);

    ws.onopen = () => {
      console.log('WebSocket Capacidad connected');
    };

    ws.onclose = () => {
      console.log('WebSocket Capacidad disconnected');
    };

    ws.onerror = (error) => {
      console.error('WebSocket Capacidad error:', error);
    };

    ws.onmessage = handleMessage;

    return () => {
      ws.close();
    };
  }, [handleMessage]);
};

// hooks/useWarehouseWebSocket.js
import { useEffect, useCallback } from 'react';
import { useSetAtom } from 'jotai';
import { occupancyUpdatesAtom, totalStatsAtom } from '../atoms/locationAtoms';

const WEBSOCKET_URL = 'ws://localhost:4567/api/v1/ws/occupancy';

export const useWarehouseWebSocket = () => {
  const setOccupancyUpdates = useSetAtom(occupancyUpdatesAtom);
  const setTotalStats = useSetAtom(totalStatsAtom);

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
          
          // Actualizar estadísticas totales
          setTotalStats({
            totalOccupancy: data.totalOccupancy,
            warehouseCount: data.warehouseCount,
            timestamp: data.timestamp
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
          
          // Actualizar estadísticas totales del batch
          setTotalStats({
            totalOccupancy: data.totalOccupancy,
            warehouseCount: data.warehouseCount,
            timestamp: data.timestamp
          });
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    },
    [setOccupancyUpdates, setTotalStats]
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

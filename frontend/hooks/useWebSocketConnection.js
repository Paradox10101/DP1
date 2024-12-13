import { useEffect, useCallback } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { 
  serverAvailableAtom,
  simulationMetricsAtom,
  simulationErrorAtom
} from '../atoms/simulationAtoms';
import { webSocketService } from '../services/websocketService';

export const useWebSocketConnection = () => {
  const [isAvailable, setIsAvailable] = useAtom(serverAvailableAtom);
  const setMetrics = useSetAtom(simulationMetricsAtom);
  const setError = useSetAtom(simulationErrorAtom);

  const handleMessage = useCallback((data) => {
    setMetrics(data);
  }, [setMetrics]);

  const handleConnectionChange = useCallback((status) => {
    const isConnected = status === 'connected';
    setIsAvailable(isConnected);
    if (!isConnected) {
      setError('Conexión perdida con el servidor');
    }
  }, [setIsAvailable, setError]);

  useEffect(() => {
    const ws = webSocketService.connect({
      onMessage: handleMessage,
      onConnectionChange: handleConnectionChange,
    });

    return () => ws.disconnect();
  }, [handleMessage, handleConnectionChange]);

  return { isAvailable };
};
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAtom } from 'jotai';
import { errorAtom, ErrorTypes } from '../atoms/errorAtoms';
import { serverAvailableAtom, simulationStatusAtom } from '../atoms/simulationAtoms';

const WEBSOCKET_CONFIG = {
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 3000,
  URL: 'wss://1inf54-982-1a.inf.pucp.edu.pe/ws'  // Cambiado a wss://
};


const createError = (type, customMessage = null) => {
  const baseErrors = {
    [ErrorTypes.CONNECTION]: {
      title: 'Servidor no disponible',
      message: 'No se puede conectar con el servidor. Por favor, verifica que el servidor esté en funcionamiento.',
      action: 'Intentar reconectar',
      type: ErrorTypes.CONNECTION
    },
    [ErrorTypes.SIMULATION]: {
      title: 'Simulación no iniciada',
      message: 'La simulación no está activa en este momento.',
      action: 'Verificar estado',
      type: ErrorTypes.SIMULATION
    },
    [ErrorTypes.DATA]: {
      title: 'Error de datos',
      message: 'Error al procesar datos recibidos',
      action: 'Reintentar',
      type: ErrorTypes.DATA
    }
  };

  const error = baseErrors[type];
  return {
    ...error,
    message: customMessage || error.message
  };
};

export const useWebSocket = ({
  onMessage,
  onConnectionChange,
}) => {
  const [error, setError] = useAtom(errorAtom);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const websocketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const connectRef = useRef(null);
  const [serverAvailable, setServerAvailable] = useAtom(serverAvailableAtom);
  const [simulationStatus, setSimulationStatus] = useAtom(simulationStatusAtom);

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (websocketRef.current) {
      websocketRef.current.onclose = null;
      websocketRef.current.close();
      websocketRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const checkSimulationStatus = useCallback(async () => {
    try {
      console.log('Verificando estado de simulación...');
      const response = await fetch('https://1inf54-982-1a.inf.pucp.edu.pe/api/v1/simulation/status');
      if (!response.ok) throw new Error('server_error');

      const data = await response.json();
      console.log('Estado de simulación:', data);

      setServerAvailable(true);

      if (data.isRunning) {
        setSimulationStatus('running');
        setError(null);
        return true;
      } else {
        setSimulationStatus('stopped');
        setError(createError(ErrorTypes.SIMULATION));
        return false;
      }
    } catch (error) {
      console.error('Error al verificar estado:', error);
      setServerAvailable(false);
      setError(createError(ErrorTypes.CONNECTION));
      return false;
    }
  }, [setServerAvailable, setSimulationStatus, setError]);

  const attemptReconnect = useCallback(() => {
    if (reconnectAttempts >= WEBSOCKET_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      console.log('Máximo número de intentos de reconexión alcanzado');
      setError(createError(
        ErrorTypes.CONNECTION,
        'No se pudo reconectar después de varios intentos. Por favor, verifica tu conexión.'
      ));
      return;
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`Intentando reconectar... (Intento ${reconnectAttempts + 1})`);
      setReconnectAttempts(prev => prev + 1);
      connectRef.current?.(); // Usar la referencia a connect
    }, WEBSOCKET_CONFIG.RECONNECT_DELAY);
  }, [reconnectAttempts, setError]);

  const connect = useCallback(async () => {
    if (websocketRef.current) {
      cleanup();
    }

    console.log('Iniciando conexión WebSocket...');
    const isActive = await checkSimulationStatus();
    if (!isActive) {
      console.log('Simulación no activa, no se establece conexión');
      return;
    }

    try {
      websocketRef.current = new WebSocket(WEBSOCKET_CONFIG.URL);

      websocketRef.current.onopen = () => {
        console.log('WebSocket conectado exitosamente');
        setIsConnected(true);
        setServerAvailable(true);
        setError(null);
        setReconnectAttempts(0);
        onConnectionChange?.('connected');
      };

      websocketRef.current.onclose = async () => {
        console.log('WebSocket cerrado');
        setIsConnected(false);
        setServerAvailable(false);
        onConnectionChange?.('disconnected');
  
        const shouldReconnect = await checkSimulationStatus();
        if (shouldReconnect) {
          attemptReconnect();
        }
      };

      websocketRef.current.onerror = () => {
        console.log('Error en WebSocket');
        setServerAvailable(false);
        setError(createError(ErrorTypes.CONNECTION));
        onConnectionChange?.('error');
      };

      websocketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data && data.type === 'FeatureCollection' && Array.isArray(data.features)) {
            onMessage?.(data);
            setError(null);
          }
        } catch (err) {
          console.error('Error al procesar mensaje WebSocket:', err);
          setError(createError(ErrorTypes.DATA));
        }
      };
    } catch (error) {
      console.error('Error al crear conexión WebSocket:', error);
      setError(createError(ErrorTypes.CONNECTION));
      onConnectionChange?.('failed');
    }
  }, [
    checkSimulationStatus,
    cleanup,
    onConnectionChange,
    onMessage,
    setError,
    attemptReconnect
  ]);

  // Mantener una referencia actualizada a la función connect
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    if (simulationStatus === 'running') {
      console.log('Simulación iniciada, estableciendo conexión WebSocket');
      connect();
    } else {
      console.log('Simulación detenida, limpiando conexión WebSocket');
      cleanup();
    }

    return cleanup;
  }, [simulationStatus, connect, cleanup]);

  return {
    isConnected,
    reconnectAttempts,
    connect,
    disconnect: cleanup,
    checkStatus: checkSimulationStatus
  };
};
// src/hooks/useWebSocket.js
import { useState, useEffect, useCallback, useRef } from 'react';

const WEBSOCKET_CONFIG = {
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 3000,
  URL: 'ws://localhost:4567/ws'
};

export const useWebSocket = ({ 
    onMessage, 
    onConnectionChange,
    simulationStatus 
  }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const [reconnectAttempts, setReconnectAttempts] = useState(0);
    const websocketRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
  
    const cleanup = useCallback(() => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (websocketRef.current) {
        websocketRef.current.close();
        websocketRef.current = null;
      }
    }, []);
  
    const connect = useCallback(() => {
      // Limpiar conexiones anteriores
      cleanup();
  
      if (!simulationStatus || simulationStatus !== 'running') {
        return;
      }
  
      try {
        websocketRef.current = new WebSocket(WEBSOCKET_CONFIG.URL);
  
        websocketRef.current.onopen = () => {
          console.log('WebSocket conectado');
          setIsConnected(true);
          setError(null);
          setReconnectAttempts(0);
          onConnectionChange?.('succeeded');
        };
  
        websocketRef.current.onclose = (event) => {
          console.log('WebSocket cerrado', event);
          setIsConnected(false);
          onConnectionChange?.('failed');
          // Solo intentar reconectar si la simulación sigue activa
          if (simulationStatus === 'running') {
            attemptReconnect();
          }
        };
  
        websocketRef.current.onerror = (error) => {
          console.error('Error en WebSocket:', error);
          setError('Error en WebSocket');
          onConnectionChange?.('failed');
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
            setError('Error al procesar datos del WebSocket');
          }
        };
      } catch (error) {
        console.error('Error al crear conexión WebSocket:', error);
        setError('Error al crear conexión WebSocket');
        onConnectionChange?.('failed');
      }
    }, [simulationStatus, cleanup, onConnectionChange, onMessage]);
  
    const attemptReconnect = useCallback(() => {
      if (reconnectAttempts >= WEBSOCKET_CONFIG.MAX_RECONNECT_ATTEMPTS) {
        setError('No se pudo reconectar al WebSocket');
        return;
      }
  
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log(`Intentando reconectar... (Intento ${reconnectAttempts + 1})`);
        setReconnectAttempts(prev => prev + 1);
        connect();
      }, WEBSOCKET_CONFIG.RECONNECT_DELAY);
    }, [reconnectAttempts, connect]);
  
    useEffect(() => {
      if (simulationStatus === 'running') {
        connect();
      } else {
        cleanup();
      }
      return cleanup;
    }, [simulationStatus, connect, cleanup]);
  
    return {
      isConnected,
      error,
      reconnectAttempts,
      connect,
      disconnect: cleanup
    };
  };
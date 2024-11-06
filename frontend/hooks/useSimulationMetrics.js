import { useState, useEffect, useCallback, useRef } from 'react';
import { useAtom } from 'jotai';
import { errorAtom, ErrorTypes } from '../atoms/errorAtoms';
import { simulationStatusAtom } from '../atoms/simulationAtoms';

const WEBSOCKET_CONFIG = {
    MAX_RECONNECT_ATTEMPTS: 5,
    RECONNECT_DELAY: 3000,
    URL: 'wss://1inf54-982-1a.inf.pucp.edu.pe/ws/simulation'
};


const createError = (type, customMessage = null) => {
    const baseErrors = {
        [ErrorTypes.CONNECTION]: {
            title: 'Error de conexión métricas',
            message: 'No se puede conectar con el servicio de métricas.',
            type: ErrorTypes.CONNECTION
        },
        [ErrorTypes.DATA]: {
            title: 'Error de datos de métricas',
            message: 'Error al procesar datos de la simulación',
            type: ErrorTypes.DATA
        }
    };

    const error = baseErrors[type];
    return {
        ...error,
        message: customMessage || error.message
    };
};

export const useSimulationMetrics = () => {
    const [metrics, setMetrics] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [reconnectAttempts, setReconnectAttempts] = useState(0);
    const [error, setError] = useAtom(errorAtom);
    const [simulationStatus] = useAtom(simulationStatusAtom);
    const websocketRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);

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

    const handleMetricsMessage = useCallback((event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.startTime && data.endTime &&
                data.simulatedTime && data.realElapsedTime) {

                // Utilizamos los datos tal cual vienen del backend
                const formattedData = {
                    startTime: data.startTime,
                    endTime: data.endTime,
                    simulatedTime: data.simulatedTime,
                    realElapsedTime: data.realElapsedTime,
                    isPaused: data.isPaused,
                    isStopped: data.isStopped
                };

                setMetrics(prevMetrics => {
                    if (JSON.stringify(prevMetrics) !== JSON.stringify(formattedData)) {
                        return formattedData;
                    }
                    return prevMetrics;
                });
                setError(null);
            } else {
                console.warn('Datos incompletos recibidos:', data);
                throw new Error('Formato de métricas inválido');
            }
        } catch (err) {
            console.error('Error al procesar métricas:', err);
            setError(createError(ErrorTypes.DATA));
        }
    }, [setError]);

    const attemptReconnect = useCallback(() => {
        if (reconnectAttempts >= WEBSOCKET_CONFIG.MAX_RECONNECT_ATTEMPTS) {
            console.log('Máximo número de intentos de reconexión de métricas alcanzado');
            setError(createError(
                ErrorTypes.CONNECTION,
                'No se pudo reconectar al servicio de métricas.'
            ));
            return;
        }

        reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Intentando reconectar métricas... (Intento ${reconnectAttempts + 1})`);
            setReconnectAttempts(prev => prev + 1);
            connectWebSocket();
        }, WEBSOCKET_CONFIG.RECONNECT_DELAY);
    }, [reconnectAttempts, setError]);

    const connectWebSocket = useCallback(() => {
        if (websocketRef.current) {
            cleanup();
        }

        try {
            websocketRef.current = new WebSocket(WEBSOCKET_CONFIG.URL);

            websocketRef.current.onopen = () => {
                console.log('WebSocket de métricas conectado');
                setIsConnected(true);
                setError(null);
                setReconnectAttempts(0);
            };

            websocketRef.current.onclose = () => {
                console.log('WebSocket de métricas cerrado');
                setIsConnected(false);
                if (simulationStatus === 'running') {
                    attemptReconnect();
                }
            };

            websocketRef.current.onerror = () => {
                console.log('Error en WebSocket de métricas');
                setError(createError(ErrorTypes.CONNECTION));
            };

            websocketRef.current.onmessage = handleMetricsMessage;

        } catch (error) {
            console.error('Error al crear conexión WebSocket de métricas:', error);
            setError(createError(ErrorTypes.CONNECTION));
        }
    }, [handleMetricsMessage, cleanup, attemptReconnect, simulationStatus, setError]);

    useEffect(() => {
        if (simulationStatus === 'running') {
            console.log('Iniciando conexión de métricas...');
            connectWebSocket();
        } else {
            console.log('Cerrando conexión de métricas...');
            cleanup();
        }

        return cleanup;
    }, [simulationStatus, connectWebSocket, cleanup]);

    return {
        metrics,
        isConnected,
        error,
        reconnectAttempts
    };
};

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAtom } from 'jotai';
import { errorAtom, ErrorTypes } from '../atoms/errorAtoms';
import { simulationStatusAtom } from '../atoms/simulationAtoms';

const WEBSOCKET_CONFIG = {
    MAX_RECONNECT_ATTEMPTS: 5,
    RECONNECT_DELAY: 3000,
    URL: process.env.NODE_ENV === 'production'
        ? `${process.env.NEXT_PUBLIC_WEBSOCKET_URL_PROD}/simulation`
        : `${process.env.NEXT_PUBLIC_WEBSOCKET_URL}/simulation`
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
    const [planningStatus, setPlanningStatus] = useState({
        phase: 'collecting',
        totalOrders: 0,
        assignedOrders: 0,
        unassignedOrders: 0,
        message: ''
    });
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
            
            // Handle planning status updates
            if (data.phase) {
                setPlanningStatus(prevStatus => ({
                    ...prevStatus,
                    ...data,
                    isActive: data.phase !== 'completed'
                }));
                setError(null);
                return;
            }

            // Handle simulation metrics
            if (data.startTime && data.endTime && data.simulatedTime && data.realElapsedTime) {
                const formattedData = {
                    startTime: data.startTime,
                    endTime: data.endTime,
                    simulatedTime: data.simulatedTime,
                    simulatedDuration: data.simulatedDuration,
                    realElapsedTime: data.realElapsedTime,
                    realDuration: data.realDuration,
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
            } else if (data?.type) {
                const formattedData = { type: data.type };
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
            console.error('Error al procesar datos:', err);
            setError(createError(ErrorTypes.DATA));
        }
    }, [setError]);

    const attemptReconnect = useCallback(() => {
        if (reconnectAttempts >= WEBSOCKET_CONFIG.MAX_RECONNECT_ATTEMPTS) {
            console.log('Máximo número de intentos de reconexión alcanzado');
            setError(createError(
                ErrorTypes.CONNECTION,
                'No se pudo reconectar al servicio de métricas.'
            ));
            return;
        }

        reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Intentando reconectar... (Intento ${reconnectAttempts + 1})`);
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
                console.log('WebSocket conectado');
                setIsConnected(true);
                setError(null);
                setReconnectAttempts(0);
            };

            websocketRef.current.onclose = () => {
                console.log('WebSocket cerrado');
                setIsConnected(false);
                if (simulationStatus === 'running') {
                    attemptReconnect();
                }
            };

            websocketRef.current.onerror = () => {
                console.log('Error en WebSocket');
                setError(createError(ErrorTypes.CONNECTION));
            };

            websocketRef.current.onmessage = handleMetricsMessage;

        } catch (error) {
            console.error('Error al crear conexión WebSocket:', error);
            setError(createError(ErrorTypes.CONNECTION));
        }
    }, [handleMetricsMessage, cleanup, attemptReconnect, simulationStatus, setError]);

    useEffect(() => {
        if (simulationStatus === 'running') {
            console.log('Iniciando conexión...');
            connectWebSocket();
        } else {
            console.log('Cerrando conexión...');
            cleanup();
        }

        return cleanup;
    }, [simulationStatus, connectWebSocket, cleanup]);

    return {
        metrics,
        planningStatus,
        isConnected,
        error,
        reconnectAttempts
    };
};
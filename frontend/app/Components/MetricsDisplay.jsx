import React from 'react'
import { Calendar, Clock } from "lucide-react"
import { useSimulationMetrics } from "../../hooks/useSimulationMetrics"
import { useMemo } from 'react'

const MetricsDisplay = () => {

    const { metrics, isConnected: metricsConnected } = useSimulationMetrics();

    const formatDateTime = (isoString) => {
        try {
            // Validar que tengamos una fecha ISO válida
            if (!isoString || typeof isoString !== 'string') {
                console.warn('Fecha inválida recibida:', isoString);
                return "--/--/---- --:--";
            }
    
            // Crear un objeto Date a partir del string ISO
            const date = new Date(isoString);
    
            // Verificar si la fecha es válida
            if (isNaN(date.getTime())) {
                console.warn('Fecha inválida después de parsing:', isoString);
                return "--/--/---- --:--";
            }
    
            // Log para debugging
            console.log('Procesando fecha:', {
                original: isoString,
                parsed: date,
                formatted: date.toLocaleString()
            });
    
            return date.toLocaleString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        } catch (error) {
            console.error('Error formateando fecha:', error);
            return "--/--/---- --:--";
        }
    };    

    // Formatear métricas para mostrar
    const useFormattedMetrics = (metrics) => {
        return useMemo(() => {
            if (!metrics) {
                console.log('No hay métricas para formatear');
                return null;
            }
    
            // Log de métricas recibidas
            console.log('Métricas recibidas:', metrics);
    
            const formatted = {
                startTime: formatDateTime(metrics.startTime),
                endTime: formatDateTime(metrics.endTime),
                simulatedTime: metrics.simulatedTime || "--:--:--",
                realTime: metrics.realElapsedTime || "--:--:--"
            };
    
            // Log de métricas formateadas
            console.log('Métricas formateadas:', formatted);
    
            return formatted;
        }, [metrics]);
    };

    const formattedMetrics = useFormattedMetrics(metrics);

    if (!formattedMetrics) return null;

    return (
        <div className="flex flex-col gap-1">
            <div className="flex w-full flex-wrap gap-4">
                <Calendar className="max-w-[240px]" />
                <span className="regular">
                    Inicio: {formattedMetrics?.startTime}
                </span>
            </div>
            <div className="flex w-full flex-wrap gap-4">
                <Calendar className="max-w-[240px]" />
                <span className="regular">
                    Fin: {formattedMetrics?.endTime}
                </span>
            </div>
            <div className="flex w-full flex-wrap gap-4">
                <Clock className="max-w-[240px]" />
                <span className="regular">
                    Tiempo simulado: {formattedMetrics?.simulatedTime}
                </span>
            </div>
            <div className="flex w-full flex-wrap gap-4">
                <Clock className="max-w-[240px]" />
                <span className="regular">
                    Tiempo real en simulación: {formattedMetrics?.realTime}
                </span>
            </div>
        </div>
    )
}

export default MetricsDisplay;

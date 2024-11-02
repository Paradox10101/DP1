import React from 'react';
import { Calendar, Clock } from "lucide-react";
import { useSimulationMetrics } from "../../hooks/useSimulationMetrics";

const MetricsDisplay = () => {

    const { metrics } = useSimulationMetrics();

    if (!metrics) return null;

    return (
        <div className="flex flex-col gap-1">
            <div className="flex w-full flex-wrap gap-4">
                <Calendar className="max-w-[240px]" />
                <span className="regular">
                    Inicio: {metrics.startTime}
                </span>
            </div>
            <div className="flex w-full flex-wrap gap-4">
                <Calendar className="max-w-[240px]" />
                <span className="regular">
                    Fin: {metrics.endTime}
                </span>
            </div>
            <div className="flex w-full flex-wrap gap-4">
                <Clock className="max-w-[240px]" />
                <span className="regular">
                    Tiempo simulado: {metrics.simulatedTime}
                </span>
            </div>
            <div className="flex w-full flex-wrap gap-4">
                <Clock className="max-w-[240px]" />
                <span className="regular">
                    Tiempo real en simulación: {metrics.realElapsedTime}
                </span>
            </div>
        </div>
    );
};

export default MetricsDisplay;

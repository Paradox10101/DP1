import React from 'react';
import { Calendar, Clock } from "lucide-react";
import { useSimulationMetrics } from "../../hooks/useSimulationMetrics";
import { MetricItem } from './MetricItem'; 

const MetricsDisplay = () => {
  const { metrics } = useSimulationMetrics();
  
  if (!metrics) return null;

  const metricsData = [
    {
      icon: Calendar,
      label: "Inicio",
      value: metrics.startTime
    },
    {
      icon: Calendar,
      label: "Fin",
      value: metrics.endTime
    },
    {
      icon: Clock,
      label: "Tiempo simulado",
      value: metrics.simulatedTime
    },
    {
      icon: Clock,
      label: "Tiempo real en simulación",
      value: metrics.realElapsedTime
    }
  ];

  return (
    <div className="w-full flex flex-col gap-1">
      {metricsData.map((metric, index) => (
        <MetricItem
          key={index}
          icon={metric.icon}
          label={metric.label}
          value={metric.value}
        />
      ))}
    </div>
  );
};

export default MetricsDisplay;
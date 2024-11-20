import React, { useState } from 'react';
import { Calendar, Clock, Timer, Layout } from "lucide-react";
import { useSimulationMetrics } from "../../hooks/useSimulationMetrics";
import { MetricItem } from './MetricItem';

const MetricsDisplay = () => {
  const { metrics } = useSimulationMetrics();
  const [selectedCategories, setSelectedCategories] = useState(['time']);
  
  if (!metrics) return null;

  const categories = [
    { id: 'time', label: 'Tiempos', icon: Clock },
    { id: 'duration', label: 'Duraciones', icon: Timer },
    { id: 'all', label: 'Todo', icon: Layout }
  ];
  
  const metricsData = [
    {
      icon: Calendar,
      label: "Inicio",
      value: metrics.startTime,
      category: 'time'
    },
    {
      icon: Calendar,
      label: "Fin",
      value: metrics.endTime,
      category: 'time'
    },
    {
      icon: Clock,
      label: "Tiempo simulado",
      value: metrics.simulatedTime,
      category: 'time'
    },
    {
      icon: Timer,
      label: "Duración simulada",
      value: metrics.simulatedDuration,
      category: 'duration'
    },
    {
      icon: Clock,
      label: "Tiempo real en simulación",
      value: metrics.realElapsedTime,
      category: 'time'
    },
    {
      icon: Timer,
      label: "Duración real",
      value: metrics.realDuration,
      category: 'duration'
    }
  ];

  const filteredMetrics = metricsData.filter(metric =>
    selectedCategories.includes('all') || selectedCategories.includes(metric.category)
  );

  const toggleCategory = (categoryId) => {
    setSelectedCategories(prev => {
      if (categoryId === 'all') {
        return prev.includes('all') ? [] : ['all'];
      }
      const newSelection = prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev.filter(id => id !== 'all'), categoryId];
      return newSelection.length === 0 ? ['all'] : newSelection;
    });
  };

  return (
    <div className="w-full space-y-8 bg-white rounded-xl shadow-sm">
      {/* Modern Segmented Control */}
      <div className="relative bg-gray-100/50 p-1 rounded-lg">
        <div className="flex items-stretch">
          {categories.map((category, index) => {
            const isSelected = selectedCategories.includes(category.id);
            const Icon = category.icon;
            
            return (
              <button
                key={category.id}
                onClick={() => toggleCategory(category.id)}
                className={`
                  relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 
                  text-sm font-medium rounded-md transition-all duration-200
                  ${isSelected ? 'text-blue-600' : 'text-gray-600 hover:text-gray-800'}
                  ${index === 0 ? 'rounded-l-md' : ''}
                  ${index === categories.length - 1 ? 'rounded-r-md' : ''}
                `}
              >
                {/* Selection Background */}
                {isSelected && (
                  <div className="absolute inset-0 bg-white rounded-md shadow-sm"></div>
                )}
                
                {/* Content */}
                <div className="relative flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span>{category.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Metrics Grid with Animation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMetrics.map((metric, index) => (
          <div
            key={`${metric.label}-${index}`}
            className="transform transition-all duration-200 hover:scale-102"
          >
            <MetricItem
              icon={metric.icon}
              label={metric.label}
              value={metric.value}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MetricsDisplay;
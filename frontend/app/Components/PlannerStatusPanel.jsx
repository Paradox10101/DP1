import React, { useState, useEffect } from 'react';
import { Box, Route, Truck } from 'lucide-react';
import { Card } from '@nextui-org/react';
import { useSimulationMetrics } from '@/hooks/useSimulationMetrics';

const PlannerStatusPanel = () => {
  const { planningStatus } = useSimulationMetrics();
  const [prevPhase, setPrevPhase] = useState(planningStatus.phase);

  useEffect(() => {
    setPrevPhase(planningStatus.phase);
  }, [planningStatus.phase]);

  const phases = [
    {
      id: 'collecting',
      icon: Box,
      label: 'Recopilando órdenes',
      getStatus: (status) => ({
        value: status.availableOrders,
        detail: status.availableOrders === 1 ? 'orden' : 'órdenes'
      })
    },
    {
      id: 'routing',
      icon: Route,
      label: 'Calculando rutas',
      getStatus: (status) => {
        if (!status.routesStats) return null;
        const { completed, total } = status.routesStats;
        return {
          value: completed,
          total,
          progress: (completed / total) * 100,
          detail: 'rutas'
        };
      }
    },
    {
      id: 'assigning',
      icon: Truck,
      label: 'Asignando vehículos',
      getStatus: (status) => ({
        value: status.assignedVehicles,
        detail: status.assignedVehicles === 1 ? 'vehículo' : 'vehículos'
      })
    }
  ];

  const currentPhaseIndex = phases.findIndex(p => p.id === planningStatus.phase);

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50">
      <Card className="w-72 shadow-xl bg-white/80 backdrop-blur-md">
        <div className="p-5">
          <div className="space-y-6">
            {phases.map(({ id, icon: Icon, label, getStatus }, index) => {
              const isActive = planningStatus.phase === id;
              const isPast = currentPhaseIndex > index;
              const status = isActive ? 'active' : isPast ? 'completed' : 'pending';
              const phaseStatus = getStatus(planningStatus);
              
              return (
                <div key={id} 
                  className="relative transition-all duration-700 ease-in-out transform">
                  {index > 0 && (
                    <div className="absolute h-full w-px -top-6 left-3 
                      bg-gradient-to-b from-primary/40 to-primary/5
                      transition-all duration-700 ease-in-out" 
                    />
                  )}
                  
                  <div className="flex gap-4 items-start relative">
                    <div 
                      className={`relative rounded-lg p-1.5 shadow-sm 
                        transform transition-all duration-700 ease-in-out
                        ${status === 'pending' ? 'bg-gray-50 text-gray-400 scale-95' : 
                          status === 'completed' ? 'bg-primary/10 text-primary scale-100' : 
                          'bg-primary text-white scale-105'}`}
                    >
                      <Icon className="h-4 w-4 transition-transform duration-700 ease-in-out" strokeWidth={2.5} />
                      {isActive && (
                        <div className="absolute inset-0 rounded-lg ring-4 ring-primary/20 animate-pulse 
                          transition-all duration-700 ease-in-out" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 transition-all duration-700 ease-in-out">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium transform
                          transition-all duration-700 ease-in-out
                          ${status === 'pending' ? 'text-gray-400' : 
                            'text-gray-700'}`}>
                          {label}
                        </p>
                        {phaseStatus && (isActive || isPast) && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                            transform transition-all duration-700 ease-in-out
                            ${isActive ? 'bg-primary/10 text-primary scale-105' : 
                              'bg-green-50 text-green-600 scale-100'}`}>
                            {phaseStatus.total ? 
                              `${phaseStatus.value}/${phaseStatus.total}` : 
                              phaseStatus.value}
                          </span>
                        )}
                      </div>

                      {phaseStatus && isActive && (
                        <div className="mt-1.5 transform transition-all duration-700 ease-in-out">
                          {phaseStatus.total ? (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary rounded-full transform
                                    transition-all duration-700 ease-in-out"
                                  style={{ 
                                    width: `${phaseStatus.progress}%`,
                                    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
                                  }}
                                />
                              </div>
                              <span className="text-xs text-gray-700 transition-all duration-700 ease-in-out">
                                {Math.round(phaseStatus.progress)}%
                              </span>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-700 transition-all duration-700 ease-in-out">
                              {phaseStatus.value} {phaseStatus.detail} {isActive ? 'procesados' : 'completados'}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {planningStatus.message && (
            <div className="mt-4 pt-4 border-t border-gray-100 transition-all duration-700 ease-in-out">
              <p className="text-xs text-gray-700 text-center">
                {planningStatus.message}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PlannerStatusPanel;
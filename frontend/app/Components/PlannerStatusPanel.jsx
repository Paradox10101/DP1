import React, { useState, useEffect, useRef } from 'react';
import { Box, Route, Truck, ChevronDown, Play, Clock, AlertCircle } from 'lucide-react';
import { Card } from '@nextui-org/react';
import { useSimulationMetrics } from '@/hooks/useSimulationMetrics';

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? process.env.NEXT_PUBLIC_API_BASE_URL_PROD
  : process.env.NEXT_PUBLIC_API_BASE_URL;

  const ErrorMessage = ({ message, onDismiss }) => (
    <div className={`
      fixed top-4 right-4 bg-red-50 text-red-600 px-4 py-2 rounded-lg
      shadow-lg flex items-center gap-2 text-sm animate-in fade-in duration-300
    `}>
      <AlertCircle className="w-4 h-4" />
      <span>{message}</span>
    </div>
  );

const PeriodButton = ({ active, children, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200
      ${active 
        ? 'bg-primary text-white shadow-sm' 
        : 'text-gray-600 hover:bg-gray-100'
      }`}
  >
    {children}
  </button>
);

const CLEAR_TIMEOUT = 3000; // 3 segundos para limpiar el estado

const PlannerStatusPanel = () => {
  const { planningStatus } = useSimulationMetrics();
  const [localPlanningStatus, setLocalPlanningStatus] = useState(planningStatus);
  const [prevPhase, setPrevPhase] = useState(planningStatus?.phase);
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(3);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const clearTimeoutRef = useRef(null);
  
  // Obtener el periodo inicial
  useEffect(() => {
    const fetchInitialPeriod = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/simulation/planning-time`);
        if (response.ok) {
          const data = await response.json();
          setSelectedPeriod(data.seconds);
        }
      } catch (error) {
        console.log('Error al obtener el período inicial:', error);
      }
    };

    fetchInitialPeriod();
  }, []);

  // Efecto para limpiar el mensaje de error después de 3 segundos
  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => {
        setError(null);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [error]);

  useEffect(() => {
    if (planningStatus) {
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
      }
      setLocalPlanningStatus(planningStatus);
      setPrevPhase(planningStatus.phase);

      clearTimeoutRef.current = setTimeout(() => {
        setLocalPlanningStatus(null);
        setPrevPhase(null);
      }, 3000);
    }

    return () => {
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
      }
    };
  }, [planningStatus]);

  const periods = [
    { value: 5, label: '5s' },
    { value: 10, label: '10s' },
    { value: 15, label: '15s' }
  ];

  const handlePeriodChange = async (newPeriod) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/simulation/planning-period`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ seconds: newPeriod })
      });

      const data = await response.json();

      if (response.ok) {
        setSelectedPeriod(newPeriod);
      } else {
        setError(data.error || 'Error al cambiar el período');
      }
    } catch (error) {
      setError('Error de conexión al cambiar el período');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecute = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/simulation/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al ejecutar el planificador');
      }
    } catch (error) {
      setError('Error de conexión al ejecutar el planificador');
    } finally {
      setIsLoading(false);
    }
  };

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

  const currentPhaseIndex = localPlanningStatus ? phases.findIndex(p => p.id === localPlanningStatus.phase) : -1;

  return (
    <>
      {error && <ErrorMessage message={error} />}
      <div className="">
        <div className="w-full">
          <Card className={`
            shadow-lg bg-white/80 backdrop-blur-md
            transform transition-all duration-300 ease-in-out
            ${isExpanded ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-95'}
          `}>
            {/* Botón de toggle */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors duration-200"
            >
              <span className="text-sm font-medium text-gray-700">
                {isExpanded ? "Ocultar Planificador" : "Mostrar Planificador"}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-gray-600 transition-transform duration-300 ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Contenido del panel */}
            <div 
              className={`
                overflow-hidden transition-all duration-300 ease-in-out
                ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}
              `}
            >
              {/* Controles del planificador */}
              <div className="px-6 pt-2 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500">
                    Periodo de actualización
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-1">
                    {periods.map(period => (
                      <PeriodButton
                        key={period.value}
                        active={selectedPeriod === period.value}
                        onClick={() => handlePeriodChange(period.value)}
                      >
                        {period.label}
                      </PeriodButton>
                    ))}
                  </div>
                  <button
                    onClick={handleExecute}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md 
                      bg-primary/10 text-primary hover:bg-primary/15
                      transition-colors duration-200 text-xs font-medium"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Ejecutar</span>
                  </button>
                </div>
              </div>

              {/* Estado del planificador */}
              <div className="p-5 pt-4">
                {!localPlanningStatus ? (
                  <div className="text-center text-sm text-gray-500">
                    No hay planificación en curso
                  </div>
                ) : (
                  <div className="space-y-6">
                    {phases.map(({ id, icon: Icon, label, getStatus }, index) => {
                      const isActive = localPlanningStatus.phase === id;
                      const isPast = currentPhaseIndex > index;
                      const status = isActive ? 'active' : isPast ? 'completed' : 'pending';
                      const phaseStatus = getStatus(localPlanningStatus);
                      
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
                )}
                
                {localPlanningStatus?.message && (
                  <div className="mt-4 pt-4 border-t border-gray-100 transition-all duration-700 ease-in-out">
                    <p className="text-xs text-gray-700 text-center">
                      {localPlanningStatus.message}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
    
  );
};

export default PlannerStatusPanel;

//<div className="fixed right-6 top-1/2 -translate-y-1/2 z-50">
//<div className="w-72">
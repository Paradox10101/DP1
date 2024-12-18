'use client'
import { performanceMetricsAtom, showSimulationModalAtom, simulationErrorAtom, simulationStatusAtom, simulationTypeAtom } from "@/atoms/simulationAtoms"
import { useDisclosure } from "@nextui-org/react"
import { useAtom } from "jotai"
import { useEffect, useState } from "react"
import PerformanceMetrics from "../Components/PerformanceMetrics"
import VehicleMap from "../Components/VehicleMap"
import SimulationPanel from "../Components/SimulationPanel/SimulationPanel"
import MapLegend from "../Components/MapLegend"
import PlannerStatusPanel from "../Components/PlannerStatusPanel"
import BlockedRoutesPanel from "../Components/BlockedRoutesPanel"
import BreakdownPanel from "../Components/BreakdownPanel"
import MaintenancePanel from "../Components/MaintenancePanel"
import DailyOperationsModal from "../Components/daily-operations/DailyOperationsModal";
import SimulationReport from "../Components/SimulationReport"
import { useSimulationDiariaInit } from '../../hooks/useSimulationDiariaInit';

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? process.env.NEXT_PUBLIC_API_BASE_URL_PROD
  : process.env.NEXT_PUBLIC_API_BASE_URL;

const DailyOperationsPage = () => {
  //const [simulationStatus, setSimulationStatus] = useAtom(simulationStatusAtom);
  //const [error, setError] = useAtom(simulationErrorAtom);
  const [performanceMetrics] = useAtom(performanceMetricsAtom);
  const [, setShowModal] = useAtom(showSimulationModalAtom);
  const [, setSimulationType] = useAtom(simulationTypeAtom);
  
  // Estados para controlar los modales
  const { simulationStatus, simulationType, error } = useSimulationDiariaInit();
  const {isOpen, onOpen, onClose} = useDisclosure();
  const {isOpen: isOpenReport, onOpen: onOpenReport, onOpenChange: onOpenChangeReport} = useDisclosure();
  const [reportShown, setReportShown] = useState(false);
  const [hasSimulationRun, setHasSimulationRun] = useState(false);
  const [ordersMetrics, setOrdersMetrics] = useState({
    totalOrders: 0,
    averageQuantity: 0,
    topDestinations: []
  });

  // Función para cargar métricas
  const fetchOrdersMetrics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/daily-metrics`);
      if (!response.ok) throw new Error('Error al cargar métricas');
      const data = await response.json();
      setOrdersMetrics(data);
      
      // Solo mostrar el modal inicial si no hay simulación en curso o completada
      if (data && !hasSimulationRun && simulationStatus !== 'running') {
        onOpen();
      }
    } catch (error) {
      console.error('Error cargando métricas:', error);
      setError('Error al cargar métricas de órdenes');
    }
  };

  // Cargar métricas al montar el componente
  useEffect(() => {
    fetchOrdersMetrics();
  }, []); 

  // Manejar estados de simulación
  useEffect(() => {
    if (simulationStatus === 'running') {
      setHasSimulationRun(true);
      onClose(); // Cerrar el modal inicial si está abierto
    }
    
    // Mostrar el reporte cuando la simulación se detiene
    if (simulationStatus === 'stopped' && hasSimulationRun) {
      onOpenReport();
    }
  }, [simulationStatus]);

  

  return (
    <>
      {/* Modal inicial - solo se muestra al cargar la página si no hay simulación */}
      {!hasSimulationRun && (
        <DailyOperationsModal 
          metrics={ordersMetrics} 
          isOpenReport={isOpen} 
          onCloseReport={onClose}
        />
      )}
      
      {/* Reporte de simulación - solo cuando termina una simulación */}
      {simulationStatus === 'stopped' && hasSimulationRun && (
        <SimulationReport 
          simulationType="diaria"
          isOpen={isOpenReport}
          onOpenChange={onOpenChangeReport}
        />
      )}

      <div className="relative w-screen h-screen">
        <PerformanceMetrics metrics={performanceMetrics} />
        <VehicleMap
          simulationStatus={simulationStatus}
        />
        <SimulationPanel openReport={onOpenReport} />
        <MapLegend cornerPosition={"top-20 right-5"} />
        <div className="fixed right-5 bottom-6 w-96 flex flex-col gap-2">
          <PlannerStatusPanel/>
          <BlockedRoutesPanel />
          <BreakdownPanel />
          <MaintenancePanel />
        </div>
      </div>
    </>
  )
}

export default DailyOperationsPage;
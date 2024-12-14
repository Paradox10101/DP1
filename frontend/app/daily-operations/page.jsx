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

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? process.env.NEXT_PUBLIC_API_BASE_URL_PROD
  : process.env.NEXT_PUBLIC_API_BASE_URL;

const DailyOperationsPage = () => {
  const [simulationStatus, setSimulationStatus] = useAtom(simulationStatusAtom)
  const [error, setError] = useAtom(simulationErrorAtom)
  const [performanceMetrics] = useAtom(performanceMetricsAtom)
  const [, setShowModal] = useAtom(showSimulationModalAtom)
  const [,setSimulationType] = useAtom(simulationTypeAtom);
  const {isOpen, onOpen, onClose} = useDisclosure();
  const [loadingModal, setLoadingModal] = useState(false)
  const [ordersMetrics, setOrdersMetrics] = useState({
    totalOrders: 0,
    averageQuantity: 0,
    topDestinations: []
  })

  // Función para cargar métricas
  const fetchOrdersMetrics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/daily-metrics`)
      if (!response.ok) throw new Error('Error al cargar métricas')
      const data = await response.json()
      setOrdersMetrics(data)
    } catch (error) {
      console.error('Error cargando métricas:', error)
      setError('Error al cargar métricas de órdenes')
    }
  }

  useEffect(() => {
    // Mostrar el modal y actualizar métricas cuando la simulación está detenida
    if (simulationStatus === 'stopped') {
      setShowModal(true)
      fetchOrdersMetrics()
    }
    setLoadingModal(true);
  }, [simulationStatus, setShowModal])

  useEffect(() => {
    setSimulationType('diaria');
  }, [])

  return (
    <>
      { loadingModal &&
        <DailyOperationsModal metrics={ordersMetrics} isOpenReport={isOpen} onCloseReport={onClose}/>
      }
      <div className="relative w-screen h-screen">
        <PerformanceMetrics metrics={performanceMetrics} />
        <VehicleMap
          simulationStatus={simulationStatus}
          setSimulationStatus={setSimulationStatus}
        />
        <SimulationPanel openReport={onOpen} />
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
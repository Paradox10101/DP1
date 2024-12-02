"use client"
import { useAtom } from 'jotai'
import { PanelRightClose } from "lucide-react"
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import PanelSimulacion from "@/app/Components/PanelSimulacion"
import MapLegend from "@/app/Components/MapLegend"
import SimulationPanel from "@/app/Components/SimulationPanel/SimulationPanel"
import DailyOperationsModal from '@/app/Components/daily-operations/DailyOperationsModal'
import {
  simulationStatusAtom,
  showControlsAtom,
  simulationErrorAtom,
  performanceMetricsAtom,
  showSimulationModalAtom,
  simulationTypeAtom
} from '@/atoms/simulationAtoms'

const VehicleMap = dynamic(() => import('@/app/Components/VehicleMap'), { ssr: false })
const PerformanceMetrics = dynamic(() => import('@/app/Components/PerformanceMetrics'), { ssr: false })

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? process.env.NEXT_PUBLIC_API_BASE_URL_PROD
  : process.env.NEXT_PUBLIC_API_BASE_URL;

const DailyOperationsPage = () => {
  const [simulationStatus, setSimulationStatus] = useAtom(simulationStatusAtom)
  const [error, setError] = useAtom(simulationErrorAtom)
  const [performanceMetrics] = useAtom(performanceMetricsAtom)
  const [, setShowModal] = useAtom(showSimulationModalAtom)
  //const [tipoSimulacion, setTipoSimulacion] = useState('diaria');
  const [simulationType, setSimulationType] = useAtom(simulationTypeAtom);

  const [ordersMetrics, setOrdersMetrics] = useState({
    totalOrders: 0,
    averageQuantity: 0,
    topDestinations: []
  })

  useEffect(() => {
    // Mostrar el modal cuando la simulación está detenida
    if (simulationStatus === 'stopped') {
      setShowModal(true)
    }
  }, [simulationStatus, setShowModal])

  useEffect(() => {
    // Cargar las métricas de órdenes al iniciar
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
    fetchOrdersMetrics()
  }, [setError])

  useEffect(()=>{
    setSimulationType('diaria');
  }, [])

  return (
    <>
      <DailyOperationsModal metrics={ordersMetrics} />
      <div className="relative w-screen h-screen">
        <PerformanceMetrics metrics={performanceMetrics} />
        <VehicleMap
          simulationStatus={simulationStatus}
          setSimulationStatus={setSimulationStatus}
          tipoSimulacion={simulationType}
        />
        <SimulationPanel tipoSimulacion={simulationType}/>
        <MapLegend cornerPosition={"top-20 right-5"} />
      </div>
    </>
  )
}

export default DailyOperationsPage
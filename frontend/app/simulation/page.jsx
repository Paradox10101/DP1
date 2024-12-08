"use client"
import PanelSimulacion from "@/app/Components/PanelSimulacion"
import MapLegend from "@/app/Components/MapLegend"
import { useAtom } from 'jotai'
import { PanelRightClose } from "lucide-react";
import {
  simulationStatusAtom,
  showControlsAtom,
  simulationErrorAtom,
  performanceMetricsAtom,
  simulationTypeAtom
} from '@/atoms/simulationAtoms'
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import SimulationModal from '@/app/Components/SimulationModal';
import SimulationPanel from "../Components/SimulationPanel/SimulationPanel";
import SimulationReport from "@/app/Components/SimulationReport"
import { useDisclosure } from "@nextui-org/react";
import { useSimulationMetrics } from "@/hooks/useSimulationMetrics";
const VehicleMap = dynamic(() => import('@/app/Components/VehicleMap'), { ssr: false });
const PerformanceMetrics = dynamic(() => import('@/app/Components/PerformanceMetrics'), { ssr: false });

const page = () => {
  const [simulationStatus, setSimulationStatus] = useAtom(simulationStatusAtom);
  const [error, setError] = useAtom(simulationErrorAtom);
  const [performanceMetrics] = useAtom(performanceMetricsAtom);
  //const [tipoSimulacion, setTipoSimulacion] = useState('semanal');
  const [simulationType, setSimulationType] = useAtom(simulationTypeAtom);
  const [loadedSimulationType, setLoadedSimulationType] = useState(false);
  const {isOpen: isOpenReport, onOpen: onOpenReport, onOpenChange: onOpenChangeReport} = useDisclosure()
  const { metrics } = useSimulationMetrics();

  const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? process.env.NEXT_PUBLIC_API_BASE_URL_PROD
  : process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    // Cargar las métricas de órdenes al iniciar
    const fetchSimulationType = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/simulation/type`)
        if (!response.ok) throw new Error('Error al cargar el estado actual de simulacion')
        const data = await response.json()
        setSimulationType(data.type!==""?(data.type==="WEEKLY"?"semanal":data.type==="COLLAPSE"?"colapso":null):null)
      } catch (error) {
        console.error('Error cargando el estado de la simulacion:', error)
        setError('Error al cargar el estado de la simulacion')
      }
    }
    fetchSimulationType()
    setLoadedSimulationType(true);
  }, [])

  useEffect(()=>{
    if(simulationStatus=='stopped' && simulationType){
      onOpenReport()
      setLoadedSimulationType(true);
    }
  }, [simulationStatus])

  useEffect(()=>{
    if(metrics?.type)
      setSimulationStatus('stopped')
  }, [metrics])

  return (
    <>
        {
          (loadedSimulationType && simulationStatus === 'stopped') &&
            <SimulationModal />
        }
        {
          (loadedSimulationType  && simulationType && simulationStatus === 'stopped') &&
          <SimulationReport simulationType={simulationType} isOpen={isOpenReport} onOpenChange={onOpenChangeReport}/>
        }
        <div className="relative w-screen h-screen">
            <PerformanceMetrics metrics={performanceMetrics} />
            <VehicleMap simulationStatus={simulationStatus} setSimulationStatus={setSimulationStatus} />
            <SimulationPanel openReport={onOpenReport}/>
            <MapLegend cornerPosition={"top-20 right-5"} />
        </div>
    </>
  )
}

export default page

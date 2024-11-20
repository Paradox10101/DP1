"use client"
import PanelSimulacion from "@/app/Components/PanelSimulacion"
import MapLegend from "@/app/Components/MapLegend"
import { useAtom } from 'jotai'
import { PanelRightClose } from "lucide-react";
import {
  simulationStatusAtom,
  showControlsAtom,
  simulationErrorAtom,
  performanceMetricsAtom
} from '@/atoms/simulationAtoms'
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import SimulationModal from '@/app/Components/SimulationModal';
import SimulationPanel from "../Components/SimulationPanel/SimulationPanel";
const VehicleMap = dynamic(() => import('@/app/Components/VehicleMap'), { ssr: false });
const PerformanceMetrics = dynamic(() => import('@/app/Components/PerformanceMetrics'), { ssr: false });

const page = () => {
  const [simulationStatus, setSimulationStatus] = useAtom(simulationStatusAtom);
  const [error, setError] = useAtom(simulationErrorAtom);
  const [performanceMetrics] = useAtom(performanceMetricsAtom);
  const [tipoSimulacion, setTipoSimulacion] = useState('semanal');

  return (
    <>
        <SimulationModal />
        <div className="relative w-screen h-screen">
            <PerformanceMetrics metrics={performanceMetrics} />
            <VehicleMap simulationStatus={simulationStatus} setSimulationStatus={setSimulationStatus} />
            <SimulationPanel
              tipoSimulacion={tipoSimulacion}
            />
            <MapLegend cornerPosition={"top-20 right-5"} />
        </div>
    </>
  )
}

export default page
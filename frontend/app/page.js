"use client"
import PanelSimulacion from "@/app/Components/PanelSimulacion"
import MapLegend from "@/app/Components/MapLegend"
import { useAtom } from 'jotai'
import VehicleMap from "./Components/VehicleMap";
import { PanelRightClose } from "lucide-react";
import {
  simulationStatusAtom,
  showControlsAtom,
  simulationErrorAtom,
  performanceMetricsAtom
} from '@/atoms/simulationAtoms'
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const PerformanceMetrics = dynamic(() => import('@/app/Components/PerformanceMetrics'), { ssr: false });

export default function App() {
  const [showControls, setShowControls] = useAtom(showControlsAtom);
  const [simulationStatus, setSimulationStatus] = useAtom(simulationStatusAtom);
  const [error, setError] = useAtom(simulationErrorAtom);
  const [performanceMetrics] = useAtom(performanceMetricsAtom);

  const toggleControls = () => setShowControls(!showControls);

  return (
    <div>
      <div className="relative w-screen h-screen">
        <PerformanceMetrics metrics={performanceMetrics} />
        <VehicleMap simulationStatus={simulationStatus} setSimulationStatus={setSimulationStatus} />
        {showControls ? (
          <PanelSimulacion
            datos={[]}
            toggleControls={toggleControls}
            error={error}
          />
        ) : (
          <button
            onClick={toggleControls}
            className="bg-white w-[11vw] px-[22px] py-[11px] rounded text-principal encabezado absolute left-5 top-5 z-50 cursor-pointer flex flex-row justify-between items-center"
          >
            <div>
              <span className="text-principal encabezado">Mostrar Panel</span>
            </div>
            <PanelRightClose size={40} className="stroke-principal inline"/>
          </button>
        )}
        <MapLegend cornerPosition={showControls ? "left-[24vw]" : "left-[2vw]"} />
      </div>
    </div>
  );
}
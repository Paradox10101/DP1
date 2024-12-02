"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Card } from "@nextui-org/react";
import Header from "./Header";
import Navigation from "./Navigation";
import Tabs from "@/app/Components/ui/CustomTabs/Tabs";
import Tab from "@/app/Components/ui/CustomTabs/Tab";
import OpcionSimulacion from "@/app/Components/OpcionSimulacion";
import OpcionEnvios from "@/app/Components/OpcionEnvios";
import OpcionAlmacenes from "@/app/Components/OpcionAlmacenes";
import OpcionVehiculos from "@/app/Components/OpcionVehiculos";
import { simulationTypeAtom } from "@/atoms/simulationAtoms";
import { useAtom } from "jotai";

const ClockContainer = dynamic(() => import('@/app/Components/ClockContainer'), {
  ssr: false
});

export default function SimulationPanel() {
  const [simulationType] = useAtom(simulationTypeAtom);  
  return (
      <Card className="fixed left-5 top-1/2 -translate-y-1/2 w-[22vw] min-w-[400px] h-[95%] z-50 shadow-lg bg-white overflow-y-auto">
        <div className="flex flex-col h-full">
          <Header ClockContainer={ClockContainer} />
          <div className="flex flex-col gap-4 p-4 flex-1">
            <Navigation tipoSimulacion={simulationType}/>
            
            <Tabs variant="default" defaultTab="1">
              <Tab tabId="1" title="Simulación">
                <OpcionSimulacion
                  tipoSimulacion={simulationType}
                />
              </Tab>
              
              <Tab tabId="2" title="Envíos">
                <OpcionEnvios />
              </Tab>
              
              <Tab tabId="3" title="Almacenes">
                <OpcionAlmacenes />
              </Tab>
              
              <Tab tabId="4" title="Vehículos">
                <OpcionVehiculos />
              </Tab>
            </Tabs>
          </div>
        </div>
      </Card>
    );
  }
"use client";
import dynamic from "next/dynamic";
import { Card, Button } from "@nextui-org/react";
import Header from "./Header";
import Navigation from "./Navigation";
import Tabs from "@/app/Components/ui/CustomTabs/Tabs";
import Tab from "@/app/Components/ui/CustomTabs/Tab";
import OpcionSimulacion from "@/app/Components/OpcionSimulacion";
import OpcionEnvios from "@/app/Components/OpcionEnvios";
import OpcionAlmacenes from "@/app/Components/OpcionAlmacenes";
import OpcionVehiculos from "@/app/Components/OpcionVehiculos";
import { simulationTypeAtom } from "@/atoms/simulationAtoms";
import { showControlsAtom } from "@/atoms/simulationAtoms";
import { useAtom } from "jotai";
import { PanelRightOpen } from "lucide-react";

const ClockContainer = dynamic(() => import('@/app/Components/ClockContainer'), {
  ssr: false
});

export default function SimulationPanel({openReport}) {
  const [simulationType] = useAtom(simulationTypeAtom);  
  const [showControls, setShowControls] = useAtom(showControlsAtom);

  return (
    <>
      {/* Botón flotante para mostrar el panel cuando está oculto */}
      <Button
          isIconOnly
          variant="solid"
          className={`fixed left-5 top-1/2 -translate-y-1/2 z-50 bg-primary text-white transition-all duration-300 ${
            showControls ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          onClick={() => setShowControls(true)}
        >
          <PanelRightOpen size={24} />
        </Button>

      {/* Panel principal */}
      <Card 
        className={`fixed left-5 top-1/2 -translate-y-1/2 w-[22vw] min-w-[400px] h-[95%] z-50 shadow-lg bg-white overflow-y-auto transition-all duration-300 ease-in-out ${
          !showControls ? 'translate-x-[-120%]' : 'translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          <Header ClockContainer={ClockContainer} />
          <div className="flex flex-col gap-4 p-4 flex-1">
            <Navigation tipoSimulacion={simulationType}/>
            
            <Tabs variant="default" defaultTab="1">
              <Tab tabId="1" title="Simulación">
                <OpcionSimulacion
                  tipoSimulacion={simulationType}
                  openReport={openReport}
                  
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
    </>
    );
  }
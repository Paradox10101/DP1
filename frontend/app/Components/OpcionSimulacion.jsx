import { Button, Tab, Tabs, useDisclosure } from "@nextui-org/react"
import { Calendar, ChartColumnIncreasing, Clock, Pause, Play, Square } from "lucide-react"
import Dashboard from "@/app/Components/Dashboard"
import ModalContainer from "@/app/Components/ModalContainer"
import SimulationControls from '../Components/SimulationControls';
import { useAtom } from "jotai";
import { errorAtom, ErrorTypes, ERROR_MESSAGES } from '../../atoms/errorAtoms';
import { simulationStatusAtom } from "@/atoms/simulationAtoms";
import { useCallback, useState, useEffect, useMemo } from "react";
import { serverAvailableAtom } from '@/atoms/simulationAtoms';
import { useWebSocket } from "@/hooks/useWebSocket";
import SimulationSpeedControl from '../Components/SimulationSpeedControl';
import MetricsDisplay from '../Components/MetricsDisplay';

const SimulationStates = {
    RUNNING: 'running',
    PAUSED: 'paused',
    STOPPED: 'stopped',
    DISCONNECTED: 'disconnected'
  };
  
  export default function OpcionSimulacion({
    tipoSimulacion,
    setTipoSimulacion,
    date,
    fechaError,
    tiemposSimulacion,
  }) {    
    const [error, setError] = useAtom(errorAtom);
    const [simulationStatus, setSimulationStatus] = useAtom(simulationStatusAtom);
    const [serverAvailable, setServerAvailable] = useAtom(serverAvailableAtom);
    
    const handleWebSocketMessage = useCallback((data) => {
        //console.log('Datos recibidos del WebSocket:', data);
      }, []);
    
      const handleConnectionChange = useCallback((status) => {
        setServerAvailable(status === 'connected');
        if (status !== 'connected') {
          setSimulationStatus(SimulationStates.DISCONNECTED);
        }
      }, [setServerAvailable, setSimulationStatus]);

    const { connect, checkStatus } = useWebSocket({
        onMessage: handleWebSocketMessage,
        onConnectionChange: handleConnectionChange,
    });

    const handleSimulationControl = useCallback(async (action) => {
        if (!error || error.type !== ErrorTypes.CONNECTION) {
          try {
            const endpoint = simulationStatus === 'paused' && action === 'start'
              ? 'resume'
              : action;
            
            const response = await fetch(`http://localhost:4567/api/v1/simulation/${endpoint}`, {
              method: 'POST',
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || `Failed to ${action} simulation`);
            }
            
            switch (action) {
              case 'start':
                setSimulationStatus(SimulationStates.RUNNING);
                break;
              case 'pause':
                setSimulationStatus(SimulationStates.PAUSED);
                break;
              case 'stop':
                setSimulationStatus(SimulationStates.STOPPED);
                break;
            }
            setError(null);
          } catch (err) {
            console.error(`Error ${action}ing simulation:`, err);
            checkStatus();
          }
        }
      }, [simulationStatus, setSimulationStatus, setError, error]);
  
    const effectiveStatus = useMemo(() => 
        error?.type === ErrorTypes.CONNECTION 
          ? SimulationStates.DISCONNECTED 
          : simulationStatus
      , [error, simulationStatus]);
    
    useEffect(() => {
        console.log("estado: ", effectiveStatus);
    }, [effectiveStatus])

    useEffect(() => {
        console.log("servidor disponible: ", serverAvailable);
    }, [serverAvailable])

    // Hook para controlar el modal
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
return (

        <div className="h-full flex flex-col justify-between">
            <div className="flex flex-col gap-3 justify-between">
                <div className="w-full flex flex-col gap-2 justify-between">
                    <div >
                        <span className="encabezado">Tipo de Simulación</span>
                    </div>
                    <Tabs
                        className="bg-grisFondo flex flex-col rounded border-2 border-black"
                        selectedKey={tipoSimulacion}
                        onSelectionChange={setTipoSimulacion}
                    >
                        <Tab key="1" title={"Semanal"} className={`${tipoSimulacion==="1"?"bg-principal text-blanco":'bg-blanco text-negro'}`+" rounded focus:outline-none"}>
                        </Tab>
                        <Tab key="2" title={"Colapso"} className={`${tipoSimulacion==="2"?"bg-principal text-blanco":'bg-blanco text-negro'}`+" rounded focus:outline-none"}>
                        </Tab>
                    </Tabs>
                </div>
                
                <div className="w-full flex flex-col gap-1">
                    <div>
                        <span className="encabezado">Fecha de Inicio</span>
                    </div>
                    <div className="flex w-full gap-4">
                        <div className="flex flex-col gap-1">
                            <div>
                            <input
                                id="date-input"
                                type="date"
                                value={date !== null ? date : ""}
                                className="border-2 stroke-black rounded-2xl w-[180px] px-2"
                            />
                            </div>
                            <div className={`text-red-500 regular h-4`}>{fechaError?"Error en la fecha ingresada":" "}</div>
                        </div>
                    </div>
                </div>
                
                <div className="flex w-full flex-col gap-3">
                    <SimulationControls 
                        simulationStatus={effectiveStatus}
                        isServerAvailable={!error?.type || error.type !== ErrorTypes.CONNECTION}
                        handleSimulationControl={handleSimulationControl}
                    />

                    <SimulationSpeedControl
                        simulationStatus={effectiveStatus}
                    />
                </div>

                {error?.message && (
                    <div className="p-2 mb-2 text-sm text-red-600 bg-red-100 rounded-lg">
                        {error.message}
                    </div>
                )}
                
                <div className="flex flex-col gap-3">
                    <div>
                        <span className="regular_bold">Resumen de la simulación asd</span>
                    </div>
                    <MetricsDisplay/>
                </div>

            </div>
            <div>
                <Button disableRipple={true} 
                    className="bg-placeholder text-blanco w-full rounded regular py-[12px]" 
                    startContent={<ChartColumnIncreasing />}
                    onClick={onOpen}
                >
                    Visualizar Reporte
                </Button>    
                
            </div>
            <ModalContainer
                isOpen={isOpen}
                onOpen={onOpen}
                onOpenChange={onOpenChange}
                header={
                <div className="flex flex-row gap-2">
                    <div className="text-xl font-bold">Reporte de Simulación</div>
                </div>
                }
                body={<Dashboard />}
            />
        </div>
        
        
    )

}
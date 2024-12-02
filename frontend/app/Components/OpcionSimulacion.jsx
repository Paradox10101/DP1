import { Button, Modal, ModalBody, ModalContent, ModalHeader, Tab, Tabs, useDisclosure } from "@nextui-org/react"
import { Calendar, ChartColumnIncreasing, Clock, Pause, Play, Square } from "lucide-react"
import Dashboard from "@/app/Components/Dashboard"
import CollapseDashboard from "@/app/Components/CollapseDashboard"
import ModalContainer from "@/app/Components/ModalContainer"
import SimulationControls from '../Components/SimulationControls';
import { useAtom } from "jotai";
import { errorAtom, ErrorTypes, ERROR_MESSAGES } from '../../atoms/errorAtoms';
import { simulationStatusAtom, simulationTypeAtom, showSimulationModalAtom } from "@/atoms/simulationAtoms";
import { useCallback, useState, useEffect, useMemo, useRef } from "react";
import { serverAvailableAtom } from '@/atoms/simulationAtoms';
import { useWebSocket } from "@/hooks/useWebSocket";
import SimulationSpeedControl from '../Components/SimulationSpeedControl';
import MetricsDisplay from '../Components/MetricsDisplay';
import SimulationTypeDisplay from '../Components/SimulationPanel/SimulationTypeDisplay';
import SimulationSummary from '@/app/Components/SimulationPanel/SimulationSummary';
import ErrorDisplay from "./ErrorDisplay"

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? process.env.NEXT_PUBLIC_API_BASE_URL_PROD
  : process.env.NEXT_PUBLIC_API_BASE_URL;

  const SimulationStates = {
    RUNNING: 'running',
    PAUSED: 'paused',
    STOPPED: 'stopped',
    DISCONNECTED: 'disconnected'
  };
  
  export default function OpcionSimulacion({
    tipoSimulacion,
  }) {    
    const [error, setError] = useAtom(errorAtom);
    const [simulationStatus, setSimulationStatus] = useAtom(simulationStatusAtom);
    const [serverAvailable, setServerAvailable] = useAtom(serverAvailableAtom);
    const [simulationType] = useAtom(simulationTypeAtom);
    const [showModal, setShowModal] = useAtom(showSimulationModalAtom);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
  
    
    // Función para traducir el tipo de simulación
    const getSimulationTypeText = (type) => {
      return type === 'semanal' ? 'Simulación Semanal' : 
            type === 'colapso' ? 'Simulación hasta Colapso' : 
            'Tipo de simulación no seleccionado';
    };

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

    // Manejadores específicos para cada acción
  const handlePauseResume = useCallback(async () => {
    if (!error || error.type !== ErrorTypes.CONNECTION) {
      try {
        const action = simulationStatus === SimulationStates.RUNNING ? 'pause' : 'resume';
        const response = await fetch(`${API_BASE_URL}/simulation/${action}`, {
          method: 'POST',
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to ${action} simulation`);
        }
        
        setSimulationStatus(
          action === 'pause' ? SimulationStates.PAUSED : SimulationStates.RUNNING
        );
        setError(null);
      } catch (err) {
        console.error('Error toggling simulation:', err);
        checkStatus();
      }
    }
  }, [simulationStatus, setSimulationStatus, setError, error, checkStatus]);

  const handleStop = useCallback(async () => {
    if (!error || error.type !== ErrorTypes.CONNECTION) {
      try {
        const response = await fetch(`${API_BASE_URL}/simulation/stop`, {
          method: 'POST',
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to stop simulation');
        }
        
        setSimulationStatus(SimulationStates.STOPPED);
        setError(null);
      } catch (err) {
        console.error('Error stopping simulation:', err);
        checkStatus();
      }
    }
  }, [setSimulationStatus, setError, error, checkStatus]);
  
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

/*
    useEffect(()=>{
      
      if(simulationStatus==='stopped'){
          onOpen();
      }
    }, [simulationStatus])
*/

return (

        <div className="h-full flex flex-col justify-between gap-2">
            <div className="flex flex-col gap-3 justify-between">

              {tipoSimulacion !== 'diaria' && (
                <SimulationTypeDisplay 
                  simulationType={simulationType}
                  simulationStatus={effectiveStatus}
                  setShowModal={setShowModal}
                />
              )}
                
              <div className="flex w-full flex-col gap-3">
                <SimulationControls 
                  simulationStatus={effectiveStatus}
                  isServerAvailable={!error?.type || error.type !== ErrorTypes.CONNECTION}
                  onPauseResume={handlePauseResume}
                  onStop={handleStop}
                />

                {tipoSimulacion !== 'diaria' && (
                  <SimulationSpeedControl
                    simulationStatus={effectiveStatus}
                  />
                )}
              </div>

              <ErrorDisplay error={error}/>
              <SimulationSummary/>

            </div>

            <Button disableRipple={true} 
                    className="bg-principal text-blanco w-full rounded regular py-[12px]" 
                    startContent={<ChartColumnIncreasing />}
                    onClick={onOpen}
            >
              Visualizar Reporte
            </Button>


            {simulationType&&isOpen&&(simulationType==='semanal'||simulationType==='colapso')&&
              <Modal
                closeButton
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                isDismissable={true}
                blur
              >
                <ModalContent className="h-[775px] min-w-[850px]">
                <ModalHeader>
                  <div className="flex flex-row gap-2">
                        <div className="text-xl font-bold">{"Reporte de Simulación " + simulationType}</div>
                    </div>
                </ModalHeader>
                <ModalBody>
                  {simulationType==='semanal'?
                  <Dashboard onClose={onOpenChange}/>
                  :
                  simulationType==='colapso'?
                  <CollapseDashboard />
                  :
                  <></>
                  }
                </ModalBody>
                </ModalContent>
              </Modal>
            }
        </div>
        
        
    )

}

/*
<Button disableRipple={true} 
                    className="bg-placeholder text-blanco w-full rounded regular py-[12px]" 
                    startContent={<ChartColumnIncreasing />}
                    onClick={onOpen}
            >
              Visualizar Reporte
</Button>
*/
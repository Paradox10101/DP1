import { useCallback } from 'react';
import { useAtom } from 'jotai';
import { 
  simulationStatusAtom,
  simulationErrorAtom,
  simulationSpeedAtom
} from '../atoms/simulationAtoms';
import { simulationApi } from '../services/simulationApi';
import { SimulationStates } from '../app/constants';

export const useSimulationControls = () => {
  const [status, setStatus] = useAtom(simulationStatusAtom);
  const [error, setError] = useAtom(simulationErrorAtom);
  const [speed, setSpeed] = useAtom(simulationSpeedAtom);

  const handlePauseResume = useCallback(async () => {
    if (!error) {
      try {
        const action = status === SimulationStates.RUNNING ? 'pause' : 'resume';
        await simulationApi.toggleSimulation(action);
        
        setStatus(action === 'pause' ? SimulationStates.PAUSED : SimulationStates.RUNNING);
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    }
  }, [status, error, setStatus, setError]);

  const handleStop = useCallback(async () => {
    if (!error) {
      try {
        await simulationApi.stopSimulation();
        setStatus(SimulationStates.STOPPED);
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    }
  }, [error, setStatus, setError]);

  return {
    status,
    error,
    speed,
    setSpeed,
    handlePauseResume,
    handleStop,
  };
};

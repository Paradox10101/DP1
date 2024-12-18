import { useEffect } from 'react';
import { useAtom } from 'jotai';
import {
  simulationStatusAtom,
  simulationErrorAtom,
  simulationTypeAtom
} from '../atoms/simulationAtoms';

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? process.env.NEXT_PUBLIC_API_BASE_URL_PROD
  : process.env.NEXT_PUBLIC_API_BASE_URL;

export const useSimulationDiariaInit = () => {
  const [simulationStatus, setSimulationStatus] = useAtom(simulationStatusAtom);
  const [error, setError] = useAtom(simulationErrorAtom);
  const [simulationType, setSimulationType] = useAtom(simulationTypeAtom);

  useEffect(() => {
    const initializeSimulation = async () => {
      try {
        const startResponse = await fetch(`${API_BASE_URL}/simulation/start-daily`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (!startResponse.ok) {
          throw new Error(`HTTP error! status: ${startResponse.status}`);
        }

        const contentType = startResponse.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new TypeError("Recibida respuesta no JSON del servidor");
        }

        const startData = await startResponse.json();
        
        if (startData.success) {
          setSimulationType('diaria');
          setSimulationStatus('running');
          console.log('Simulación diaria iniciada exitosamente');
        } else {
          throw new Error(startData.message || 'Error al iniciar la simulación diaria');
        }

      } catch (error) {
        console.error('Error en la inicialización:', error);
        setError(error.message);
        setSimulationType(null);
        setSimulationStatus('stopped');
      }
    };

    initializeSimulation();
  }, []);

  return {
    simulationStatus,
    simulationType,
    error
  };
};
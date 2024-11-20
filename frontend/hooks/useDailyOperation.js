import { useState } from 'react'
import { useAtom } from 'jotai'
import { 
  simulationStatusAtom, 
  showSimulationModalAtom,
  simulationTypeAtom 
} from '@/atoms/simulationAtoms'
import { SIMULATION_STATUS } from '@/lib/utils/constants'

export const useDailyOperation = () => {
  const [error, setError] = useState(null)
  const [simulationStatus, setSimulationStatus] = useAtom(simulationStatusAtom)
  const [, setShowModal] = useAtom(showSimulationModalAtom)
  const [, setSimulationType] = useAtom(simulationTypeAtom)

  const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? process.env.NEXT_PUBLIC_API_BASE_URL_PROD
  : process.env.NEXT_PUBLIC_API_BASE_URL;

  const startSimulation = async () => {
    try {
      // Obtener la fecha y hora actual
      const now = new Date()
      const currentDate = now.toISOString().split('T')[0] // Formato: YYYY-MM-DD
      const currentTime = now.toLocaleTimeString('en-US', { 
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }) // Formato: H:MM AM/PM

      const response = await fetch(`${API_BASE_URL}/simulation/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'diaria',
          startDate: currentDate,
          startTime: currentTime
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al iniciar simulación')
      }

      setSimulationStatus(SIMULATION_STATUS.RUNNING)
      setSimulationType('diaria')
      setShowModal(false) // Cerrar el modal
      setError(null)
    } catch (error) {
      setError(error.message)
      console.error('Error iniciando simulación:', error)
      throw error // Re-lanzar el error para que pueda ser manejado por el componente
    }
  }

  return {
    startSimulation,
    error,
    simulationStatus
  }
}
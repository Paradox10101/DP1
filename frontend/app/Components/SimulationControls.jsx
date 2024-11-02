import { Calendar, ChartColumnIncreasing, Clock, Pause, Play, Square } from "lucide-react"

// Estados posibles de la simulación
const SimulationStates = {
  RUNNING: 'running',
  PAUSED: 'paused',
  STOPPED: 'stopped',
  DISCONNECTED: 'disconnected'
};

// Funciones auxiliares para el estado
const getStatusColor = (status, isServerAvailable) => {
  if (!isServerAvailable) {
    return 'text-gray-600';
  }
  
  const colors = {
    [SimulationStates.RUNNING]: 'text-green-600',
    [SimulationStates.PAUSED]: 'text-yellow-600',
    [SimulationStates.STOPPED]: 'text-red-600',
    [SimulationStates.DISCONNECTED]: 'text-gray-600'
  };
  return colors[status] || 'text-gray-600';
};

const getStatusText = (status, isServerAvailable) => {
  if (!isServerAvailable) {
    return 'Servidor no disponible';
  }
  
  const texts = {
    [SimulationStates.RUNNING]: 'En ejecución',
    [SimulationStates.PAUSED]: 'Pausado',
    [SimulationStates.STOPPED]: 'Detenido',
    [SimulationStates.DISCONNECTED]: 'Desconectado'
  };
  return texts[status] || 'Desconocido';
};

const SimulationControls = ({ 
  simulationStatus, 
  handleSimulationControl,
  isServerAvailable = true // Nuevo prop para controlar disponibilidad del servidor
}) => {
  // Determinar si los controles deberían estar deshabilitados
  const areControlsDisabled = !isServerAvailable;

  return (
    <>
      <div className="text-sm">
        Estado:
        <span className={`ml-2 font-medium ${getStatusColor(simulationStatus, isServerAvailable)}`}>
          {getStatusText(simulationStatus, isServerAvailable)}
        </span>
      </div>
      <div className="flex justify-around w-full flex-row gap-2">
        {simulationStatus === SimulationStates.PAUSED && isServerAvailable ? (
          // Botón de reanudar cuando está pausado
          <button
            className={`p-2 rounded-lg flex items-center justify-center transition-colors duration-200
              ${areControlsDisabled 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}
            onClick={() => handleSimulationControl('start')}
            disabled={areControlsDisabled}
            title="Resume Simulation"
          >
            <Play size={20} />
            <span className="ml-2">Reanudar</span>
          </button>
        ) : (
          // Botón de inicio normal
          <button
            className={`p-2 rounded-lg flex items-center justify-center transition-colors duration-200
              ${areControlsDisabled || simulationStatus === SimulationStates.RUNNING
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
            onClick={() => handleSimulationControl('start')}
            disabled={areControlsDisabled || simulationStatus === SimulationStates.RUNNING}
            title="Start Simulation"
          >
            <Play size={20} />
            <span className="ml-2">Iniciar</span>
          </button>
        )}

        <button
          className={`p-2 rounded-lg flex items-center justify-center transition-colors duration-200
            ${areControlsDisabled || simulationStatus !== SimulationStates.RUNNING
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'}`}
          onClick={() => handleSimulationControl('pause')}
          disabled={areControlsDisabled || simulationStatus !== SimulationStates.RUNNING}
          title="Pause Simulation"
        >
          <Pause size={20} />
          <span className="ml-2">Pausar</span>
        </button>

        <button
          className={`p-2 rounded-lg flex items-center justify-center transition-colors duration-200
            ${areControlsDisabled || simulationStatus === SimulationStates.STOPPED
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
          onClick={() => handleSimulationControl('stop')}
          disabled={areControlsDisabled || simulationStatus === SimulationStates.STOPPED}
          title="Stop Simulation"
        >
          <Square size={20} />
          <span className="ml-2">Detener</span>
        </button>
      </div>
    </>
  );
};

export default SimulationControls;
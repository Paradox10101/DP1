import React from 'react';
import { SimulationStatus } from '@/app/constants';
import { SimulationStatusDisplay } from '@/app/Components/SimulationStatusDisplay';
import { SimulationButton } from '@/app/Components/SimulationButton';

const SimulationControls = ({
  simulationStatus,
  onPauseResume,
  onStop,
  isServerAvailable = true
}) => {
  const areControlsDisabled = !isServerAvailable;
  const isRunning = simulationStatus === SimulationStatus.RUNNING;
  const isPaused = simulationStatus === SimulationStatus.PAUSED;
  const isStopped = simulationStatus === SimulationStatus.STOPPED;
  const isDisconnected = simulationStatus === SimulationStatus.DISCONNECTED;
  const canTogglePause = (isRunning || isPaused) && !isDisconnected;

  return (
    <div className="space-y-4">
      <SimulationStatusDisplay
        status={simulationStatus}
        isServerAvailable={isServerAvailable}
      />
      <div className="grid grid-cols-2 gap-3">
        <SimulationButton
          type="pauseResume"
          onClick={onPauseResume}
          disabled={areControlsDisabled || !canTogglePause || isDisconnected}
          simulationStatus={simulationStatus}
        />
        <SimulationButton
          type="stop"
          onClick={onStop}
          disabled={areControlsDisabled || isStopped || isDisconnected}
        />
      </div>
    </div>
  );
};

export default SimulationControls;

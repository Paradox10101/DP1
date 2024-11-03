package com.odiparpack.tasks;

import com.odiparpack.models.RouteSegment;
import com.odiparpack.models.SimulationState;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.logging.Level;

import static com.odiparpack.Main.logger;

public class TimeAdvancementTask implements Runnable {
    private final SimulationState state;
    private final LocalDateTime endTime;
    private final AtomicBoolean isSimulationRunning;
    private final Map<String, List<RouteSegment>> vehicleRoutes;

    public TimeAdvancementTask(SimulationState state, LocalDateTime endTime,
                               AtomicBoolean isSimulationRunning,
                               Map<String, List<RouteSegment>> vehicleRoutes) {
        this.state = state;
        this.endTime = endTime;
        this.isSimulationRunning = isSimulationRunning;
        this.vehicleRoutes = vehicleRoutes;
    }

    @Override
    public void run() {
        try {
            if (!isSimulationRunning.get() || state.isPaused() || state.isStopped()) {
                return;
            }

            state.updateSimulationTime();
            LocalDateTime currentTime = state.getCurrentTime();

            // Verificar si ha pasado un día completo

            long hours = state.calculateIntervalTime();
            if (hours != 0 && hours % 24 == 0) {
                // Llamar al método para guardar los pedidos del día actual
                state.guardarPedidosDiarios();
            }

            state.updateBlockages(currentTime, state.getAllBlockages());
            state.updateVehicleStates();
            state.updateOrderStatuses();

            if (currentTime.isAfter(endTime)) {
                logger.info("Simulación completada.");
                isSimulationRunning.set(false);
                state.stopSimulation();
            }
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Error en actualización de tiempo", e);
        }
    }
}
package com.odiparpack.tasks;

import com.odiparpack.api.routers.SimulationRouter;
import com.odiparpack.models.RouteSegment;
import com.odiparpack.models.SimulationState;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.logging.Level;

import static com.odiparpack.Main.logger;
import static com.odiparpack.SimulationRunner.TIME_ADVANCEMENT_INTERVAL_MINUTES;
import static com.odiparpack.SimulationRunner.TIME_ADVANCEMENT_INTERVAL_SECONDS;

public class TimeAdvancementTask implements Runnable {
    private final SimulationState state;
    private final AtomicBoolean isSimulationRunning;
    private final LocalDateTime endTime;
    private final Map<String, List<RouteSegment>> vehicleRoutes;
    private final boolean isDaily;

    public TimeAdvancementTask(SimulationState state,
                               AtomicBoolean isSimulationRunning,
                               Map<String, List<RouteSegment>> vehicleRoutes,
                               boolean isDaily) {
        this.state = state;
        this.isSimulationRunning = isSimulationRunning;
        this.endTime = state.getCurrentTime().plusDays(state.getSimulationType().getDays());
        this.vehicleRoutes = vehicleRoutes;
        this.isDaily = isDaily;
    }

    private Duration getCurrentTimeToAdvance() {
        if (isDaily) {
            return Duration.ofSeconds(TIME_ADVANCEMENT_INTERVAL_SECONDS);
        } else {
            // Para simulaciones semanales/colapso, obtener el valor actual
            return Duration.ofMinutes(TIME_ADVANCEMENT_INTERVAL_MINUTES);
        }
    }

    @Override
    public void run() {
        try {
            if (!isSimulationRunning.get() || state.isPaused() || state.isStopped()) {
                return;
            }

            // Obtener el timeToAdvance actual en cada ejecución
            Duration timeToAdvance = getCurrentTimeToAdvance();
            state.updateSimulationTime(timeToAdvance);
            LocalDateTime currentTime = state.getCurrentTime();

            // Verificar si ha pasado un día completo
            long hours = state.calculateIntervalTime();
            if (hours != 0 && hours % 24 == 0) {
                // Llamar al método para guardar los pedidos del día actual
                state.guardarPedidosDiarios();

                // Si es simulación diaria, terminar después de un día
                if (state.getSimulationType() == SimulationRouter.SimulationType.DAILY) {
                    logger.info("Simulación diaria completada.");
                    isSimulationRunning.set(false);
                    state.stopSimulation();
                    return;
                }
            }

            state.updateBlockages(currentTime, state.getAllBlockages());
            state.updateVehicleStates();
            state.updateOrderStatuses();

            // Solo verificar endTime si no es simulación por colapso
            if (state.getSimulationType() != SimulationRouter.SimulationType.COLLAPSE &&
                    endTime != null && currentTime.isAfter(endTime)) {
                logger.info("Simulación completada.");
                isSimulationRunning.set(false);
                state.stopSimulation();
            }

            // Verificar colapsos
            if (state.getSimulationType() == SimulationRouter.SimulationType.COLLAPSE) {
                // Verificar colapso logístico por tiempo
                if (state.checkLogisticCollapse()) {
                    isSimulationRunning.set(false);
                    state.stopSimulation();
                    return;
                }

                // Verificar colapso por capacidad
                if (state.checkCapacityCollapse()) {
                    isSimulationRunning.set(false);
                    state.stopSimulation();
                    return;
                }
            }
            else if(state.getSimulationType() == SimulationRouter.SimulationType.WEEKLY){
                if(state.checkWeeklySimulationEnd()){
                    isSimulationRunning.set(false);
                    state.stopSimulation();
                    return;
                }
            }

        } catch (Exception e) {
            logger.log(Level.SEVERE, "Error en actualización de tiempo", e);
        }
    }
}
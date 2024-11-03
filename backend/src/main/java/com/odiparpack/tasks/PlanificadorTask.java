package com.odiparpack.tasks;

import com.odiparpack.models.RouteSegment;
import com.odiparpack.models.SimulationState;

import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.logging.Level;

import static com.odiparpack.Main.logger;
import static com.odiparpack.SimulationRunner.*;

import com.odiparpack.models.Order;
import com.odiparpack.models.VehicleAssignment;

public class PlanificadorTask implements Runnable {
    private final SimulationState state;
    private final AtomicBoolean isSimulationRunning;
    private final Map<String, List<RouteSegment>> vehicleRoutes;

    public PlanificadorTask(SimulationState state, AtomicBoolean isSimulationRunning,
                            Map<String, List<RouteSegment>> vehicleRoutes) {
        this.state = state;
        this.isSimulationRunning = isSimulationRunning;
        this.vehicleRoutes = vehicleRoutes;
    }

    @Override
    public void run() {
        if (!isSimulationRunning.get() || state.isPaused() || state.isStopped()) {
            return;
        }

        logger.info("Iniciando planificación: " + state.getCurrentTime());

        try {
            long[][] currentTimeMatrix = state.getCurrentTimeMatrix();
            List<Order> availableOrders = getAvailableOrders(state.getOrders(), state.getCurrentTime());
            logAvailableOrders(availableOrders);

            if (!availableOrders.isEmpty()) {
                List<VehicleAssignment> assignments = assignOrdersToVehicles(
                        availableOrders,
                        new ArrayList<>(state.getVehicles().values()),
                        state.getCurrentTime(),
                        state
                );

                if (!assignments.isEmpty()) {
                    calculateAndApplyRoutes(
                            currentTimeMatrix,
                            assignments,
                            state.getLocationIndices(),
                            state.getLocationNames(),
                            state.getLocationUbigeos(),
                            vehicleRoutes,
                            state
                    );
                }
            }
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Error en planificación", e);
        }
    }
}
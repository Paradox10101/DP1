package com.odiparpack.tasks;

import com.odiparpack.DataModel;
import com.odiparpack.models.RouteSegment;
import com.odiparpack.models.SimulationState;
import com.odiparpack.models.VehicleAssignment;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CancellationException;
import java.util.concurrent.RecursiveAction;
import java.util.logging.Level;

import static com.odiparpack.Main.logger;
import static com.odiparpack.SimulationRunner.applyRoutesToVehiclesWithGroups;
import static com.odiparpack.SimulationRunner.calculateRouteWithStrategies;

public class CalculateRoutesTask extends RecursiveAction {
    private final DataModel data;
    private final SimulationState state;
    private final Map<String, List<VehicleAssignment>> assignmentGroups;
    private final Map<String, List<RouteSegment>> vehicleRoutes;

    public CalculateRoutesTask(DataModel data, SimulationState state,
                               Map<String, List<VehicleAssignment>> assignmentGroups,
                               Map<String, List<RouteSegment>> vehicleRoutes) {
        this.data = data;
        this.state = state;
        this.assignmentGroups = assignmentGroups;
        this.vehicleRoutes = vehicleRoutes;
    }

    @Override
    protected void compute() {
        try {
            Map<String, List<RouteSegment>> newRoutes = calculateRouteWithStrategies(data, state);
            applyRoutesToVehiclesWithGroups(newRoutes, assignmentGroups, state);
            vehicleRoutes.putAll(newRoutes);
            logger.info("Nuevas rutas calculadas y agregadas en tiempo de simulación: " + state.getCurrentTime());
        } catch (Exception e) {
            if (e instanceof CancellationException || Thread.currentThread().isInterrupted()) {
                logger.warning("Cálculo de rutas fue cancelado");
            } else {
                logger.log(Level.SEVERE, "Error durante el cálculo de rutas", e);
            }
        }
    }
}

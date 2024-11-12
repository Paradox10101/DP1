package com.odiparpack.tasks;

import com.google.ortools.constraintsolver.*;
import com.odiparpack.DataModel;
import com.odiparpack.Main;
import com.odiparpack.models.RoutingResult;
import com.odiparpack.models.SimulationState;
import com.odiparpack.models.VehicleAssignment;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.RecursiveAction;
import java.util.logging.Level;

import static com.odiparpack.Main.*;
import static com.odiparpack.Main.locationUbigeos;

public class ProcessSubsetTask extends RecursiveAction {
    private SimulationState state;
    private List<VehicleAssignment> subset;
    private List<FirstSolutionStrategy.Value> strategies;
    private List<Main.SolutionData> solutions;
    private int depth;
    private int maxDepth;

    public ProcessSubsetTask(SimulationState state, List<VehicleAssignment> subset,
                             List<FirstSolutionStrategy.Value> strategies,
                             List<Main.SolutionData> solutions, int depth, int maxDepth) {
        this.state = state;
        this.subset = subset;
        this.strategies = strategies;
        this.solutions = solutions;
        this.depth = depth;
        this.maxDepth = maxDepth;
    }

    @Override
    protected void compute() {
        if (Thread.currentThread().isInterrupted()) {
            return;
        }

        if (depth > maxDepth) {
            logger.warning("Profundidad máxima alcanzada. Deteniendo la división de subconjuntos.");
            return;
        }

        if (subset.size() <= 1) {
            logger.info("No se puede dividir más. Pedido conflictivo detectado.");
            return;
        }

        for (FirstSolutionStrategy.Value strategy : strategies) {
            if (Thread.currentThread().isInterrupted()) {
                return;
            }

            logger.info("Intentando resolver subconjunto con estrategia: " + strategy);
            RoutingResult result = solveSubset(state, subset, strategy);

            if (result != null && result.solution != null) {
                logger.info("Solución encontrada para el subconjunto con estrategia: " + strategy);
                synchronized (solutions) {
                    solutions.add(new SolutionData(result.solution, result.routingModel, result.manager, result.data, state.getActiveBlockages()));
                }
                return;
            } else {
                logger.info("No se encontró solución para el subconjunto con estrategia: " + strategy);
            }
        }

        logger.info("Todas las estrategias fallaron para el subconjunto. Dividiendo nuevamente...");
        int mid = subset.size() / 2;
        List<VehicleAssignment> firstHalf = new ArrayList<>(subset.subList(0, mid));
        List<VehicleAssignment> secondHalf = new ArrayList<>(subset.subList(mid, subset.size()));

        invokeAll(
                new ProcessSubsetTask(state, firstHalf, strategies, solutions, depth + 1, maxDepth),
                new ProcessSubsetTask(state, secondHalf, strategies, solutions, depth + 1, maxDepth)
        );
    }

    private static RoutingResult solveSubset(SimulationState state, List<VehicleAssignment> subset, FirstSolutionStrategy.Value strategy) {
        if (Thread.currentThread().isInterrupted()) {
            return null;
        }

        try {
            DataModel data = new DataModel(state.getCurrentTimeMatrix(), new ArrayList<>(), subset, locationIndices, locationNames, locationUbigeos);
            RoutingIndexManager manager = createRoutingIndexManager(data, data.starts, data.ends);
            RoutingModel routing = createRoutingModel(manager, data);
            RoutingSearchParameters searchParameters = Main.createSearchParameters(strategy);

            Assignment solution = routing.solveWithParameters(searchParameters);

            if (solution != null) {
                logger.info("Solución encontrada para el subconjunto con estrategia: " + strategy);
                return new RoutingResult(solution, routing, manager, data);
            } else {
                logger.info("No se encontró solución para el subconjunto con estrategia: " + strategy);
                return null;
            }
        } catch (Exception e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            logger.log(Level.SEVERE, "Error al resolver el subconjunto con estrategia: " + strategy, e);
            return null;
        }
    }
}


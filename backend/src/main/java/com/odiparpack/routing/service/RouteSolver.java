package com.odiparpack.routing.service;

import com.odiparpack.routing.model.*;
import com.google.ortools.constraintsolver.*;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Logger;

import static com.odiparpack.models.SimulationState.locationNames;
import static com.odiparpack.models.SimulationState.locationUbigeos;

public class RouteSolver {
    private static final Logger logger = Logger.getLogger(RouteSolver.class.getName());
    private static RouteSolver instance;
    private final RoutingSearchParameters searchParameters;

    private RouteSolver() {
        this.searchParameters = main.defaultRoutingSearchParameters()
                .toBuilder()
                .setFirstSolutionStrategy(FirstSolutionStrategy.Value.CHRISTOFIDES)
                //.setLocalSearchMetaheuristic(LocalSearchMetaheuristic.Value.GUIDED_LOCAL_SEARCH)
                //.setTimeLimit(Duration.newBuilder().setSeconds(3).build())
                .build();
    }

    public static RouteSolver getInstance() {
        if (instance == null) {
            synchronized (RouteSolver.class) {
                if (instance == null) {
                    instance = new RouteSolver();
                }
            }
        }
        return instance;
    }

    public Route solveRoute(long[][] timeMatrix, int startIndex, int endIndex,
                            String startUbigeo, String endUbigeo) {
        logger.info("Calculando ruta desde " + startUbigeo + " hacia " + endUbigeo);

        RoutingSetup setup = createRoutingSetup(timeMatrix, startIndex, endIndex);
        Assignment solution = setup.routing.solveWithParameters(searchParameters);

        if (solution != null) {
            Route route = extractRoute(setup, solution, timeMatrix, startUbigeo, endUbigeo);
            logger.info("Ruta calculada exitosamente");
            return route;
        }

        // Fallback a Dijkstra
        logger.warning("OR-Tools no encontró solución, utilizando Dijkstra como fallback");
        LocalSearchRouter localSearchRouter = new LocalSearchRouter(timeMatrix);
        return localSearchRouter.findRoute(startIndex, endIndex);
    }

    private static class RoutingSetup {
        final RoutingIndexManager manager;
        final RoutingModel routing;

        RoutingSetup(RoutingIndexManager manager, RoutingModel routing) {
            this.manager = manager;
            this.routing = routing;
        }
    }

    private RoutingSetup createRoutingSetup(long[][] timeMatrix, int startIndex, int endIndex) {
        // Una sola ruta por vez
        final int vehicleNumber = 1;
        int[] starts = new int[]{startIndex};
        int[] ends = new int[]{endIndex};

        RoutingIndexManager manager = new RoutingIndexManager(
                timeMatrix.length, vehicleNumber, starts, ends);
        RoutingModel routing = new RoutingModel(manager);

        // Configurar callback de tránsito
        final int transitCallbackIndex = routing.registerTransitCallback((long fromIndex, long toIndex) -> {
            int fromNode = manager.indexToNode(fromIndex);
            int toNode = manager.indexToNode(toIndex);
            return timeMatrix[fromNode][toNode];
        });

        routing.setArcCostEvaluatorOfAllVehicles(transitCallbackIndex);
        routing.addDimension(transitCallbackIndex, 0, Integer.MAX_VALUE, true, "Time");

        // Añadir penalizaciones suaves
        addSoftPenalties(routing, manager, timeMatrix, startIndex, endIndex);

        return new RoutingSetup(manager, routing);
    }

    private void addSoftPenalties(RoutingModel routing,
                                  RoutingIndexManager manager,
                                  long[][] timeMatrix,
                                  int start,
                                  int end) {
        for (int i = 0; i < timeMatrix.length; i++) {
            if (!isStartOrEndNode(i, start, end)) {
                routing.addDisjunction(new long[]{manager.nodeToIndex(i)}, 5);
            }
        }
    }

    private static boolean isStartOrEndNode(int node, int start, int end) {
        return node == start || node == end;
    }

    private Route extractRoute(RoutingSetup setup,
                               Assignment solution,
                               long[][] timeMatrix,
                               String startUbigeo,
                               String endUbigeo) {
        List<com.odiparpack.models.RouteSegment> segments = new ArrayList<>();
        long totalTime = 0;

        long index = setup.routing.start(0);
        while (!setup.routing.isEnd(index)) {
            long previousIndex = index;
            index = solution.value(setup.routing.nextVar(index));

            int fromNode = setup.manager.indexToNode(previousIndex);
            int toNode = setup.manager.indexToNode(index);
            long duration = timeMatrix[fromNode][toNode];

            String fromName = locationNames.get(fromNode);
            String fromUbigeo = locationUbigeos.get(fromNode);
            String toName = locationNames.get(toNode);
            String toUbigeo = locationUbigeos.get(toNode);

            //segments.add(new RouteSegment(fromNode, toNode, duration));
            segments.add(new com.odiparpack.models.RouteSegment(fromName + " to " + toName,
                    fromUbigeo, toUbigeo, duration));

            totalTime += duration;
        }

        return new Route(segments, totalTime, true, startUbigeo, endUbigeo);
    }
}
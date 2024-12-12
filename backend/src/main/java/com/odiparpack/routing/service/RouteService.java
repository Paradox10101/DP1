package com.odiparpack.routing.service;

import com.odiparpack.models.Location;
import com.odiparpack.routing.model.Route;
import com.odiparpack.routing.summary.RoutingSummary;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

public class RouteService {
    private final RouteSolver solver;
    private final Map<String, Integer> locationIndices;
    private final long[][] timeMatrix;
    private static final Logger logger = Logger.getLogger(RouteService.class.getName());

    public RouteService(Map<String, Integer> locationIndices, long[][] timeMatrix) {
        this.solver = RouteSolver.getInstance();
        this.timeMatrix = timeMatrix;
        this.locationIndices = locationIndices;
    }

    public Route calculateRoute(String startUbigeo, String endUbigeo) {
        int startIndex = locationIndices.get(startUbigeo);
        int endIndex = locationIndices.get(endUbigeo);

        logger.info("Calculando ruta desde " + startUbigeo + " hacia " + endUbigeo);
        Route route = solver.solveRoute(timeMatrix, startIndex, endIndex, startUbigeo, endUbigeo);

        if (!route.isSuccessful()) {
            logger.warning("No se encontró solución para la ruta " + startUbigeo + " -> " + endUbigeo);
        }

        return route;
    }

    public Map<String, Route> findBestRoutes(String[] warehouses, String[] destinations) {
        Map<String, Route> bestRoutes = new HashMap<>();
        RoutingSummary summary = new RoutingSummary();

        for (String warehouse : warehouses) {
            for (String destination : destinations) {
                Route route = calculateRoute(warehouse, destination);
                processBestRoute(route, destination, bestRoutes, summary);
            }
        }

        summary.printSummary();
        return bestRoutes;
    }

    private void processBestRoute(Route route, String destination,
                                  Map<String, Route> bestRoutes,
                                  RoutingSummary summary) {
        if (route.isSuccessful()) {
            summary.addResult(destination, route.getStartUbigeo(), true, route.getTotalDuration());
            updateBestRoute(destination, route, bestRoutes);
        } else {
            summary.addResult(destination, route.getStartUbigeo(), false, 0);
        }
    }

    private void updateBestRoute(String destination, Route newRoute, Map<String, Route> bestRoutes) {
        bestRoutes.compute(destination, (key, existingRoute) -> {
            if (existingRoute == null ||
                    newRoute.getTotalDuration() < existingRoute.getTotalDuration()) {
                return newRoute;
            }
            return existingRoute;
        });
    }

}
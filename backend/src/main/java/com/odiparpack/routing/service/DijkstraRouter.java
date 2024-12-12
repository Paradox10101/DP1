package com.odiparpack.routing.service;

import com.odiparpack.models.Location;
import com.odiparpack.models.RouteSegment;
import com.odiparpack.routing.model.Route;

import java.util.*;

import static com.odiparpack.Main.*;

public class DijkstraRouter {
    private final long[][] timeMatrix;

    public DijkstraRouter(long[][] timeMatrix) {
        this.timeMatrix = timeMatrix;
    }

    private Map<String, Integer> initializeLocationIndices(List<Location> locations) {
        Map<String, Integer> indices = new HashMap<>();
        for (int i = 0; i < locations.size(); i++) {
            indices.put(locations.get(i).getUbigeo(), i);
        }
        return indices;
    }

    public Route findRoute(Integer startIndex, Integer endIndex) {
        int n = timeMatrix.length;

        String startUbigeo = locationUbigeos.get(startIndex);
        String endUbigeo = locationUbigeos.get(endIndex);

        if (startIndex == null || endIndex == null) {
            logger.warning("Ubigeo no encontrado - inicio: " + startUbigeo + ", fin: " + endUbigeo);
            return createEmptyRoute(startUbigeo, endUbigeo);
        }

        DijkstraResult result = executeDijkstraAlgorithm(n, startIndex, endIndex);

        if (result.distances[endIndex] == Long.MAX_VALUE) {
            logger.warning("No se encontró ruta entre " + startUbigeo + " y " + endUbigeo);
            return createEmptyRoute(startUbigeo, endUbigeo);
        }

        return buildRoute(result, startUbigeo, endUbigeo, endIndex);
    }

    private DijkstraResult executeDijkstraAlgorithm(int n, int startIdx, int endIdx) {
        long[] distances = new long[n];
        boolean[] visited = new boolean[n];
        int[] previous = new int[n];

        Arrays.fill(distances, Long.MAX_VALUE);
        Arrays.fill(previous, -1);
        distances[startIdx] = 0;

        for (int count = 0; count < n - 1; count++) {
            int u = findMinimumDistanceNode(distances, visited);
            if (u == -1) break;

            visited[u] = true;
            updateNeighborDistances(u, distances, visited, previous);
        }

        return new DijkstraResult(distances, previous);
    }

    private int findMinimumDistanceNode(long[] distances, boolean[] visited) {
        int u = -1;
        long minDistance = Long.MAX_VALUE;

        for (int i = 0; i < distances.length; i++) {
            if (!visited[i] && distances[i] < minDistance) {
                minDistance = distances[i];
                u = i;
            }
        }

        return u;
    }

    private void updateNeighborDistances(int u, long[] distances, boolean[] visited, int[] previous) {
        for (int v = 0; v < distances.length; v++) {
            if (!visited[v] &&
                    timeMatrix[u][v] != Long.MAX_VALUE &&
                    distances[u] != Long.MAX_VALUE &&
                    distances[u] + timeMatrix[u][v] < distances[v]) {

                distances[v] = distances[u] + timeMatrix[u][v];
                previous[v] = u;
            }
        }
    }

    private Route buildRoute(DijkstraResult result, String startUbigeo, String endUbigeo, int endIdx) {
        List<RouteSegment> segments = new ArrayList<>();
        List<Integer> pathIndices = reconstructPath(result.previous, endIdx);

        for (int i = 0; i < pathIndices.size() - 1; i++) {
            segments.add(createRouteSegment(pathIndices.get(i), pathIndices.get(i + 1)));
        }

        return new Route(segments, result.distances[endIdx], true, startUbigeo, endUbigeo);
    }

    private List<Integer> reconstructPath(int[] previous, int endIdx) {
        List<Integer> pathIndices = new ArrayList<>();
        for (int at = endIdx; at != -1; at = previous[at]) {
            pathIndices.add(0, at);
        }
        return pathIndices;
    }

    private RouteSegment createRouteSegment(int fromIdx, int toIdx) {
        return new RouteSegment(
                locationNames.get(fromIdx) + " to " + locationNames.get(toIdx),
                locationUbigeos.get(fromIdx),
                locationUbigeos.get(toIdx),
                timeMatrix[fromIdx][toIdx]
        );
    }

    private Route createEmptyRoute(String startUbigeo, String endUbigeo) {
        logger.warning("No se encontró solución para la ruta " + startUbigeo + " -> " + endUbigeo);
        return new Route(Collections.emptyList(), 0, false, startUbigeo, endUbigeo);
    }

    private static class DijkstraResult {
        final long[] distances;
        final int[] previous;

        DijkstraResult(long[] distances, int[] previous) {
            this.distances = distances;
            this.previous = previous;
        }
    }
}
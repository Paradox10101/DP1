package com.odiparpack.routing.service;

import com.odiparpack.models.Location;
import com.odiparpack.models.RouteSegment;
import com.odiparpack.routing.model.Route;

import java.util.*;

import static com.odiparpack.Main.*;

public class LocalSearchRouter {
    private final long[][] timeMatrix;

    public LocalSearchRouter(long[][] timeMatrix) {
        this.timeMatrix = timeMatrix;
    }

    public Route findRoute(Integer startIndex, Integer endIndex) {
        int n = timeMatrix.length;

        String startUbigeo = locationUbigeos.get(startIndex);
        String endUbigeo = locationUbigeos.get(endIndex);

        if (startIndex == null || endIndex == null) {
            logger.warning("Ubigeo no encontrado - inicio: " + startUbigeo + ", fin: " + endUbigeo);
            return createEmptyRoute(startUbigeo, endUbigeo);
        }

        LocalSearchResult result = executeDijkstraAlgorithm(n, startIndex, endIndex);

        if (result.distances[endIndex] == Long.MAX_VALUE) {
            logger.warning("No se encontró ruta entre " + startUbigeo + " y " + endUbigeo);
            return createEmptyRoute(startUbigeo, endUbigeo);
        }

        return buildRoute(result, startUbigeo, endUbigeo, endIndex);
    }

    private LocalSearchResult executeDijkstraAlgorithm(int n, int startIdx, int endIdx) {
        /*System.out.println("\n=== Iniciando Dijkstra ===");
        System.out.println("Nodos totales: " + n);
        System.out.println("Índice inicio: " + startIdx);
        System.out.println("Índice fin: " + endIdx);*/

        long[] distances = new long[n];
        boolean[] visited = new boolean[n];
        int[] previous = new int[n];

        Arrays.fill(distances, Long.MAX_VALUE);
        Arrays.fill(previous, -1);
        distances[startIdx] = 0;

        /*System.out.println("\nDistancia inicial al nodo inicio: " + distances[startIdx]);
        System.out.println("Distancia inicial al nodo fin: " + distances[endIdx]);*/

        for (int count = 0; count < n - 1; count++) {
            int u = findMinimumDistanceNode(distances, visited);
            if (u == -1) {
                //System.out.println("\nNo se encontraron más nodos alcanzables en iteración " + count);
                break;
            }

            /*System.out.println("\nIteración " + count + ":");
            System.out.println("Procesando nodo: " + u);
            System.out.println("Distancia actual al nodo: " + distances[u]);*/

            visited[u] = true;

            // Verificar conexiones del nodo actual
            /*System.out.println("Conexiones desde nodo " + u + ":");
            int conexionesValidas = 0;
            for (int v = 0; v < n; v++) {
                if (timeMatrix[u][v] != Long.MAX_VALUE) {
                    conexionesValidas++;
                }
            }
            System.out.println("Tiene " + conexionesValidas + " conexiones válidas");*/

            updateNeighborDistances(u, distances, visited, previous);
        }

        // Mostrar distancia al nodo final después de cada iteración
        //System.out.println("Distancia actual al nodo final: " + distances[endIdx]);
        return new LocalSearchResult(distances, previous);
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

    private Route buildRoute(LocalSearchResult result, String startUbigeo, String endUbigeo, int endIdx) {
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

    private static class LocalSearchResult {
        final long[] distances;
        final int[] previous;

        LocalSearchResult(long[] distances, int[] previous) {
            this.distances = distances;
            this.previous = previous;
        }
    }
}
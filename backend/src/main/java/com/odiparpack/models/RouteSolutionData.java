package com.odiparpack.models;

import com.google.ortools.constraintsolver.Assignment;
import com.google.ortools.constraintsolver.RoutingIndexManager;
import com.google.ortools.constraintsolver.RoutingModel;
import com.odiparpack.DataModel;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.odiparpack.Utils.calculateDistanceFromNodes;

public class RouteSolutionData {
    public long objectiveValue;
    public Map<String, List<RouteSegment>> routes;        // Mapa de rutas por origen-destino
    public Map<String, Long> routeTimes;                  // Tiempos por origen-destino
    public long maxRouteTime;
    private final RouteCache routeCache;                  // Opcional, puede ser null

    public RouteSolutionData(Assignment solution,
                             RoutingModel routingModel,
                             RoutingIndexManager manager,
                             DataModel data,
                             List<Blockage> activeBlockages,
                             RouteCache routeCache) {
        this.routes = new HashMap<>();
        this.routeTimes = new HashMap<>();
        this.maxRouteTime = 0;
        this.objectiveValue = solution.objectiveValue();
        this.routeCache = routeCache;

        processRoutes(solution, routingModel, manager, data, activeBlockages);
    }

    private void processRoutes(Assignment solution,
                               RoutingModel routingModel,
                               RoutingIndexManager manager,
                               DataModel data,
                               List<Blockage> activeBlockages) {
        for (int i = 0; i < data.vehicleNumber; ++i) {
            long index = routingModel.start(i);
            List<RouteSegment> route = new ArrayList<>();
            long routeTime = 0;

            // Crear clave única para la ruta origen-destino
            String originUbigeo = data.locationUbigeos.get(data.starts[i]);
            String destinationUbigeo = data.locationUbigeos.get(data.ends[i]);
            String routeKey = createRouteKey(originUbigeo, destinationUbigeo);

            while (!routingModel.isEnd(index)) {
                long previousIndex = index;
                index = solution.value(routingModel.nextVar(index));

                int fromNode = manager.indexToNode(previousIndex);
                int toNode = manager.indexToNode(index);

                RouteSegment segment = createRouteSegment(data, fromNode, toNode);
                route.add(segment);
                routeTime += segment.getDurationMinutes();
            }

            // Almacenar la ruta y su tiempo
            this.routes.put(routeKey, route);
            this.routeTimes.put(routeKey, routeTime);
            this.maxRouteTime = Math.max(this.maxRouteTime, routeTime);

            // Actualizar caché si está disponible
            if (routeCache != null) {
                routeCache.putRoute(originUbigeo, destinationUbigeo, route, activeBlockages);
            }
        }
    }

    private RouteSegment createRouteSegment(DataModel data, int fromNode, int toNode) {
        String fromName = data.locationNames.get(fromNode);
        String fromUbigeo = data.locationUbigeos.get(fromNode);
        String toName = data.locationNames.get(toNode);
        String toUbigeo = data.locationUbigeos.get(toNode);

        long durationMinutes = data.timeMatrix[fromNode][toNode];
        double distance = calculateDistanceFromNodes(data, fromNode, toNode);

        return new RouteSegment(
                fromName + " to " + toName,
                fromUbigeo,
                toUbigeo,
                distance,
                durationMinutes
        );
    }

    private String createRouteKey(String origin, String destination) {
        return origin + "-" + destination;
    }

    // Métodos de utilidad
    public List<RouteSegment> getRoute(String origin, String destination) {
        return routes.get(createRouteKey(origin, destination));
    }

    public Long getRouteTime(String origin, String destination) {
        return routeTimes.get(createRouteKey(origin, destination));
    }

    // Constructor por defecto
    public RouteSolutionData() {
        this.routes = new HashMap<>();
        this.routeTimes = new HashMap<>();
        this.maxRouteTime = 0;
        this.routeCache = null;
    }
}
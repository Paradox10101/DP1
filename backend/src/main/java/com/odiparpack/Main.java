package com.odiparpack;

import com.google.ortools.Loader;
import com.google.ortools.constraintsolver.*;
import com.odiparpack.api.controllers.SimulationController;
import com.odiparpack.api.routers.SimulationRouter;
import com.odiparpack.models.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.logging.Logger;
import java.util.stream.Collectors;
import com.google.protobuf.Duration;

import java.io.IOException;

public class Main {
    public static final Logger logger = Logger.getLogger(Main.class.getName());
    public static final int ROUTE_CACHE_CAPACITY = 1000;
    public static RouteCache routeCache;
    public static Map<String, Integer> locationIndices;
    public static List<String> locationNames;
    public static List<String> locationUbigeos;
    public static Map<String, Location> locations;

    public static com.odiparpack.models.SimulationState initializeSimulationState(LocalDateTime startDateTime,
                                                                                  LocalDateTime endDateTime,
                                                                                  SimulationRouter.SimulationType type)
            throws IOException {
        DataLoader dataLoader = new DataLoader();

        // Cargar datos base
        locations = dataLoader.loadLocations("src/main/resources/locations.txt", "160401"); //Se excluye el ubigeo 160401
        List<Edge> edges = dataLoader.loadEdges("src/main/resources/edgesv2.txt", locations);
        List<Vehicle> vehicles = dataLoader.loadVehicles("src/main/resources/vehicles.txt");
        List<Blockage> blockages = dataLoader.loadBlockages(startDateTime, endDateTime);
        List<Maintenance> maintenanceSchedule = dataLoader.loadMaintenanceSchedule("src/main/resources/maintenance.txt");

        // Obtener órdenes según el tipo de simulación
        List<Order> orders;
        if (type == SimulationRouter.SimulationType.DAILY) {
            // Para simulación diaria, usar órdenes del registro
            orders = OrderRegistry.getAllOrders().stream()
                    .filter(order -> order.getStatus() == Order.OrderStatus.REGISTERED)
                    .collect(Collectors.toList());

            // Si no hay órdenes registradas, lanzar excepción
            if (orders.isEmpty()) {
                throw new IllegalStateException("No hay órdenes registradas para simular");
            }

            // Actualizar startDateTime basado en las órdenes existentes
            LocalDateTime earliestOrder = orders.stream()
                    .map(Order::getOrderTime)
                    .min(LocalDateTime::compareTo)
                    .orElseThrow();

            startDateTime = earliestOrder;
        } else {
            // Para otros tipos de simulación, cargar desde archivo
            orders = dataLoader.loadOrders(startDateTime, endDateTime, locations);
        }

        routeCache = new RouteCache(ROUTE_CACHE_CAPACITY);

        // Construir índices y matrices
        List<Location> locationList = new ArrayList<>(locations.values());

        locationIndices = new HashMap<>();
        for (int i = 0; i < locationList.size(); i++) {
            locationIndices.put(locationList.get(i).getUbigeo(), i);
        }

        long[][] timeMatrix = dataLoader.createTimeMatrix(locationList, edges);

        locationNames = new ArrayList<>();
        locationUbigeos = new ArrayList<>();
        for (Location loc : locationList) {
            locationNames.add(loc.getProvince());
            locationUbigeos.add(loc.getUbigeo());
        }

        // Inicializar mapa de vehículos
        Map<String, Vehicle> vehicleMap = vehicles.stream()
                .collect(Collectors.toMap(Vehicle::getCode, v -> v));

        // Crear una nueva instancia de SimulationState
        return new com.odiparpack.models.SimulationState(
                vehicles,
                startDateTime,
                orders,
                locations,
                routeCache,
                timeMatrix,
                blockages,
                maintenanceSchedule,
                locationIndices,
                locationNames,
                locationUbigeos,
                type
        );
    }

    public static void main(String[] args) throws IOException {
        Loader.loadNativeLibraries();
        SimulationController simulationController = new SimulationController();
        simulationController.start();
    }

    public static RoutingSearchParameters createSearchParameters(
            FirstSolutionStrategy.Value firstSolutionStrategy) {
        // Llamar al método sobrecargado con el valor predeterminado de 10 segundos
        return createSearchParameters(firstSolutionStrategy, 10);
    }

    public static RoutingSearchParameters createSearchParameters(
            FirstSolutionStrategy.Value firstSolutionStrategy, int timeLimitInSeconds) {
        RoutingSearchParameters searchParameters = main.defaultRoutingSearchParameters()
                .toBuilder()
                .setFirstSolutionStrategy(firstSolutionStrategy)
                .setLocalSearchMetaheuristic(LocalSearchMetaheuristic.Value.GUIDED_LOCAL_SEARCH)
                .setTimeLimit(Duration.newBuilder().setSeconds(3).build())
                //.setLogSearch(true)  // Habilitar "verbose logging"
                .build();
        logger.info("Parámetros de búsqueda configurados con estrategia: " + firstSolutionStrategy +
                ", límite de tiempo: " + timeLimitInSeconds + " segundos.");
        return searchParameters;
    }
}
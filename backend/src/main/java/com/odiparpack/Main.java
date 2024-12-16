package com.odiparpack;

import com.google.ortools.Loader;
import com.odiparpack.api.controllers.SimulationController;
import com.odiparpack.api.routers.SimulationRouter;
import com.odiparpack.models.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.logging.*;
import java.util.stream.Collectors;

import java.io.IOException;

public class Main {
    public static final Logger logger = Logger.getLogger(Main.class.getName());
    public static final int ROUTE_CACHE_CAPACITY = 1000;
    public static RouteCache routeCache;
    public static Map<String, Integer> locationIndices;
    public static List<String> locationNames;
    public static List<String> locationUbigeos;
    public static Map<String, Location> locations;

    /*static {
        try {
            // Configurar el formato de los logs
            SimpleFormatter formatter = new SimpleFormatter() {
                private static final String format = "[%1$tF %1$tT] [%2$-7s] %3$s %n";

                @Override
                public synchronized String format(LogRecord lr) {
                    return String.format(format,
                            new java.util.Date(lr.getMillis()),
                            lr.getLevel().getLocalizedName(),
                            lr.getMessage()
                    );
                }
            };

            // Crear el directorio logs si no existe
            java.nio.file.Path logPath = java.nio.file.Paths.get("logs");
            if (!java.nio.file.Files.exists(logPath)) {
                java.nio.file.Files.createDirectories(logPath);
            }

            // Crear el nombre del archivo con la fecha actual
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String logFileName = "logs/simulation_" + timestamp + ".log";

            // Configurar el manejador de archivo
            FileHandler fileHandler = new FileHandler(logFileName, true);
            fileHandler.setFormatter(formatter);

            // Configurar el manejador de consola
            ConsoleHandler consoleHandler = new ConsoleHandler();
            consoleHandler.setFormatter(formatter);

            // Remover los manejadores existentes y agregar los nuevos
            Logger rootLogger = Logger.getLogger("");
            Handler[] handlers = rootLogger.getHandlers();
            for (Handler handler : handlers) {
                rootLogger.removeHandler(handler);
            }

            // Agregar ambos manejadores al logger raíz
            rootLogger.addHandler(fileHandler);
            rootLogger.addHandler(consoleHandler);

            // Establecer el nivel de logging
            rootLogger.setLevel(Level.INFO);

            logger.info("Sistema de logs iniciado. Archivo de logs: " + logFileName);

        } catch (IOException e) {
            System.err.println("Error al configurar el sistema de logs: " + e.getMessage());
            e.printStackTrace();
        }
    }
*/
    static {
        try {
            // Configurar el logger raíz
            Logger rootLogger = Logger.getLogger("");

            // Deshabilitar todos los logs
            rootLogger.setLevel(Level.OFF);

            // Remover todos los manejadores existentes
            Handler[] handlers = rootLogger.getHandlers();
            for (Handler handler : handlers) {
                rootLogger.removeHandler(handler);
            }

            logger.info("Sistema de logs deshabilitado."); // Este log no se mostrará

        } catch (Exception e) {
            System.err.println("Error al configurar el sistema de logs: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public static com.odiparpack.models.SimulationState initializeSimulationState(LocalDateTime startDateTime,
                                                                                  LocalDateTime endDateTime,
                                                                                  SimulationRouter.SimulationType type,
                                                                                  boolean useUploadedOrders)
            throws IOException {
        DataLoader dataLoader = new DataLoader();

        // Cargar datos base
        locations = dataLoader.loadLocationsWithCapacityByRegion("src/main/resources/locations.txt", "160401"); //Se excluye el ubigeo 160401
        List<Edge> edges = dataLoader.loadEdges("src/main/resources/edgesv2.txt", locations);
        List<Vehicle> vehicles = dataLoader.loadVehicles("src/main/resources/vehicles.txt");
        List<Blockage> blockages = dataLoader.loadBlockages(startDateTime, endDateTime);
        List<Maintenance> maintenanceSchedule = dataLoader.loadMaintenanceSchedule("src/main/resources/maintenance.txt");

        // Obtener órdenes según el tipo de simulación
        List<Order> orders;
        if (type == SimulationRouter.SimulationType.DAILY || useUploadedOrders) {
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

}
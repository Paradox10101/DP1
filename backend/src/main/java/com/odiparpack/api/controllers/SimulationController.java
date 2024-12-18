package com.odiparpack.api.controllers;

import com.google.gson.JsonObject;
import com.odiparpack.DataLoader;
import com.odiparpack.models.*;
import com.odiparpack.api.routers.*;
import com.odiparpack.websocket.*;
import spark.Spark;

import static spark.Spark.*;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Future;
import java.util.logging.*;

import io.github.cdimascio.dotenv.Dotenv;
import java.time.LocalDateTime;
import java.util.stream.Collectors;

public class SimulationController {
    private SimulationState simulationState;
    private final List<BaseRouter> routers;
    private ExecutorService simulationExecutor;
    private Future<?> simulationFuture;
    private static final Logger logger = Logger.getLogger(SimulationController.class.getName());

    // Inicializar dotenv para cargar las variables de entorno
    private static final Dotenv dotenv = Dotenv.load();

    public static Map<String, Integer> locationIndices;
    public static List<String> locationNames;
    public static List<String> locationUbigeos;
    public static Map<String, Location> locations;

    public SimulationController() {
        this.routers = Arrays.asList(
                new LocationRouter(),
                new VehicleRouter(),
                new SimulationRouter(this),
                new ReportRouter(),
                new ShipmentRouter(),
                new OrderRouter()
        );
    }

    // Agregar getter si no existe
    public SimulationState getSimulationState() {
        return this.simulationState;
    }

    public void start() {
        try {
            int port = Integer.parseInt(dotenv.get("SERVER_PORT", "8080")); // Usa la variable de entorno o el valor por defecto
            port(port);
            setupWebSocket();
            configureServer();
            initializeRoutes();
            logger.info("Servidor de simulación iniciado en el puerto " + port);
        } catch (Exception e) {
            logger.severe("Error al iniciar el servidor: " + e.getMessage());
            throw new RuntimeException("Error al iniciar el servidor", e);
        }
    }


    private void configureServer() {
        setupCORS();
        setupExceptionHandling();
    }

    private void setupWebSocket() {
        webSocket("/api/v1/ws", VehicleWebSocketHandler.class);
        webSocket("/api/v1/ws/simulation", SimulationMetricsWebSocketHandler.class);
        webSocket("/api/v1/ws/occupancy", WarehouseOccupancyWebSocketHandler.class);  // Nueva línea
        //VehicleWebSocketHandler.setSimulationState(simulationState);
        webSocket("/api/v1/ws/shipments", ShipmentWebSocketHandler.class);
        webSocket("/api/v1/ws/routes", RouteWebSocketHandler.class);

    }

    private void initializeRoutes() {
        // Ruta base
        get("/", (request, response) -> {
            response.type("text/html");
            return "<h1>Servidor de Simulación de Vehículos</h1>" +
                    "<p>API REST disponible en /api/v1/</p>";
        });

        // Inicializar todas las rutas de los routers
        routers.forEach(BaseRouter::setupRoutes);
    }

    private void setupCORS() {
        String allowOrigin = dotenv.get("ALLOW_ORIGIN", "*");

        options("/*", (request, response) -> {
            String accessControlRequestHeaders = request.headers("Access-Control-Request-Headers");
            if (accessControlRequestHeaders != null) {
                response.header("Access-Control-Allow-Headers", accessControlRequestHeaders);
            }

            String accessControlRequestMethod = request.headers("Access-Control-Request-Method");
            if (accessControlRequestMethod != null) {
                response.header("Access-Control-Allow-Methods", accessControlRequestMethod);
            }

            return "OK";
        });

        before((request, response) -> {
            response.header("Access-Control-Allow-Origin", allowOrigin);
            response.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            response.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
            response.type("application/json");
        });
    }

    private void setupExceptionHandling() {
        exception(Exception.class, (exception, request, response) -> {
            logger.severe("Error no manejado: " + exception.getMessage());
            response.status(500);
            response.type("application/json");
            JsonObject errorResponse = new JsonObject();
            errorResponse.addProperty("error", "Error interno del servidor");
            errorResponse.addProperty("message", exception.getMessage());
            response.body(errorResponse.toString());
        });

        // Manejo de rutas no encontradas
        notFound((request, response) -> {
            response.type("application/json");
            JsonObject errorResponse = new JsonObject();
            errorResponse.addProperty("error", "Ruta no encontrada");
            errorResponse.addProperty("path", request.pathInfo());
            return errorResponse;
        });
    }

    public void initializeSimulation(LocalDateTime startDateTime,
                                     LocalDateTime endDateTime,
                                     SimulationRouter.SimulationType type,
                                     boolean useUploadedOrders) {
        try {
            this.simulationState = initializeSimulationState(startDateTime, endDateTime, type, useUploadedOrders);

            // Actualizar los routers
            routers.forEach(router -> {
                router.setSimulationState(this.simulationState);
            });

        } catch (IOException e) {
            throw new RuntimeException("Failed to initialize SimulationState", e);
        }
    }

    public void resetSimulationState(LocalDateTime startDateTime, LocalDateTime endDateTime,
                                     SimulationRouter.SimulationType type, boolean useUploadedOrders) {
        if (simulationExecutor != null && !simulationExecutor.isShutdown()) {
            simulationExecutor.shutdownNow();
        }

        simulationExecutor = null;
        SimulationState newState = createNewSimulationState(startDateTime, endDateTime, type, useUploadedOrders);
        this.simulationState = newState;

        // Actualizar los routers
        routers.forEach(router -> {
            /*if (router instanceof SimulationRouter) {
                //((SimulationRouter) router).updateSimulationState(newState);
                ((SimulationRouter) router).setSimulationState(newState);
            }*/
            router.setSimulationState(newState);
        });
    }

    private SimulationState createNewSimulationState(LocalDateTime startDateTime,
                                                     LocalDateTime endDateTime,
                                                     SimulationRouter.SimulationType type,
                                                     boolean useUploadedOrders) {
        try {
            return initializeSimulationState(startDateTime, endDateTime, type, useUploadedOrders);
        } catch (IOException e) {
            throw new RuntimeException("Failed to create new SimulationState", e);
        }
    }

    public LocalDateTime getFirstAvailableDateTime(int year, int month) {
        String fileName = String.format("src/main/resources/c.1inf54.ventas%04d%02d.txt", year, month);
        File file = new File(fileName);

        if (!file.exists()) {
            logger.warning("Archivo de ventas no encontrado: " + fileName);
            return null; // No hay pedidos para este mes
        }

        try (BufferedReader br = new BufferedReader(new FileReader(file))) {
            String line;
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
            while ((line = br.readLine()) != null) {
                if (line.trim().isEmpty() || line.startsWith("#")) continue;

                String[] parts = line.split(",");
                if (parts.length < 1) continue;

                // Parsear día y hora
                String dayAndTimeStr = parts[0].trim(); // e.g., "14 00:27"
                String[] dayTimeParts = dayAndTimeStr.split(" ");
                if (dayTimeParts.length != 2) continue;

                int day = Integer.parseInt(dayTimeParts[0]);
                LocalTime time = LocalTime.parse(dayTimeParts[1], timeFormatter);

                LocalDate date = LocalDate.of(year, month, day);
                LocalDateTime dateTime = LocalDateTime.of(date, time);

                // Agregar logging del datetime
                DateTimeFormatter logFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
                logger.info("DateTime encontrado: " + dateTime.format(logFormatter));

                return dateTime; // Retornar la primera fecha y hora disponible
            }
        } catch (IOException e) {
            logger.severe("Error al leer el archivo de ventas: " + e.getMessage());
        }

        return null; // Si no se encontró ninguna fecha
    }

    public void enableLogging() {
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

    public void disableLogging() {
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

            // No agregamos el logger.info aquí ya que los logs están deshabilitados

        } catch (Exception e) {
            System.err.println("Error al configurar el sistema de logs: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public static SimulationState initializeSimulationState(LocalDateTime startDateTime,
                                                            LocalDateTime endDateTime,
                                                            SimulationRouter.SimulationType type,
                                                            boolean useUploadedOrders) throws IOException {
        DataLoader dataLoader = new DataLoader();

        // Cargar datos base
        locations = dataLoader.loadLocationsWithCapacityByRegion("src/main/resources/locations.txt", "6551968"); //Se excluye el ubigeo 160401
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
            /*if (orders.isEmpty()) {
                throw new IllegalStateException("No hay órdenes registradas para simular");
            }*/

            if (!orders.isEmpty()) {
                // Actualizar startDateTime basado en las órdenes existentes
                LocalDateTime earliestOrder = orders.stream()
                        .map(Order::getOrderTime)
                        .min(LocalDateTime::compareTo)
                        .orElseThrow();

                startDateTime = earliestOrder;
            }
        } else {
            // Para otros tipos de simulación, cargar desde archivo
            orders = dataLoader.loadOrders(startDateTime, endDateTime, locations);
        }

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
                timeMatrix,
                blockages,
                maintenanceSchedule,
                locationIndices,
                locationNames,
                locationUbigeos,
                type
        );
    }


    // Método para exponer a SimulationRouter
    public void handleStopSimulation() {
        simulationState.stopSimulation();
    }

    public void stop() {
        try {
            if (simulationExecutor != null) {
                simulationExecutor.shutdownNow();
                simulationExecutor = null;
            }
            Spark.stop();
            logger.info("Servidor detenido correctamente");
        } catch (Exception e) {
            logger.severe("Error al detener el servidor: " + e.getMessage());
        }
    }
}
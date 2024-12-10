package com.odiparpack.api.controllers;

import com.google.gson.JsonObject;
import com.odiparpack.DataLoader;
import com.odiparpack.SimulationRunner;
import com.odiparpack.models.Location;
import com.odiparpack.api.routers.*;
import com.odiparpack.models.SimulationState;
import com.odiparpack.websocket.ShipmentWebSocketHandler;
import com.odiparpack.websocket.VehicleWebSocketHandler;
import com.odiparpack.websocket.SimulationMetricsWebSocketHandler;
import com.odiparpack.websocket.WarehouseOccupancyWebSocketHandler;
import spark.Spark;

import static com.odiparpack.Main.initializeSimulationState;
import static spark.Spark.*;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.logging.Logger;

import io.github.cdimascio.dotenv.Dotenv;
import java.time.LocalDateTime;

public class SimulationController {
    private SimulationState simulationState;
    private final List<BaseRouter> routers;
    private ExecutorService simulationExecutor;
    private Future<?> simulationFuture;
    private static final Logger logger = Logger.getLogger(SimulationController.class.getName());

    // Inicializar dotenv para cargar las variables de entorno
    private static final Dotenv dotenv = Dotenv.load();

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
            int port = Integer.parseInt(dotenv.get("SERVER_PORT", "4567")); // Usa la variable de entorno o el valor por defecto
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

    public void initializeSimulation(LocalDateTime startDateTime, LocalDateTime endDateTime, SimulationRouter.SimulationType type) {
        try {
            this.simulationState = initializeSimulationState(startDateTime, endDateTime, type);

            // Actualizar los routers
            routers.forEach(router -> {
                /*if (router instanceof SimulationRouter) {
                    ((SimulationRouter) router).setSimulationState(this.simulationState);
                } else if (router instanceof VehicleRouter) {
                    ((VehicleRouter) router).setSimulationState(this.simulationState);
                } else if (router instanceof ReportRouter) {
                    ((ReportRouter) router).setSimulationState(this.simulationState);
                } else if (router instanceof ShipmentRouter) {
                    ((ShipmentRouter) router).setSimulationState(this.simulationState);
                } else if (router instanceof ReportRouter) {
                    ((ReportRouter) router).setSimulationState(this.simulationState);
                }*/
                router.setSimulationState(this.simulationState);
            });

        } catch (IOException e) {
            throw new RuntimeException("Failed to initialize SimulationState", e);
        }
    }

    public void resetSimulationState(LocalDateTime startDateTime, LocalDateTime endDateTime,
                                     SimulationRouter.SimulationType type) {
        if (simulationExecutor != null && !simulationExecutor.isShutdown()) {
            simulationExecutor.shutdownNow();
        }

        simulationExecutor = null;
        SimulationState newState = createNewSimulationState(startDateTime, endDateTime, type);
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

    private SimulationState createNewSimulationState(LocalDateTime startDateTime, LocalDateTime endDateTime, SimulationRouter.SimulationType type) {
        try {
            return initializeSimulationState(startDateTime, endDateTime, type);
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
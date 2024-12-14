package com.odiparpack.api.routers;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.odiparpack.api.controllers.SimulationController;
import com.odiparpack.models.Order;
import com.odiparpack.models.OrderRegistry;
import com.odiparpack.models.SimulationReport;
import com.odiparpack.models.SimulationState;
import com.odiparpack.SimulationRunner;

import com.odiparpack.scheduler.PlanificadorScheduler;
import com.odiparpack.tasks.PlanificadorTask;
import spark.Spark;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.logging.Logger;
import java.util.List;
import java.util.stream.Collectors;

public class SimulationRouter extends BaseRouter {
    private SimulationController simulationController;

    private static final Logger logger = Logger.getLogger(SimulationRouter.class.getName());

    private ExecutorService simulationExecutor;
    private Future<?> simulationFuture;
    private volatile boolean isSimulationRunning = false;
    private volatile boolean isShutdown = false;
    private SimulationType simulationType = null;

    public enum SimulationType {
        DAILY("diaria", 1),
        WEEKLY("semanal", 7),
        COLLAPSE("colapso", -1);

        private final String value;
        private final int days;

        SimulationType(String value, int days) {
            this.value = value;
            this.days = days;
        }

        public int getDays() {
            return days;
        }

        public static SimulationType fromString(String type) {
            for (SimulationType st : values()) {
                if (st.value.equalsIgnoreCase(type)) {
                    return st;
                }
            }
            throw new IllegalArgumentException("Tipo de simulación inválido: " + type);
        }
    }

    public SimulationRouter(SimulationController simulationController) {
        this.simulationController = simulationController;
    }

    @Override
    public void setupRoutes() {
        Spark.post("/api/v1/simulation/start", (request, response) -> {
            response.type("application/json");

            if (isSimulationRunning) {
                response.status(400);
                return createErrorResponse("La simulación ya está en ejecución.");
            }

            try {
                JsonObject body = JsonParser.parseString(request.body()).getAsJsonObject();
                String typeStr = body.get("type").getAsString(); // 'semanal', 'colapso', 'diaria'

                // Verificar si se usa órdenes cargadas
                boolean useUploadedOrders = body.has("useUploadedOrders") &&
                        body.get("useUploadedOrders").getAsBoolean();

                // Usar el enum para manejar el tipo de simulación
                SimulationType simulationType = SimulationType.fromString(typeStr);
                this.simulationType = simulationType;

                LocalDateTime startDateTime;
                LocalDateTime endDateTime = null;

                if (simulationType == SimulationType.DAILY || useUploadedOrders) {
                    // Obtener las órdenes registradas
                    List<Order> registeredOrders = OrderRegistry.getAllOrders().stream()
                            .filter(order -> order.getStatus() == Order.OrderStatus.REGISTERED)
                            .collect(Collectors.toList());

                    if (registeredOrders.isEmpty()) {
                        throw new IllegalStateException("No hay órdenes registradas para simular");
                    }

                    // Encontrar la orden más antigua para usar su tiempo como inicio
                    startDateTime = registeredOrders.stream()
                            .map(Order::getOrderTime)
                            .min(LocalDateTime::compareTo)
                            .orElseThrow(() -> new IllegalStateException("No se pudo determinar la hora de inicio"));

                    // La fecha de fin se calculará en initializeSimulationState
                    logger.info("Iniciando simulación diaria desde: " + startDateTime);

                    if (simulationType == SimulationType.WEEKLY) {
                        endDateTime = startDateTime.plusDays(simulationType.getDays());
                    }
                } else {
                    // Para otros tipos, usar fechas del request
                    String startDateStr = body.get("startDate").getAsString();
                    String startTimeStr = body.get("startTime").getAsString();

                    DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
                    DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("h:mm a", Locale.ENGLISH);

                    LocalDate startDate = LocalDate.parse(startDateStr, dateFormatter);
                    LocalTime startTime = LocalTime.parse(startTimeStr, timeFormatter);
                    startDateTime = LocalDateTime.of(startDate, startTime);

                    // Calcular endDateTime solo si no es tipo colapso
                    if (simulationType != SimulationType.COLLAPSE) {
                        endDateTime = startDateTime.plusDays(simulationType.getDays());
                    }
                }

                // Configurar la velocidad de simulación según el tipo
                if (simulationType == SimulationType.DAILY) {
                    // Para simulación diaria: 1 segundo real = 1 segundo simulación
                    SimulationRunner.setSimulationParameters(1);
                } else if (simulationType == SimulationType.WEEKLY || simulationType == SimulationType.COLLAPSE) {
                    // Para semanal y colapso: 1 segundo real = 5 minutos simulación (default)
                    SimulationRunner.setSimulationParameters(5);
                } else {
                    throw new IllegalArgumentException("Tipo de simulación no soportado: " + typeStr);
                }

                // Revisar si la simulacion fue iniciada anteriormente
                if (simulationState != null) {
                    // Reiniciar el estado si estaba apagado
                    if (simulationState.isStopped()) {
                        System.out.println("Simulacion anterior detectada, reseteando estado.");
                        simulationController.resetSimulationState(startDateTime, endDateTime, simulationType, useUploadedOrders);
                        // Resetear las capacidades de los almacenes
                        simulationState.getWarehouseManager().resetCapacities();
                    }
                } else {
                    logger.info("Intentando inicializar simulacion.");
                    simulationController.initializeSimulation(startDateTime, endDateTime, simulationType, useUploadedOrders);
                    // Resetear las capacidades de los almacenes para la nueva simulación
                    simulationState.getWarehouseManager().resetCapacities();
                }

                startSimulation();

                // Preparar respuesta con información adicional
                JsonObject jsonResponse = new JsonObject();
                jsonResponse.addProperty("success", true);
                jsonResponse.addProperty("message", "Simulación iniciada exitosamente");
                jsonResponse.addProperty("startTime", startDateTime.toString());
                jsonResponse.addProperty("simulationType", simulationType.toString());

                response.status(200);
                return jsonResponse;
            } catch (Exception e) {
                response.status(400);
                return createErrorResponse("Error al iniciar la simulación: " + e.getMessage());
            }
        });

        // Pausar simulación
        Spark.post("/api/v1/simulation/pause", (request, response) -> {
            response.type("application/json");

            if (!isSimulationRunning) {
                response.status(400);
                return createErrorResponse("La simulación no está en ejecución.");
            }

            if (simulationState.isPaused()) {
                response.status(400);
                return createErrorResponse("La simulación ya está pausada.");
            }

            simulationState.pauseSimulation();
            response.status(200);
            return createSuccessResponse("Simulación pausada.");
        });

        // Reanudar simulación
        Spark.post("/api/v1/simulation/resume", (request, response) -> {
            response.type("application/json");

            if (!isSimulationRunning) {
                response.status(400);
                return createErrorResponse("La simulación no está en ejecución.");
            }

            if (!simulationState.isPaused()) {
                response.status(400);
                return createErrorResponse("La simulación no está pausada.");
            }

            simulationState.resumeSimulation();
            response.status(200);
            return createSuccessResponse("Simulación reanudada.");
        });

        // Detener simulación
        Spark.post("/api/v1/simulation/stop", (request, response) -> {
            response.type("application/json");

            if (!isSimulationRunning) {
                response.status(400);
                return createErrorResponse("La simulación no está en ejecución.");
            }

            simulationController.handleStopSimulation();
            isSimulationRunning = false;
            isShutdown = true;

            // Limpiar registro de órdenes al detener la simulación
            OrderRegistry.clearOrders();
            /*if (simulationType == SimulationType.DAILY) {
                // Limpiar registro de órdenes al detener la simulación
                OrderRegistry.clearOrders();
            }*/

            response.status(200);
            this.simulationType = null;
            return createSuccessResponse("Simulación detenida.");
        });

        Spark.get("/api/v1/simulation/planning-time", (request, response) -> {
            response.type("application/json");

            try {
                int currentPeriod = PlanificadorScheduler.getCurrentPeriod();
                JsonObject jsonResponse = new JsonObject();
                jsonResponse.addProperty("seconds", currentPeriod);

                response.status(200);
                return jsonResponse.toString();
            } catch (Exception e) {
                logger.severe("Error al obtener el período de planificación: " + e.getMessage());
                response.status(500);
                return createErrorResponse("Error al obtener el período de planificación: " + e.getMessage());
            }
        });

        Spark.post("/api/v1/simulation/planning-period", (request, response) -> {
            response.type("application/json");

            try {
                JsonObject body = JsonParser.parseString(request.body()).getAsJsonObject();
                int seconds = body.get("seconds").getAsInt();

                if (seconds < 3 || seconds > 20) {
                    response.status(400);
                    return createErrorResponse("El período debe estar entre 3 y 20 segundos");
                }

                // Usar el PlanificadorScheduler en lugar de SimulationRunner
                PlanificadorScheduler.setPlanningPeriod(seconds);

                response.status(200);
                return createSuccessResponse("Período de planificación actualizado a " + seconds + " segundos");
            } catch (Exception e) {
                logger.severe("Error al actualizar período: " + e.getMessage());
                response.status(500);
                return createErrorResponse("Error al actualizar el período: " + e.getMessage());
            }
        });

        Spark.post("/api/v1/simulation/execute", (request, response) -> {
            response.type("application/json");

            if (!isSimulationRunning) {
                response.status(400);
                return createErrorResponse("La simulación no está en ejecución.");
            }

            if (simulationState.isPaused() || simulationState.isStopped()) {
                response.status(400);
                return createErrorResponse("La simulación está pausada o detenida.");
            }

            try {
                // Ejecutar sincrónicamente para capturar excepciones
                if (PlanificadorScheduler.isTaskRunning()) {
                    response.status(409); // Código 409 Conflict
                    return createErrorResponse("Ya hay una tarea de planificación en ejecución");
                }

                CompletableFuture.runAsync(() -> {
                    PlanificadorScheduler.executeManually(simulationState);
                });

                response.status(200);
                return createSuccessResponse("Planificador ejecutado manualmente");
            } catch (Exception e) {
                logger.severe("Error al ejecutar planificador manualmente: " + e.getMessage());
                response.status(500);
                return createErrorResponse("Error al ejecutar planificador: " + e.getMessage());
            }
        });

        Spark.get("/api/v1/simulation/first-available-date", (request, response) -> {
            response.type("application/json");
            try {
                String monthYear = request.queryParams("monthYear"); // e.g., "2024-08"
                if (monthYear == null || !monthYear.matches("\\d{4}-\\d{2}")) {
                    response.status(400);
                    return createErrorResponse("Parámetro 'monthYear' inválido.");
                }

                // Parsear año y mes
                int year = Integer.parseInt(monthYear.substring(0, 4));
                int month = Integer.parseInt(monthYear.substring(5, 7));

                // Obtener la primera fecha y hora disponible
                LocalDateTime firstAvailable = simulationController.getFirstAvailableDateTime(year, month);

                if (firstAvailable == null) {
                    response.status(404);
                    return createErrorResponse("No hay pedidos disponibles para el mes seleccionado.");
                }

                // Formatear la fecha y hora para el JSON
                String date = firstAvailable.toLocalDate().toString(); // "YYYY-MM-DD"
                String time = firstAvailable.toLocalTime().format(DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH)); // "HH:MM AM/PM"

                JsonObject jsonResponse = new JsonObject();
                jsonResponse.addProperty("success", true);
                jsonResponse.addProperty("date", date);
                jsonResponse.addProperty("time", time);

                return jsonResponse;
            } catch (Exception e) {
                logger.severe("Error en /first-available-date: " + e.getMessage());
                response.status(500);
                return createErrorResponse("Error al obtener la fecha disponible: " + e.getMessage());
            }
        });

        // Obtener estado actual de la simulación
        Spark.get("/api/v1/simulation/status", (request, response) -> {
            response.type("application/json");
            JsonObject status = new JsonObject();

            if (simulationState != null) {
                status.addProperty("currentTime", simulationState.getCurrentTime().toString());
            } else {
                status.addProperty("currentTime", "Simulation state is null");
            }

            status.addProperty("isRunning", isSimulationRunning);
            status.addProperty("isShutdown", isShutdown);

            return status;
        });

        // Obtener estado actual de la simulación
        Spark.get("/api/v1/simulation/type", (request, response) -> {
            response.type("application/json");
            JsonObject status = new JsonObject();

            if (simulationState != null) {
                status.addProperty("currentTime", simulationState.getCurrentTime().toString());
            } else {
                status.addProperty("currentTime", "Simulation state is null");
            }

            status.addProperty("type", (this.simulationType!=null ? this.simulationType.toString():""));

            return status;
        });

        // Nueva ruta para cambiar velocidad
        Spark.post("/api/v1/simulation/speed", (request, response) -> {
            response.type("application/json");

            try {
                JsonObject body = JsonParser.parseString(request.body()).getAsJsonObject();
                String speedStr = body.get("speed").getAsString();
                SimulationRunner.SimulationSpeed speed = SimulationRunner.SimulationSpeed.valueOf(speedStr.toUpperCase());
                SimulationRunner.setSimulationSpeed(speed);

                response.status(200);
                return createSuccessResponse("Velocidad de simulación actualizada a " + speed.getMinutesPerSecond() + " minutos por segundo");
            } catch (IllegalArgumentException e) {
                response.status(400);
                return createErrorResponse("Velocidad inválida. Opciones válidas: FAST, MEDIUM, SLOW");
            } catch (Exception e) {
                response.status(500);
                return createErrorResponse("Error al actualizar la velocidad: " + e.getMessage());
            }
        });
    }

    private void startSimulation() {
        isSimulationRunning = true;

        // Reinitialize executor services if they have been shut down
        SimulationRunner.initializeExecutorServices();

        simulationExecutor = Executors.newSingleThreadExecutor();
        simulationFuture = simulationExecutor.submit(() -> {
            try {
                SimulationRunner.runSimulation(simulationState);
            } catch (Exception e) {
                logger.severe("Error en la simulación: " + e.getMessage());
                e.printStackTrace();
            } finally {
                isSimulationRunning = false;
            }
        });
    }

    public void updateSimulationState(SimulationState newState) {
        this.simulationState = newState;
    }

    private void stopSimulation() {
        simulationState.stopSimulation();
        isSimulationRunning = false;
        isShutdown = true;
        if (simulationExecutor != null) {
            simulationExecutor.shutdownNow();
            simulationExecutor = null;
        }
        simulationFuture = null;
    }

    private void pauseSimulation() {
        simulationState.pauseSimulation();
    }

    private JsonObject createSuccessResponse(String message) {
        JsonObject response = new JsonObject();
        response.addProperty("success", true);
        response.addProperty("message", message);
        return response;
    }

    private JsonObject createErrorResponse(String message) {
        JsonObject response = new JsonObject();
        response.addProperty("success", false);
        response.addProperty("error", message);
        return response;
    }
}
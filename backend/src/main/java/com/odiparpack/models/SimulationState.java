package com.odiparpack.models;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.ortools.constraintsolver.Assignment;
import com.google.ortools.constraintsolver.RoutingIndexManager;
import com.google.ortools.constraintsolver.RoutingModel;
import com.google.ortools.constraintsolver.RoutingSearchParameters;
import com.odiparpack.DataLoader;
import com.odiparpack.DataModel;
import com.odiparpack.SimulationRunner;
import com.odiparpack.websocket.SimulationMetricsWebSocketHandler;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.locks.ReentrantLock;
import java.util.stream.Collectors;

import static com.odiparpack.Main.*;
import static com.odiparpack.SimulationRunner.*;
import static com.odiparpack.Utils.calculateDistanceFromNodes;

public class SimulationState {
    private Map<String, Vehicle> vehicles;
    private List<Order> orders;
    private Map<String, Location> locations;
    private ReentrantLock lock = new ReentrantLock();
    private static final int SIMULATION_SPEED = 10; // 1 minuto de simulación = 1 segundo de tiempo real
    private static final int PLANNING_INTERVAL_MINUTES = 15;
    private WarehouseManager warehouseManager;
    private List<Vehicle> vehiclesNeedingNewRoutes;
    private List<String> almacenesPrincipales = Arrays.asList("150101", "040201", "130101"); // Lima, Arequipa, Trujillo
    private RouteCache routeCache;
    private List<Blockage> activeBlockages;
    private long[][] currentTimeMatrix;
    private List<Maintenance> maintenanceSchedule;
    private static final String BREAKDOWN_COMMAND_FILE = "src/main/resources/breakdown_commands.txt";
    private long lastModified = 0;
    // Mapa para almacenar los logs de avería por vehículo
    public static Map<String, List<String>> breakdownLogs = new HashMap<>();
    private Map<String, Integer> locationIndices;
    private List<String> locationNames;
    private List<String> locationUbigeos;
    private long[][] timeMatrix;
    private List<Blockage> allBlockages;
    private volatile boolean isPaused = false;
    private volatile boolean isStopped = false;
    private final AtomicLong lastUpdateTimestamp = new AtomicLong(0);
    private final AtomicInteger updateCounter = new AtomicInteger(0);
    private volatile JsonObject lastPositions = null;
    private static final long UPDATE_THRESHOLD = 50; // 50ms threshold
    private static final Gson gson = new Gson();
    private final ReentrantLock stateLock = new ReentrantLock();
    private final Object pauseLock = new Object();

    private LocalDateTime simulationStartTime; // Tiempo inicial de simulación
    private LocalDateTime simulationEndTime;   // Tiempo final de simulación
    private LocalDateTime currentTime;         // Tiempo actual de simulación
    private LocalDateTime realStartTime;       // Momento real de inicio
    private long effectiveRunningTime = 0;     // Tiempo efectivo de ejecución en ms
    private long lastUpdateTime;               // Último momento de actualización

    private final Object timeLock = new Object();

    // Atributos para capacidad efectiva acumulada
    private double totalCapacityUsed = 0;
    private double totalCapacity = 0;
    private int capacityRecordsCount = 0;

    private static final StringBuilderPool stringBuilderPool;

    static {
        // Usar núcleos * 2 para balance entre threads I/O y CPU
        int poolSize = Runtime.getRuntime().availableProcessors() * 2;
        stringBuilderPool = new StringBuilderPool(poolSize, 16384); // 16KB initial capacity
    }

    public void reset() {
        lock.lock();
        try {
            System.out.println("Starting simulation reset at: " + LocalDateTime.now());

            // Detener la simulación primero
            this.stopSimulation();

            // Inicializar estructuras si son null antes de limpiar
            if (this.routeCache == null) {
                this.routeCache = new RouteCache(ROUTE_CACHE_CAPACITY);
            } else {
                this.routeCache.clear();
            }

            // Limpiar el contenido del mapa existente en lugar de reasignarlo
            if (breakdownLogs != null) {
                breakdownLogs.clear();
            }

            if (this.vehiclesNeedingNewRoutes == null) {
                this.vehiclesNeedingNewRoutes = new ArrayList<>();
            } else {
                this.vehiclesNeedingNewRoutes.clear();
            }

            if (this.activeBlockages == null) {
                this.activeBlockages = new ArrayList<>();
            } else {
                this.activeBlockages.clear();
            }

            // Recargar todos los datos
            loadInitialData();

            // Verificar estado después de la carga
            validateState();

            updateBlockages(currentTime, allBlockages);

            System.out.println("Simulation reset completed successfully");
        } catch (Exception e) {
            System.err.println("Error during simulation reset: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to reset simulation", e);
        } finally {
            lock.unlock();
        }
    }

    private void validateState() {
        if (locations == null || locations.isEmpty()) {
            throw new IllegalStateException("Invalid state: locations not initialized");
        }
        if (vehicles == null || vehicles.isEmpty()) {
            throw new IllegalStateException("Invalid state: vehicles not initialized");
        }
        if (orders == null) {
            throw new IllegalStateException("Invalid state: orders not initialized");
        }
        if (timeMatrix == null) {
            throw new IllegalStateException("Invalid state: timeMatrix not initialized");
        }
        // Validar otras estructuras críticas
    }

    private void loadInitialData() {
        try {
            System.out.println("Starting initial data reload...");

            // Inicializar DataLoader
            DataLoader dataLoader = new DataLoader();

            // Cargar datos desde archivos
            this.locations = dataLoader.loadLocations("src/main/resources/locations.txt");
            List<Edge> edges = dataLoader.loadEdges("src/main/resources/edges.txt", this.locations);
            List<Vehicle> vehiclesList = dataLoader.loadVehicles("src/main/resources/vehicles.txt");
            this.orders = dataLoader.loadOrders("src/main/resources/orders.txt", this.locations);
            this.allBlockages = dataLoader.loadBlockages("src/main/resources/blockages.txt");
            this.maintenanceSchedule = dataLoader.loadMaintenanceSchedule("src/main/resources/maintenance.txt");

            // Reinicializar el cache de rutas
            this.routeCache = new RouteCache(ROUTE_CACHE_CAPACITY);

            // Construir índices y matrices
            List<Location> locationList = new ArrayList<>(this.locations.values());

            // Reinicializar índices de ubicación
            this.locationIndices = new HashMap<>();
            for (int i = 0; i < locationList.size(); i++) {
                locationIndices.put(locationList.get(i).getUbigeo(), i);
            }

            // Crear matriz de tiempos
            this.timeMatrix = dataLoader.createTimeMatrix(locationList, edges);
            this.currentTimeMatrix = Arrays.stream(this.timeMatrix)
                    .map(long[]::clone)
                    .toArray(long[][]::new);

            // Reinicializar listas de nombres y ubigeos
            this.locationNames = new ArrayList<>();
            this.locationUbigeos = new ArrayList<>();
            for (Location loc : locationList) {
                this.locationNames.add(loc.getProvince());
                this.locationUbigeos.add(loc.getUbigeo());
            }

            // Convertir lista de vehículos a mapa
            this.vehicles = vehiclesList.stream()
                    .collect(Collectors.toMap(Vehicle::getCode, v -> v));

            // Establecer tiempo inicial de simulación
            this.currentTime = this.orders.stream()
                    .map(Order::getOrderTime)
                    .min(LocalDateTime::compareTo)
                    .orElse(LocalDateTime.now())
                    .withHour(0).withMinute(0).withSecond(0).withNano(0);

            // Reinicializar otras estructuras de datos
            this.vehiclesNeedingNewRoutes = new ArrayList<>();
            this.activeBlockages = new ArrayList<>();

            // Reinicializar el warehouse manager con las nuevas ubicaciones
            this.warehouseManager = new WarehouseManager(this.locations);

            // Reinicializar los almacenes principales
            this.almacenesPrincipales = Arrays.asList("150101", "040201", "130101");

            // Restablecer flags de control
            this.isPaused = false;
            this.isStopped = false;
            this.lastModified = 0;

            System.out.println("Initial data reload completed successfully");
            System.out.println("Loaded: " +
                    String.format("%d locations, %d vehicles, %d orders, %d blockages, %d maintenance schedules",
                            locations.size(),
                            vehicles.size(),
                            orders.size(),
                            allBlockages.size(),
                            maintenanceSchedule.size())
            );

        } catch (Exception e) {
            System.err.println("Error during initial data reload: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to reload initial data", e);
        }
    }

    public List<Blockage> getActiveBlockages() {
        return activeBlockages;
    }

    public void setActiveBlockages(List<Blockage> activeBlockages) {
        this.activeBlockages = activeBlockages;
    }

    public long[][] getCurrentTimeMatrix() {
        return currentTimeMatrix;
    }

    public void setCurrentTimeMatrix(long[][] currentTimeMatrix) {
        this.currentTimeMatrix = currentTimeMatrix;
    }

    public Map<String, Location> getLocations() {
        return locations;
    }

    public void pauseSimulation() {
        stateLock.lock();
        try {
            isPaused = true;
            logger.info("Simulación pausada en tiempo de simulación: " + currentTime);

            // Actualizar tiempo efectivo hasta el momento de pausar
            long now = System.currentTimeMillis();
            long timeDiff = now - lastUpdateTime;
            if (timeDiff > 0) {
                effectiveRunningTime += timeDiff;
                logger.fine("Tiempo efectivo actualizado al pausar: " + effectiveRunningTime + "ms");
            }
            lastUpdateTime = now;

            // En lugar de manejar directamente los executors, notificar a SimulationRunner
            //SimulationRunner.pauseSimulation();

            // Notificar a threads en espera
            synchronized (pauseLock) {
                pauseLock.notifyAll();
            }
        } finally {
            stateLock.unlock();
        }
    }

    public void resumeSimulation() {
        stateLock.lock();
        try {
            isPaused = false;
            lastUpdateTime = System.currentTimeMillis();
            logger.info("Simulación resumida en tiempo de simulación: " + currentTime);

            // Notificar a SimulationRunner para reanudar
            //SimulationRunner.resumeSimulation();

            // Notificar a threads en espera
            synchronized (pauseLock) {
                pauseLock.notifyAll();
            }
        } finally {
            stateLock.unlock();
        }
    }

    public void initializeSimulation() {
        simulationStartTime = currentTime;
        simulationEndTime = simulationStartTime.plusDays(7);
        realStartTime = LocalDateTime.now();
        lastUpdateTime = System.currentTimeMillis();
        effectiveRunningTime = 0;

        // Log de inicialización
        logger.info("Simulación inicializada - Start Time: " + simulationStartTime +
                ", Last Update: " + lastUpdateTime);
    }

    public void updateSimulationTime() {
        stateLock.lock();
        try {
            if (!isPaused && !isStopped) {
                // Actualizar tiempo de simulación
                currentTime = currentTime.plusMinutes(SimulationRunner.TIME_ADVANCEMENT_INTERVAL_MINUTES);

                // Actualizar tiempo efectivo de ejecución
                long now = System.currentTimeMillis();
                long timeDiff = now - lastUpdateTime;

                // Log del cálculo de tiempo
                logger.fine("Cálculo de tiempo - Now: " + now +
                        ", Last Update: " + lastUpdateTime +
                        ", Diff: " + timeDiff);

                if (timeDiff > 0) {  // Validación adicional
                    effectiveRunningTime += timeDiff;
                    logger.fine("Tiempo efectivo actualizado: " + effectiveRunningTime + "ms");
                }

                lastUpdateTime = now;

                // Crear y enviar resumen actualizado
                broadcastSimulationSummary();
            }
        } finally {
            stateLock.unlock();
        }
    }

    private void broadcastSimulationSummary() {
        JsonObject summary = new JsonObject();

        // Calcular y verificar las duraciones
        Duration simulatedDuration = Duration.between(simulationStartTime, currentTime);
        Duration realDuration = Duration.ofMillis(effectiveRunningTime);

        // Log de duraciones
        logger.fine("Duraciones - Simulada: " + simulatedDuration.toString() +
                ", Real: " + realDuration.toString());

        // Convertir LocalDateTime a ZonedDateTime con zona horaria UTC
        ZonedDateTime startZonedDateTime = simulationStartTime.atZone(ZoneOffset.UTC);
        ZonedDateTime endZonedDateTime = simulationEndTime.atZone(ZoneOffset.UTC);

        // Convertir ZonedDateTime a Instant
        Instant startInstant = startZonedDateTime.toInstant();
        Instant endInstant = endZonedDateTime.toInstant();

        // Formatear fechas en ISO 8601 con zona horaria UTC
        DateTimeFormatter formatter = DateTimeFormatter.ISO_INSTANT;
        String formattedStartTime = formatter.format(startInstant);
        String formattedEndTime = formatter.format(endInstant);

        summary.addProperty("startTime", formattedStartTime);
        summary.addProperty("endTime", formattedEndTime);

        // Tiempo simulado (duración en formato hh:mm:ss)
        String simulatedTime = formatDuration(simulatedDuration);
        summary.addProperty("simulatedTime", simulatedTime);

        // Tiempo real efectivo (duración en formato hh:mm:ss)
        String realTime = formatDuration(realDuration);
        summary.addProperty("realElapsedTime", realTime);

        // Log del resumen
        logger.info("Resumen de simulación - Tiempo simulado: " + simulatedTime +
                ", Tiempo real: " + realTime);

        // Estado actual
        summary.addProperty("isPaused", isPaused);
        summary.addProperty("isStopped", isStopped);

        // Log detallado de JSON enviado al frontend
        logger.info("JSON enviado al frontend: " + summary.toString());

        // Enviar vía WebSocket
        SimulationMetricsWebSocketHandler.broadcastSimulationMetrics(summary);
    }

    private String formatDuration(Duration duration) {
        long seconds = duration.getSeconds();
        long hours = seconds / 3600;
        long minutes = (seconds % 3600) / 60;
        long secs = seconds % 60;
        return String.format("%02d:%02d:%02d", hours, minutes, secs);
    }

    public void waitWhilePaused() {
        synchronized (pauseLock) {
            while (isPaused && !isStopped) {
                try {
                    pauseLock.wait();
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }
    }

    public void stopSimulation() {
        stateLock.lock();
        try {
            isStopped = true;
            logger.info("Simulación detenida en tiempo de simulación: " + currentTime);

            // Delegar la detención de executors a SimulationRunner
            SimulationRunner.stopSimulation();

            // Notificar a threads en espera
            synchronized (pauseLock) {
                pauseLock.notifyAll();
            }
        } finally {
            stateLock.unlock();
        }
    }

    public boolean isPaused() {
        return isPaused;
    }

    public boolean isStopped() {
        return isStopped;
    }

    void setIsStopped(boolean stop) {
        this.isStopped = stop;
    }

    public Map<String, Integer> getLocationIndices() {
        return locationIndices;
    }

    public List<String> getLocationNames() {
        return locationNames;
    }

    public List<String> getLocationUbigeos() {
        return locationUbigeos;
    }

    public List<Order> getOrders() {
        return orders;
    }

    public List<Blockage> getAllBlockages() {
        return allBlockages;
    }


    public SimulationState(Map<String, Vehicle> vehicleMap, LocalDateTime initialSimulationTime,
                           List<Order> orders, Map<String, Location> locations, RouteCache routeCache,
                           long[][] originalTimeMatrix, List<Blockage> blockages,
                           List<Maintenance> maintenanceSchedule,
                           Map<String, Integer> locationIndices, List<String> locationNames, List<String> locationUbigeos) {
        this.vehicles = vehicleMap;
        this.currentTime = initialSimulationTime;
        this.orders = orders;
        this.locations = locations;
        this.warehouseManager = new WarehouseManager(locations);
        this.routeCache = routeCache;
        this.timeMatrix = originalTimeMatrix;
        this.locationIndices = locationIndices;
        this.locationNames = locationNames;
        this.locationUbigeos = locationUbigeos;
        this.maintenanceSchedule = maintenanceSchedule;
        this.allBlockages = blockages;
        this.activeBlockages = new ArrayList<>();
        this.currentTimeMatrix = Arrays.stream(originalTimeMatrix)
                .map(long[]::clone)
                .toArray(long[][]::new);

        // Inicializar tiempos de simulación
        initializeSimulation();
        updateBlockages(initialSimulationTime, allBlockages);
    }

    public RouteCache getRouteCache() {
        return routeCache;
    }


    // Getter para breakdownLogs
    public Map<String, List<String>> getBreakdownLogs() {
        return breakdownLogs;
    }

    // Método para agregar un mensaje de avería
    public static void addBreakdownLog(String vehicleCode, String message) {
        breakdownLogs.computeIfAbsent(vehicleCode, k -> new ArrayList<>()).add(message);
    }

    public WarehouseManager getWarehouseManager() {
        return warehouseManager;
    }

    public void updateBlockages(LocalDateTime currentTime, List<Blockage> allBlockages) {
        logger.info("Actualizando bloqueos en tiempo: " + currentTime);

        // Remover bloqueos que han expirado
        List<Blockage> expiredBlockages = activeBlockages.stream()
                .filter(blockage -> currentTime.isAfter(blockage.getEndTime()))
                .collect(Collectors.toList());

        for (Blockage expiredBlockage : expiredBlockages) {
            activeBlockages.remove(expiredBlockage);
            logger.info("Bloqueo expirado y removido: " + blockageToString(expiredBlockage));
        }

        // Añadir nuevos bloqueos activos
        int newBlockagesCount = 0;
        for (Blockage blockage : allBlockages) {
            if (!currentTime.isBefore(blockage.getStartTime()) &&
                    currentTime.isBefore(blockage.getEndTime()) &&
                    !activeBlockages.contains(blockage)) {
                activeBlockages.add(blockage);
                newBlockagesCount++;
                logger.info("Nuevo bloqueo activado: " + blockageToString(blockage));
            }
        }

        logger.info("Resumen de actualización de bloqueos:");
        logger.info("- Bloqueos expirados: " + expiredBlockages.size());
        logger.info("- Nuevos bloqueos activados: " + newBlockagesCount);
        logger.info("- Total de bloqueos activos: " + activeBlockages.size());

        // Actualizar la matriz de tiempo
        updateTimeMatrix();
    }

    private String blockageToString(Blockage blockage) {
        return String.format("Origen: %s, Destino: %s, Inicio: %s, Fin: %s",
                blockage.getOriginUbigeo(),
                blockage.getDestinationUbigeo(),
                blockage.getStartTime(),
                blockage.getEndTime());
    }

    private void updateTimeMatrix() {
        logger.info("Actualizando matriz de tiempo basada en bloqueos activos");

        // Restaurar la matriz original
        for (int i = 0; i < currentTimeMatrix.length; i++) {
            System.arraycopy(timeMatrix[i], 0, currentTimeMatrix[i], 0, timeMatrix[i].length);
        }

        // Aplicar bloqueos activos
        for (Blockage blockage : activeBlockages) {
            int fromIndex = locationIndices.get(blockage.getOriginUbigeo());
            int toIndex = locationIndices.get(blockage.getDestinationUbigeo());
            currentTimeMatrix[fromIndex][toIndex] = Long.MAX_VALUE;
            currentTimeMatrix[toIndex][fromIndex] = Long.MAX_VALUE; // Asumiendo que las rutas son bidireccionales
            logger.info("Ruta bloqueada: " + blockage.getOriginUbigeo() + " -> " + blockage.getDestinationUbigeo());
        }

        logger.info("Matriz de tiempo actualizada con " + activeBlockages.size() + " bloqueos aplicados");
    }

    public JsonObject getCurrentPositionsGeoJSON() {
        StringBuilder builder = stringBuilderPool.borrow();
        try {
            builder.append("{\"type\":\"FeatureCollection\",\"features\":[");

            boolean first = true;
            for (Vehicle vehicle : vehicles.values()) {
                Position position = vehicle.getCurrentPosition(getCurrentTime());
                if (position != null) {
                    if (!first) {
                        builder.append(',');
                    }
                    first = false;
                    appendVehicleFeature(builder, vehicle, position);
                }
            }

            builder.append("],\"timestamp\":")
                    .append(System.currentTimeMillis())
                    .append("}");

            return JsonParser.parseString(builder.toString()).getAsJsonObject();
        } finally {
            stringBuilderPool.release(builder);
        }
    }

    private void appendVehicleFeature(StringBuilder builder, Vehicle vehicle, Position position) {
        builder.append("{\"type\":\"Feature\",\"geometry\":{\"type\":\"Point\",")
                .append("\"coordinates\":[")
                .append(position.getLongitude()).append(",")
                .append(position.getLatitude()).append("]},")
                .append("\"properties\":{\"vehicleCode\":\"")
                .append(vehicle.getCode())
                .append("\",\"status\":\"")
                .append(vehicle.getEstado())
                .append("\"}}");
    }

    // Método para limpiar caché si es necesario
    public void clearPositionsCache() {
        lastPositions = null;
        lastUpdateTimestamp.set(0);
    }

    public void updateVehicleStates() {
        lock.lock();
        try {
            List<Vehicle> vehiclesNeedingNewRoutes = new ArrayList<>();

            for (Vehicle vehicle : vehicles.values()) {
                if (vehicle.isInMaintenance()) {
                    handleMaintenance(vehicle);
                    continue;
                }

                if (vehicle.isUnderRepair()) {
                    handleRepairCompletion(vehicle, currentTime);
                    vehicle.updateAveriaTime(currentTime);  // Actualizar el tiempo en estado de avería
                    // TODO: Considerar reasignación de pedidos en caso de avería.
                    // if (vehicle.getAssignedOrder() != null) {
                    //     reassignOrderAfterBreakdown(vehicle, currentTime);
                    // }
                }

                if (vehicle.shouldUpdateStatus()) {
                    handleVehicleStatusUpdate(vehicle, currentTime);
                }

                if (vehicle.shouldCalculateNewRoute(currentTime)) {
                    vehiclesNeedingNewRoutes.add(vehicle);
                }
            }

            if (!vehiclesNeedingNewRoutes.isEmpty()) {
                logVehiclesNeedingNewRoutes(vehiclesNeedingNewRoutes);
                processNewRoutes(vehiclesNeedingNewRoutes);
            }

        } finally {
            lock.unlock();
        }
    }

    // TODO: Implementar reasignación de pedidos cuando ocurre una avería en el vehículo.
    // Este método debería buscar vehículos vacíos y cercanos para reasignar el pedido del vehículo averiado.
    // private void reassignOrderAfterBreakdown(Vehicle brokenVehicle, LocalDateTime currentTime) {
    //     Order orderToReassign = brokenVehicle.getAssignedOrder();
    //     if (orderToReassign == null) {
    //         logger.warning("El vehículo " + brokenVehicle.getCode() + " no tiene un pedido asignado. No es necesario reasignar.");
    //         return;
    //     }
    //
    //     // Buscar vehículos vacíos y cercanos
    //     List<Vehicle> availableVehicles = vehicles.values().stream()
    //             .filter(v -> v.getEstado() == Vehicle.EstadoVehiculo.EN_ALMACEN
    //                         && v.getCurrentLocationUbigeo().equals(brokenVehicle.getCurrentLocationUbigeo())
    //                         && v.getAssignedOrder() == null)
    //             .collect(Collectors.toList());
    //
    //     if (availableVehicles.isEmpty()) {
    //         logger.warning("No hay vehículos disponibles cercanos para reasignar el pedido " + orderToReassign.getId() + " del vehículo " + brokenVehicle.getCode());
    //         return;
    //     }
    //
    //     // Seleccionar el primer vehículo disponible y reasignar el pedido
    //     Vehicle newVehicle = availableVehicles.get(0);
    //     newVehicle.setEstado(Vehicle.EstadoVehiculo.ORDENES_CARGADAS);
    //     newVehicle.setAssignedOrder(orderToReassign);
    //     newVehicle.setCurrentCapacity(orderToReassign.getQuantity());
    //     orderToReassign.setAssignedVehicle(newVehicle);
    //     orderToReassign.setStatus(Order.OrderStatus.FULLY_ASSIGNED);
    //
    //     brokenVehicle.setEstado(Vehicle.EstadoVehiculo.EN_REPARACION);
    //     brokenVehicle.setAssignedOrder(null);
    //     brokenVehicle.setCurrentCapacity(0);
    //
    //     logger.info("Pedido " + orderToReassign.getId() + " reasignado del vehículo averiado " + brokenVehicle.getCode() + " al vehículo " + newVehicle.getCode());
    // }


    // Método para actualizar la métrica de capacidad efectiva acumulada
    public void updateCapacityMetrics(int currentCapacityUsed, int vehicleCapacity) {
        this.totalCapacityUsed += currentCapacityUsed;
        this.totalCapacity += vehicleCapacity;
        this.capacityRecordsCount++;
        logger.info("Actualizando métricas de capacidad: Capacidad Usada: " + currentCapacityUsed +
                ", Capacidad Total: " + vehicleCapacity + ", Total Registros: " + capacityRecordsCount);
    }

    public double calculateAverageCapacity() {
        if (capacityRecordsCount == 0 || totalCapacity == 0) {
            return 0;
        }
        return (totalCapacityUsed / totalCapacity) * 100 / capacityRecordsCount;
    }

    private void handleMaintenance(Vehicle vehicle) {
        Maintenance mantenimiento = getCurrentMaintenance(vehicle.getCode());
        if (mantenimiento != null) {
            handleVehicleInMaintenance(vehicle, mantenimiento);
        }
    }

    private void handleRepairCompletion(Vehicle vehicle, LocalDateTime currentTime) {
        if (vehicle.hasCompletedRepair(currentTime)) {
            if (vehicle.getEstado() == Vehicle.EstadoVehiculo.AVERIADO_1) {
                vehicle.continueCurrentRoute(currentTime);
                logger.info(String.format("Vehículo %s ha sido reparado y continúa su ruta actual.", vehicle.getCode()));
            } else {
                vehicle.setEstado(Vehicle.EstadoVehiculo.EN_ALMACEN);
                vehicle.setAvailable(true);
                logger.info(String.format("Vehículo %s ha sido reparado y está nuevamente disponible en el almacén.", vehicle.getCode()));
            }
            vehicle.clearRepairTime();
        }
    }

    private void handleVehicleStatusUpdate(Vehicle vehicle, LocalDateTime currentTime) {
        vehicle.updateStatus(currentTime, warehouseManager);
    }

    private void collectVehiclesNeedingNewRoutes(Vehicle vehicle, List<Vehicle> vehiclesNeedingNewRoutes, LocalDateTime currentTime) {
        if (vehicle.shouldCalculateNewRoute(currentTime)) {
            vehiclesNeedingNewRoutes.add(vehicle);
        }
    }

    private void logVehiclesNeedingNewRoutes(List<Vehicle> vehiclesNeedingNewRoutes) {
        String vehicleCodes = vehiclesNeedingNewRoutes.stream()
                .map(Vehicle::getCode)
                .collect(Collectors.joining(", "));
        logger.info("Vehículos que necesitan nuevas rutas: " + vehicleCodes);
    }

    private void processNewRoutes(List<Vehicle> vehiclesNeedingNewRoutes) {
        new Thread(() -> calculateNewRoutes(vehiclesNeedingNewRoutes)).start();
    }

    private void checkAndUpdateMaintenanceStatus(Vehicle vehicle) {
        Maintenance lastMaintenance = maintenanceSchedule.stream()
                .filter(m -> m.getVehicleCode().equals(vehicle.getCode()) &&
                        m.getEndTime().isBefore(currentTime) || m.getEndTime().isEqual(currentTime))
                .max(Comparator.comparing(Maintenance::getEndTime))
                .orElse(null);

        if (lastMaintenance != null) {
            vehicle.setEstado(Vehicle.EstadoVehiculo.EN_ALMACEN);
            vehicle.setAvailable(true);
            logger.info("Vehículo " + vehicle.getCode() + " ha salido de mantenimiento y está disponible en " +
                    vehicle.getCurrentLocationUbigeo() + " a partir de " + currentTime);
        }
    }

    public void provocarAveria(String vehicleCode, String breakdownType) {
        Vehicle vehicle = vehicles.get(vehicleCode);
        if (vehicle != null) {
            if (vehicle.getEstado() == Vehicle.EstadoVehiculo.EN_TRANSITO_ORDEN) {
                Vehicle.EstadoVehiculo estadoAveria;
                switch (breakdownType) {
                    case "1":
                        estadoAveria = Vehicle.EstadoVehiculo.AVERIADO_1;
                        break;
                    case "2":
                        estadoAveria = Vehicle.EstadoVehiculo.AVERIADO_2;
                        break;
                    case "3":
                        estadoAveria = Vehicle.EstadoVehiculo.AVERIADO_3;
                        break;
                    default:
                        logger.warning("Tipo de avería no reconocido: " + breakdownType);
                        return;
                }
                vehicle.handleBreakdown(currentTime, estadoAveria);
                logger.info(String.format("Avería tipo %s provocada en el vehículo %s", breakdownType, vehicleCode));

                // Agregar un mensaje de avería
                String logMessage = String.format("Avería tipo %s provocada en el vehículo %s en %s.",
                        breakdownType, vehicleCode, currentTime);
                addBreakdownLog(vehicleCode, logMessage);
            } else {
                logger.warning(String.format("No se puede provocar avería en el vehículo %s porque no está en tránsito", vehicleCode));
            }
        } else {
            logger.warning(String.format("No se encontró el vehículo con código %s", vehicleCode));
        }
    }

    Maintenance getCurrentMaintenance(String code) {
        return maintenanceSchedule.stream()
                .filter(m -> m.getVehicleCode().equals(code) && m.isInMaintenancePeriod(currentTime))
                .findFirst()
                .orElse(null);
    }

    private void handleVehicleInMaintenance(Vehicle vehicle, Maintenance maintenance) {
        Vehicle.EstadoVehiculo estado = vehicle.getEstado();
        if (estado != Vehicle.EstadoVehiculo.EN_ALMACEN) {
            // El vehículo está en ruta o en proceso de ruta, debe completar la entrega antes de ir a mantenimiento
            logger.info("Vehículo " + vehicle.getCode() + " en ruta, irá a mantenimiento después de completar la entrega.");
        } else {
            // El vehículo no está en ruta, se envía directamente a mantenimiento
            vehicle.setEstado(Vehicle.EstadoVehiculo.EN_MANTENIMIENTO);
            vehicle.setAvailable(false);
            logger.info("Vehículo " + vehicle.getCode() + " enviado a mantenimiento hasta " + maintenance.getEndTime());
        }
    }

    private void calculateNewRoutes(List<Vehicle> vehicles) {
        Map<String, String> vehicleDestinations = new HashMap<>();
        Map<String, Map<String, Long>> vehicleRouteTimes = new HashMap<>();
        Set<RouteRequest> routesToCalculate = new HashSet<>();

        // Paso 1: Identificar rutas necesarias y buscar en caché
        for (Vehicle vehicle : vehicles) {
            String currentLocation = vehicle.getCurrentLocationUbigeo();
            vehicleRouteTimes.put(vehicle.getCode(), new HashMap<>());

            for (String warehouseUbigeo : almacenesPrincipales) {
                if (!warehouseUbigeo.equals(currentLocation)) {
                    List<RouteSegment> cachedRoute = routeCache.getRoute(warehouseUbigeo, currentLocation, activeBlockages);
                    if (cachedRoute != null) {
                        long routeTime = calculateRouteTime(cachedRoute);
                        vehicleRouteTimes.get(vehicle.getCode()).put(warehouseUbigeo, routeTime);
                    } else {
                        routesToCalculate.add(new RouteRequest(currentLocation, warehouseUbigeo));
                    }
                }
            }
        }

        // Paso 2: Calcular rutas faltantes
        if (!routesToCalculate.isEmpty()) {
            logger.info(String.format("Calculando %d rutas faltantes...", routesToCalculate.size()));
            Map<RouteRequest, List<RouteSegment>> calculatedRoutes = batchCalculateRoutes(routesToCalculate);

            for (Map.Entry<RouteRequest, List<RouteSegment>> entry : calculatedRoutes.entrySet()) {
                RouteRequest request = entry.getKey();
                List<RouteSegment> route = entry.getValue();
                long routeTime = calculateRouteTime(route);

                logger.info(String.format("Ruta calculada: Origen: %s, Destino: %s, Tiempo: %d minutos",
                        request.start, request.end, routeTime));

                for (Vehicle vehicle : vehicles) {
                    if (vehicle.getCurrentLocationUbigeo().equals(request.start)) {
                        vehicleRouteTimes.get(vehicle.getCode()).put(request.end, routeTime);
                        logger.info(String.format("Tiempo de ruta actualizado para vehículo %s: Destino %s, Tiempo: %d minutos",
                                vehicle.getCode(), request.end, routeTime));
                    }
                }

                routeCache.putRoute(request.end, request.start, route, activeBlockages);
                logger.info(String.format("Ruta almacenada en caché: Origen: %s, Destino: %s, Segmentos: %d",
                        request.start, request.end, route.size()));
            }
        } else {
            logger.info("No hay rutas faltantes para calcular.");
        }

        // Paso 3: Determinar el mejor destino para cada vehículo
        for (Vehicle vehicle : vehicles) {
            String bestDestination = findBestDestination(vehicle, vehicleRouteTimes.get(vehicle.getCode()));
            vehicleDestinations.put(vehicle.getCode(), bestDestination);

            String originUbigeo = vehicle.getCurrentLocationUbigeo();
            String originName = locations.get(originUbigeo).getProvince();
            String destinationName = locations.get(bestDestination).getProvince();

            logger.info(String.format("Vehículo %s en %s (%s) asignado al mejor destino %s (%s)",
                    vehicle.getCode(), originName, originUbigeo, destinationName, bestDestination));
        }

        // Paso 4: Asignar rutas a vehículos
        for (Vehicle vehicle : vehicles) {
            String destination = vehicleDestinations.get(vehicle.getCode());
            List<RouteSegment> route = routeCache.getRoute(vehicle.getCurrentLocationUbigeo(), destination, activeBlockages);
            if (route != null) {
                vehicle.setRoute(route);
                vehicle.startWarehouseJourney(currentTime, destination);
                logger.info(String.format("Vehículo %s asignado a ruta hacia %s (%s)", vehicle.getCode(), locations.get(destination).getProvince(), destination));

                // Imprimir los segmentos de la ruta
                StringBuilder routeDetails = new StringBuilder();
                routeDetails.append("Ruta asignada para vehículo ").append(vehicle.getCode()).append(":\n");
                for (int i = 0; i < route.size(); i++) {
                    RouteSegment segment = route.get(i);
                    routeDetails.append(String.format("%d. %s, Duración: %d minutos, Distancia: %.2f km\n",
                            i + 1, segment.getName(), segment.getDurationMinutes(), segment.getDistance()));
                }
                logger.info(routeDetails.toString());
            } else {
                logger.warning(String.format("No se pudo asignar ruta para el vehículo %s", vehicle.getCode()));
            }
            vehicle.setRouteBeingCalculated(false);
        }
    }

    private Map<RouteRequest, List<RouteSegment>> batchCalculateRoutes(Set<RouteRequest> routesToCalculate) {
        List<Integer> starts = new ArrayList<>();
        List<Integer> ends = new ArrayList<>();

        for (RouteRequest request : routesToCalculate) {
            Integer startIndex = locationIndices.get(request.start);
            Integer endIndex = locationIndices.get(request.end);
            if (startIndex == null || endIndex == null) {
                logger.warning(String.format("Ubigeo de inicio o fin no encontrado en locationIndices: %s -> %s",
                        request.start, request.end));
            } else {
                starts.add(startIndex);
                ends.add(endIndex);
            }
        }

        DataModel data = new DataModel(getCurrentTimeMatrix(), getActiveBlockages(),
                starts.stream().mapToInt(Integer::intValue).toArray(),
                ends.stream().mapToInt(Integer::intValue).toArray(),
                locationNames, locationUbigeos);

        List<List<RouteSegment>> calculatedRoutes = calcularRutasHaciaAlmacen(data, data.starts, data.ends);

        if (calculatedRoutes.isEmpty()) {
            logger.warning("No se pudieron calcular rutas. 'calculatedRoutes' está vacío.");
            // Maneja este caso, por ejemplo, devolviendo un mapa vacío o lanzando una excepción controlada
            return Collections.emptyMap();
        }

        Map<RouteRequest, List<RouteSegment>> result = new HashMap<>();
        int index = 0;
        for (RouteRequest request : routesToCalculate) {
            if (index < calculatedRoutes.size()) {
                result.put(request, calculatedRoutes.get(index));
            } else {
                logger.warning(String.format("No hay ruta calculada para la solicitud %s -> %s", request.start, request.end));
            }
            index++;
        }

        return result;
    }

    private static List<List<RouteSegment>> calcularRutasHaciaAlmacen(DataModel data, int[] start, int[] end) {
        RoutingIndexManager manager = SimulationRunner.createRoutingIndexManager(data, start, end);
        RoutingModel routing = SimulationRunner.createRoutingModel(manager, data);
        RoutingSearchParameters searchParameters = SimulationRunner.createSearchParameters();

        logger.info("Iniciando la resolución del modelo de rutas para rutas hacia almacenes.");
        Assignment solution = routing.solveWithParameters(searchParameters);
        logger.info("Solución de rutas obtenida para rutas hacia almacenes.");

        if (solution != null) {
            List<List<RouteSegment>> calculatedRoutes = extractCalculatedRoutesWithoutAssignments(manager, data, routing, solution);
            SimulationRunner.printSolution(data, routing, manager, solution);
            logger.info("Solución de rutas hacia almacenes impresa correctamente.");
            return calculatedRoutes;
        } else {
            logger.warning("No se encontró solución para las rutas hacia almacenes.");
            // Imprimir detalles de las rutas que no pudieron ser calculadas
            for (int i = 0; i < start.length; i++) {
                String startUbigeo = data.locationUbigeos.get(start[i]);
                String endUbigeo = data.locationUbigeos.get(end[i]);
                String startName = data.locationNames.get(start[i]);
                String endName = data.locationNames.get(end[i]);
                logger.warning(String.format("No se pudo encontrar ruta desde %s (%s) hasta %s (%s).",
                        startName, startUbigeo, endName, endUbigeo));
            }
            return new ArrayList<>();
        }
    }


    private static List<List<RouteSegment>> extractCalculatedRoutesWithoutAssignments(
            RoutingIndexManager manager, DataModel data, RoutingModel routing, Assignment solution) {
        List<List<RouteSegment>> calculatedRoutes = new ArrayList<>();
        for (int i = 0; i < data.vehicleNumber; ++i) {
            List<RouteSegment> route = new ArrayList<>();
            long index = routing.start(i);
            while (!routing.isEnd(index)) {
                long nextIndex = solution.value(routing.nextVar(index));
                int fromNode = manager.indexToNode(index);
                int toNode = manager.indexToNode(nextIndex);

                String fromName = data.locationNames.get(fromNode);
                String fromUbigeo = data.locationUbigeos.get(fromNode);
                String toName = data.locationNames.get(toNode);
                String toUbigeo = data.locationUbigeos.get(toNode);

                long durationMinutes = data.timeMatrix[fromNode][toNode];
                double distance = calculateDistanceFromNodes(data, fromNode, toNode);

                route.add(new RouteSegment(fromName + " to " + toName, fromUbigeo, toUbigeo, distance, durationMinutes));

                index = nextIndex;
            }

            calculatedRoutes.add(route);
            logger.info("Ruta calculada para la ruta " + i + " con " + route.size() + " segmentos.");
        }
        return calculatedRoutes;
    }


    private long calculateRouteTime(List<RouteSegment> route) {
        return route.stream().mapToLong(RouteSegment::getDurationMinutes).sum();
    }

    private String findBestDestination(Vehicle vehicle, Map<String, Long> routeTimes) {
        return routeTimes.entrySet().stream()
                .min(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);
    }

    private static class RouteRequest {
        final String start;
        final String end;

        RouteRequest(String start, String end) {
            this.start = start;
            this.end = end;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            RouteRequest that = (RouteRequest) o;
            return Objects.equals(start, that.start) && Objects.equals(end, that.end);
        }

        @Override
        public int hashCode() {
            return Objects.hash(start, end);
        }
    }

    /*private String findNearestWarehouse(Vehicle vehicle) {
        List<String> potentialDestinations = locations.values().stream()
                .filter(loc -> !loc.getUbigeo().equals(vehicle.getCurrentLocationUbigeo()))
                .map(Location::getUbigeo)
                .collect(Collectors.toList());

        String nearestWarehouse = null;
        long shortestRouteTime = Long.MAX_VALUE;

        for (String destination : potentialDestinations) {
            List<VehicleAssignment> singleAssignment = Collections.singletonList(new VehicleAssignment(vehicle, null, 0));
            DataModel data = new DataModel(timeMatrix, activeBlockages, singleAssignment, locationIndices, locationNames, locationUbigeos);
            int[] starts = {locationIndices.get(vehicle.getCurrentLocationUbigeo())};
            int[] ends = {locationIndices.get(destination)};

            Map<String, List<RouteSegment>> route = calculateRoute(data, starts, ends, this);
            List<RouteSegment> vehicleRoute = route.get(vehicle.getCode());

            if (vehicleRoute != null) {
                long routeTime = vehicleRoute.stream().mapToLong(RouteSegment::getDurationMinutes).sum();
                if (routeTime < shortestRouteTime) {
                    shortestRouteTime = routeTime;
                    nearestWarehouse = destination;
                }
            }
        }

        return nearestWarehouse;
    }*/

    private int[] getStartIndices(List<Vehicle> vehicles) {
        return vehicles.stream()
                .map(v -> locationIndices.get(v.getCurrentLocationUbigeo()))
                .mapToInt(Integer::intValue)
                .toArray();
    }

    private int[] getEndIndices(String destination) {
        int endIndex = locationIndices.get(destination);
        return new int[vehicles.size()]; // Todos los vehículos van al mismo destino
    }


    public void updateOrderStatuses() {
        for (Order order : orders) {
            if (order.getStatus() == Order.OrderStatus.PENDING_PICKUP) {
                if (order.isReadyForDelivery(currentTime)) {
                    order.setDelivered(currentTime);
                    // Incrementar la capacidad del almacén de destino cuando el pedido se marca como entregado
                    warehouseManager.increaseCapacity(order.getDestinationUbigeo(), order.getQuantity());
                }
            }
        }
    }

    public void advanceTime() {
        currentTime = currentTime.plusMinutes(PLANNING_INTERVAL_MINUTES);
    }

    public LocalDateTime getCurrentTime() {
        stateLock.lock();
        try {
            return currentTime;
        } finally {
            stateLock.unlock();
        }
    }

    public void setCurrentTime(LocalDateTime currentTime) {
        lock.lock();
        try {
            this.currentTime = currentTime;
        } finally {
            lock.unlock();
        }
    }

    public Map<String, Vehicle> getVehicles() {
        return vehicles;
    }
}
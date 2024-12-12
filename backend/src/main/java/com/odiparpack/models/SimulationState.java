package com.odiparpack.models;

import com.google.gson.*;
import com.google.ortools.constraintsolver.*;
import com.odiparpack.DataModel;
import com.odiparpack.SimulationRunner;
import com.odiparpack.api.routers.SimulationRouter;
import com.odiparpack.routing.model.Route;
import com.odiparpack.routing.service.RouteService;
import com.odiparpack.services.LocationService;
import com.odiparpack.websocket.SimulationMetricsWebSocketHandler;


import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.locks.ReentrantLock;
import java.util.logging.Level;
import java.util.stream.Collectors;

import static com.odiparpack.Main.*;
import static com.odiparpack.Utils.calculateDistanceFromNodes;
import static java.lang.Math.abs;

public class SimulationState {
    private List<Vehicle> vehicles;
    private List<Order> orders;
    public static Map<String, Location> locations;
    private ReentrantLock lock = new ReentrantLock();
    private WarehouseManager warehouseManager;
    private Map<Integer, List<VehicleAssignment>> vehicleAssignmentsPerOrder = new HashMap<>();

    private static final String[] almacenesPrincipales = {"150101", "040101", "130101"}; // Lima, Arequipa, Trujillo

    private static RouteCache routeCache;
    private static List<Blockage> activeBlockages;
    private static long[][] currentTimeMatrix;
    private List<Maintenance> maintenanceSchedule;
    // Mapa para almacenar los logs de avería por vehículo
    public static Map<String, List<String>> breakdownLogs = new HashMap<>();
    private static Map<String, Integer> locationIndices;
    public static List<String> locationNames;
    public static List<String> locationUbigeos;
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
    private SimulationRouter.SimulationType simulationType;

    private LocalDateTime simulationStartTime; // Tiempo inicial de simulación
    private LocalDateTime simulationEndTime = null;   // Tiempo final de simulación
    private LocalDateTime currentTime;         // Tiempo actual de simulación
    private LocalDateTime realStartTime;       // Momento real de inicio
    private long effectiveRunningTime = 0;     // Tiempo efectivo de ejecución en ms
    private long lastUpdateTime;               // Último momento de actualización

    private final Object timeLock = new Object();

    // Atributos para capacidad efectiva acumulada
    private double totalCapacityUsed = 0;
    private double totalCapacity = 0;
    private int capacityRecordsCount = 0;
    private double averageCapacityMetric = 0;
    private int totalOrdersCount = 0;
    private int totalOrdersCount2 = 0;
    private int currentDayOrders = 0;
    private List<Integer> orderbyDays;
    private Map<String, Integer> cityOrderCount = new HashMap<>(); //Aqui se tiene el Map para
    private Map<String, Integer> paradasAlmacenesOrderCount = new HashMap<>();
    private Map<String, Integer> pedidosPorRegion = new HashMap<>();
    private Map<String, Double> eficienciaPedidos = new HashMap<>();
    private int averiasTipo1 = 0;
    private int averiasTipo2 = 0;
    private int averiasTipo3 = 0;

    private Duration collapseThresholdDuration = null;

    public List<LocalDateTime> obtenerTiempos(){
        List<LocalDateTime> tiempos = new ArrayList<>();
        tiempos.add(simulationStartTime);
        tiempos.add(simulationEndTime != null ? simulationEndTime : currentTime);
        tiempos.add(currentTime);
        return tiempos;
    }


    // Agregar getters
    public int getAveriasTipo1() {
        return averiasTipo1;
    }

    public int getAveriasTipo2() {
        return averiasTipo2;
    }

    public int getAveriasTipo3() {
        return averiasTipo3;
    }

    public String[] getAlmacenesPrincipales() {
        return almacenesPrincipales;
    }

    public LocalDateTime getSimulationStartTime() {
        return simulationStartTime;
    }
    private static final StringBuilderPool stringBuilderPool;

    private List<ScheduledBreakdown> scheduledBreakdowns = new ArrayList<>();

    private static final int NUM_CORES = Runtime.getRuntime().availableProcessors();
    private static final int TASK_MULTIPLIER = 2; // Ajusta según la naturaleza de tus tareas
    private static final int MAX_CONCURRENT_TASKS = NUM_CORES * TASK_MULTIPLIER;
    private static final Semaphore semaphore = new Semaphore(MAX_CONCURRENT_TASKS);

    static {
        // Usar núcleos * 2 para balance entre threads I/O y CPU
        int poolSize = Runtime.getRuntime().availableProcessors() * 2;
        stringBuilderPool = new StringBuilderPool(poolSize, 16384); // 16KB initial capacity

        logger.info("Número de núcleos detectados: " + NUM_CORES);
        logger.info("Máximo de tareas concurrentes ajustado a: " + MAX_CONCURRENT_TASKS);
    }

    public void addScheduledBreakdown(ScheduledBreakdown breakdown) {
        scheduledBreakdowns.add(breakdown);
    }

    public List<ScheduledBreakdown> getScheduledBreakdowns() {
        return scheduledBreakdowns;
    }


    public List<Blockage> getActiveBlockages() {
        return activeBlockages;
    }

    public void setActiveBlockages(List<Blockage> activeBlockages) {
        this.activeBlockages = activeBlockages;
    }

    public boolean checkCapacityCollapse() {
        lock.lock();
        try {
            // Usar WarehouseManager para obtener capacidades actuales
            for (Map.Entry<String, Location> entry : locations.entrySet()) {
                String ubigeo = entry.getKey();
                Location location = entry.getValue();
                int maxCapacity = location.getWarehouseCapacity();

                if (maxCapacity <= 0) {
                    logger.warning("Ubicación " + ubigeo + " tiene capacidad máxima invalida: " + maxCapacity);
                    continue;
                }

                // Obtener capacidad actual del WarehouseManager
                int currentCapacity = warehouseManager.getCurrentCapacity(ubigeo);
                int capacidadUtilizada = abs(maxCapacity - currentCapacity);

                // Verificar si la capacidad utilizada supera la máxima
                if (capacidadUtilizada > maxCapacity) {
                    simulationEndTime = currentTime;
                    logger.severe("¡Colapso logístico detectado por capacidad!");
                    logger.severe(String.format("Oficina %s ha excedido su capacidad máxima. Utilizada: %d, Máxima: %d",
                            location.getProvince(), currentCapacity, maxCapacity));

                    JsonObject collapseInfo = new JsonObject();
                    collapseInfo.addProperty("type", "LOGISTIC_COLLAPSE");
                    collapseInfo.addProperty("location", location.getProvince());
                    collapseInfo.addProperty("ubigeo", ubigeo);
                    collapseInfo.addProperty("capacidadUtilizada", currentCapacity);
                    collapseInfo.addProperty("maxCapacity", maxCapacity);
                    collapseInfo.addProperty("currentTime", currentTime.toString());

                    SimulationMetricsWebSocketHandler.broadcastSimulationMetrics(collapseInfo);
                    return true;
                }
            }
            return false;
        } finally {
            lock.unlock();
        }
    }

    public boolean checkLogisticCollapse() {
        lock.lock();
        try {
            // Calculamos el tiempo simulado
            Duration simulatedDuration = Duration.between(simulationStartTime, currentTime);

            // 1. Si el tiempo simulado es menor a 2 semanas (14 días), no colapsar.
            if (simulatedDuration.toDays() < 14) {
                return false;
            }

            // 2. Si ya pasamos de 2 semanas, verificamos si ya tenemos umbral. Si no, lo generamos.
            if (collapseThresholdDuration == null) {
                // Generamos un número aleatorio entre 0 y 14 días adicionales
                Random rand = new Random();
                long extraDays = rand.nextInt(15); // 0 a 14 días extra
                collapseThresholdDuration = Duration.ofDays(14 + extraDays);
                logger.info("Umbral de colapso definido: " + collapseThresholdDuration.toDays() + " días desde el inicio.");
            }

            // 3. Si el tiempo simulado aún no supera el umbral, no se dispara el colapso.
            if (simulatedDuration.compareTo(collapseThresholdDuration) < 0) {
                return false;
            }

            // 4. Si ya superamos el umbral, revisamos si hay pedidos vencidos.
            for (Order order : orders) {
                if (order.getStatus() != Order.OrderStatus.DELIVERED) {
                    // Si el tiempo actual es posterior al tiempo límite de entrega
                    if (currentTime.isAfter(order.getDueTime())) {
                        simulationEndTime = currentTime;
                        logger.severe("¡Colapso logístico detectado!");
                        logger.severe("Pedido " + order.getOrderCode() +
                                " no entregado. Tiempo límite: " + order.getDueTime() +
                                ", Tiempo actual: " + currentTime);

                        // Notificar al frontend a través de WebSocket
                        JsonObject collapseInfo = new JsonObject();
                        collapseInfo.addProperty("type", "LOGISTIC_COLLAPSE");
                        collapseInfo.addProperty("orderCode", order.getOrderCode());
                        collapseInfo.addProperty("dueTime", order.getDueTime().toString());
                        collapseInfo.addProperty("currentTime", currentTime.toString());

                        SimulationMetricsWebSocketHandler.broadcastSimulationMetrics(collapseInfo);

                        return true;
                    }
                }
            }
            return false;
        } finally {
            lock.unlock();
        }
    }


    public boolean checkWeeklySimulationEnd() {
        lock.lock();
        try {
            if( currentTime.isAfter(simulationEndTime) || currentTime.isEqual(simulationEndTime)){
                JsonObject weeklyInfo = new JsonObject();
                weeklyInfo.addProperty("type", "WEEKLY");
                weeklyInfo.addProperty("currentTime", currentTime.toString());
                SimulationMetricsWebSocketHandler.broadcastSimulationMetrics(weeklyInfo);
                return true;
            }
            return false;
        } finally {
            lock.unlock();
        }
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

    public void initializeSimulation(SimulationRouter.SimulationType type) {
        simulationStartTime = currentTime;

        if (type == SimulationRouter.SimulationType.COLLAPSE) {
            simulationEndTime = null;
        } else simulationEndTime = simulationStartTime.plusDays(7);

        realStartTime = LocalDateTime.now();
        lastUpdateTime = System.currentTimeMillis();
        effectiveRunningTime = 0;

        // Log de inicialización
        logger.info("Simulación inicializada - Start Time: " + simulationStartTime +
                ", Last Update: " + lastUpdateTime);
    }

    public void updateSimulationTime(java.time.Duration timeToAdvance) {
        stateLock.lock();
        try {
            if (!isPaused && !isStopped) {
                // Actualizar tiempo de simulación con el Duration proporcionado
                currentTime = currentTime.plus(timeToAdvance);
                logger.info("Tiempo actualizado - Current Time: " + currentTime);

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

    public long calculateIntervalTime(){
        return Duration.between(simulationStartTime, currentTime).toHours();
    }

    private void broadcastSimulationSummary() {
        JsonObject summary = new JsonObject();

        // Calcular y verificar las duraciones
        Duration simulatedDuration = Duration.between(simulationStartTime, currentTime);
        Duration realDuration = Duration.ofMillis(effectiveRunningTime);

        // Log de duraciones
        logger.fine("Duraciones - Simulada: " + simulatedDuration.toString() +
                ", Real: " + realDuration.toString());

        // Formatear fechas de inicio y fin con AM/PM
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy hh:mm:ss a")
                .withZone(ZoneOffset.UTC);

        String formattedStartTime = simulationStartTime.format(dateFormatter);
        String formattedEndTime;

        if (simulationEndTime != null) {
            formattedEndTime = simulationEndTime.format(dateFormatter);
        } else {
            // Si `simulationEndTime` es null, establecemos un valor predeterminado
            formattedEndTime = "Simulación aún en curso";
        }

        summary.addProperty("startTime", formattedStartTime);
        summary.addProperty("endTime", formattedEndTime);

        // Formatear tiempo simulado con fecha completa y AM/PM
        LocalDateTime simulatedDateTime = simulationStartTime.plus(simulatedDuration);
        String simulatedTimeStr = simulatedDateTime.format(dateFormatter);
        String simulatedTime = simulatedTimeStr;

        // Formatear duración simulada
        String simulatedDurationStr = formatDuration(simulatedDuration);

        // Formatear tiempo real con fecha completa y AM/PM
        LocalDateTime realDateTime = simulationStartTime.plus(realDuration);
        String realTimeStr = realDateTime.format(dateFormatter);
        String realTime = realTimeStr;

        // Formatear duración real
        String realDurationStr = formatDuration(realDuration);

        summary.addProperty("simulatedTime", simulatedTime);
        summary.addProperty("simulatedDuration", simulatedDurationStr);
        summary.addProperty("realElapsedTime", realTime);
        summary.addProperty("realDuration", realDurationStr);

        // Estado actual
        summary.addProperty("isPaused", isPaused);
        summary.addProperty("isStopped", isStopped);

        // Log del resumen
        logger.info("Resumen de simulación - Tiempo simulado: " + simulatedTime +
                ", Duración simulada: " + simulatedDurationStr +
                ", Tiempo real: " + realTime +
                ", Duración real: " + realDurationStr);

        // Enviar vía WebSocket
        SimulationMetricsWebSocketHandler.broadcastSimulationMetrics(summary);
    }

    /**
     * Formatea una duración en un formato legible
     * Ejemplos: "5 minutos", "1 hora 5 minutos", "1 día 2 horas 15 minutos"
     */
    private String formatDuration(Duration duration) {
        long days = duration.toDays();
        long hours = duration.toHoursPart();
        long minutes = duration.toMinutesPart();
        long seconds = duration.toSecondsPart();

        StringBuilder sb = new StringBuilder();

        if (days > 0) {
            sb.append(days).append(days == 1 ? " día" : " días");
            if (hours > 0 || minutes > 0 || seconds > 0) sb.append(" ");
        }

        if (hours > 0) {
            sb.append(hours).append(hours == 1 ? " hora" : " horas");
            if (minutes > 0 || seconds > 0) sb.append(" ");
        }

        if (minutes > 0) {
            sb.append(minutes).append(minutes == 1 ? " minuto" : " minutos");
            if (seconds > 0) sb.append(" ");
        }

        if (seconds > 0 || (days == 0 && hours == 0 && minutes == 0)) {
            sb.append(seconds).append(seconds == 1 ? " segundo" : " segundos");
        }

        return sb.toString();
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


    public SimulationState(List<Vehicle> vehicles, LocalDateTime initialSimulationTime,
                           List<Order> orders, Map<String, Location> locations, RouteCache routeCache,
                           long[][] originalTimeMatrix, List<Blockage> blockages,
                           List<Maintenance> maintenanceSchedule,
                           Map<String, Integer> locationIndices,
                           List<String> locationNames, List<String> locationUbigeos,
                           SimulationRouter.SimulationType type) {
        this.vehicles = vehicles;
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
        this.orderbyDays = new ArrayList<>();
        this.simulationType = type;

        // Inicializa otras variables
        paradasAlmacenesOrderCount.put("150101", 0);//Lima
        paradasAlmacenesOrderCount.put("040201", 0);//Arequipa
        paradasAlmacenesOrderCount.put("130101", 0);//Trujillo

        pedidosPorRegion.put("SELVA", 0);
        pedidosPorRegion.put("COSTA", 0);
        pedidosPorRegion.put("SIERRA", 0);

        // Inicializar tiempos de simulación
        initializeSimulation(type);
        updateBlockages(initialSimulationTime, allBlockages);
    }

    public SimulationRouter.SimulationType getSimulationType() {
        return simulationType;
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

    public void updateBlockages(LocalDateTime currentTime, List<Blockage> allBlockages) {
        logger.info("Verificando cambios en bloqueos para tiempo: " + currentTime);

        boolean hasChanges = false;

        // Verificar bloqueos expirados
        List<Blockage> expiredBlockages = activeBlockages.stream()
                .filter(blockage -> currentTime.isAfter(blockage.getEndTime()))
                .collect(Collectors.toList());

        // Verificar nuevos bloqueos que deberían activarse
        List<Blockage> newBlockages = allBlockages.stream()
                .filter(blockage ->
                        !currentTime.isBefore(blockage.getStartTime()) &&
                                currentTime.isBefore(blockage.getEndTime()) &&
                                !activeBlockages.contains(blockage))
                .collect(Collectors.toList());

        // Si no hay bloqueos expirados ni nuevos, no es necesario actualizar
        if (expiredBlockages.isEmpty() && newBlockages.isEmpty()) {
            logger.info("No hay cambios en los bloqueos, matriz de tiempos se mantiene sin cambios");
            return;
        }

        // Proceder con las actualizaciones ya que hay cambios
        // Remover bloqueos expirados
        for (Blockage expiredBlockage : expiredBlockages) {
            activeBlockages.remove(expiredBlockage);
            hasChanges = true;
            logger.info("Bloqueo expirado y removido: " + blockageToString(expiredBlockage));
        }

        // Añadir nuevos bloqueos activos
        for (Blockage newBlockage : newBlockages) {
            activeBlockages.add(newBlockage);
            hasChanges = true;
            logger.info("Nuevo bloqueo activado: " + blockageToString(newBlockage));
        }

        // Log del resumen de cambios
        if (hasChanges) {
            logger.info("Resumen de actualización de bloqueos:");
            logger.info("- Bloqueos expirados: " + expiredBlockages.size());
            logger.info("- Nuevos bloqueos activados: " + newBlockages.size());
            logger.info("- Total de bloqueos activos: " + activeBlockages.size());

            // Actualizar la matriz de tiempo solo si hubo cambios
            updateTimeMatrix();
        }
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


    public JsonObject getShipmentListJsonInPeriod(LocalDateTime initialDate, LocalDateTime endDate, String lastClientMessage) {
        StringBuilder builder = stringBuilderPool.borrow();
        try {
            builder.append("{\"type\":\"FeatureCollection\",\"features\":[");

            List<Order> ordersInPeriod = orders.stream()
                    .filter(order -> {
                        LocalDateTime orderTime = order.getOrderTime();
                        return (orderTime.isAfter(initialDate) || orderTime.isEqual(initialDate)) &&
                                (orderTime.isBefore(endDate) || orderTime.isEqual(endDate));
                    })
                    .collect(Collectors.toList());

            boolean first = true;
            boolean existOrder = true;
            for (Order order : ordersInPeriod) {
                if (order != null) {
                    if (!first && existOrder) {
                        builder.append(',');
                    }
                    first = false;

                    try {
                        existOrder = appendShipmentFeature(builder, order, lastClientMessage);
                    } catch (Exception e) {
                        logger.warning("Error procesando la orden " + order.getOrderCode() + ": " + e.getMessage());
                        existOrder = false; // Aseguramos que no se agregue una coma extra
                    }
                }
            }

            builder.append("]}");

            String jsonString = builder.toString();
            try {
                // Intentar parsear el JSON para validar su estructura
                JsonObject jsonObject = JsonParser.parseString(jsonString).getAsJsonObject();

                // Validación adicional de la estructura esperada
                if (!jsonObject.has("type") || !jsonObject.has("features")) {
                    throw new JsonSyntaxException("JSON structure is invalid");
                }

                return jsonObject;
            } catch (JsonSyntaxException e) {
                logger.severe("Error en la estructura del JSON generado: " + e.getMessage());
                logger.severe("JSON malformado: " + jsonString);

                // Devolver un JSON válido vacío como fallback
                return JsonParser.parseString("{\"type\":\"FeatureCollection\",\"features\":[]}").getAsJsonObject();
            }
        } finally {
            stringBuilderPool.release(builder);
        }
    }

    public JsonObject getBlockedAndCurrentRoutes(LocalDateTime initialDate, LocalDateTime endDate) {
        // Crear el objeto principal con "type" y "features"
        JsonObject featureCollection = new JsonObject();
        featureCollection.addProperty("type", "FeatureCollection");

        // Crear el arreglo "features"
        JsonArray featuresArray = new JsonArray();


        // Crear las "blockages" como objetos de tipo "Feature"
        if (vehicles != null && !vehicles.isEmpty()) {
            for (Vehicle vehicle : vehicles) {
                JsonObject blockageFeature = new JsonObject();
                blockageFeature.addProperty("type", "Feature");

                // Agregar las propiedades del bloqueo
                JsonObject properties = new JsonObject();
                blockageFeature.add("properties", properties);

                // (Opcional) Agregar una geometría si es relevante
                JsonObject geometry = new JsonObject();
                geometry.addProperty("type", "Point"); // Ejemplo

                if (vehicle.getRoute() == null || vehicle.getRoute().isEmpty() || vehicle.getCurrentSegmentIndex() >= vehicle.getRoute().size()) continue;
                // El primer elemento corresponde al origen y el segundo al destino
                JsonArray coordinates = new JsonArray();
                JsonArray coordinatesOrigin = new JsonArray();
                coordinatesOrigin.add(locations.get(vehicle.getCurrentLocationUbigeo()).getLongitude());
                coordinatesOrigin.add(locations.get(vehicle.getCurrentLocationUbigeo()).getLatitude());

                JsonArray coordinatesDestination = new JsonArray();
                coordinatesDestination.add(locations.get(vehicle.getRoute().get(vehicle.getCurrentSegmentIndex()).getToUbigeo()).getLongitude());
                coordinatesDestination.add(locations.get(vehicle.getRoute().get(vehicle.getCurrentSegmentIndex()).getToUbigeo()).getLatitude());

                coordinates.add(coordinatesOrigin);
                coordinates.add(coordinatesDestination);

                geometry.add("coordinates", coordinates);

                //Ruta actual de vehiculo
                properties.addProperty("routeType", "vRoute");
                properties.add("geometry", geometry);

                featuresArray.add(blockageFeature);
            }
        }
        // Crear las "blockages" como objetos de tipo "Feature"
        if (activeBlockages != null) {
            for (Blockage activeBlockage : activeBlockages) {
                JsonObject blockageFeature = new JsonObject();
                blockageFeature.addProperty("type", "Feature");

                // Agregar las propiedades del bloqueo
                JsonObject properties = new JsonObject();
                blockageFeature.add("properties", properties);

                // (Opcional) Agregar una geometría si es relevante
                JsonObject geometry = new JsonObject();
                geometry.addProperty("type", "Point"); // Ejemplo

                // El primer elemento corresponde al origen y el segundo al destino
                JsonArray coordinates = new JsonArray();
                JsonArray coordinatesOrigin = new JsonArray();
                coordinatesOrigin.add(locations.get(activeBlockage.getOriginUbigeo()).getLongitude());
                coordinatesOrigin.add(locations.get(activeBlockage.getOriginUbigeo()).getLatitude());

                JsonArray coordinatesDestination = new JsonArray();
                coordinatesDestination.add(locations.get(activeBlockage.getDestinationUbigeo()).getLongitude());
                coordinatesDestination.add(locations.get(activeBlockage.getDestinationUbigeo()).getLatitude());

                coordinates.add(coordinatesOrigin);
                coordinates.add(coordinatesDestination);

                geometry.add("coordinates", coordinates);

                //Ruta de bloqueo
                properties.addProperty("routeType", "blockage");
                properties.add("geometry", geometry);

                featuresArray.add(blockageFeature);
            }
        }

        // Agregar el arreglo "features" al objeto principal
        featureCollection.add("features", featuresArray);

        return featureCollection;
    }


    // Método helper para validar y obtener provincia
    private String getValidatedProvince(String ubigeo) {
        if (ubigeo != null && ubigeo.contains("******")) {
            return "------";
        }
        return locations.get(ubigeo).getProvince();
    }

    // Método helper para validar y obtener región natural
    private String getValidatedNaturalRegion(String ubigeo) {
        if (ubigeo != null && ubigeo.contains("******")) {
            return "------";
        }
        return locations.get(ubigeo).getNaturalRegion();
    }

    private boolean appendShipmentFeature(StringBuilder builder, Order order, String lastClientMessage) {
        Order.OrderStatus currentOrderStatus = order.getStatus();
        JsonObject lastClientJSON = new JsonObject();
        if (lastClientMessage != null && !lastClientMessage.isEmpty()) {
            try {
                lastClientJSON = JsonParser.parseString(lastClientMessage).getAsJsonObject();
            } catch (JsonSyntaxException e) {
                lastClientJSON = null;
                System.err.println("Error parsing JSON: " + e.getMessage());
            }
        }

        builder.append("{")
                .append("\"type\":\"Feature\",")
                .append("\"order\":{")
                .append("\"id\":").append(order.getId()).append(",")
                .append("\"orderCode\":\"").append(order.getOrderCode()).append("\",")
                .append("\"status\":\"").append(currentOrderStatus).append("\",")
                .append("\"quantity\":").append(order.getQuantity()).append(",")
                .append("\"originCity\":\"").append(getValidatedProvince(order.getOriginUbigeo())).append("\",")
                .append("\"destinationCity\":\"").append(getValidatedProvince(order.getDestinationUbigeo())).append("\",")
                .append("\"destinationRegion\":\"").append(getValidatedNaturalRegion(order.getDestinationUbigeo())).append("\",")
                .append("\"orderTime\":\"").append(order.getOrderTime()).append("\",")
                .append("\"quantityVehicles\":").append(!vehicleAssignmentsPerOrder.containsKey(order.getId())?0:vehicleAssignmentsPerOrder.get(order.getId()).size()).append(",")
                .append("\"dueTime\":\"").append(order.getDueTime()).append("\",");

        // Calcular tiempo transcurrido solo si el estado no es DELIVERED o PENDING_PICKUP
        if (currentOrderStatus.equals(Order.OrderStatus.DELIVERED) || currentOrderStatus.equals(Order.OrderStatus.PENDING_PICKUP)) {
            Optional<LocalDateTime> deliveryTime = vehicleAssignmentsPerOrder.containsKey(order.getId())? vehicleAssignmentsPerOrder.get(order.getId()).stream()
                    .map(VehicleAssignment::getEstimatedDeliveryTime) // Extraer el atributo de fecha
                    .filter(date -> date != null) // Filtrar fechas nulas
                    .max((d1, d2) -> d1.isAfter(d2) ? 1 : (d2.isAfter(d1) ? -1 : 0)) : null;
            if(deliveryTime!=null&&deliveryTime.isPresent()){
                Duration timeElapsed = Duration.between(order.getOrderTime(), deliveryTime.get());
                Duration timeRemaining = Duration.between(deliveryTime.get(), order.getDueTime());
                builder.append("\"timeElapsedDays\":").append(timeElapsed.toDays()).append(",")
                        .append("\"timeElapsedHours\":").append(timeElapsed.toHours() % 24).append(",")
                        .append("\"timeRemainingDays\":").append(timeRemaining.toDays()).append(",")
                        .append("\"timeRemainingHours\":").append(timeRemaining.toHours() % 24);
            }
            else{
                builder.append("\"timeElapsedDays\":").append(0).append(",")
                        .append("\"timeElapsedHours\":").append(0).append(",")
                        .append("\"timeRemainingDays\":").append(0).append(",")
                        .append("\"timeRemainingHours\":").append(0);
            }
        } else {
            Duration timeElapsed = Duration.between(order.getOrderTime(), currentTime);
            Duration timeRemaining = Duration.between(currentTime, order.getDueTime());
            builder.append("\"timeElapsedDays\":").append(timeElapsed.toDays()).append(",")
                    .append("\"timeElapsedHours\":").append(timeElapsed.toHours() % 24).append(",")
                    .append("\"timeRemainingDays\":").append(timeRemaining.toDays()).append(",")
                    .append("\"timeRemainingHours\":").append(timeRemaining.toHours() % 24);
        }
        builder.append("},");

        builder.append("\"vehicles\":[");
        StringBuilder vehiclesContentBuilder = new StringBuilder();
        try {

            if (vehicleAssignmentsPerOrder.containsKey(order.getId())) {
                boolean firstVehicle = true;
                if (lastClientJSON != null &&
                        ((lastClientJSON.has("orderId") &&
                        !lastClientJSON.get("orderId").getAsString().isEmpty() &&
                        lastClientJSON.get("orderId").getAsInt() == order.getId())
                        )
                ) {
                    for (VehicleAssignment assignedVehicle : vehicleAssignmentsPerOrder.get(order.getId())) {
                        boolean attendedOrder = assignedVehicle.getOrder().getStatus().equals(Order.OrderStatus.DELIVERED)
                                || assignedVehicle.getOrder().getStatus().equals(Order.OrderStatus.PENDING_PICKUP)
                                || assignedVehicle.getVehicle().getCurrentOrder() == null
                                || assignedVehicle.getVehicle().getCurrentOrder().getId() != order.getId();
                        if (!firstVehicle) vehiclesContentBuilder.append(",");
                        vehiclesContentBuilder.append("{")
                                .append("\"orderId\":").append(assignedVehicle.getOrder().getId()).append(",")
                                .append("\"orderCode\":\"").append(assignedVehicle.getOrder().getOrderCode()).append("\",")
                                .append("\"vehicleCode\":\"").append(assignedVehicle.getVehicle().getCode()).append("\",")
                                .append("\"packageQuantity\":\"").append(assignedVehicle.getAssignedQuantity()).append("\",")
                                .append("\"vehicleStatus\":\"").append(assignedVehicle.getVehicle().getStatus()).append("\",")
                                .append("\"vehicleType\":\"").append(assignedVehicle.getVehicle().getType()).append("\",")
                                .append("\"vehicleCapacity\":\"").append(assignedVehicle.getVehicle().getCapacity()).append("\",")
                                .append("\"status\":\"").append(attendedOrder ? "ATTENDED" : "NO_ATTENDED").append("\",")
                                .append("\"orderTime\":\"").append(assignedVehicle.getOrder().getOrderTime()).append("\",");

                        // Construir el arreglo JSON de rutas (anidado dentro de cada vehículo)
                        vehiclesContentBuilder.append("\"routes\":[");
                        StringBuilder routeContentBuilder = new StringBuilder();

                        try {
                            boolean firstRoute = true;
                            // Primera ruta con campos vacíos para indicar el destino final
                            if (assignedVehicle.getRouteSegments() != null && !assignedVehicle.getRouteSegments().isEmpty()) {
                                if (lastClientJSON != null &&
                                        ((lastClientJSON.has("vehicleCode") &&
                                        !lastClientJSON.get("vehicleCode").getAsString().isEmpty() &&
                                        lastClientJSON.get("vehicleCode").getAsString().equals(assignedVehicle.getVehicle().getCode()))
                                        )
                                ) {
                                    routeContentBuilder.append("{")
                                            .append("\"originUbigeo\":\"").append(assignedVehicle.getRouteSegments().get(0).getFromUbigeo()).append("\",")
                                            .append("\"originCity\":\"").append(getValidatedProvince(assignedVehicle.getRouteSegments().get(0).getFromUbigeo())).append("\",")
                                            .append("\"destinationUbigeo\":null,")
                                            .append("\"durationMinutes\":null,")
                                            .append("\"distance\":null")
                                            .append("},");

                                    String currentUbigeo = "";
                                    if (assignedVehicle.getVehicle().getStatus() != null)
                                        currentUbigeo = assignedVehicle.getVehicle().getStatus().getCurrentSegmentUbigeo();
                                    boolean traveled = true;
                                    boolean inTravel = false;

                                    // Iterar por las rutas segmentadas
                                    for (RouteSegment routeSegment : assignedVehicle.getRouteSegments()) {
                                        if (!firstRoute) routeContentBuilder.append(",");
                                        if (!attendedOrder && currentUbigeo.equals(routeSegment.getToUbigeo())) {
                                            traveled = false;
                                            inTravel = true;
                                        }
                                        routeContentBuilder.append("{")
                                                .append("\"originUbigeo\":\"").append(routeSegment.getFromUbigeo()).append("\",")
                                                .append("\"destinationUbigeo\":\"").append(routeSegment.getToUbigeo()).append("\",")
                                                .append("\"originCity\":\"").append(getValidatedProvince(routeSegment.getFromUbigeo())).append("\",")
                                                .append("\"destinationCity\":\"").append(getValidatedProvince(routeSegment.getToUbigeo())).append("\",")
                                                .append("\"durationMinutes\":").append(routeSegment.getDurationMinutes()).append(",")
                                                .append("\"status\":\"").append(attendedOrder || traveled ? "TRAVELED" : inTravel ? "IN_TRAVEL" : "NO_TRAVELED").append("\",")
                                                .append("\"distance\":").append(routeSegment.getDistance())
                                                .append("}");
                                        firstRoute = false;
                                        inTravel = false;
                                    }

                                    // Última ruta con campos vacíos para indicar el destino final
                                    routeContentBuilder.append(",{")
                                            .append("\"originUbigeo\":null,")
                                            .append("\"destinationUbigeo\":\"").append(assignedVehicle.getRouteSegments().get(assignedVehicle.getRouteSegments().size() - 1).getToUbigeo()).append("\",")
                                            .append("\"destinationCity\":\"").append(getValidatedProvince(assignedVehicle.getRouteSegments().get(assignedVehicle.getRouteSegments().size() - 1).getToUbigeo())).append("\",")
                                            .append("\"durationMinutes\":null,")
                                            .append("\"distance\":null")
                                            .append("}");
                                }
                            }
                            vehiclesContentBuilder.append(routeContentBuilder);
                        } catch (Exception e) {

                        }

                        vehiclesContentBuilder.append("]"); // Cerrar el arreglo de rutas
                        // Cerrar el vehículo actual
                        vehiclesContentBuilder.append("}");
                        firstVehicle = false;
                    }
                }
            }
            builder.append(vehiclesContentBuilder);
        } catch (Exception e) {

        }

        builder.append("]"); // Cerrar el arreglo de vehículos


        builder.append("}"); // Cerrar el objeto JSON principal
        return true;
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

    private void initiateMaintenance(Vehicle vehicle, Maintenance mantenimiento) {
        if (vehicle.getEstado() == Vehicle.EstadoVehiculo.EN_ALMACEN) {
            vehicle.setEstado(Vehicle.EstadoVehiculo.EN_MANTENIMIENTO);
            vehicle.setAvailable(false);
            vehicle.setMaintenanceStartTime(currentTime);
            logger.info("Vehículo " + vehicle.getCode() + " enviado a mantenimiento hasta " + mantenimiento.getEndTime());
        } else {
            logger.info("Vehículo " + vehicle.getCode() + " en ruta, irá a mantenimiento después de completar la entrega.");
        }
    }

    public void updateVehicleStates() {
        lock.lock();
        try {
            List<Vehicle> vehiclesNeedingNewRoutes = new ArrayList<>();
            List<Vehicle> vehiclesNeedingReplacement = new ArrayList<>();

            for (Vehicle vehicle : vehicles) {

                // Verificar si es momento de entrar en mantenimiento
                Maintenance mantenimiento = getCurrentMaintenance(vehicle.getCode());
                if (mantenimiento != null) { // Se encontró mantenimiento a aplicar
                    if (!vehicle.isInMaintenance()) {
                        // Transición inicial a mantenimiento
                        initiateMaintenance(vehicle, mantenimiento);
                    } else {
                        // Calcular el tiempo transcurrido en mantenimiento
                        if (vehicle.getMaintenanceStartTime() != null) {
                            Duration duration = Duration.between(vehicle.getMaintenanceStartTime(), currentTime);
                            if (simulationType == SimulationRouter.SimulationType.DAILY) {
                                logger.info("Tiempo en mantenimiento para el vehículo " + vehicle.getCode() + ": " + duration.toSeconds() + " segundos.");
                            } else {
                                logger.info("Tiempo en mantenimiento para el vehículo " + vehicle.getCode() + ": " + duration.toMinutes() + " minutos.");
                            }
                        }
                    }
                    continue;
                } else {
                    if (vehicle.getMaintenanceStartTime() != null) { // Significa que acabó su periodo de mantenimiento
                        vehicle.setEstado(Vehicle.EstadoVehiculo.EN_ALMACEN);
                        vehicle.setAvailable(true);
                        logger.info("Vehículo " + vehicle.getCode() + " ha finalizado el mantenimiento.");
                        vehicle.setMaintenanceStartTime(null);
                    }
                }

                if (vehicle.isUnderRepair()) {
                    // Verificar si el vehículo está en estado AVERIADO_2 y no ha iniciado el proceso de reemplazo
                    boolean averiaGrave = vehicle.getEstado() == Vehicle.EstadoVehiculo.AVERIADO_2 || vehicle.getEstado() == Vehicle.EstadoVehiculo.AVERIADO_3;
                    if (averiaGrave && !vehicle.isReplacementProcessInitiated()) { // si es grave pero ya empezo proceso => no entra
                        vehiclesNeedingReplacement.add(vehicle);
                        vehicle.setReplacementProcessInitiated(true); // Marcar que el proceso ha sido iniciado
                    } else { // en reparacion o averia tipo 1
                        handleRepairCompletion(vehicle, currentTime);
                    }
                    vehicle.updateAveriaTime(currentTime, simulationType);  // Actualizar el tiempo en estado de avería
                    continue;
                }

                if (vehicle.shouldUpdateStatus()) {
                    handleVehicleStatusUpdate(vehicle, currentTime);
                }

                // Procesar averías programadas
                processScheduledBreakdowns();

                // Vehiculos que acabaron de entregar su pedido y la espera en oficina
                // y necesitan ruta para volver al almacén más cercano
                if (vehicle.shouldCalculateNewRoute(currentTime)) {
                    vehiclesNeedingNewRoutes.add(vehicle);
                }
            }

            // Procesar vehículos que necesitan reemplazo por averia
            if (!vehiclesNeedingReplacement.isEmpty()) {
                procesarProcesoReemplazo(vehiclesNeedingReplacement);
            }

            // Vehiculos necesitan ruta de regreso a almacen mas cercano
            if (!vehiclesNeedingNewRoutes.isEmpty()) {
                logVehiculosNecesitandoRegresoAlmacen(vehiclesNeedingNewRoutes);
                procesarProcesoRegresoAlmacen(vehiclesNeedingNewRoutes);
            }

        } finally {
            lock.unlock();
        }
    }

    public Vehicle findVehicleByCode(List<Vehicle> vehicles, String code) {
        for (Vehicle vehicle : vehicles) {
            if (vehicle.getCode().equals(code)) {
                return vehicle;
            }
        }
        return null;
    }

    private void processScheduledBreakdowns() {
        Iterator<ScheduledBreakdown> iterator = scheduledBreakdowns.iterator();
        while (iterator.hasNext()) {
            ScheduledBreakdown breakdown = iterator.next();
            if (!currentTime.isBefore(breakdown.getScheduledTime())) {
                Vehicle vehicle = findVehicleByCode(vehicles, breakdown.getVehicleCode());
                if (vehicle != null && vehicle.getEstado() == Vehicle.EstadoVehiculo.EN_TRANSITO_ORDEN) {
                    String tempUbigeo = vehicle.handleBreakdown(currentTime, Vehicle.EstadoVehiculo.fromBreakdownType(breakdown.getBreakdownType()), simulationType);

                    // Loggear la avería
                    String logMessage = String.format("Vehículo %s ha sufrido una avería tipo %s a las %s en el tramo de %s a %s",
                            vehicle.getCode(), breakdown.getBreakdownType(), currentTime,
                            breakdown.getOriginUbigeo(), breakdown.getDestinationUbigeo());
                    addBreakdownLog(vehicle.getCode(), logMessage);
                    logger.info(logMessage);

                    if (tempUbigeo != null) {
                        String originUbigeo = vehicle.getRoute().get(vehicle.getCurrentSegmentIndex()).getFromUbigeo();
                        long elapsedMinutes = vehicle.getElapsedTimeInSegment();
                        addTemporaryLocationToMatrices(tempUbigeo, originUbigeo, elapsedMinutes);
                    }

                    // Remover la avería programada de la lista
                    iterator.remove();
                }
            }
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


    public Map<String, Double> getEficienciaPedidos() {
        return eficienciaPedidos;
    }

    public void calcularEficienciaPedido(String codigo, LocalDateTime tiempoEstimado, LocalDateTime tiempoLimite) {
        //aqui se debe dividir el tiempo estimado entre el tiempo limite. --> todo esto para 1 pedido se guarda en 1 indice de un MAP
        //luego se tiene que ir sumando en total
        //Aqui al final se tiene que guardar un <integer, integer> -> el primer "int" solo indica que pedido es. Y luego el otro indica el valor de la division
        // Asegurarnos de que tiempoLimite sea siempre mayor a tiempoEstimado
        /*if (tiempoEstimado.isAfter(tiempoLimite)) {
            logger.info("El tiempo estimado no puede ser después del tiempo límite.\n");
        }*/

// Calculamos la duración entre el tiempo estimado de llegada y el límite de entrega
        //long tiempoEstimadoSegundos = Duration.between(currentTime, tiempoEstimado).getSeconds();
        //long tiempoLimiteSegundos = Duration.between(currentTime, tiempoLimite.getSeconds());

        /*double eficiencia = (double) Duration.between(currentTime, tiempoEstimado).getSeconds()
                / (double) Duration.between(currentTime, tiempoLimite).getSeconds();*/

        // Convertir ambos tiempos a minutos o segundos para hacer la división
        //long tiempoEstimadoMinutos = tiempoEstimado.toLocalTime().toSecondOfDay();
        //long tiempoLimiteMinutos = tiempoLimite.toLocalTime().toSecondOfDay();

        // Calcular eficiencia como tiempo estimado / tiempo límite
        //double eficiencia = (double) tiempoEstimadoMinutos / tiempoLimiteMinutos;
        /* Aqui sugerencia: MODIFCAR LA FORMA DE CALCULAR LA EFICIENCIA PARA QUE SEA MAS FACIL --> SOLO SE DEBE DIVIDIR EL TIEMPO ESTIMADO ENTRE EL TIEMPO LIMITE */
        if (tiempoEstimado.isAfter(tiempoLimite)) {
            // Si el tiempo estimado supera el límite, la eficiencia es 0
            eficienciaPedidos.put(codigo, 0.0);
            return;
        }

        // Convertir ambos tiempos a minutos
        long tiempoEstimadoMinutos = tiempoEstimado.toLocalTime().toSecondOfDay();
        long tiempoLimiteMinutos = tiempoLimite.toLocalTime().toSecondOfDay();

        // Calcular la diferencia entre el tiempo límite y el estimado
        double margenTiempo = tiempoLimiteMinutos - tiempoEstimadoMinutos;

        // La eficiencia es mejor mientras más margen de tiempo tengamos
        double eficiencia = margenTiempo / tiempoLimiteMinutos;

        // Normalizar la eficiencia entre 0 y 1
        eficiencia = Math.max(0.0, Math.min(1.0, eficiencia));

        eficienciaPedidos.put(codigo, eficiencia);
    }


    public Map<String, Integer> getPedidosPorRegion(){
        return pedidosPorRegion;
    }

    public void asignarPedidoAlmacenCount(String ubigeoDestino){
        // Obtener la región natural del pedido que se está asignando
        String regionNatural = locations.get(ubigeoDestino).getNaturalRegion();

        // Verificar la región y actualizar el contador correspondiente
        if (regionNatural != null) {
            switch (regionNatural.toUpperCase()) {
                case "SELVA":
                    pedidosPorRegion.put("SELVA", pedidosPorRegion.getOrDefault("SELVA", 0) + 1);
                    break;
                case "COSTA":
                    pedidosPorRegion.put("COSTA", pedidosPorRegion.getOrDefault("COSTA", 0) + 1);
                    break;
                case "SIERRA":
                    pedidosPorRegion.put("SIERRA", pedidosPorRegion.getOrDefault("SIERRA", 0) + 1);
                    break;
                default:
                    // Región desconocida, no se actualiza nada
                    System.out.println("Región desconocida para el ubigeo: " + ubigeoDestino);
                    break;
            }
        }
    }

    public Map<String, Integer> getDemandasAlmacenesOrderCount(){
        return paradasAlmacenesOrderCount;
    }

    public void registrarParadaEnAlmacen(String codigoAlmacen) {
        //aqui falta ver que es el parametro. Si es un ubigeo se necesita hacer un match para ver cual de los 3 almacenes es el indicado
        paradasAlmacenesOrderCount.put(codigoAlmacen, paradasAlmacenesOrderCount.getOrDefault(codigoAlmacen, 0) + 1);
    }

    //Metodo que se llama cada vez que se asigna un pedido a un vehículo
    public void assignOrdersCount(){
        currentDayOrders++;
        totalOrdersCount2++;
    }

    public int getTotalOrdersCount2(){
        return totalOrdersCount2;
    }

    public void guardarPedidosDiarios() {
        if(currentDayOrders != 0){
            stateLock.lock();
            try {
                orderbyDays.add(currentDayOrders);
                totalOrdersCount += currentDayOrders;
                currentDayOrders = 0; // Reiniciar el conteo diario para el siguiente día
                logger.info("Pedidos guardados para el día actual. Total de pedidos: " + totalOrdersCount);
            } finally {
                stateLock.unlock();
            }
        }
    }

    public int obteinCountOrder(){
        return totalOrdersCount;
    }
    public List<Integer> getOrderbyDays(){
        return orderbyDays;
    }

    // Método para actualizar la métrica de capacidad efectiva acumulada
    public void updateCapacityMetrics(int currentCapacityUsed, int vehicleCapacity) {
        double aux = (double) currentCapacityUsed / vehicleCapacity;
        //this.totalCapacityUsed += currentCapacityUsed;
        //this.totalCapacity += vehicleCapacity;
        this.averageCapacityMetric += aux;
        this.capacityRecordsCount++;
        logger.info("Actualizando métricas de capacidad: Capacidad Usada: " + currentCapacityUsed +
                ", Capacidad Total: " + vehicleCapacity + ", Total Registros: " + capacityRecordsCount);
    }

    public double calculateAverageCapacity() {
        /*if (capacityRecordsCount == 0 || totalCapacity == 0) {
            return 0;
        }*/
        if(averageCapacityMetric == 0){
            return 0;
        }
        return averageCapacityMetric / capacityRecordsCount;
    }

    public void guardarCiudadDestino(String destinationCity){
        cityOrderCount.put(destinationCity, cityOrderCount.getOrDefault(destinationCity, 0) + 1);
    }

    public Map<String, Integer> getCityOrderCount(){
        return cityOrderCount;
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
            } else { // TIPO 2 Y 3
                vehicle.setEstado(Vehicle.EstadoVehiculo.EN_ALMACEN);
                vehicle.setAvailable(true);
                vehicle.setReplacementProcessInitiated(false); // limpiar porque ya acabó proceso reparación
                logger.info(String.format("Vehículo %s ha sido reparado y está nuevamente disponible en el almacén.", vehicle.getCode()));
            }
            vehicle.clearRepairTime();

            // Calculate and accumulate the breakdown duration
            if (vehicle.getAveriaStartTime() != null) {
                long breakdownDuration = (simulationType == SimulationRouter.SimulationType.DAILY)
                        ? ChronoUnit.SECONDS.between(vehicle.getAveriaStartTime(), currentTime)
                        : ChronoUnit.MINUTES.between(vehicle.getAveriaStartTime(), currentTime);
                vehicle.addToTotalBreakdownTime(breakdownDuration);
                vehicle.setAveriaStartTime(null);
            }
        }
    }

    private void procesarProcesoReemplazo(List<Vehicle> brokenVehicles) {
        CompletableFuture.runAsync(() -> iniciarProcesoReemplazoAveriados(brokenVehicles),
                SimulationRunner.getComputeIntensiveExecutor());
    }

    public static List<List<RouteRequest>> groupRoutesWithoutRepetitions(List<RouteRequest> allRoutes) {
        List<List<RouteRequest>> groups = new ArrayList<>();
        Set<String> processedRoutes = new HashSet<>();

        // Filtrar rutas duplicadas
        List<RouteRequest> uniqueRoutes = allRoutes.stream()
                .filter(route -> {
                    String key = buildRouteKey(route.start, route.end);
                    if (processedRoutes.contains(key)) {
                        return false;
                    } else {
                        processedRoutes.add(key);
                        return true;
                    }
                })
                .collect(Collectors.toList());

        Set<String> usedOrigins = new HashSet<>();
        Set<String> usedDestinations = new HashSet<>();

        List<RouteRequest> currentGroup = new ArrayList<>();

        for (RouteRequest route : uniqueRoutes) {
            if (!usedOrigins.contains(route.start) && !usedDestinations.contains(route.end)) {
                currentGroup.add(route);
                usedOrigins.add(route.start);
                usedDestinations.add(route.end);
            } else {
                // Si el origen o destino ya están usados, iniciar un nuevo grupo
                if (!currentGroup.isEmpty()) {
                    groups.add(new ArrayList<>(currentGroup));
                }
                currentGroup.clear();
                usedOrigins.clear();
                usedDestinations.clear();
                // Añadir la ruta actual al nuevo grupo
                currentGroup.add(route);
                usedOrigins.add(route.start);
                usedDestinations.add(route.end);
            }
        }
        if (!currentGroup.isEmpty()) {
            groups.add(currentGroup);
        }
        return groups;
    }

    private void extendMatrixForDummy(int dummyIndex, int originalIndex) {
        // Determinar el tamaño actual de la matriz
        int currentSize = timeMatrix.length;

        // Crear una nueva matriz con espacio para el dummy node
        long[][] extendedMatrix = new long[currentSize + 1][currentSize + 1];

        // Copiar la matriz existente en la nueva matriz
        for (int i = 0; i < currentSize; i++) {
            System.arraycopy(timeMatrix[i], 0, extendedMatrix[i], 0, currentSize);
        }

        // Inicializar la nueva fila y columna con valores grandes (999999)
        for (int i = 0; i < currentSize + 1; i++) {
            extendedMatrix[currentSize][i] = 999999; // Nueva fila
            extendedMatrix[i][currentSize] = 999999; // Nueva columna
        }

        // Copiar los valores del nodo original a la nueva fila y columna (dummy node)
        for (int i = 0; i < currentSize; i++) {
            extendedMatrix[currentSize][i] = timeMatrix[originalIndex][i]; // Fila
            extendedMatrix[i][currentSize] = timeMatrix[i][originalIndex]; // Columna
        }

        // Configurar el costo entre el nodo original y su dummy node como 0
        extendedMatrix[currentSize][originalIndex] = 0;
        extendedMatrix[originalIndex][currentSize] = 0;

        // Reemplazar la matriz original con la extendida
        timeMatrix = extendedMatrix;
    }


    private DataModel createDataModelForGroup(Set<RouteRequest> routesToCalculate, List<Blockage> blockages) {
        List<Integer> starts = new ArrayList<>();
        List<Integer> ends = new ArrayList<>();

        AtomicInteger dummyIndex = new AtomicInteger(currentTimeMatrix.length); // Primer índice para dummy nodes
        Map<String, Integer> dummyNodes = new HashMap<>();

        for (RouteRequest request : routesToCalculate) {
            Integer startIndex = locationIndices.get(request.start);
            Integer endIndex = locationIndices.get(request.end);

            if (startIndex == null || endIndex == null) {
                logger.warning(String.format("Ubigeo de inicio o fin no encontrado: %s -> %s",
                        request.start, request.end));
                continue;
            }

            // Manejar dummy nodes para el origen
            int actualStartIndex;
            if (starts.contains(startIndex)) {
                // Nodo ya usado, crear un dummy node
                String dummyKey = "start-" + startIndex;
                actualStartIndex = dummyNodes.computeIfAbsent(dummyKey, key -> {
                    extendMatrixForDummy(dummyIndex.get(), startIndex);
                    return dummyIndex.getAndIncrement();
                });
            } else {
                actualStartIndex = startIndex;
            }

            // Manejar dummy nodes para el destino
            int actualEndIndex;
            if (ends.contains(endIndex)) {
                // Nodo ya usado, crear un dummy node
                String dummyKey = "end-" + endIndex;
                actualEndIndex = dummyNodes.computeIfAbsent(dummyKey, key -> {
                    extendMatrixForDummy(dummyIndex.get(), endIndex);
                    return dummyIndex.getAndIncrement();
                });
            } else {
                actualEndIndex = endIndex;
            }

            // Agregar los índices al conjunto de rutas
            starts.add(actualStartIndex);
            ends.add(actualEndIndex);
        }

        if (starts.isEmpty()) {
            logger.warning("No hay rutas para calcular en este grupo.");
            return null; // No hay rutas para este grupo
        }

        return new DataModel(
                getCurrentTimeMatrix(),
                blockages,
                starts.stream().mapToInt(Integer::intValue).toArray(),
                ends.stream().mapToInt(Integer::intValue).toArray(),
                locationNames,
                locationUbigeos
        );
    }


    private void iniciarProcesoReemplazoAveriados(List<Vehicle> brokenVehicles) {
        // Obtener destinos únicos de las órdenes
        Set<String> destinationSet = new HashSet<>();
        for (Vehicle vehicle : brokenVehicles) {
            destinationSet.add(vehicle.getCurrentLocationUbigeo()); // Punto de avería
        }
        String[] destinations = destinationSet.toArray(new String[0]);

        // Calcular las mejores rutas para cada destino
        RouteService routeService = new RouteService(getLocationIndices(), currentTimeMatrix);
        Map<String, Route> bestRoutes = routeService.findBestRoutes(getAlmacenesPrincipales(), destinations);

        // Determinar el almacén más cercano para cada vehículo
        for (Vehicle vehicle : brokenVehicles) {
            String breakdownUbigeo = vehicle.getCurrentLocationUbigeo();
            Route bestRoute = bestRoutes.get(breakdownUbigeo);
            if (bestRoute != null) {
                boolean assigned = asignarReemplazo(vehicle, bestRoute.getStartUbigeo(), bestRoute.getSegments());
                if (!assigned) {
                    vehicle.setReplacementProcessInitiated(false);
                }
            } else {
                logger.warning("No se encontró almacén cercano para el vehículo " + vehicle.getCode());
                vehicle.setReplacementProcessInitiated(false);
            }
        }
    }

    private boolean asignarReemplazo(Vehicle brokenVehicle, String warehouse, List<RouteSegment> route) {
        boolean asignado = false;

        // Obtener un vehículo disponible en el almacén seleccionado
        Vehicle replacementVehicle = getAvailableVehicleAtWarehouse(warehouse, brokenVehicle);

        if (replacementVehicle != null) {
            assignReplacementVehicle(replacementVehicle, brokenVehicle, route, getCurrentTime());
            logger.info(String.format("Vehículo %s asignado para reemplazar al vehículo averiado %s.", replacementVehicle.getCode(), brokenVehicle.getCode()));
            asignado = true;
        } else {
            logger.warning(String.format("No hay vehículos disponibles en el almacén %s para reemplazar al vehículo %s.", warehouse, brokenVehicle.getCode()));
        }

        return asignado;
    }

    private Vehicle getAvailableVehicleAtWarehouse(String warehouseUbigeo, Vehicle brokenVehicle) {
        // Calcular la cantidad de paquetes que el vehículo averiado está llevando
        int packagesToCarry = brokenVehicle.getCurrentCapacity();
        logger.info(String.format("El vehículo averiado con código '%s' transporta %d paquetes." +
                " Se buscará un vehículo de reemplazo en el almacén más cercano.", brokenVehicle.getCode(), packagesToCarry));

        String type = brokenVehicle.getType();
        int highestNumber = 0;
        Vehicle availableVehicle = null;

        // Buscar vehículo disponible y al mismo tiempo encontrar el código más alto
        for (Vehicle vehicle : vehicles) {
            // Actualizar el número más alto para el tipo de vehículo
            if (vehicle.getType().equals(type)) {
                String numberPart = vehicle.getCode().substring(1);
                int currentNumber = Integer.parseInt(numberPart);
                if (currentNumber > highestNumber) {
                    highestNumber = currentNumber;
                }
            }

            // Verificar si el vehículo está disponible
            if (availableVehicle == null
                    && vehicle.getCurrentLocationUbigeo().equals(warehouseUbigeo) // Ubicación del almacén
                    && vehicle.getEstado() == Vehicle.EstadoVehiculo.EN_ALMACEN // Estado en almacén
                    && vehicle.isAvailable() // Disponible
                    && (vehicle.getCapacity() >= packagesToCarry)) { // Suficiente capacidad
                return vehicle;
            }
        }

        // Si encontramos un vehículo disponible, lo retornamos
        if (availableVehicle != null) {
            return availableVehicle;
        }

        // Si no encontramos vehículo disponible, creamos uno nuevo
        String newCode = type + String.format("%03d", highestNumber + 1);
        int capacity = getCapacityForType(type);

        Vehicle newVehicle = new Vehicle(newCode, type, capacity, warehouseUbigeo);
        newVehicle.setAvailable(true);
        newVehicle.setEstado(Vehicle.EstadoVehiculo.EN_ALMACEN);
        vehicles.add(newVehicle);

        logger.info(String.format("Se ha creado un nuevo vehículo con código '%s' en el almacén '%s'",
                newCode, warehouseUbigeo));

        return newVehicle;
    }

    private int getCapacityForType(String type) {
        switch (type) {
            case "A":
                return 90;
            case "B":
                return 45;
            case "C":
                return 30;
            default:
                throw new IllegalArgumentException("Tipo de vehículo no válido: " + type);
        }
    }

    private void handleVehicleStatusUpdate(Vehicle vehicle, LocalDateTime currentTime) {
        vehicle.updateStatus(currentTime, warehouseManager, simulationType);
    }

    private void logVehiculosNecesitandoRegresoAlmacen(List<Vehicle> vehiclesNeedingNewRoutes) {
        String vehicleCodes = vehiclesNeedingNewRoutes.stream()
                .map(Vehicle::getCode)
                .collect(Collectors.joining(", "));
        logger.info("Vehículos que necesitan nuevas rutas: " + vehicleCodes);
    }

    private void procesarProcesoRegresoAlmacen(List<Vehicle> vehiclesNeedingNewRoutes) {
        new Thread(() -> initiateReturnToWarehouseProcess(vehiclesNeedingNewRoutes)).start();
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

    public void incrementarAveria(String tipo) {
        switch (tipo) {
            case "1":
                averiasTipo1++;
                break;
            case "2":
                averiasTipo2++;
                break;
            case "3":
                averiasTipo3++;
                break;
            default:
                logger.warning("Tipo de avería no reconocido: " + tipo);
        }
    }

    public void provocarAveria(String vehicleCode, String breakdownType) {
        Vehicle vehicle = findVehicleByCode(vehicles, vehicleCode);
        if (vehicle != null) {
            if (vehicle.getEstado() == Vehicle.EstadoVehiculo.EN_TRANSITO_ORDEN || vehicle.getEstado() == Vehicle.EstadoVehiculo.HACIA_ALMACEN) {
                Vehicle.EstadoVehiculo estadoAveria;
                switch (breakdownType) {
                    case "1":
                        estadoAveria = Vehicle.EstadoVehiculo.AVERIADO_1;
                        averiasTipo1++;
                        break;
                    case "2":
                        estadoAveria = Vehicle.EstadoVehiculo.AVERIADO_2;
                        averiasTipo2++;
                        break;
                    case "3":
                        estadoAveria = Vehicle.EstadoVehiculo.AVERIADO_3;
                        averiasTipo3++;
                        break;
                    default:
                        logger.warning("Tipo de avería no reconocido: " + breakdownType);
                        return;
                }

                String tempUbigeo = vehicle.handleBreakdown(currentTime, estadoAveria, simulationType);
                logger.info(String.format("Avería tipo %s provocada en el vehículo %s", breakdownType, vehicleCode));

                if (tempUbigeo != null) {
                    String originUbigeo = vehicle.getRoute().get(vehicle.getCurrentSegmentIndex()).getFromUbigeo();
                    long elapsedMinutes = vehicle.getElapsedTimeInSegment();
                    addTemporaryLocationToMatrices(tempUbigeo, originUbigeo, elapsedMinutes);
                }

                // Agregar un mensaje de avería
                String logMessage = String.format("Avería tipo %s provocada en el vehículo %s en %s.",
                        breakdownType, vehicleCode, currentTime);
                addBreakdownLog(vehicleCode, logMessage);

                //AQUI TIENE QUE VERIFICARSE EL TIPO DE AVERIA, PARA LA METRICA Y EL REPORTE


            } else {
                logger.warning(String.format("No se puede provocar avería en el vehículo %s porque no está en tránsito: estado %s", vehicleCode, vehicle.getEstado()));
            }
        } else {
            logger.warning(String.format("No se encontró el vehículo con código %s", vehicleCode));
        }
    }

    public void actualizarMatrizConTramoTemporal(String ubigeoInicioAveria, String ubigeoPuntoAveria, long elapsedMinutes) {
        logger.info("Actualizando matriz de tiempo basada en ubigeo temporal.");

        // Asegurarte de que la matriz es lo suficientemente grande
        int newSize = SimulationState.locations.size(); // Supongamos que los nodos están indexados por la cantidad de ubicaciones
        expandMatrixForTemporaryNode(newSize);

        int fromIndex = locationIndices.get(ubigeoInicioAveria);
        int toIndex = locationIndices.get(ubigeoPuntoAveria);
        currentTimeMatrix[fromIndex][toIndex] = elapsedMinutes;
        currentTimeMatrix[toIndex][fromIndex] = elapsedMinutes; // Asumiendo que las rutas son bidireccionales
        logger.info("Ruta creada: " + ubigeoInicioAveria + " -> " + ubigeoPuntoAveria + " minutos: " + elapsedMinutes);
    }

    public static void removeTemporaryLocation(String tempUbigeo) {
        // Eliminar de la lista de ubicaciones
        LocationService.getInstance().removeTemporaryLocation(tempUbigeo);

        // Obtener el índice del ubigeo temporal
        Integer tempIndex = locationIndices.get(tempUbigeo);
        if (tempIndex == null) {
            logger.warning("El ubigeo temporal no existe en locationIndices: " + tempUbigeo);
            return;
        }

        // Eliminar el ubigeo de las estructuras de datos
        locationUbigeos.remove((int) tempIndex);
        locationNames.remove(tempIndex);
        locationIndices.remove(tempUbigeo);

        // Actualizar los índices de ubigeo después del eliminado
        for (int i = tempIndex; i < locationUbigeos.size(); i++) {
            String ubigeo = locationUbigeos.get(i);
            locationIndices.put(ubigeo, i);
        }

        // Eliminar la fila y columna correspondiente en currentTimeMatrix
        removeRowAndColumnFromMatrix(tempIndex);

        logger.info("Ubigeo temporal eliminado: " + tempUbigeo);
    }

    private static void removeRowAndColumnFromMatrix(int index) {
        int size = currentTimeMatrix.length;
        long[][] newMatrix = new long[size - 1][size - 1];

        for (int i = 0, newI = 0; i < size; i++) {
            if (i == index) continue;
            for (int j = 0, newJ = 0; j < size; j++) {
                if (j == index) continue;
                newMatrix[newI][newJ] = currentTimeMatrix[i][j];
                newJ++;
            }
            newI++;
        }

        currentTimeMatrix = newMatrix;
    }

    private void expandMatrixForTemporaryNode(int newSize) {
        // Incorporar nuevo nodo en matriz actual
        // Crear una nueva matriz con dimensiones ampliadas
        long[][] newMatrix = new long[newSize][newSize];

        // Copiar datos de la matriz existente a la nueva
        for (int i = 0; i < currentTimeMatrix.length; i++) {
            System.arraycopy(currentTimeMatrix[i], 0, newMatrix[i], 0, currentTimeMatrix[i].length);
        }

        // Rellenar las nuevas celdas con valores predeterminados (por ejemplo, Long.MAX_VALUE o 0)
        for (int i = currentTimeMatrix.length; i < newSize; i++) {
            for (int j = 0; j < newSize; j++) {
                newMatrix[i][j] = Long.MAX_VALUE; // O un valor predeterminado que represente la falta de conexión
            }
        }
        for (int i = 0; i < newSize; i++) {
            for (int j = currentTimeMatrix.length; j < newSize; j++) {
                newMatrix[i][j] = Long.MAX_VALUE; // O un valor predeterminado
            }
        }

        // Reemplazar la matriz antigua con la nueva
        currentTimeMatrix = newMatrix;

        // Expandir timeMatrix
        if (newSize > timeMatrix.length) {
            timeMatrix = expandMatrix(timeMatrix, newSize, Long.MAX_VALUE);
        }
    }

    /**
     * Expande una matriz existente a un nuevo tamaño con un valor predeterminado.
     *
     * @param originalMatrix La matriz original que se desea expandir.
     * @param newSize El nuevo tamaño de la matriz (debe ser mayor que el tamaño original).
     * @param defaultValue El valor predeterminado para rellenar las nuevas celdas.
     * @return Una nueva matriz expandida.
     */
    private long[][] expandMatrix(long[][] originalMatrix, int newSize, long defaultValue) {
        long[][] newMatrix = new long[newSize][newSize];

        // Copiar datos de la matriz existente a la nueva
        for (int i = 0; i < originalMatrix.length; i++) {
            System.arraycopy(originalMatrix[i], 0, newMatrix[i], 0, originalMatrix[i].length);
        }

        // Rellenar las nuevas filas con el valor predeterminado
        for (int i = originalMatrix.length; i < newSize; i++) {
            for (int j = 0; j < newSize; j++) {
                newMatrix[i][j] = defaultValue;
            }
        }

        // Rellenar las nuevas columnas con el valor predeterminado
        for (int i = 0; i < newSize; i++) {
            for (int j = originalMatrix.length; j < newSize; j++) {
                newMatrix[i][j] = defaultValue;
            }
        }

        return newMatrix;
    }

    public void addTemporaryLocationToMatrices(String temporaryUbigeo, String originUbigeo, long elapsedMinutes) {
        // Agregar el ubigeo temporal a las listas
        locationUbigeos.add(temporaryUbigeo);
        locationIndices.put(temporaryUbigeo, locationUbigeos.size() - 1);
        locationNames.add(temporaryUbigeo);
        actualizarMatrizConTramoTemporal(originUbigeo, temporaryUbigeo, elapsedMinutes);
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

    public static Map<String, List<WarehouseRouteRequest>> groupWarehouseRouteRequestsByOriginDestination(List<WarehouseRouteRequest> requests) {
        Map<String, List<WarehouseRouteRequest>> requestGroups = new HashMap<>();
        for (WarehouseRouteRequest request : requests) {
            String key = request.getOriginUbigeo() + "-" + request.getDestinationUbigeo();
            requestGroups.computeIfAbsent(key, k -> new ArrayList<>()).add(request);
        }
        return requestGroups;
    }

    public enum LocationType {
        ORIGIN,
        DESTINATION
    }

    /**
     * Construye la clave de la ruta usando origen y destino
     */
    public static String buildRouteKey(String origin, String destination) {
        return origin + "-" + destination;
    }

    /**
     * Agrega un vehículo a una ruta específica
     */
    private void addVehicleToRoute(
            Map<String, List<Vehicle>> groupedVehicles,
            String routeKey,
            Vehicle vehicle) {
        groupedVehicles.computeIfAbsent(routeKey, k -> new ArrayList<>()).add(vehicle);
    }

    private void assignReplacementVehicle(Vehicle replacementVehicle, Vehicle brokenVehicle, List<RouteSegment> routeToBreakdown, LocalDateTime currentTime) {
        // Imprimir los segmentos de la ruta antes de asignarla
        logger.info("Asignando ruta al vehículo de reemplazo: " + replacementVehicle.getCode());
        if (routeToBreakdown != null && !routeToBreakdown.isEmpty()) {
            StringBuilder routeLog = new StringBuilder("Segmentos de la ruta a asignar:\n");
            for (RouteSegment segment : routeToBreakdown) {
                routeLog.append(", Desde: ").append(segment.getFromUbigeo())
                        .append(", Hacia: ").append(segment.getToUbigeo())
                        .append(", Duración: ").append(segment.getDurationMinutes()).append(" minutos\n");
            }
            logger.info(routeLog.toString());
        } else {
            logger.warning("No se encontraron segmentos de ruta para asignar al vehículo de reemplazo.");
        }

        // Asignar la ruta desde el almacén al punto de avería
        replacementVehicle.setRoute(routeToBreakdown);
        replacementVehicle.startJourneyToBreakdown(currentTime, brokenVehicle.getCurrentLocationUbigeo());
        replacementVehicle.setEstado(Vehicle.EstadoVehiculo.EN_REEMPLAZO);
        replacementVehicle.setAvailable(false);

        // Almacenar una referencia al vehículo averiado que está siendo reemplazado
        replacementVehicle.setBrokenVehicleBeingReplaced(brokenVehicle);

        // Registrar la asignación
        logger.info(String.format("Vehículo %s iniciará ruta de reemplazo hacia el punto de avería del vehículo %s.", replacementVehicle.getCode(), brokenVehicle.getCode()));
    }

    private void assignReplacementVehiclesAtWarehouse(List<Vehicle> brokenVehiclesAtWarehouse) {
        // Lista para los vehículos cuyo proceso de reemplazo falló
        List<Vehicle> vehiclesFailedToReplace = new ArrayList<>();

        for (Vehicle brokenVehicle : brokenVehiclesAtWarehouse) {
            String warehouseUbigeo = brokenVehicle.getCurrentLocationUbigeo();
            logger.info(String.format("El vehículo averiado %s se encuentra en el almacén %s. Asignando vehículo directamente.", brokenVehicle.getCode(), warehouseUbigeo));

            Vehicle replacementVehicle = getAvailableVehicleAtWarehouse(warehouseUbigeo, brokenVehicle);

            if (replacementVehicle != null) {
                // Asignar vehículo de reemplazo sin necesidad de ruta
                assignReplacementVehicleAtSameLocation(replacementVehicle, brokenVehicle, getCurrentTime());
                logger.info(String.format("Vehículo %s asignado para reemplazar al vehículo averiado %s en el almacén %s.", replacementVehicle.getCode(), brokenVehicle.getCode(), warehouseUbigeo));
            } else {
                logger.warning(String.format("No hay vehículos disponibles en el almacén %s para reemplazar al vehículo %s.", warehouseUbigeo, brokenVehicle.getCode()));
                vehiclesFailedToReplace.add(brokenVehicle);
            }
        }

        // Resetear el indicador para los vehículos que no pudieron ser reemplazados
        for (Vehicle vehicle : vehiclesFailedToReplace) {
            vehicle.setReplacementProcessInitiated(false);
        }
    }

    private void assignReplacementVehicleAtSameLocation(Vehicle replacementVehicle, Vehicle brokenVehicle, LocalDateTime currentTime) {
        // Asignar la ruta desde el almacén al punto de avería
        replacementVehicle.setRoute(Collections.emptyList());
        replacementVehicle.startJourneyToBreakdown(currentTime, brokenVehicle.getCurrentLocationUbigeo());
        replacementVehicle.setEstado(Vehicle.EstadoVehiculo.EN_REEMPLAZO);
        replacementVehicle.setAvailable(false);

        // Almacenar una referencia al vehículo averiado que está siendo reemplazado
        replacementVehicle.setBrokenVehicleBeingReplaced(brokenVehicle);
    }


    private static class RouteResult {
        private List<RouteSegment> route;
        private final String destination;
        private final long time;

        public RouteResult(List<RouteSegment> route, String destination, long time) {
            this.route = route;
            this.destination = destination;
            this.time = time;
        }

        public List<RouteSegment> getRoute() {
            return route;
        }

        public void setRoute(List<RouteSegment> route) {
            this.route = route;
        }

        public String getDestination() {
            return destination;
        }

        public long getTime() {
            return time;
        }
    }

    private void initiateReturnToWarehouseProcess(List<Vehicle> vehicles) {
        // Obtener destinos únicos de las oficinas
        Set<String> destinationSet = new HashSet<>();
        for (Vehicle vehicle : vehicles) {
            destinationSet.add(vehicle.getCurrentLocationUbigeo());
        }
        String[] destinations = destinationSet.toArray(new String[0]);

        // Calcular las mejores rutas para cada destino
        RouteService routeService = new RouteService(getLocationIndices(), timeMatrix);
        Map<String, Route> bestRoutes = routeService.findBestRoutes(getAlmacenesPrincipales(), destinations);

        // Paso 5: Determinar el almacén más cercano para cada vehículo
        for (Vehicle vehicle : vehicles) {
            String currentUbigeo = vehicle.getCurrentLocationUbigeo();
            Route route = bestRoutes.get(currentUbigeo);

            if (route != null) {
                route.inverse();
                boolean assigned = assignVehicleToWarehouse(vehicle, route.getEndUbigeo(), route.getSegments());
                if (!assigned) {
                    vehicle.setRouteBeingCalculated(false);
                }
            } else {
                logger.warning("No se encontró almacén cercano para el vehículo " + vehicle.getCode());
                vehicle.setRouteBeingCalculated(false);
            }
        }
    }

    private boolean assignVehicleToWarehouse(Vehicle vehicle, String warehouseUbigeo, List<RouteSegment> route) {
        if (vehicle != null && warehouseUbigeo != null) {
            vehicle.setRoute(route);
            vehicle.startWarehouseJourney(getCurrentTime(), warehouseUbigeo);
            logger.info("Vehículo " + vehicle.getCode() + " asignado al almacén " + warehouseUbigeo);
            return true;
        }
        return false;
    }

    public static class RouteRequest {
        public final String start;
        public final String end;

        public RouteRequest(String start, String end) {
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

    public LocalDateTime getCurrentTime() {
        stateLock.lock();
        try {
            return currentTime;
        } finally {
            stateLock.unlock();
        }
    }

    public List<Vehicle> getVehicles() {
        return vehicles;
    }

    public List<VehicleAssignment> getVehicleAssignments(Integer id_OrderFound) {
        return vehicleAssignmentsPerOrder.get(id_OrderFound);
    }

    public JsonObject getCurrentVehiclesDataGeoJSON() {
        StringBuilder builder = stringBuilderPool.borrow();
        try {
            builder.append("{\"type\":\"FeatureCollection\",\"features\":[");

            List<String> features = vehicles
                    .parallelStream()
                    .map(vehicle -> {
                        Position position = vehicle.getCurrentPosition(getCurrentTime(), simulationType);
                        if (position != null) {
                            StringBuilder featureBuilder = new StringBuilder();
                            appendVehicleFullDataFeature(featureBuilder, vehicle, position);
                            return featureBuilder.toString();
                        }
                        return null; // Return null if position is null to filter later
                    })
                    .filter(Objects::nonNull) // Remove null features
                    .toList(); // Collect the valid features

            builder.append(String.join(",", features)); // Join all features with commas

            builder.append("],\"timestamp\":")
                    .append(System.currentTimeMillis())
                    .append("}");

            return JsonParser.parseString(builder.toString()).getAsJsonObject();
        } finally {
            stringBuilderPool.release(builder);
        }
    }

    private void appendVehicleFullDataFeature(StringBuilder builder, Vehicle vehicle, Position position) {

        builder.append("{\"type\":\"Feature\",\"properties\":{")
                .append("\"vehicleCode\":\"").append(vehicle.getCode()).append("\",")
                //.append("\"ubicacionActual\":\"").append(vehicle.getCurrentLocationUbigeo()).append("\",")
                //.append("\"ubicacionSiguiente\":\"").append(vehicle.getRoute() != null && !vehicle.getRoute().isEmpty() && vehicle.getCurrentSegmentIndex() < vehicle.getRoute().size()
                //        ? vehicle.getRoute().get(vehicle.getCurrentSegmentIndex()).getToUbigeo() : " ").append("\",")
                .append("\"ubicacionActual\":\"").append(locations.get(vehicle.getCurrentLocationUbigeo()).getProvince()).append("\",")
                .append("\"ubicacionSiguiente\":\"").append(vehicle.getRoute() != null && !vehicle.getRoute().isEmpty() && vehicle.getCurrentSegmentIndex() < vehicle.getRoute().size()
                        ? locations.get(vehicle.getRoute().get(vehicle.getCurrentSegmentIndex()).getToUbigeo()).getProvince() : " ").append("\",")
                .append("\"tipo\":\"").append(vehicle.getType()).append("\",")
                .append("\"capacidadUsada\":").append(vehicle.getCurrentCapacity()).append(",")
                .append("\"capacidadMaxima\":").append(vehicle.getCapacity()).append(",")
                .append("\"cantidadRutas\":").append(vehicle.getRoute()!=null?vehicle.getRoute().size():0).append(",")
                .append("\"status\":\"").append(vehicle.getEstado().toString()).append("\",")
                .append("\"velocidad\":").append(vehicle.getStatus() != null ? vehicle.getStatus().getCurrentSpeed() : 0).append(",");

        // Manejo de currentRoute
        builder.append("\"currentRoute\":[");
        StringBuilder routeContentBuilder = new StringBuilder();

        try {
            if (vehicle.getRoute() != null && !vehicle.getRoute().isEmpty()) {
                boolean isFirst = true;
                //boolean alreadyAttended = vehicle.getCurrentOrder()!=null;
                String currentUbigeo = "";
                if (vehicle.getStatus() != null)
                    currentUbigeo = vehicle.getStatus().getCurrentSegmentUbigeo();
                boolean traveled = true;
                boolean inTravel = false;

                for (RouteSegment routeSegment : vehicle.getRoute()) {
                    if (currentUbigeo.equals(routeSegment.getToUbigeo())) {
                        traveled = false;
                        inTravel = true;
                    }
                    if (!isFirst) {
                        routeContentBuilder.append(",");
                    }
                    else{
                        routeContentBuilder.append("{")
                                .append("\"city\":\"").append(locations.get(routeSegment.getFromUbigeo()).getProvince()).append("\",")
                                .append("\"status\":\"").append("Actual").append("\",")
                                .append("\"type\":\"").append(Arrays.asList(almacenesPrincipales).contains(routeSegment.getFromUbigeo())?"wareouse":"office").append("\",")
                                .append("\"coordinates\":[").append(locations.get(routeSegment.getFromUbigeo()).getLongitude()).append(", ").append(locations.get(routeSegment.getFromUbigeo()).getLatitude()).append("]")
                                .append("},");
                    }
                    routeContentBuilder.append("{")
                            .append("\"city\":\"").append(locations.get(routeSegment.getToUbigeo()).getProvince()).append("\",")
                            .append("\"status\":\"").append(traveled ? "Recorrido" : inTravel ? "Actual" : "Por Recorrer").append("\",")
                            .append("\"type\":\"").append(Arrays.asList(almacenesPrincipales).contains(routeSegment.getToUbigeo())?"wareouse":"office").append("\",")
                            .append("\"coordinates\":[").append(locations.get(routeSegment.getToUbigeo()).getLongitude()).append(", ").append(locations.get(routeSegment.getToUbigeo()).getLatitude()).append("]")
                            .append("}");

                    isFirst = false;
                    inTravel = false;
                }
            }
            else{
                routeContentBuilder.append("{")
                        .append("\"city\":\"").append(locations.get(vehicle.getCurrentLocationUbigeo()).getProvince()).append("\",")
                        .append("\"status\":\"").append("Actual").append("\",")
                        .append("\"type\":\"").append(Arrays.asList(almacenesPrincipales).contains(vehicle.getCurrentLocationUbigeo())?"wareouse":"office").append("\",")
                        .append("\"coordinates\":[").append(locations.get(vehicle.getCurrentLocationUbigeo()).getLongitude()).append(", ").append(locations.get(vehicle.getCurrentLocationUbigeo()).getLatitude()).append("]")
                        .append("}");
            }
            builder.append(routeContentBuilder);
        } catch (Exception e) {
            // En caso de error, dejamos el arreglo vacío
        }
        builder.append("],");

        builder.append("\"shipmentsVehicle\":[");
        StringBuilder shipmentsContentBuilder = new StringBuilder();

        try {
            List<VehicleAssignment> vehicleAssignmentPerVehicle = vehicleAssignmentsPerOrder.values().stream()  // Obtenemos todos los valores del mapa (List<VehicleAssignment>)
                    .flatMap(List::stream)
                    .filter(assignment -> assignment.getVehicle().getCode().equals(vehicle.getCode()))
                    .collect(Collectors.toList());

            if (vehicleAssignmentPerVehicle != null && !vehicleAssignmentPerVehicle.isEmpty()) {
                boolean isFirst = true;

                for (VehicleAssignment vehicleAssignment : vehicleAssignmentPerVehicle) {
                    if (!isFirst) {
                        shipmentsContentBuilder.append(",");
                    }

                    shipmentsContentBuilder.append("{")
                            .append("\"code\":\"").append(vehicleAssignment.getOrder().getOrderCode()).append("\",")
                            .append("\"quantity\":\"").append(vehicleAssignment.getAssignedQuantity()).append("\",")
                            .append("\"status\":\"").append(vehicleAssignment.getOrder().getStatus()).append("\",")
                            .append("\"originCity\":\"").append(locations.get(vehicleAssignment.getOrder().getOriginUbigeo()).getProvince()).append("\",")
                            .append("\"destinationCity\":\"").append(locations.get(vehicleAssignment.getOrder().getDestinationUbigeo()).getProvince()).append("\",")
                            .append("\"dueTime\":\"").append(vehicleAssignment.getOrder().getDueTime()).append("\"")
                            .append("}");
                    isFirst = false;
                }
            }
            builder.append(shipmentsContentBuilder);
        } catch (Exception e) {
            // En caso de error, dejamos el arreglo vacío
        }
        builder.append("]");

        builder.append("},");
        // Add the geometry (location)
        builder.append("\"geometry\":{\"type\":\"Point\",\"coordinates\":[")
                .append(position.getLongitude()).append(",")
                .append(position.getLatitude())
                .append("]}}");
    }
    

}
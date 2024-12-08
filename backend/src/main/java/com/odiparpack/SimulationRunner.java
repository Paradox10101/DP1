package com.odiparpack;

import com.google.gson.JsonObject;
import com.google.ortools.constraintsolver.*;
import com.google.protobuf.Duration;
import com.google.protobuf.*;
import com.odiparpack.Main.SolutionData;
import com.odiparpack.api.routers.SimulationRouter;
import com.odiparpack.models.*;
import com.odiparpack.tasks.*;
import com.odiparpack.websocket.ShipmentWebSocketHandler;
import com.odiparpack.websocket.VehicleWebSocketHandler;

import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.stream.Collectors;

import static com.odiparpack.Main.*;
import static com.odiparpack.Main.logger;
import static com.odiparpack.Utils.calculateDistanceFromNodes;
import static com.odiparpack.Utils.formatTime;
import static com.odiparpack.models.SimulationState.buildRouteKey;
import static com.odiparpack.models.SimulationState.groupRoutesWithoutRepetitions;

public class SimulationRunner {
    // Constantes para el manejo de threads
    private static final int CORE_MULTIPLIER = 2;
    private static final int MIN_THREADS = 4;
    private static final int MAX_THREADS = 16;

    // Pool centralizado de threads
    private static ExecutorService mainExecutorService;
    private static ScheduledExecutorService scheduledExecutorService;
    private static ScheduledExecutorService webSocketExecutorService;
    private static ForkJoinPool computeIntensiveExecutor;

    private static final Logger logger = Logger.getLogger(SimulationRunner.class.getName());
    private static final int SIMULATION_DAYS = 7;

    public static volatile int TIME_ADVANCEMENT_INTERVAL_MINUTES = 5; // Por defecto para semanal y colapso
    public static volatile int TIME_ADVANCEMENT_INTERVAL_SECONDS = 1; // Por defecto para diaria
    public static volatile int SIMULATION_SPEED = 5; // Por defecto para semanal y colapso
    private static final int PLANNING_INTERVAL_MINUTES = 15;

    public static ScheduledExecutorService simulationExecutorService;
    private static final int BROADCAST_INTERVAL = 1500; // ms

    public static ForkJoinPool getComputeIntensiveExecutor() {
        return computeIntensiveExecutor;
    }

    public static void setSimulationParameters(int timeAdvancementValue) {
        if (timeAdvancementValue <= 0) {
            throw new IllegalArgumentException("Los parámetros de simulación deben ser positivos.");
        }

        TIME_ADVANCEMENT_INTERVAL_MINUTES = timeAdvancementValue;
        logger.info("Configurada tiempo de avance de simulación: " + timeAdvancementValue);
    }

    public static void initializeExecutorServices() {
        int cores = Runtime.getRuntime().availableProcessors();
        int optimalThreads = Math.min(MAX_THREADS, Math.max(MIN_THREADS, cores * CORE_MULTIPLIER));
        ThreadFactory threadFactory = createThreadFactory();

        if (mainExecutorService == null || mainExecutorService.isShutdown()) {
            mainExecutorService = Executors.newFixedThreadPool(optimalThreads, threadFactory);
        }

        if (scheduledExecutorService == null || scheduledExecutorService.isShutdown()) {
            scheduledExecutorService = Executors.newScheduledThreadPool(cores, threadFactory);
        }

        if (webSocketExecutorService == null || webSocketExecutorService.isShutdown()) {
            webSocketExecutorService = Executors.newSingleThreadScheduledExecutor(threadFactory);
        }

        // Usar ForkJoinPool en lugar de FixedThreadPool para tareas intensivas en cómputo
        if (computeIntensiveExecutor == null || computeIntensiveExecutor.isShutdown()) {
            computeIntensiveExecutor = new ForkJoinPool(
                    Math.max(1, cores - 1),  // Número de hilos en función de los núcleos disponibles
                    ForkJoinPool.defaultForkJoinWorkerThreadFactory,
                    null,                    // Manejo de excepciones predeterminado
                    true                     // Activar el modo asíncrono para mejorar el rendimiento
            );
        }
    }

    public static void stopSimulation() {
        shutdown();
    }

    private static ThreadFactory createThreadFactory() {
        return new ThreadFactory() {
            private final AtomicInteger counter = new AtomicInteger();
            @Override
            public Thread newThread(Runnable r) {
                Thread t = new Thread(r, "simulation-thread-" + counter.incrementAndGet());
                t.setDaemon(true);
                return t;
            }
        };
    }

    // Método para verificar el estado de los executors
    public static boolean areExecutorsRunning() {
        return !(webSocketExecutorService.isShutdown() ||
                scheduledExecutorService.isShutdown() ||
                mainExecutorService.isShutdown() ||
                computeIntensiveExecutor.isShutdown());
    }

    // Para cambiar velocidad de avance del tiempo
    public enum SimulationSpeed {
        FAST(8),    // 8 min/seg
        MEDIUM(6),  // 6 min/seg
        SLOW(5);    // 5 min/seg

        private final int minutesPerSecond;

        SimulationSpeed(int minutesPerSecond) {
            this.minutesPerSecond = minutesPerSecond;
        }

        public int getMinutesPerSecond() {
            return minutesPerSecond;
        }
    }

    public static void setSimulationSpeed(SimulationSpeed speed) {
        // Calcular el nuevo intervalo de avance basado en la velocidad deseada
        // Para X minutos/segundo, necesitamos que cada tick avance X minutos
        TIME_ADVANCEMENT_INTERVAL_MINUTES = speed.getMinutesPerSecond();
        logger.info("Velocidad de simulación actualizada: " + speed.getMinutesPerSecond() + " minutos por segundo");
    }

    public static int getTimeAdvancementInterval() {
        return TIME_ADVANCEMENT_INTERVAL_MINUTES;
    }

    static {
        int cores = Runtime.getRuntime().availableProcessors();
        int optimalThreads = Math.min(MAX_THREADS,
                Math.max(MIN_THREADS, cores * CORE_MULTIPLIER));

        ThreadFactory threadFactory = new ThreadFactory() {
            private final AtomicInteger counter = new AtomicInteger();
            @Override
            public Thread newThread(Runnable r) {
                Thread t = new Thread(r, "simulation-thread-" + counter.incrementAndGet());
                t.setDaemon(true);  // Permite que la JVM termine si solo quedan threads daemon
                return t;
            }
        };

        mainExecutorService = Executors.newFixedThreadPool(optimalThreads, threadFactory);
        scheduledExecutorService = Executors.newScheduledThreadPool(
                cores,
                r -> {
                    Thread t = threadFactory.newThread(r);
                    t.setPriority(Thread.NORM_PRIORITY + 1);
                    return t;
                }
        );
        webSocketExecutorService = Executors.newSingleThreadScheduledExecutor(
                r -> {
                    Thread t = threadFactory.newThread(r);
                    t.setPriority(Thread.NORM_PRIORITY + 1);
                    return t;
                }
        );
        computeIntensiveExecutor = new ForkJoinPool(
                Math.max(1, cores - 1),
                ForkJoinPool.defaultForkJoinWorkerThreadFactory,
                null,
                true  // Usar modo asíncrono para mejorar el rendimiento en tareas recursivas
        );
    }

    public static void runSimulation(SimulationState state) throws InterruptedException {
        // Obtener los datos necesarios del estado de simulación
        long[][] timeMatrix = state.getCurrentTimeMatrix();
        List<Order> allOrders = state.getOrders();
        Map<String, Integer> locationIndices = state.getLocationIndices();
        List<String> locationNames = state.getLocationNames();
        List<String> locationUbigeos = state.getLocationUbigeos();

        //LocalDateTime endTime = state.getCurrentTime().plusDays(SIMULATION_DAYS);
        AtomicBoolean isSimulationRunning = new AtomicBoolean(true);
        Map<String, List<RouteSegment>> vehicleRoutes = new ConcurrentHashMap<>();

        try {
            // Iniciar broadcasts
            scheduleWebSocketVehicleBroadcast(state, isSimulationRunning);
            scheduleWebSocketShipmentBroadcast(state, isSimulationRunning);

            // Programar tareas principales
            Future<?> timeAdvancement = scheduleTimeAdvancement(
                    state, isSimulationRunning, vehicleRoutes);
            Future<?> planning = schedulePlanning(
                    state, isSimulationRunning, vehicleRoutes);

            // Monitoreo principal
            while (!state.isStopped() && isSimulationRunning.get()) {
                if (state.isPaused()) {
                    Thread.sleep(1000);
                    continue;
                }
                Thread.sleep(1000);
            }
        } finally {
            shutdown();
        }
    }

    private static void shutdown() {
        // Crear lista solo con executors no nulos
        List<ExecutorService> executors = new ArrayList<>();

        if (mainExecutorService != null) executors.add(mainExecutorService);
        if (scheduledExecutorService != null) executors.add(scheduledExecutorService);
        if (webSocketExecutorService != null) executors.add(webSocketExecutorService);
        if (computeIntensiveExecutor != null) executors.add(computeIntensiveExecutor);

        for (ExecutorService executor : executors) {
            executor.shutdown();
            try {
                if (!executor.awaitTermination(5, TimeUnit.SECONDS)) {
                    executor.shutdownNow();
                }
            } catch (InterruptedException e) {
                executor.shutdownNow();
                Thread.currentThread().interrupt();
            }
        }

        // Registrar el estado antes de nullificar
        logger.info("Estado de shutdown - " +
                "Main: " + (mainExecutorService != null) + ", " +
                "Scheduled: " + (scheduledExecutorService != null) + ", " +
                "WebSocket: " + (webSocketExecutorService != null) + ", " +
                "Compute: " + (computeIntensiveExecutor != null));

        // Set executor services to null
        mainExecutorService = null;
        scheduledExecutorService = null;
        webSocketExecutorService = null;
        computeIntensiveExecutor = null;
    }

    public static void stopWebSocketBroadcast() {
        if (webSocketExecutorService != null && !webSocketExecutorService.isShutdown()) {
            webSocketExecutorService.shutdownNow();
            webSocketExecutorService = null;
        }
    }

    private static void scheduleWebSocketVehicleBroadcast(SimulationState state, AtomicBoolean isSimulationRunning) {
        ScheduledFuture<?> future = webSocketExecutorService.scheduleAtFixedRate(
                new WebSocketVehicleBroadcastTask(state, isSimulationRunning),
                0, BROADCAST_INTERVAL, TimeUnit.MILLISECONDS
        );
    }

    private static void scheduleWebSocketShipmentBroadcast(SimulationState state, AtomicBoolean isSimulationRunning) {
        ScheduledFuture<?> future = webSocketExecutorService.scheduleAtFixedRate(
                new WebSocketShipmentBroadcastTask(state, isSimulationRunning),
                0, BROADCAST_INTERVAL, TimeUnit.MILLISECONDS
        );
    }

    private static Future<?> scheduleTimeAdvancement(
            SimulationState state,
            AtomicBoolean isSimulationRunning,
            Map<String, List<RouteSegment>> vehicleRoutes) {

        Runnable task;
        long intervalMillis;

        // Determinar si es una simulación diaria o no
        boolean isDaily = state.getSimulationType() == SimulationRouter.SimulationType.DAILY;
        intervalMillis = 1000L; // 1 segundo real
        task = new TimeAdvancementTask(state, isSimulationRunning, vehicleRoutes, isDaily);

        return scheduledExecutorService.scheduleAtFixedRate(
                task,
                0,
                intervalMillis,
                TimeUnit.MILLISECONDS
        );
         /* Runnable task = () -> {
            try {
                if (!state.isPaused() && !state.isStopped()) {
                    // Determinar el intervalo de tiempo según el tipo de simulación
                    java.time.Duration timeAdvance;
                    if (state.getSimulationType() == SimulationRouter.SimulationType.DAILY) {
                        timeAdvance = java.time.Duration.ofSeconds(TIME_ADVANCEMENT_INTERVAL_SECONDS);
                    } else {
                        timeAdvance = java.time.Duration.ofMinutes(TIME_ADVANCEMENT_INTERVAL_MINUTES);
                    }

                    state.updateSimulationTime(timeAdvance);

                    // Si es simulación de colapso y se detectó uno, detener
                    if (state.getSimulationType() == SimulationRouter.SimulationType.COLLAPSE &&
                            state.checkCapacityCollapse() || state.checkLogisticCollapse()) {
                        isSimulationRunning.set(false);
                        state.stopSimulation();
                    }
                }
            } catch (Exception e) {
                logger.log(Level.SEVERE, "Error en time advancement task", e);
            }
        };

        return scheduledExecutorService.scheduleAtFixedRate(
                task,
                0,
                1000L, // 1 segundo real
                TimeUnit.MILLISECONDS);*/
    }

    private static Future<?> schedulePlanning(
            SimulationState state,
            AtomicBoolean isSimulationRunning,
            Map<String, List<RouteSegment>> vehicleRoutes) {

        return scheduledExecutorService.scheduleAtFixedRate(
                new PlanificadorTask(state, isSimulationRunning, vehicleRoutes),
                0, PLANNING_INTERVAL_MINUTES * 200, // cada 3 segundos
                TimeUnit.MILLISECONDS
        );
    }

    /* Obtiene ordenes disponibles y las ordena por tiempo limite y fecha de registro */
    public static List<Order> getAvailableOrders(List<Order> allOrders, LocalDateTime currentTime) {
        return allOrders.stream()
                .filter(order -> (order.getStatus() == Order.OrderStatus.REGISTERED
                        || order.getStatus() == Order.OrderStatus.PARTIALLY_ASSIGNED
                        || order.getStatus() == Order.OrderStatus.PARTIALLY_ARRIVED)
                        && !order.getOrderTime().isAfter(currentTime))
                .sorted(Comparator
                        .comparing((Order order) -> order.getDueTime().isBefore(currentTime) ? 0 : 1) // Prioridad a las vencidas
                        .thenComparing(Order::getDueTime)  // Ordenar por dueTime (más cercano primero)
                        .thenComparing(Order::getOrderTime)) // Si dueTime es igual, ordenar por registro
                .collect(Collectors.toList());
    }

    public static void logAvailableOrders(List<Order> availableOrders) {
        logger.info("Órdenes disponibles: " + availableOrders.size());
        for (Order order : availableOrders) {
            logger.info("Orden " + order.getId() + " - Paquetes restantes sin asignar: " + order.getUnassignedPackages());
        }
    }

    public static List<VehicleAssignment> assignOrdersToVehicles(List<Order> orders, List<Vehicle> vehicles,
                                                                 LocalDateTime currentTime, SimulationState state) {
        List<VehicleAssignment> assignments = new ArrayList<>();

        // Agrupar órdenes por destino para optimizar acceso
        Map<String, List<Order>> ordersByDestination = orders.stream()
                .filter(order -> order.getStatus() == Order.OrderStatus.REGISTERED ||
                        order.getStatus() == Order.OrderStatus.PARTIALLY_ASSIGNED ||
                        order.getStatus() == Order.OrderStatus.PARTIALLY_ARRIVED)
                .filter(order -> order.getUnassignedPackages() > 0)
                .collect(Collectors.groupingBy(Order::getDestinationUbigeo));

        for (Order order : orders) {
            // Filtrado de órdenes válidas
            if (order.getStatus() != Order.OrderStatus.REGISTERED &&
                    order.getStatus() != Order.OrderStatus.PARTIALLY_ASSIGNED &&
                    order.getStatus() != Order.OrderStatus.PARTIALLY_ARRIVED) {
                logger.info("Orden " + order.getId() + " no está en estado REGISTERED, PARTIALLY_ASSIGNED o PARTIALLY_ARRIVED. Se omite.");
                continue;
            }

            int unassignedPackages = order.getUnassignedPackages();
            if (unassignedPackages <= 0) {
                continue; // No hay paquetes por asignar
            }

            // Obtener y ordenar vehículos disponibles
            List<Vehicle> availableVehicles = getAvailableVehicles(vehicles, order.getOriginUbigeo()).stream()
                    .sorted(Comparator.comparingInt(Vehicle::getCapacity).reversed()) // Ordenar por capacidad descendente
                    .collect(Collectors.toList());

            if (availableVehicles.isEmpty()) {
                logger.info("No hay vehículos disponibles en " + order.getOriginUbigeo() + " para la orden " + order.getId());
                continue;
            }

            for (Vehicle vehicle : availableVehicles) {
                if (unassignedPackages <= 0) {
                    break; // No hay más paquetes que asignar
                }

                synchronized (vehicle) { // Sincronizar acceso al vehículo
                    if (vehicle.getCapacity() >= unassignedPackages) {
                        // Asignación completa
                        assignments.add(new VehicleAssignment(vehicle, order, unassignedPackages));
                        vehicle.setCurrentCapacity(vehicle.getCurrentCapacity() + unassignedPackages);
                        vehicle.setAvailable(false);
                        vehicle.setEstado(Vehicle.EstadoVehiculo.ORDENES_CARGADAS);
                        order.incrementAssignedPackages(unassignedPackages); // Actualización completa

                        // Log de asignación
                        String logMessage = String.format(
                                "\n--- Asignación Completa ---\n" +
                                        "Código de la Orden: %d\n" +
                                        "Cantidad Total de la Orden: %d paquetes\n" +
                                        "Cantidad Asignada al Vehículo: %d paquetes\n" +
                                        "Código del Vehículo: %s\n" +
                                        "Capacidad Actual del Vehículo: %d / %d\n" +
                                        "---------------------------",
                                order.getId(),
                                order.getQuantity(),
                                unassignedPackages,
                                vehicle.getCode(),
                                vehicle.getCurrentCapacity(),
                                vehicle.getCapacity()
                        );

                        // Actualizar métricas de estado de manera sincronizada
                        synchronized (state) {
                            state.updateCapacityMetrics(unassignedPackages, vehicle.getCapacity());
                            state.assignOrdersCount();
                            String destinationCity = order.getDestinationCity();
                            state.guardarCiudadDestino(destinationCity);
                            state.registrarParadaEnAlmacen(order.getOriginUbigeo());
                            state.asignarPedidoAlmacenCount(order.getDestinationUbigeo());
                        }

                        logger.info(logMessage);

                        unassignedPackages = 0;
                    } else if (vehicle.getCapacity() > 0) {
                        // Asignación parcial
                        int assignedQuantity = Math.min(vehicle.getCapacity(), unassignedPackages); // Limitar a paquetes restantes
                        assignments.add(new VehicleAssignment(vehicle, order, assignedQuantity));
                        vehicle.setAvailable(false);
                        vehicle.setEstado(Vehicle.EstadoVehiculo.ORDENES_CARGADAS);
                        order.incrementAssignedPackages(assignedQuantity); // Actualización parcial

                        // Log de asignación parcial
                        String logMessage = String.format(
                                "\n--- Asignación Parcial ---\n" +
                                        "Código de la Orden: %d\n" +
                                        "Cantidad Total de la Orden: %d paquetes\n" +
                                        "Cantidad Asignada al Vehículo: %d paquetes\n" +
                                        "Código del Vehículo: %s\n" +
                                        "---------------------------",
                                order.getId(),
                                order.getQuantity(),
                                assignedQuantity,
                                vehicle.getCode()
                        );
                        logger.info(logMessage);

                        unassignedPackages -= assignedQuantity;
                    }
                }
            }

            // Actualizar el estado de la orden fuera del bloque sincronizado para minimizar el tiempo de bloqueo
            synchronized (order) {
                if (unassignedPackages > 0) {
                    order.setStatus(Order.OrderStatus.PARTIALLY_ASSIGNED);
                    logger.warning("Quedan " + unassignedPackages + " paquetes por asignar para la orden " + order.getId());
                } else {
                    order.setStatus(Order.OrderStatus.FULLY_ASSIGNED);
                    logger.info("Orden " + order.getId() + " completamente asignada.");
                }
            }
        }

        return assignments;
    }


    private static List<Vehicle> getAvailableVehicles(List<Vehicle> vehicles, String locationUbigeo) {
        // Loguear el origen del ubigeo de la orden antes del filtrado
        //logger.info(String.format("Ubigeo de origen de la orden: %s", locationUbigeo));

        return vehicles.stream()
                //.peek(v -> logger.info(String.format("Ubigeo actual del vehículo %s: %s", v.getCode(), v.getCurrentLocationUbigeo())))
                .filter(v -> v.getEstado() == Vehicle.EstadoVehiculo.EN_ALMACEN && v.getCurrentLocationUbigeo().equals(locationUbigeo))
                .collect(Collectors.toList());
    }

    /*public static void calculateAndApplyRoutes(long[][] currentTimeMatrix,
                                               List<VehicleAssignment> assignments,
                                               Map<String, Integer> locationIndices,
                                               List<String> locationNames,
                                               List<String> locationUbigeos,
                                               Map<String, List<RouteSegment>> vehicleRoutes,
                                               SimulationState state) {
        if (locationIndices == null || locationIndices.isEmpty()) {
            logger.severe("locationIndices no está inicializado.");
            return;
        }

        Map<String, List<VehicleAssignment>> assignmentGroups = groupAssignmentsByOriginDestination(assignments);
        List<VehicleAssignment> filteredAssignments = new ArrayList<>();
        for (List<VehicleAssignment> group : assignmentGroups.values()) {
            filteredAssignments.add(group.get(0));
        }

        DataModel data = new DataModel(currentTimeMatrix, state.getActiveBlockages(),
                filteredAssignments, locationIndices,
                locationNames, locationUbigeos);

        // Crear la tarea recursiva
        CalculateRoutesTask task = new CalculateRoutesTask(data, state, assignmentGroups, vehicleRoutes);

        // Ejecutar la tarea en el ForkJoinPool
        ForkJoinTask<?> forkJoinTask = computeIntensiveExecutor.submit(task);

        // Programar la cancelación si excede el tiempo límite
        ScheduledFuture<?> timeoutFuture = scheduledExecutorService.schedule(() -> {
            if (!forkJoinTask.isDone()) {
                logger.warning("Cálculo de rutas excedió tiempo máximo de 240 segundos");
                forkJoinTask.cancel(true);
            }
        }, 240, TimeUnit.SECONDS);

        try {
            // Esperar a que la tarea termine
            forkJoinTask.get();
        } catch (CancellationException e) {
            logger.warning("Cálculo de rutas fue cancelado");
        } catch (InterruptedException | ExecutionException e) {
            logger.log(Level.SEVERE, "Error en cálculo de rutas", e);
        } finally {
            timeoutFuture.cancel(false); // Cancelar la tarea de timeout si ya no es necesaria
        }
    }*/

    public static void processOrdersWithUnknownOrigin(List<Order> orders, SimulationState state, List<Blockage> blockages) {
        // Paso 1: Crear todas las posibles rutas entre oficinas y almacenes
        List<String> warehouses = state.getAlmacenesPrincipales(); // Lista de ubigeos de almacenes

        List<String> destinationPoints = orders.stream()
                .map(Order::getDestinationUbigeo)
                .distinct()
                .collect(Collectors.toList());

        List<SimulationState.RouteRequest> allPossibleRoutes = new ArrayList<>();

        for (String office : destinationPoints) {
            for (String warehouse : warehouses) {
                if (!office.equals(warehouse)) {
                    allPossibleRoutes.add(new SimulationState.RouteRequest(warehouse, office)); // start - end
                }
            }
        }

        // Paso 2: Crear grupos sin repeticiones de origen y destino
        List<List<SimulationState.RouteRequest>> routeGroups = groupRoutesWithoutRepetitions(allPossibleRoutes);

        // Paso 4: Calcular rutas en paralelo para cada grupo
        Map<String, List<RouteSegment>> allCalculatedRoutes = state.calculateRoutesInParallel(routeGroups, blockages, 7);

        logger.info("Rutas para ventas proyectadas terminadas de calcular.");

        // Lista para las órdenes cuyo proceso de asignación falló
        //List<Order> ordersFailedProcess = new ArrayList<>();

        // Paso 5: Determinar el almacén más cercano para cada orden
        for (Order order : orders) {
            String destinationUbigeo = order.getDestinationUbigeo();
            String nearestWarehouse = state.findNearestWarehouse(warehouses, destinationUbigeo, allCalculatedRoutes);
            if (nearestWarehouse != null) {
                order.setOriginUbigeo(nearestWarehouse);
                logger.info("Orden " + order.getId() + ": Se asignó almacén más cercano " + nearestWarehouse + " como origen.");
            } else {
                logger.warning("Orden " + order.getId() + ": No se pudo determinar almacén más cercano.");
                //ordersFailedProcess.add(order);
            }
        }
    }

    public static void calculateAndApplyRoutes(
            long[][] currentTimeMatrix,
            List<VehicleAssignment> assignments,
            Map<String, Integer> locationIndices,
            List<String> locationNames,
            List<String> locationUbigeos,
            Map<String, List<RouteSegment>> vehicleRoutes,
            SimulationState state,
            List<Blockage> blockages) {

        if (assignments == null || assignments.isEmpty()) {
            logger.warning("No hay asignaciones para procesar.");
            return;
        }

        // Agrupar asignaciones por origen-destino
        Map<String, List<VehicleAssignment>> assignmentGroups = groupAssignmentsByOriginDestination(assignments);
        List<VehicleAssignment> filteredAssignments = new ArrayList<>();
        for (List<VehicleAssignment> group : assignmentGroups.values()) {
            filteredAssignments.add(group.get(0));
        }

        // Verificar si las rutas están en caché antes de intentar resolverlas
        Map<String, List<RouteSegment>> cachedRoutes = new HashMap<>();
        List<VehicleAssignment> assignmentsToSolve = new ArrayList<>();

        for (VehicleAssignment va : filteredAssignments) {
            String originUbigeo = va.getOrder().getOriginUbigeo();
            String destinationUbigeo = va.getOrder().getDestinationUbigeo();

            // Intentar obtener la ruta desde el caché
            List<RouteSegment> cachedRoute = state.getRouteCache().getRoute(originUbigeo, destinationUbigeo, blockages);
            if (cachedRoute != null) {
                cachedRoutes.put(va.getVehicle().getCode(), cachedRoute);
            } else {
                logger.info("MON - La orden " + va.getOrder().getId() + "(" + va.getOrder().getOriginUbigeo() + "-"
                        + va.getOrder().getDestinationUbigeo() + ") no se encuentra ruta en caché.");
                assignmentsToSolve.add(va);
            }
        }

        if (!cachedRoutes.isEmpty()) {
            applyRoutesToVehiclesWithGroups(cachedRoutes, assignmentGroups, state);
            vehicleRoutes.putAll(cachedRoutes);
        }

        // Actualizar filteredAssignments para incluir solo las asignaciones que necesitan ser resueltas
        filteredAssignments = assignmentsToSolve;

        if (!filteredAssignments.isEmpty()) {
            // Crear el DataModel para las asignaciones que necesitan ser resueltas
            DataModel data = new DataModel(currentTimeMatrix, blockages,
                    filteredAssignments, locationIndices,
                    locationNames, locationUbigeos);

            // Intentar resolver todas las rutas juntas
            Map<String, List<RouteSegment>> routes = trySolvingWithStrategies(data, Arrays.asList(
                    FirstSolutionStrategy.Value.CHRISTOFIDES,
                    FirstSolutionStrategy.Value.PATH_CHEAPEST_ARC,
                    FirstSolutionStrategy.Value.GLOBAL_CHEAPEST_ARC
            ));

            if (routes != null && !routes.isEmpty()) {
                // Asignar las rutas a los vehículos
                applyRoutesToVehiclesWithGroups(routes, assignmentGroups, state);
                vehicleRoutes.putAll(routes);
            } else {
                // Si no se pudo resolver, proceder a agrupar y calcular en paralelo

                // Obtener las rutas únicas a calcular
                List<SimulationState.RouteRequest> uniqueRoutes = new ArrayList<>();
                Set<String> processedRoutes = new HashSet<>();

                for (String key : assignmentGroups.keySet()) {
                    String[] parts = key.split("-");
                    String origin = parts[0];
                    String destination = parts[1];
                    if (!processedRoutes.contains(key)) {
                        uniqueRoutes.add(new SimulationState.RouteRequest(origin, destination));
                        processedRoutes.add(key);
                    }
                }

                // Verificar si las rutas únicas están en caché
                Map<String, List<RouteSegment>> cachedRoutes2 = new HashMap<>();
                List<SimulationState.RouteRequest> routesToCalculate = new ArrayList<>();

                for (SimulationState.RouteRequest routeRequest : uniqueRoutes) {
                    List<RouteSegment> cachedRoute = state.getRouteCache().getRoute(
                            routeRequest.start, routeRequest.end, blockages);
                    if (cachedRoute != null) {
                        String routeKey = buildRouteKey(routeRequest.start, routeRequest.end);
                        cachedRoutes2.put(routeKey, cachedRoute);
                    } else {
                        routesToCalculate.add(routeRequest);
                    }
                }

                // Si hay rutas que no están en caché, agruparlas sin repeticiones de origen y destino
                Map<String, List<RouteSegment>> calculatedRoutes = new HashMap<>();
                if (!routesToCalculate.isEmpty()) {
                    // Agrupar rutas sin repeticiones de origen y destino
                    List<List<SimulationState.RouteRequest>> routeGroups = groupRoutesWithoutRepetitions(routesToCalculate);

                    // Calcular rutas en paralelo
                    calculatedRoutes = state.calculateRoutesInParallel(routeGroups, blockages, 7);
                }

                // Combinar rutas en caché y rutas calculadas
                Map<String, List<RouteSegment>> allRoutes = new HashMap<>();
                allRoutes.putAll(cachedRoutes2);
                allRoutes.putAll(calculatedRoutes);

                if (!allRoutes.isEmpty()) {
                    // Asignar las rutas a los vehículos
                    applyRoutesToVehiclesWithGroups(allRoutes, assignmentGroups, state);
                    vehicleRoutes.putAll(allRoutes);
                } else {
                    logger.warning("No se pudieron obtener rutas para las asignaciones.");
                }
            }
        }
    }

    /*public static void calculateAndApplyRoutes(long[][] currentTimeMatrix, List<VehicleAssignment> assignments,
                                               Map<String, Integer> locationIndices, List<String> locationNames,
                                               List<String> locationUbigeos, Map<String, List<RouteSegment>> vehicleRoutes,
                                               SimulationState state, ExecutorService executorService) {
        if (locationIndices == null || locationIndices.isEmpty()) {
            logger.severe("locationIndices no está inicializado.");
            return;
        }

        // Filtrar asignaciones por destino único
        Map<String, List<VehicleAssignment>> assignmentGroups = groupAssignmentsByOriginDestination(assignments);

        // Crear las asignaciones filtradas
        List<VehicleAssignment> filteredAssignments = new ArrayList<>();
        for (List<VehicleAssignment> group : assignmentGroups.values()) {
            filteredAssignments.add(group.get(0)); // Tomar una asignación por grupo
        }

        // Crear el modelo de datos con las asignaciones filtradas
        DataModel data = new DataModel(currentTimeMatrix, state.getActiveBlockages(), filteredAssignments, locationIndices, locationNames, locationUbigeos);

        executorService.submit(() -> {
            try {
                Map<String, List<RouteSegment>> newRoutes = calculateRouteWithStrategies(data, state, assignmentGroups);
                vehicleRoutes.putAll(newRoutes);
                logger.info("Nuevas rutas calculadas y agregadas en tiempo de simulación: " + state.getCurrentTime());
            } catch (Exception e) {
                logger.log(Level.SEVERE, "Error durante el cálculo de rutas", e);
            }
        });
    }*/

    public static Map<String, List<RouteSegment>> calculateRouteWithStrategies(DataModel data, SimulationState state) {
        logger.info("\n--- Inicio del cálculo de rutas con estrategias ---");
        Map<String, List<RouteSegment>> allRoutes = new HashMap<>();
        try {
            // Intentar resolver con las estrategias definidas
            Map<String, List<RouteSegment>> routes = trySolvingWithStrategies(data, Arrays.asList(
                    FirstSolutionStrategy.Value.CHRISTOFIDES,
                    FirstSolutionStrategy.Value.PATH_CHEAPEST_ARC
            ));

            if (routes != null && !routes.isEmpty()) {
                allRoutes.putAll(routes);
            } else {
                // Si no se encuentra solución, dividir y resolver
                List<SolutionData> solutions = Collections.synchronizedList(new ArrayList<>());

                // Crear una tarea para `divideAndSolve`
                ForkJoinTask<?> task = computeIntensiveExecutor.submit(() ->
                        divideAndSolve(state, data.assignments, Arrays.asList(
                                FirstSolutionStrategy.Value.CHRISTOFIDES,
                                FirstSolutionStrategy.Value.PATH_CHEAPEST_ARC
                        ), solutions, computeIntensiveExecutor)
                );

                // Programar timeout si es necesario
                ScheduledFuture<?> timeoutFuture = scheduledExecutorService.schedule(() -> {
                    if (!task.isDone()) {
                        logger.warning("divideAndSolve excedió tiempo máximo");
                        task.cancel(true);
                    }
                }, 240, TimeUnit.SECONDS);

                try {
                    task.get();
                } catch (CancellationException e) {
                    logger.warning("divideAndSolve fue cancelado");
                } catch (InterruptedException | ExecutionException e) {
                    logger.log(Level.SEVERE, "Error en divideAndSolve", e);
                } finally {
                    timeoutFuture.cancel(false);
                }

                // Combinar soluciones
                for (SolutionData solutionData : solutions) {
                    allRoutes.putAll(solutionData.routes);
                }
            }

            return allRoutes;
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Error durante el cálculo de rutas con estrategias.", e);
            return allRoutes;
        } finally {
            logger.info("--- Fin del cálculo de rutas con estrategias ---\n");
        }
    }


    private static Map<String, List<RouteSegment>> trySolvingWithStrategies(DataModel data, List<FirstSolutionStrategy.Value> strategies) {
        for (FirstSolutionStrategy.Value strategy : strategies) {
            try {
                RoutingIndexManager manager = createRoutingIndexManager(data, data.starts, data.ends);
                RoutingModel routing = createRoutingModel(manager, data);
                RoutingSearchParameters searchParameters = Main.createSearchParameters(strategy, 7);

                logger.info("Intentando resolver con estrategia: " + strategy);
                Assignment solution = routing.solveWithParameters(searchParameters);

                if (solution != null) {
                    logger.info("Solución encontrada con estrategia: " + strategy);
                    Map<String, List<RouteSegment>> routes = extractCalculatedRoutes(data.activeBlockages, manager, data, data.assignments, routing, solution);
                    return routes;
                } else {
                    logger.info("No se encontró solución con estrategia: " + strategy);
                }
            } catch (Exception e) {
                logger.log(Level.SEVERE, "Error al resolver con estrategia: " + strategy, e);
            }
        }
        return null; // No se encontró solución con las estrategias dadas
    }

    /*public static void divideAndSolve(SimulationState state, List<VehicleAssignment> assignments, List<FirstSolutionStrategy.Value> strategies, List<Main.SolutionData> solutions) {
        if (assignments == null || strategies == null || solutions == null) {
            throw new IllegalArgumentException("Los argumentos no pueden ser nulos.");
        }

        ExecutorService executor = Executors.newFixedThreadPool(Runtime.getRuntime().availableProcessors());
        int maxDepth = 10;
        try {
            Future<?> future = executor.submit(() ->
                    processSubset(state, assignments, strategies, solutions, executor, 0, maxDepth)
            );

            future.get();

        } catch (InterruptedException | ExecutionException e) {
            logger.log(Level.SEVERE, "Error en la ejecución del proceso de resolución.", e);
        } finally {
            executor.shutdown();
            try {
                if (!executor.awaitTermination(60, TimeUnit.SECONDS)) {
                    executor.shutdownNow();
                }
            } catch (InterruptedException e) {
                executor.shutdownNow();
            }
        }
    }*/

    public static void divideAndSolve(SimulationState state, List<VehicleAssignment> assignments,
                                      List<FirstSolutionStrategy.Value> strategies, List<SolutionData> solutions,
                                      ForkJoinPool forkJoinPool) {
        if (assignments == null || strategies == null || solutions == null) {
            throw new IllegalArgumentException("Los argumentos no pueden ser nulos.");
        }

        int maxDepth = 10;

        forkJoinPool.invoke(new ProcessSubsetTask(state, assignments, strategies, solutions, 0, maxDepth));
    }


    private static void processSubset(SimulationState state, List<VehicleAssignment> subset,
                                      List<FirstSolutionStrategy.Value> strategies,
                                      List<SolutionData> solutions,
                                      ExecutorService executor,
                                      int depth,
                                      int maxDepth) {
        if (depth > maxDepth) {
            logger.warning("Profundidad máxima alcanzada. Deteniendo la división de subconjuntos.");
            return;
        }

        if (subset.size() <= 1) {
            logger.info("No se puede dividir más. Pedido conflictivo detectado.");
            return;
        }

        for (FirstSolutionStrategy.Value strategy : strategies) {
            logger.info("Intentando resolver subconjunto con estrategia: " + strategy);

            RoutingResult result = solveSubset(state, subset, strategy);

            if (result != null && result.solution != null) {
                logger.info("Solución encontrada para el subconjunto con estrategia: " + strategy);

                // Crear una instancia de SolutionData con los resultados obtenidos
                SolutionData solutionData = new SolutionData(result.solution, result.routingModel, result.manager, result.data, state.getActiveBlockages());
                solutions.add(solutionData);

                return;
            } else {
                logger.info("No se encontró solución para el subconjunto con estrategia: " + strategy);
            }
        }

        // Si ninguna estrategia resolvió el subconjunto, dividirlo nuevamente
        logger.info("Todas las estrategias fallaron para el subconjunto. Dividiendo nuevamente...");

        int mid = subset.size() / 2;
        List<VehicleAssignment> firstHalf = new ArrayList<>(subset.subList(0, mid));
        List<VehicleAssignment> secondHalf = new ArrayList<>(subset.subList(mid, subset.size()));

        // Procesar cada mitad de manera concurrente
        Future<?> futureFirst = executor.submit(() ->
                processSubset(state, firstHalf, strategies, solutions, executor, depth + 1, maxDepth)
        );

        Future<?> futureSecond = executor.submit(() ->
                processSubset(state, secondHalf, strategies, solutions, executor, depth + 1, maxDepth)
        );

        try {
            // Esperar a que ambas mitades se procesen
            futureFirst.get();
            futureSecond.get();
        } catch (InterruptedException | ExecutionException e) {
            logger.log(Level.SEVERE, "Error al procesar los subconjuntos divididos.", e);
        }
    }

    private static RoutingResult solveSubset(SimulationState state, List<VehicleAssignment> subset, FirstSolutionStrategy.Value strategy) {
        try {
            DataModel data = new DataModel(state.getCurrentTimeMatrix(), new ArrayList<>(), subset, locationIndices, locationNames, locationUbigeos);
            RoutingIndexManager manager = createRoutingIndexManager(data, data.starts, data.ends);
            RoutingModel routing = createRoutingModel(manager, data);
            RoutingSearchParameters searchParameters = Main.createSearchParameters(strategy);

            Assignment solution = routing.solveWithParameters(searchParameters);

            if (solution != null) {
                logger.info("Solución encontrada para el subconjunto con estrategia: " + strategy);
                return new RoutingResult(solution, routing, manager, data);
            } else {
                logger.info("No se encontró solución para el subconjunto con estrategia: " + strategy);
                return null;
            }
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Error al resolver el subconjunto con estrategia: " + strategy, e);
            return null;
        }
    }


    public static void applyRoutesToVehiclesWithGroups(Map<String, List<RouteSegment>> allRoutes, Map<String, List<VehicleAssignment>> assignmentGroups, SimulationState state) {
        for (String key : assignmentGroups.keySet()) {
            List<VehicleAssignment> group = assignmentGroups.get(key);
            VehicleAssignment representativeAssignment = group.get(0);
            Vehicle representativeVehicle = representativeAssignment.getVehicle();
            List<RouteSegment> route = allRoutes.get(representativeVehicle.getCode());

            if (route != null) {
                for (VehicleAssignment assignment : group) {
                    Vehicle vehicle = assignment.getVehicle();
                    vehicle.setRoute(route);
                    if (state != null) {
                        vehicle.startJourney(state.getCurrentTime(), assignment.getOrder(),state);
                    }
                    vehicle.setEstado(Vehicle.EstadoVehiculo.EN_TRANSITO_ORDEN); // otra vez
                    System.out.println(vehicle.getRoute());
                    logger.info("Vehículo " + vehicle.getCode() + " iniciando viaje a " + assignment.getOrder().getDestinationUbigeo() + " estado: " + vehicle.getEstado());
                }
            } else {
                logger.warning("No se encontró ruta para el grupo con origen-destino " + key);
            }
        }
    }

    public static Map<String, List<VehicleAssignment>> groupAssignmentsByOriginDestination(List<VehicleAssignment> assignments) {
        Map<String, List<VehicleAssignment>> assignmentGroups = new HashMap<>();
        for (VehicleAssignment assignment : assignments) {
            String key = assignment.getVehicle().getCurrentLocationUbigeo() + "-" + assignment.getOrder().getDestinationUbigeo();
            assignmentGroups.computeIfAbsent(key, k -> new ArrayList<>()).add(assignment);
        }
        return assignmentGroups;
    }

    public static Map<String, List<RouteSegment>> calculateRoute(DataModel data, int[] start, int[] end, SimulationState state) {
        logger.info("\n--- Inicio del cálculo de rutas ---");
        Map<String, List<RouteSegment>> allRoutes = new HashMap<>();

        try {
            Map<String, List<RouteSegment>> cachedRoutes = getCachedRoutes(data, start, end);
            allRoutes.putAll(cachedRoutes);

            if (cachedRoutes.size() < data.vehicleNumber) {
                logger.info("Se necesitan calcular rutas adicionales. Rutas en caché: " + cachedRoutes.size() + ", Vehículos totales: " + data.vehicleNumber);
                Map<String, List<RouteSegment>> calculatedRoutes = calculateMissingRoutes(data, start, end, cachedRoutes); // y almacena en cache
                allRoutes.putAll(calculatedRoutes);
                //updateRouteCache(data, start, end, calculatedRoutes);
            } else {
                logger.info("Todas las rutas fueron encontradas en caché.");
                logAllCachedRoutes(cachedRoutes);
            }

            applyRoutesToVehicles(data, allRoutes, state);

            return allRoutes;
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Error durante el cálculo de rutas.", e);
            return allRoutes;
        } finally {
            logger.info("--- Fin del cálculo de rutas ---\n");
        }
    }

    private static Map<String, List<RouteSegment>> getCachedRoutes(DataModel data, int[] start, int[] end) {
        Map<String, List<RouteSegment>> cachedRoutes = new HashMap<>();
        for (int i = 0; i < data.vehicleNumber; i++) {
            String fromUbigeo = data.locationUbigeos.get(start[i]);
            String toUbigeo = data.locationUbigeos.get(end[i]);
            String vehicleCode = data.assignments.get(i).getVehicle().getCode();

            List<RouteSegment> cachedRoute = routeCache.getRoute(fromUbigeo, toUbigeo, data.activeBlockages);
            if (cachedRoute != null) {
                cachedRoutes.put(vehicleCode, cachedRoute);
                logCachedRoute(vehicleCode, fromUbigeo, toUbigeo, cachedRoute);
            } else {
                logger.info("Ruta no encontrada en caché para vehículo " + vehicleCode + ": " + fromUbigeo + " -> " + toUbigeo);
            }
        }
        return cachedRoutes;
    }

    private static void logCachedRoute(String vehicleCode, String fromUbigeo, String toUbigeo, List<RouteSegment> route) {
        StringBuilder logBuilder = new StringBuilder();
        logBuilder.append("\n--- Ruta encontrada en caché ---\n");
        logBuilder.append("Código del Vehículo: ").append(vehicleCode).append("\n");
        logBuilder.append("Origen (Ubigeo): ").append(fromUbigeo).append("\n");
        logBuilder.append("Destino (Ubigeo): ").append(toUbigeo).append("\n");
        logBuilder.append("Segmentos de la ruta:\n");
        double totalDuration = 0;
        for (int i = 0; i < route.size(); i++) {
            RouteSegment segment = route.get(i);
            totalDuration += segment.getDurationMinutes();
            logBuilder.append("  ").append(i + 1).append(". ")
                    .append("Nombre: ").append(segment.getName())
                    .append(", Ubigeo: ").append(segment.getUbigeo())
                    .append(", Distancia: ").append(segment.getDistance()).append(" km")
                    .append(", Duración: ").append(segment.getDurationMinutes()).append(" minutos\n");
        }
        logBuilder.append("Duración total de la ruta: ").append(totalDuration).append(" minutos\n");
        logBuilder.append("-----------------------------");
        logger.info(logBuilder.toString());
    }

    private static Map<String, List<RouteSegment>> calculateMissingRoutes(DataModel data, int[] start, int[] end,
                                                                          Map<String, List<RouteSegment>> existingRoutes) {
        // Crear una nueva DataModel solo con las rutas que faltan
        DataModel missingData = createMissingDataModel(data, start, end, existingRoutes);
        RoutingIndexManager manager = createRoutingIndexManager(missingData, missingData.starts, missingData.ends);
        RoutingModel routing = createRoutingModel(manager, missingData);
        RoutingSearchParameters searchParameters = createSearchParameters();

        logger.info("Verifiquemos otra vez el tramo LUYA - BONGARA");
        missingData.printTravelTime("010501", "010301");

        logger.info("Iniciando la resolución del modelo de rutas para rutas faltantes.");
        Assignment solution = routing.solveWithParameters(searchParameters);
        logger.info("Solución de rutas obtenida para rutas faltantes.");

        if (solution != null) {
            Map<String, List<RouteSegment>> calculatedRoutes = extractCalculatedRoutes(data.activeBlockages, manager, missingData, missingData.assignments, routing, solution);
            //Map<String, List<RouteSegment>> calculatedRoutes = applyRouteToVehicles(manager, missingData, missingData.assignments, routing, solution, state);
            printSolution(missingData, routing, manager, solution);
            logger.info("Solución de rutas faltantes impresa correctamente.");
            return calculatedRoutes;
        } else {
            logger.warning("No se encontró solución para las rutas faltantes.");
            return new HashMap<>();
        }
    }

    private static Map<String, List<RouteSegment>> extractCalculatedRoutes(List<Blockage> activeBlockages, RoutingIndexManager manager, DataModel data,
                                                                           List<VehicleAssignment> assignments,
                                                                           RoutingModel routing, Assignment solution) {
        Map<String, List<RouteSegment>> calculatedRoutes = new HashMap<>();
        for (int i = 0; i < assignments.size(); ++i) {
            VehicleAssignment assignment = assignments.get(i);
            Vehicle vehicle = assignment.getVehicle();

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


            calculatedRoutes.put(vehicle.getCode(), route);

            // Añadir la ruta calculada al caché
            routeCache.putRoute(data.locationUbigeos.get(data.starts[i]),
                    data.locationUbigeos.get(data.ends[i]),
                    route,
                    activeBlockages);

            logger.info("Ruta calculada para el vehículo " + vehicle.getCode() + " con " + route.size() + " segmentos.");
        }
        return calculatedRoutes;
    }

    public static RoutingSearchParameters createSearchParameters() {
        RoutingSearchParameters searchParameters = main.defaultRoutingSearchParameters()
                .toBuilder()
                .setFirstSolutionStrategy(FirstSolutionStrategy.Value.CHRISTOFIDES)
                .setLocalSearchMetaheuristic(LocalSearchMetaheuristic.Value.GUIDED_LOCAL_SEARCH)
                .setTimeLimit(Duration.newBuilder().setSeconds(10).build())
                //.setLogSearch(true)  // Habilitar "verbose logging"
                .build();
        logger.info("Parámetros de búsqueda configurados.");
        return searchParameters;
    }

    public static RoutingModel createRoutingModel(RoutingIndexManager manager, DataModel data) {
        RoutingModel routing = new RoutingModel(manager);
        logger.info("RoutingModel creado.");

        final int transitCallbackIndex = routing.registerTransitCallback((long fromIndex, long toIndex) -> {
            int fromNode = manager.indexToNode(fromIndex);
            int toNode = manager.indexToNode(toIndex);
            return data.timeMatrix[fromNode][toNode];
        });
        logger.info("Callback de tránsito registrado: " + transitCallbackIndex);

        routing.setArcCostEvaluatorOfAllVehicles(transitCallbackIndex);
        logger.info("Evaluador de costo de arco establecido para todos los vehículos.");

        routing.addDimension(transitCallbackIndex, 0, Integer.MAX_VALUE, true, "Time");
        logger.info("Dimensión 'Time' agregada.");

        RoutingDimension timeDimension = routing.getMutableDimension("Time");
        timeDimension.setGlobalSpanCostCoefficient(100);
        logger.info("Coeficiente de costo global de 'Time' establecido.");

        addSoftPenalties(routing, manager, data);

        return routing;
    }

    private static void addSoftPenalties(RoutingModel routing, RoutingIndexManager manager, DataModel data) {
        for (int i = 0; i < data.timeMatrix.length; i++) {
            if (!isStartOrEndNode(i, data.starts, data.ends)) {
                routing.addDisjunction(new long[]{manager.nodeToIndex(i)}, 100);
            }
        }
    }

    private static boolean isStartOrEndNode(int node, int[] starts, int[] ends) {
        for (int i = 0; i < starts.length; i++) {
            if (node == starts[i] || node == ends[i]) {
                return true;
            }
        }
        return false;
    }

    public static RoutingIndexManager createRoutingIndexManager(DataModel data, int[] start, int[] end) {
        RoutingIndexManager manager = new RoutingIndexManager(
                data.timeMatrix.length,
                data.vehicleNumber,
                start,
                end);
        logger.info("RoutingIndexManager creado.");
        return manager;
    }

    private static void logAllCachedRoutes(Map<String, List<RouteSegment>> cachedRoutes) {
        logger.info("\n--- Rutas encontradas en caché ---");
        for (Map.Entry<String, List<RouteSegment>> entry : cachedRoutes.entrySet()) {
            String vehicleCode = entry.getKey();
            List<RouteSegment> route = entry.getValue();
            logger.info("Vehículo " + vehicleCode + ":");
            for (int i = 0; i < route.size(); i++) {
                RouteSegment segment = route.get(i);
                logger.info(String.format("  Segmento %d: %s -> %s, Duración: %d minutos, Distancia: %.2f km",
                        i + 1, segment.getName().split(" to ")[0], segment.getName().split(" to ")[1],
                        segment.getDurationMinutes(), segment.getDistance()));
            }
        }
        logger.info("-------------------------------");
    }

    private static void applyRoutesToVehicles(DataModel data, Map<String, List<RouteSegment>> allRoutes, SimulationState state) {
        for (VehicleAssignment assignment : data.assignments) {
            Vehicle vehicle = assignment.getVehicle();
            List<RouteSegment> route = allRoutes.get(vehicle.getCode());
            if (route != null) {
                vehicle.setRoute(route);
                if (state != null) {
                    vehicle.startJourney(state.getCurrentTime(), assignment.getOrder(),state);
                }
                logger.info("Vehículo " + vehicle.getCode() + " iniciando viaje a " + assignment.getOrder().getDestinationUbigeo());
            } else {
                logger.warning("No se encontró ruta para el vehículo " + vehicle.getCode());
            }
        }
    }

    public static DataModel createMissingDataModel(DataModel originalData, int[] start, int[] end, Map<String, List<RouteSegment>> existingRoutes) {
        List<VehicleAssignment> missingAssignments = new ArrayList<>();
        List<Integer> missingStarts = new ArrayList<>();
        List<Integer> missingEnds = new ArrayList<>();

        for (int i = 0; i < originalData.vehicleNumber; i++) {
            String vehicleCode = originalData.assignments.get(i).getVehicle().getCode();
            if (!existingRoutes.containsKey(vehicleCode)) {
                missingAssignments.add(originalData.assignments.get(i));
                missingStarts.add(start[i]);
                missingEnds.add(end[i]);
            }
        }

        int[] newStarts = missingStarts.stream().mapToInt(Integer::intValue).toArray();
        int[] newEnds = missingEnds.stream().mapToInt(Integer::intValue).toArray();

        logger.info("Verifiquemos el valor del tramo LUYA - BONGARA");
        return new DataModel(
                originalData.timeMatrix,
                originalData.activeBlockages,
                missingAssignments,
                locationIndices,
                originalData.locationNames,
                originalData.locationUbigeos
        );
    }

    // Esto un test

    public static void printSolution(
            DataModel data, RoutingModel routing, RoutingIndexManager manager, Assignment solution) {
        // Objetivo de la solución.
        logger.info("Objetivo de la Solución: " + solution.objectiveValue());

        // Inspeccionar la solución.
        long maxRouteTime = 0;
        long localTotalTime = 0;  // Variable local para almacenar el tiempo total de esta solución

        for (int i = 0; i < data.vehicleNumber; ++i) {
            long index = routing.start(i);
            logger.info("\n--- Ruta para el Vehículo " + i + " ---");
            long routeTime = 0;
            StringBuilder routeBuilder = new StringBuilder();
            int routeStep = 1;
            while (!routing.isEnd(index)) {
                long previousIndex = index;
                index = solution.value(routing.nextVar(index));

                int fromNode = manager.indexToNode(previousIndex);
                int toNode = manager.indexToNode(index);

                String fromLocationName = data.locationNames.get(fromNode);
                String fromLocationUbigeo = data.locationUbigeos.get(fromNode);
                String toLocationName = data.locationNames.get(toNode);
                String toLocationUbigeo = data.locationUbigeos.get(toNode);

                long arcCost = routing.getArcCostForVehicle(previousIndex, index, i);
                long dimCost = solution.min(routing.getMutableDimension("Time").cumulVar(index)) -
                        solution.min(routing.getMutableDimension("Time").cumulVar(previousIndex));
                long matrixTime = data.timeMatrix[fromNode][toNode];

                routeTime += matrixTime;

                // Formatear el tiempo de duración
                String formattedDuration = formatTime(matrixTime);

                routeBuilder.append(String.format(
                        "%d. De %s (%s) a %s (%s): %s\n",
                        routeStep,
                        fromLocationName, fromLocationUbigeo,
                        toLocationName, toLocationUbigeo,
                        formattedDuration
                ));

                routeStep++;
            }

            logger.info(routeBuilder.toString());
            logger.info("Tiempo total de la ruta: " + formatTime(routeTime));
            maxRouteTime = Math.max(routeTime, maxRouteTime);
            localTotalTime += routeTime;
        }
        logger.info("Máximo tiempo de las rutas: " + formatTime(maxRouteTime));
    }
}

package com.odiparpack;

import com.google.gson.JsonObject;
import com.google.ortools.constraintsolver.*;
import com.google.protobuf.Duration;
import com.odiparpack.models.*;
import com.odiparpack.tasks.PlanificadorTask;
import com.odiparpack.tasks.TimeAdvancementTask;
import com.odiparpack.tasks.WebSocketShipmentBroadcastTask;
import com.odiparpack.tasks.WebSocketVehicleBroadcastTask;
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
import static com.odiparpack.Utils.calculateDistanceFromNodes;
import static com.odiparpack.Utils.formatTime;

public class SimulationRunner {
    // Constantes para el manejo de threads
    private static final int CORE_MULTIPLIER = 2;
    private static final int MIN_THREADS = 4;
    private static final int MAX_THREADS = 16;

    // Pool centralizado de threads
    private static ExecutorService mainExecutorService;
    private static ScheduledExecutorService scheduledExecutorService;
    private static ScheduledExecutorService webSocketExecutorService;
    private static ExecutorService computeIntensiveExecutor;

    private static final Logger logger = Logger.getLogger(SimulationRunner.class.getName());
    private static final int SIMULATION_DAYS = 7;
    private static final int SIMULATION_SPEED = 10; // 1 minuto de simulación = 1 segundo de tiempo real
    private static final int PLANNING_INTERVAL_MINUTES = 15;
    public static int TIME_ADVANCEMENT_INTERVAL_MINUTES = 5;
    public static ScheduledExecutorService simulationExecutorService;
    private static final int BROADCAST_INTERVAL = 500; // 100ms = 10 updates/segundo

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

        if (computeIntensiveExecutor == null || computeIntensiveExecutor.isShutdown()) {
            computeIntensiveExecutor = Executors.newFixedThreadPool(Math.max(1, cores - 1), threadFactory);
        }
    }

    public static void pauseSimulation() {
        /*List<ExecutorService> executors = Arrays.asList(
                scheduledExecutorService,
                webSocketExecutorService
        );

        for (ExecutorService executor : executors) {
            if (executor instanceof ScheduledExecutorService) {
                // Para servicios programados, cancelar tareas futuras pero permitir que las actuales terminen
                ((ScheduledExecutorService) executor).shutdown();
            }
        }*/
    }

    public static void resumeSimulation() {
        /*// Reiniciar los servicios si es necesario
        if (webSocketExecutorService == null || webSocketExecutorService.isShutdown()) {
            webSocketExecutorService = Executors.newSingleThreadScheduledExecutor(createThreadFactory());
        }
        if (scheduledExecutorService == null || scheduledExecutorService.isShutdown()) {
            scheduledExecutorService = Executors.newScheduledThreadPool(
                    Runtime.getRuntime().availableProcessors(),
                    createThreadFactory()
            );
        }*/
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
        computeIntensiveExecutor = Executors.newFixedThreadPool(
                Math.max(1, cores - 1),
                r -> {
                    Thread t = threadFactory.newThread(r);
                    t.setName("compute-intensive-" + t.getName());
                    t.setPriority(Thread.MIN_PRIORITY);
                    return t;
                }
        );
    }

    public static void runSimulation(SimulationState state) throws InterruptedException {
        // Obtener los datos necesarios del estado de simulación
        long[][] timeMatrix = state.getCurrentTimeMatrix();
        List<Order> allOrders = state.getOrders();
        Map<String, Integer> locationIndices = state.getLocationIndices();
        List<String> locationNames = state.getLocationNames();
        List<String> locationUbigeos = state.getLocationUbigeos();

        LocalDateTime endTime = state.getCurrentTime().plusDays(SIMULATION_DAYS);
        AtomicBoolean isSimulationRunning = new AtomicBoolean(true);
        Map<String, List<RouteSegment>> vehicleRoutes = new ConcurrentHashMap<>();

        try {
            // Iniciar broadcasts
            scheduleWebSocketVehicleBroadcast(state, isSimulationRunning);
            scheduleWebSocketShipmentBroadcast(state, isSimulationRunning);

            // Programar tareas principales
            Future<?> timeAdvancement = scheduleTimeAdvancement(
                    state, endTime, isSimulationRunning, vehicleRoutes);
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

    /*private static void scheduleWebSocketShipmentBroadcast(SimulationState state, AtomicBoolean isSimulationRunning) {
        webSocketExecutorService.scheduleAtFixedRate(() -> {
            try {
                if (state.isPaused() || state.isStopped()) return;

                // Broadcast shipment list via WebSocket
                ShipmentWebSocketHandler.broadcastShipments();

            } catch (Exception e) {
                logger.log(Level.SEVERE, "Error in WebSocket broadcast task", e);
            }
        }, 0, 1000, TimeUnit.MILLISECONDS);
    }*/

    /*private static void scheduleTimeAdvancement(SimulationState state, LocalDateTime endTime,
                                                AtomicBoolean isSimulationRunning,
                                                Map<String, List<RouteSegment>> vehicleRoutes,
                                                ScheduledExecutorService executorService) {
        executorService.scheduleAtFixedRate(() -> {
            try {
                // Si está pausado, esperar
                if (state.isPaused()) {
                    return;
                }

                if (!isSimulationRunning.get() || state.isStopped()) {
                    return;
                }

                state.updateSimulationTime();
                LocalDateTime currentTime = state.getCurrentTime();

                // Verificar si ha pasado un día completo

                long hours = state.calculateIntervalTime();
                if (hours != 0 && hours % 24 == 0) {
                    // Llamar al método para guardar los pedidos del día actual
                    state.guardarPedidosDiarios();
                }
                // Actualizar estado de la simulación
                state.updateBlockages(currentTime, state.getAllBlockages());
                state.updateVehicleStates();
                state.updateOrderStatuses();

                if (currentTime.isAfter(endTime)) {
                    logger.info("Simulación completada.");
                    isSimulationRunning.set(false);
                    state.stopSimulation();
                }
            } catch (Exception e) {
                logger.log(Level.SEVERE, "Error en la tarea de avance del tiempo", e);
            }
        }, 0, TIME_ADVANCEMENT_INTERVAL_MINUTES * 1000L / SIMULATION_SPEED, TimeUnit.MILLISECONDS);
    }*/

    private static Future<?> scheduleTimeAdvancement(
            SimulationState state,
            LocalDateTime endTime,
            AtomicBoolean isSimulationRunning,
            Map<String, List<RouteSegment>> vehicleRoutes) {

        return scheduledExecutorService.scheduleAtFixedRate(
                new TimeAdvancementTask(state, endTime, isSimulationRunning, vehicleRoutes),
                0, TIME_ADVANCEMENT_INTERVAL_MINUTES * 1000L / SIMULATION_SPEED,
                TimeUnit.MILLISECONDS
        );
    }

    private static Future<?> schedulePlanning(
            SimulationState state,
            AtomicBoolean isSimulationRunning,
            Map<String, List<RouteSegment>> vehicleRoutes) {

        return scheduledExecutorService.scheduleAtFixedRate(
                new PlanificadorTask(state, isSimulationRunning, vehicleRoutes),
                0, PLANNING_INTERVAL_MINUTES * 1000L / SIMULATION_SPEED,
                TimeUnit.MILLISECONDS
        );
    }

    /*private static void schedulePlanning(SimulationState state, List<Order> allOrders,
                                         Map<String, Integer> locationIndices, List<String> locationNames,
                                         List<String> locationUbigeos, Map<String, List<RouteSegment>> vehicleRoutes,
                                         ScheduledExecutorService executorService, AtomicBoolean isSimulationRunning) {
        executorService.scheduleAtFixedRate(() -> {
            if (!isSimulationRunning.get() || state.isPaused() || state.isStopped()) return;

            logger.info("Iniciando algoritmo de planificación en tiempo de simulación: " + state.getCurrentTime());

            try {
                long[][] currentTimeMatrix = state.getCurrentTimeMatrix();
                List<Order> availableOrders = getAvailableOrders(allOrders, state.getCurrentTime());
                logAvailableOrders(availableOrders);

                if (!availableOrders.isEmpty()) {
                    List<VehicleAssignment> assignments = assignOrdersToVehicles(availableOrders, new ArrayList<>(state.getVehicles().values()), state.getCurrentTime(), state);
                    if (!assignments.isEmpty()) {
                        calculateAndApplyRoutes(currentTimeMatrix, assignments, locationIndices, locationNames,
                                locationUbigeos, vehicleRoutes, state, executorService);
                    }
                }
            } catch (Exception e) {
                logger.log(Level.SEVERE, "Error en el ciclo de planificación", e);
            }
        }, 0, PLANNING_INTERVAL_MINUTES * 1000L / SIMULATION_SPEED, TimeUnit.MILLISECONDS);
    }*/

    public static List<Order> getAvailableOrders(List<Order> allOrders, LocalDateTime currentTime) {
        return allOrders.stream()
                .filter(order -> (order.getStatus() == Order.OrderStatus.REGISTERED
                        || order.getStatus() == Order.OrderStatus.PARTIALLY_ASSIGNED
                        || order.getStatus() == Order.OrderStatus.PARTIALLY_ARRIVED)
                        && !order.getOrderTime().isAfter(currentTime))
                .collect(Collectors.toList());
    }

    public static void logAvailableOrders(List<Order> availableOrders) {
        logger.info("Órdenes disponibles: " + availableOrders.size());
        for (Order order : availableOrders) {
            logger.info("Orden " + order.getId() + " - Paquetes restantes sin asignar: " + order.getUnassignedPackages());
        }
    }

    public static List<VehicleAssignment> assignOrdersToVehicles(List<Order> orders, List<Vehicle> vehicles, LocalDateTime currentTime, SimulationState state) {
        List<VehicleAssignment> assignments = new ArrayList<>();

        // Ordenar los pedidos por dueTime (los más urgentes primero)
        orders.sort(Comparator.comparing(Order::getDueTime));

        for (Order order : orders) {
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

                if (vehicle.getCapacity() >= unassignedPackages) {
                    // El vehículo puede satisfacer completamente la orden
                    assignments.add(new VehicleAssignment(vehicle, order, unassignedPackages));
                    vehicle.setCurrentCapacity(vehicle.getCurrentCapacity()  + unassignedPackages);
                    vehicle.setAvailable(false);
                    vehicle.setEstado(Vehicle.EstadoVehiculo.ORDENES_CARGADAS);
                    order.incrementAssignedPackages(unassignedPackages); // Actualización completa

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

                    // Actualizar la métrica de capacidad efectiva acumulada
                    state.updateCapacityMetrics(unassignedPackages, vehicle.getCapacity());

                    //AQUI CREO QUE ES <------------------------------- OJITO
                    state.assignOrdersCount();

                    //Aqui se procesa el pedido para sacar su ubigeo
                    String destinationCity = order.getDestinationCity();

                    // Actualizar el contador en el mapa
                    state.guardarCiudadDestino(destinationCity);

                    state.registrarParadaEnAlmacen(order.getOriginUbigeo()); //se analiza el ubigeo origen del pedido

                    //Llamar para contar que se está haciendo un pedido en tal Region
                    state.asignarPedidoAlmacenCount(order.getDestinationUbigeo());

                    //state.calcularEficienciaPedido(vehicle.getCode(),vehicle.getEstimatedDeliveryTime(),order.getOrderTime());// AQUI YA NO PIPIPI

                    logger.info(logMessage);

                    //order.setAssignedPackages(unassignedPackages);
                    unassignedPackages = 0;
                    break;
                } else if (vehicle.getCapacity() > 0) {
                    // El vehículo puede satisfacer parcialmente la orden
                    int assignedQuantity = Math.min(vehicle.getCapacity(), unassignedPackages); // Limitar a paquetes restantes
                    assignments.add(new VehicleAssignment(vehicle, order, assignedQuantity));
                    vehicle.setAvailable(false);
                    vehicle.setEstado(Vehicle.EstadoVehiculo.ORDENES_CARGADAS);
                    order.incrementAssignedPackages(assignedQuantity); // Actualización parcial

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

            if (unassignedPackages > 0) {
                order.setStatus(Order.OrderStatus.PARTIALLY_ASSIGNED);
                logger.warning("Quedan " + unassignedPackages + " paquetes por asignar para la orden " + order.getId());
            } else {
                order.setStatus(Order.OrderStatus.FULLY_ASSIGNED);
                logger.info("Orden " + order.getId() + " completamente asignada.");
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

    public static void calculateAndApplyRoutes(long[][] currentTimeMatrix,
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

        // Usar computeIntensiveExecutor en lugar de executorService
        Future<?> calculation = computeIntensiveExecutor.submit(() -> {
            try {
                Map<String, List<RouteSegment>> newRoutes = calculateRouteWithStrategies(data, state);
                // Asignar rutas a todos los vehículos en los grupos correspondientes
                applyRoutesToVehiclesWithGroups(newRoutes, assignmentGroups, state);
                vehicleRoutes.putAll(newRoutes);

                logger.info("Nuevas rutas calculadas y agregadas en tiempo de simulación: " + state.getCurrentTime());
            } catch (Exception e) {
                logger.log(Level.SEVERE, "Error durante el cálculo de rutas", e);
            }
        });

        // Opcional: Esperar con timeout
        try {
            calculation.get(240, TimeUnit.SECONDS);
        } catch (TimeoutException e) {
            logger.warning("Cálculo de rutas excedió tiempo máximo de 120 segundos");
            calculation.cancel(true);
        } catch (InterruptedException | ExecutionException e) {
            logger.log(Level.SEVERE, "Error en cálculo de rutas", e);
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
                divideAndSolve(state, data.assignments, Arrays.asList(
                        FirstSolutionStrategy.Value.CHRISTOFIDES,
                        FirstSolutionStrategy.Value.PATH_CHEAPEST_ARC
                ), solutions);

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
                RoutingSearchParameters searchParameters = Main.createSearchParameters(strategy);

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

    public static void divideAndSolve(SimulationState state, List<VehicleAssignment> assignments, List<FirstSolutionStrategy.Value> strategies, List<Main.SolutionData> solutions) {
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


    private static void applyRoutesToVehiclesWithGroups(Map<String, List<RouteSegment>> allRoutes, Map<String, List<VehicleAssignment>> assignmentGroups, SimulationState state) {
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
                    System.out.println(vehicle.getRoute());

                    logger.info("Vehículo " + vehicle.getCode() + " iniciando viaje a " + assignment.getOrder().getDestinationUbigeo());
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

                /*route.append(String.format(
                        "%d. De %s (%s) a %s (%s): %s\n",
                        routeStep,
                        fromLocationName, fromLocationUbigeo,
                        toLocationName, toLocationUbigeo,
                        formatTime(matrixTime)
                ));*/
                /*logger.info(String.format("  ArcCost: %d, DimCost: %d, MatrixTime: %d",
                        arcCost, dimCost, matrixTime));*/

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
        //totalDeliveryTime = localTotalTime;
    }
}

package com.odiparpack;

import com.google.ortools.constraintsolver.*;
import com.google.protobuf.Duration;
import com.odiparpack.api.routers.SimulationRouter;
import com.odiparpack.models.*;
import com.odiparpack.scheduler.PlanificadorScheduler;
import com.odiparpack.services.LocationService;
import com.odiparpack.tasks.*;

import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.logging.Logger;
import java.util.stream.Collectors;

import static com.odiparpack.Main.*;
import static com.odiparpack.Utils.formatTime;

public class SimulationRunner {
    // Constantes para el manejo de threads
    private static final int CORE_MULTIPLIER = 2;
    private static final int MIN_THREADS = 4;
    private static final int MAX_THREADS = 16;
    private static volatile int PLANNING_PERIOD_SECONDS = 10; // valor por defecto 10 segundos

    // Pool centralizado de threads
    private static ExecutorService mainExecutorService;
    private static ScheduledExecutorService scheduledExecutorService;
    private static ScheduledExecutorService webSocketExecutorService;
    private static ForkJoinPool computeIntensiveExecutor;

    private static final Logger logger = Logger.getLogger(SimulationRunner.class.getName());

    public static volatile int TIME_ADVANCEMENT_INTERVAL_MINUTES = 5; // Por defecto para semanal y colapso
    public static volatile int TIME_ADVANCEMENT_INTERVAL_SECONDS = 1; // Por defecto para diaria

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

    public static void setPlanningPeriod(int seconds) {
        PLANNING_PERIOD_SECONDS = seconds;
        logger.info("Período de planificación actualizado: " + seconds + " segundos");
    }

    public static int getPlanningPeriod() {
        return PLANNING_PERIOD_SECONDS;
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
        AtomicBoolean isSimulationRunning = new AtomicBoolean(true);
        final Object pauseLock = new Object();

        try {
            // Iniciar broadcasts
            scheduleWebSocketVehicleBroadcast(state, isSimulationRunning);
            scheduleWebSocketShipmentBroadcast(state, isSimulationRunning);
            scheduleWebSocketRouteBroadcast(state, isSimulationRunning);

            // Inicializar el PlanificadorScheduler
            PlanificadorScheduler.initialize(scheduledExecutorService);

            // Iniciar el planificador automático
            PlanificadorScheduler.start(state, isSimulationRunning);

            // Programar tareas principales
            Future<?> timeAdvancement = scheduleTimeAdvancement(
                    state, isSimulationRunning);

            // Monitoreo principal usando condition variable
            while (!state.isStopped() && isSimulationRunning.get()) {
                synchronized (pauseLock) {
                    while (state.isPaused()) {
                        pauseLock.wait();
                    }
                }
                Thread.sleep(100);
            }
        } finally {
            PlanificadorScheduler.stop();
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

    private static void scheduleWebSocketRouteBroadcast(SimulationState state, AtomicBoolean isSimulationRunning) {
        ScheduledFuture<?> future = webSocketExecutorService.scheduleAtFixedRate(
                new WebSocketRouteBroadcastTask(state, isSimulationRunning),
                0, BROADCAST_INTERVAL, TimeUnit.MILLISECONDS
        );
    }

    private static Future<?> scheduleTimeAdvancement(
            SimulationState state,
            AtomicBoolean isSimulationRunning) {

        Runnable task;
        long intervalMillis;

        // Determinar si es una simulación diaria o no
        boolean isDaily = state.getSimulationType() == SimulationRouter.SimulationType.DAILY;
        intervalMillis = 1000L; // 1 segundo real
        task = new TimeAdvancementTask(state, isSimulationRunning, isDaily);

        return scheduledExecutorService.scheduleAtFixedRate(
                task,
                0,
                intervalMillis,
                TimeUnit.MILLISECONDS
        );
    }

    /* Obtiene ordenes disponibles y las ordena por tiempo limite y fecha de registro */
    public static List<Order> getAvailableOrders(List<Order> allOrders, LocalDateTime currentTime) {
        // Preallocate con tamaño aproximado para evitar resizing
        List<Order> availableOrders = new ArrayList<>(allOrders.size());

        // Evitar stream y hacer filtrado directo
        for (Order order : allOrders) {
            if (isOrderAvailable(order, currentTime)) {
                availableOrders.add(order);
            }
        }

        // Ordenar una sola vez después de filtrar
        Collections.sort(availableOrders,
                Comparator
                        .comparing((Order order) -> order.getDueTime().isBefore(currentTime) ? 0 : 1)
                        .thenComparing(Order::getDueTime)
                        .thenComparing(Order::getOrderTime)
        );

        return availableOrders;
    }

    private static boolean isOrderAvailable(Order order, LocalDateTime currentTime) {
        // Verificar si el ubigeo destino existe en las locations
        LocationService locationService = LocationService.getInstance();
        if (locationService.getLocation(order.getDestinationUbigeo()) == null) {
            // Si el ubigeo no existe, marcar la orden como INVALID
            order.setStatus(Order.OrderStatus.INVALID);
            logger.warning("Orden " + order.getId() + " marcada como INVALID - ubigeo destino no válido: " + order.getDestinationUbigeo());
            return false;
        }

        // Verificar que no esté en estado completado o en transito
        if (order.getStatus() == Order.OrderStatus.DELIVERED ||
                order.getStatus() == Order.OrderStatus.IN_TRANSIT) {
            return false;
        }

        // Luego verificar los estados válidos y el tiempo
        return (order.getStatus() == Order.OrderStatus.REGISTERED
                || order.getStatus() == Order.OrderStatus.PARTIALLY_ASSIGNED
                || order.getStatus() == Order.OrderStatus.PARTIALLY_ARRIVED)
                && !order.getOrderTime().isAfter(currentTime);
    }

    public static void logAvailableOrders(List<Order> availableOrders) {
        logger.info("Órdenes disponibles: " + availableOrders.size());
        for (Order order : availableOrders) {
            logger.info("Orden " + order.getId() + " - Paquetes restantes sin asignar: " + order.getUnassignedPackages());
        }
    }

}

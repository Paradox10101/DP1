package com.odiparpack.scheduler;

import com.odiparpack.models.RouteSegment;
import com.odiparpack.models.SimulationState;
import com.odiparpack.tasks.PlanificadorTask;

import java.util.List;
import java.util.Map;
import java.util.concurrent.Future;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

public class PlanificadorScheduler {
    private static ScheduledExecutorService scheduledExecutorService;
    private static Future<?> currentPlanningTask;
    private static int planningPeriodSeconds = 5;
    private static AtomicBoolean isTaskRunning = new AtomicBoolean(false);
    private static Integer pendingPeriodChange = null;
    private static final Object periodChangeLock = new Object();
    private static volatile boolean manualExecutionInProgress = false;

    private static SimulationState currentState;
    private static AtomicBoolean currentSimulationRunning;
    private static Map<String, List<RouteSegment>> currentVehicleRoutes;

    // Nuevo método de inicialización
    public static void initialize(ScheduledExecutorService executor) {
        scheduledExecutorService = executor;
    }

    public static int getCurrentPeriod() {
        return planningPeriodSeconds;
    }

    // Nuevo método para iniciar la planificación
    public static synchronized void start(
            SimulationState state,
            AtomicBoolean isSimulationRunning,
            Map<String, List<RouteSegment>> vehicleRoutes) {

        if (scheduledExecutorService == null) {
            throw new IllegalStateException("PlanificadorScheduler no ha sido inicializado");
        }

        // Guardar referencias
        currentState = state;
        currentSimulationRunning = isSimulationRunning;
        currentVehicleRoutes = vehicleRoutes;

        currentPlanningTask = schedulePlanning(state, isSimulationRunning, vehicleRoutes);
    }

    // Nuevo método para detener la planificación
    public static synchronized void stop() {
        if (currentPlanningTask != null) {
            currentPlanningTask.cancel(false);
            currentPlanningTask = null;
        }
    }

    public static synchronized void setPlanningPeriod(int newPeriodSeconds) {
        if (isTaskRunning.get()) {
            synchronized (periodChangeLock) {
                pendingPeriodChange = newPeriodSeconds;
                System.out.println("Cambio de período pendiente: " + newPeriodSeconds + " segundos");
            }
        } else {
            applyPeriodChange(newPeriodSeconds);
        }
    }

    private static void applyPeriodChange(int newPeriodSeconds) {
        planningPeriodSeconds = newPeriodSeconds;
        restartPlanningTask();
        System.out.println("Período de planificación actualizado a: " + newPeriodSeconds + " segundos");
    }

    private static void restartPlanningTask() {
        if (currentPlanningTask != null && currentState != null) {
            currentPlanningTask.cancel(false);
            currentPlanningTask = schedulePlanning(
                    currentState,
                    currentSimulationRunning,
                    currentVehicleRoutes
            );
        }
    }

    private static Future<?> schedulePlanning(
            SimulationState state,
            AtomicBoolean isSimulationRunning,
            Map<String, List<RouteSegment>> vehicleRoutes) {

        return scheduledExecutorService.scheduleWithFixedDelay(
                new PlanificadorTaskWrapper(
                        new PlanificadorTask(state, isSimulationRunning, vehicleRoutes)
                ),
                0,
                planningPeriodSeconds * 1000L,
                TimeUnit.MILLISECONDS
        );
    }

    public static boolean isTaskRunning() {
        return isTaskRunning.get();
    }

    public static void executeManually(SimulationState state) {
        if (isTaskRunning.get()) {
            throw new IllegalStateException("Ya hay una tarea de planificación en ejecución");
        }

        try {
            manualExecutionInProgress = true;
            isTaskRunning.set(true);
            new PlanificadorTask(state, new AtomicBoolean(true), currentVehicleRoutes).run();
        } finally {
            isTaskRunning.set(false);
            manualExecutionInProgress = false;

            synchronized (periodChangeLock) {
                if (pendingPeriodChange != null) {
                    applyPeriodChange(pendingPeriodChange);
                    pendingPeriodChange = null;
                }
            }
        }
    }

    private static class PlanificadorTaskWrapper implements Runnable {
        private final PlanificadorTask task;

        public PlanificadorTaskWrapper(PlanificadorTask task) {
            this.task = task;
        }

        @Override
        public void run() {
            // Si hay una ejecución manual en progreso, saltamos esta ejecución programada
            if (manualExecutionInProgress) {
                System.out.println("Saltando ejecución programada debido a ejecución manual en progreso");
                return;
            }

            try {
                isTaskRunning.set(true);
                task.run();
            } finally {
                isTaskRunning.set(false);

                synchronized (periodChangeLock) {
                    if (pendingPeriodChange != null) {
                        applyPeriodChange(pendingPeriodChange);
                        pendingPeriodChange = null;
                    }
                }
            }
        }
    }
}

package com.odiparpack.tasks;

import com.google.gson.JsonObject;
import com.odiparpack.api.routers.SimulationRouter;
import com.odiparpack.models.*;
import com.odiparpack.routing.model.Route;
import com.odiparpack.routing.service.OrderAssignmentService;
import com.odiparpack.routing.service.RouteService;
import com.odiparpack.routing.service.VehicleAssignmentService;
import com.odiparpack.services.LocationService;
import com.odiparpack.websocket.SimulationMetricsWebSocketHandler;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.logging.Level;

import static com.odiparpack.Main.logger;
import static com.odiparpack.SimulationRunner.*;

public class PlanificadorTask implements Runnable {
    private final SimulationState state;
    private final AtomicBoolean isSimulationRunning;
    private final Map<String, List<RouteSegment>> vehicleRoutes;
    private boolean breakdownsScheduled = false;
    private final List<String> pendingBreakdownTypes = new ArrayList<>(Arrays.asList("1", "2", "3"));
    private final Set<String> vehiclesWithScheduledBreakdown = new HashSet<>();

    public PlanificadorTask(SimulationState state,
                            AtomicBoolean isSimulationRunning,
                            Map<String, List<RouteSegment>> vehicleRoutes) {
        this.state = state;
        this.isSimulationRunning = isSimulationRunning;
        this.vehicleRoutes = vehicleRoutes;
    }

    private void broadcastPlanningStatus(JsonObject planningStatus) {
        // Agregar timestamp
        planningStatus.addProperty("timestamp", LocalDateTime.now().toString());
        SimulationMetricsWebSocketHandler.broadcastSimulationMetrics(planningStatus);
    }

    @Override
    public void run() {
        if (!isSimulationRunning.get() || state.isPaused() || state.isStopped()) {
            return;
        }

        logger.info("Iniciando planificación: " + state.getCurrentTime());
        JsonObject planningStatus = new JsonObject(); // Para el estado de planificación

        try {
            long[][] timeMatrix = state.getCurrentTimeMatrix();

            // Fase 1: Recopilando órdenes
            planningStatus.addProperty("phase", "collecting");
            List<Order> orders = getAvailableOrders(state.getOrders(), state.getCurrentTime());
            planningStatus.addProperty("availableOrders", orders.size());
            planningStatus.addProperty("message", "Procesando " + orders.size() + " órdenes");
            broadcastPlanningStatus(planningStatus);

            logAvailableOrders(orders);

            if (orders.isEmpty()) {
                logger.info("No hay órdenes disponibles para planificar en: " + state.getCurrentTime());
                return;  // Salimos temprano para evitar procesamiento innecesario
            }

            // Delay de 2 segundos después de recolección
            Thread.sleep(2000);

            // Fase 2: Calculando rutas
            planningStatus.addProperty("phase", "routing");
            broadcastPlanningStatus(planningStatus);

            // Obtener destinos únicos de las órdenes
            Set<String> destinationSet = new HashSet<>();
            for (Order order : orders) {
                destinationSet.add(order.getDestinationUbigeo());
            }
            String[] destinations = destinationSet.toArray(new String[0]);

            // Crear objeto para estadísticas de rutas
            JsonObject routesStats = new JsonObject();
            routesStats.addProperty("total", destinations.length);
            routesStats.addProperty("completed", 0);
            planningStatus.add("routesStats", routesStats);
            planningStatus.addProperty("message", "Calculando rutas para " + destinations.length + " destinos");
            broadcastPlanningStatus(planningStatus);

            // Calcular las mejores rutas para cada destino
            RouteService routeService = new RouteService(state.getLocationIndices(), timeMatrix);
            Map<String, Route> bestRoutes = routeService.findBestRoutes(state.getAlmacenesPrincipales(), destinations);

            // Actualizar estado con rutas completadas
            routesStats.addProperty("completed", bestRoutes.size());
            planningStatus.add("routesStats", routesStats);
            broadcastPlanningStatus(planningStatus);

            // Delay de 3 segundos después del cálculo de rutas
            Thread.sleep(3000);

            // Fase 3: Asignando vehículos
            planningStatus = new JsonObject();
            planningStatus.addProperty("phase", "assigning");
            planningStatus.addProperty("message", "Iniciando asignación de vehículos");
            broadcastPlanningStatus(planningStatus);

            // Asignar almacenes a las órdenes basándose en las mejores rutas
            OrderAssignmentService assignmentService = new OrderAssignmentService();
            List<Order> ordenesAsignables = assignmentService.assignWarehousesToOrders(orders, bestRoutes);

            // Delay de 2 segundos antes de la asignación final
            Thread.sleep(2000);

            if (!ordenesAsignables.isEmpty()) {
                VehicleAssignmentService vehicleAssignmentService = new VehicleAssignmentService(state);
                List<VehicleAssignment> assignments = vehicleAssignmentService.assignOrdersToVehicles(ordenesAsignables, state.getVehicles(), bestRoutes);

                // Actualizar estado con vehículos asignados
                planningStatus.addProperty("assignedVehicles", assignments.size());
                planningStatus.addProperty("message", "Se asignaron " + assignments.size() + " vehículos");
                broadcastPlanningStatus(planningStatus);

                // Programar averías después de la primera planificación en simulación semanal
                if (state.getSimulationType() == SimulationRouter.SimulationType.WEEKLY && !breakdownsScheduled) {
                    scheduleBreakdowns(assignments, state);
                }
            } else {
                planningStatus.addProperty("assignedVehicles", 0);
                planningStatus.addProperty("message", "No hay órdenes asignables para procesar");
                broadcastPlanningStatus(planningStatus);
                logger.warning("No hay órdenes asignables para procesar");
            }
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Error en planificación", e);
        }
    }

    private void scheduleBreakdowns(List<VehicleAssignment> assignments, SimulationState state) {
        // Intentar programar las averías pendientes
        Iterator<String> iterator = pendingBreakdownTypes.iterator();
        while (iterator.hasNext()) {
            String breakdownType = iterator.next();
            VehicleAssignment vehicleAssignment = findVehicleForBreakdown(assignments, breakdownType);
            if (vehicleAssignment != null) {
                scheduleBreakdownForVehicle(vehicleAssignment, breakdownType, state);
                iterator.remove(); // Remover el tipo de avería que ya se programó
            }
        }

        if (pendingBreakdownTypes.isEmpty()) {
            breakdownsScheduled = true; // Todas las averías han sido programadas
        }
    }

    private VehicleAssignment findVehicleForBreakdown(List<VehicleAssignment> assignments, String breakdownType) {
        String requiredType = breakdownType.equals("1") ? "A" : "C";
        return assignments.stream()
                .filter(va -> va.getVehicle().getType().equals(requiredType))
                .filter(va -> !vehiclesWithScheduledBreakdown.contains(va.getVehicle().getCode()))
                .findFirst()
                .orElse(null);
    }


    private void scheduleBreakdownForVehicle(VehicleAssignment va, String breakdownType, SimulationState state) {
        Vehicle vehicle = va.getVehicle();
        LocalDateTime departureTime = vehicle.getStatus().getSegmentStartTime();
        LocalDateTime estimatedArrivalTime = vehicle.calculateEstimatedArrivalTime(departureTime, vehicle.getRoute());

        if (departureTime == null || estimatedArrivalTime == null) {
            logger.warning("No se pudo calcular el tiempo de avería para el vehículo " + vehicle.getCode());
            return;
        }

        long totalTravelMinutes = ChronoUnit.MINUTES.between(departureTime, estimatedArrivalTime);
        long halfTravelMinutes = totalTravelMinutes / 2;
        LocalDateTime breakdownTime = departureTime.plusMinutes(halfTravelMinutes);

        // Agregar esta línea para incrementar el contador
        state.incrementarAveria(breakdownType);
        ScheduledBreakdown breakdown = new ScheduledBreakdown(
                vehicle.getCode(),
                breakdownTime,
                breakdownType,
                vehicle.getCurrentLocationUbigeo(),
                va.getOrder().getDestinationUbigeo()
        );

        state.addScheduledBreakdown(breakdown);

        vehiclesWithScheduledBreakdown.add(vehicle.getCode());

        // Obtener nombres de provincia
        String originProvince = LocationService.getInstance().getLocation(breakdown.getOriginUbigeo()).getProvince();
        String destinationProvince = LocationService.getInstance().getLocation(breakdown.getDestinationUbigeo()).getProvince();

        logger.info(String.format("Vehículo %s programado para avería tipo %s a las %s en el tramo de %s (%s) a %s (%s)",
                vehicle.getCode(), breakdownType, breakdownTime,
                breakdown.getOriginUbigeo(), originProvince, breakdown.getDestinationUbigeo(), destinationProvince));
    }
}
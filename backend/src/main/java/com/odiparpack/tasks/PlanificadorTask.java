package com.odiparpack.tasks;

import com.odiparpack.api.routers.SimulationRouter;
import com.odiparpack.models.*;
import com.odiparpack.services.LocationService;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.logging.Level;
import java.util.stream.Collectors;

import static com.odiparpack.Main.logger;
import static com.odiparpack.SimulationRunner.*;

public class PlanificadorTask implements Runnable {
    private final SimulationState state;
    private final AtomicBoolean isSimulationRunning;
    private final Map<String, List<RouteSegment>> vehicleRoutes;
    private boolean breakdownsScheduled = false;
    private final List<String> pendingBreakdownTypes = new ArrayList<>(Arrays.asList("1", "2", "3"));
    private final Set<String> vehiclesWithScheduledBreakdown = new HashSet<>();

    public PlanificadorTask(SimulationState state, AtomicBoolean isSimulationRunning,
                            Map<String, List<RouteSegment>> vehicleRoutes) {
        this.state = state;
        this.isSimulationRunning = isSimulationRunning;
        this.vehicleRoutes = vehicleRoutes;
    }

    @Override
    public void run() {
        if (!isSimulationRunning.get() || state.isPaused() || state.isStopped()) {
            return;
        }

        logger.info("Iniciando planificación: " + state.getCurrentTime());

        try {
            long[][] currentTimeMatrix = state.getCurrentTimeMatrix();
            List<Order> availableOrders = getAvailableOrders(state.getOrders(), state.getCurrentTime());
            logAvailableOrders(availableOrders);

            // Filtrar órdenes con ubigeo origen inválido (******)
            /*List<Order> ordersWithInvalidUbigeo = availableOrders.stream()
                    .filter(order -> "******".equals(order.getOriginUbigeo())) // Verificar ubigeo inválido
                    .collect(Collectors.toList());*/

            // Bloqueos para calcular planificacion
            List<Blockage> blockages = state.getActiveBlockages().stream()
                    .map(blockage -> blockage.clone())
                    .collect(Collectors.toList());

            // Solo procesar si hay órdenes con ubigeo inválido
            //if (!ordersWithInvalidUbigeo.isEmpty()) {
            processOrdersWithUnknownOrigin(availableOrders, state, blockages); // Asigna ubigeo origen
            //}

            if (!availableOrders.isEmpty()) {
                List<VehicleAssignment> assignments = assignOrdersToVehicles(
                        availableOrders,
                        new ArrayList<>(state.getVehicles().values()), // copia de los vehiculos
                        state.getCurrentTime(),
                        state
                );

                if (!assignments.isEmpty()) {
                    calculateAndApplyRoutes(
                            currentTimeMatrix,
                            assignments,
                            state.getLocationIndices(),
                            state.getLocationNames(),
                            state.getLocationUbigeos(),
                            vehicleRoutes,
                            state,
                            blockages
                    );

                    for(VehicleAssignment vehicleAssingnment: assignments) {
                        if(vehicleRoutes.containsKey(vehicleAssingnment.getVehicle().getCode())){
                            if(!state.getVehicleAssignmentsPerOrder().containsKey(vehicleAssingnment.getOrder().getId()))
                                state.getVehicleAssignmentsPerOrder().put(vehicleAssingnment.getOrder().getId(), new ArrayList<>());
                            if(vehicleAssingnment.getVehicle().getEstimatedDeliveryTime()!=null)
                                vehicleAssingnment.setEstimatedDeliveryTime(vehicleAssingnment.getVehicle().getEstimatedDeliveryTime());
                            vehicleAssingnment.getRouteSegments().addAll(vehicleRoutes.get(vehicleAssingnment.getVehicle().getCode()));
                            state.getVehicleAssignmentsPerOrder().get(vehicleAssingnment.getOrder().getId()).add(vehicleAssingnment);
                        }
                    }
                }

                // Programar averías después de la primera planificación en simulación semanal
                if (state.getSimulationType() == SimulationRouter.SimulationType.WEEKLY && !breakdownsScheduled) {
                    scheduleBreakdowns(assignments, state);
                }
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
package com.odiparpack.routing.service;

import com.odiparpack.models.Order;
import com.odiparpack.models.SimulationState;
import com.odiparpack.models.Vehicle;
import com.odiparpack.models.VehicleAssignment;
import com.odiparpack.routing.model.Route;

import java.util.*;
import java.util.stream.Collectors;
import java.util.logging.Logger;

public class VehicleAssignmentService {
    private static final Logger logger = Logger.getLogger(VehicleAssignmentService.class.getName());
    private final SimulationState state;

    public VehicleAssignmentService(SimulationState state) {
        this.state = state;
    }

    /**
     * Asigna órdenes a vehículos disponibles.
     */
    public List<VehicleAssignment> assignOrdersToVehicles(List<Order> orders, List<Vehicle> vehicles, Map<String, Route> routes) {
        List<VehicleAssignment> assignments = new ArrayList<>();

        for (Order order : orders) {
            if (!isOrderEligibleForAssignment(order)) {
                continue;
            }

            processOrderAssignment(order, vehicles, assignments, routes.get(order.getDestinationUbigeo()));
        }

        return assignments;
    }

    private boolean isOrderEligibleForAssignment(Order order) {
        if (order.getStatus() != Order.OrderStatus.REGISTERED &&
                order.getStatus() != Order.OrderStatus.PARTIALLY_ASSIGNED) {
            logger.info("Orden " + order.getId() + " no está en estado válido para asignación. Se omite.");
            return false;
        }

        if (order.getUnassignedPackages() <= 0) {
            logger.info("Orden " + order.getId() + " no tiene paquetes por asignar. Se omite.");
            return false;
        }

        return true;
    }

    private void processOrderAssignment(Order order,
                                        List<Vehicle> vehicles,
                                        List<VehicleAssignment> assignments,
                                        Route route) {
        int unassignedPackages = order.getUnassignedPackages();
        List<Vehicle> availableVehicles = findAvailableVehicles(vehicles, order.getOriginUbigeo());

        if (availableVehicles.isEmpty()) {
            logger.info("No hay vehículos disponibles en " + order.getOriginUbigeo() +
                    " para la orden " + order.getId());
            return;
        }

        for (Vehicle vehicle : availableVehicles) {
            if (unassignedPackages <= 0) break;
            unassignedPackages = assignPackagesToVehicle(order, vehicle, unassignedPackages, assignments, route);
        }

        updateOrderStatus(order, unassignedPackages);
    }

    private List<Vehicle> findAvailableVehicles(List<Vehicle> vehicles, String originUbigeo) {
        return vehicles.stream()
                .filter(v ->
                        v.getEstado() == Vehicle.EstadoVehiculo.EN_ALMACEN
                                && v.getCurrentLocationUbigeo().equals(originUbigeo))
                .sorted(Comparator.comparingInt(Vehicle::getCapacity).reversed())
                .collect(Collectors.toList());
    }

    private int assignPackagesToVehicle(Order order,
                                        Vehicle vehicle,
                                        int unassignedPackages,
                                        List<VehicleAssignment> assignments,
                                        Route route) {
        synchronized (vehicle) {
            if (vehicle.getCapacity() >= unassignedPackages) {
                return handleCompleteAssignment(order, vehicle, unassignedPackages, assignments, route);
            } else if (vehicle.getCapacity() > 0) {
                return handlePartialAssignment(order, vehicle, unassignedPackages, assignments, route);
            }
            return unassignedPackages;
        }
    }

    private int handleCompleteAssignment(Order order,
                                         Vehicle vehicle,
                                         int unassignedPackages,
                                         List<VehicleAssignment> assignments,
                                         Route route) {
        VehicleAssignment assignment = new VehicleAssignment(vehicle, order, unassignedPackages);
        assignment.getRouteSegments().addAll(route.getSegments());
        if(vehicle.getEstimatedDeliveryTime() != null) {
            assignment.setEstimatedDeliveryTime(vehicle.getEstimatedDeliveryTime());
        }
        assignments.add(assignment);

        updateVehicleState(vehicle, unassignedPackages);
        order.incrementAssignedPackages(unassignedPackages);

        logAssignment(order, vehicle, unassignedPackages, true);
        updateStateMetrics(order, unassignedPackages, vehicle.getCapacity());

        vehicle.setRoute(route.getSegments());
        vehicle.startJourney(state.getCurrentTime(), order, state);

        // Actualizar el mapa de asignaciones por orden directamente aquí
        if(!state.getVehicleAssignmentsPerOrder().containsKey(order.getId())) {
            state.getVehicleAssignmentsPerOrder().put(order.getId(), new ArrayList<>());
        }
        state.getVehicleAssignmentsPerOrder().get(order.getId()).add(assignment);

        return 0;
    }

    private int handlePartialAssignment(Order order,
                                        Vehicle vehicle,
                                        int unassignedPackages,
                                        List<VehicleAssignment> assignments,
                                        Route route) {
        int assignedQuantity = Math.min(vehicle.getCapacity(), unassignedPackages);
        VehicleAssignment assignment = new VehicleAssignment(vehicle, order, assignedQuantity);
        assignment.getRouteSegments().addAll(route.getSegments());
        if(vehicle.getEstimatedDeliveryTime() != null) {
            assignment.setEstimatedDeliveryTime(vehicle.getEstimatedDeliveryTime());
        }
        assignments.add(assignment);

        updateVehicleState(vehicle, assignedQuantity);
        order.incrementAssignedPackages(assignedQuantity);

        logAssignment(order, vehicle, assignedQuantity, false);
        updateStateMetrics(order, assignedQuantity, vehicle.getCapacity());

        vehicle.setRoute(route.getSegments());
        vehicle.startJourney(state.getCurrentTime(), order, state);

        // Actualizar el mapa de asignaciones por orden directamente aquí
        if(!state.getVehicleAssignmentsPerOrder().containsKey(order.getId())) {
            state.getVehicleAssignmentsPerOrder().put(order.getId(), new ArrayList<>());
        }
        state.getVehicleAssignmentsPerOrder().get(order.getId()).add(assignment);

        return unassignedPackages - assignedQuantity;
    }

    private void updateVehicleState(Vehicle vehicle, int assignedPackages) {
        vehicle.setCurrentCapacity(vehicle.getCurrentCapacity() + assignedPackages);
        vehicle.setAvailable(false);
        vehicle.setEstado(Vehicle.EstadoVehiculo.ORDENES_CARGADAS);
    }

    private void updateOrderStatus(Order order, int remainingPackages) {
        synchronized (order) {
            if (remainingPackages > 0 && order.getQuantity() != remainingPackages) {
                order.setStatus(Order.OrderStatus.PARTIALLY_ASSIGNED);
                logger.warning("Quedan " + remainingPackages + " paquetes por asignar para la orden " + order.getId());
            } else {
                order.setStatus(Order.OrderStatus.FULLY_ASSIGNED);
                logger.info("Orden " + order.getId() + " completamente asignada.");
            }
        }
    }

    private void updateStateMetrics(Order order, int assignedPackages, int vehicleCapacity) {
        synchronized (state) {
            state.updateCapacityMetrics(assignedPackages, vehicleCapacity);
            state.assignOrdersCount();
            state.guardarCiudadDestino(order.getDestinationCity());
            state.registrarParadaEnAlmacen(order.getOriginUbigeo());
            state.asignarPedidoAlmacenCount(order.getDestinationUbigeo());
        }
    }

    private void logAssignment(Order order, Vehicle vehicle, int assignedQuantity, boolean isComplete) {
        String assignmentType = isComplete ? "Completa" : "Parcial";
        String logMessage = String.format(
                "\n--- Asignación %s ---\n" +
                        "Código de la Orden: %d\n" +
                        "Cantidad Total de la Orden: %d paquetes\n" +
                        "Cantidad Asignada al Vehículo: %d paquetes\n" +
                        "Código del Vehículo: %s\n" +
                        "Capacidad Actual del Vehículo: %d / %d\n" +
                        "---------------------------",
                assignmentType,
                order.getId(),
                order.getQuantity(),
                assignedQuantity,
                vehicle.getCode(),
                vehicle.getCurrentCapacity(),
                vehicle.getCapacity()
        );
        logger.info(logMessage);
    }
}
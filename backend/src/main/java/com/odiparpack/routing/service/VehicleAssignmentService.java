package com.odiparpack.routing.service;

import com.odiparpack.models.Order;
import com.odiparpack.models.SimulationState;
import com.odiparpack.models.Vehicle;
import com.odiparpack.models.VehicleAssignment;
import com.odiparpack.routing.model.Route;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.logging.Logger;

public class VehicleAssignmentService {
    private static final Logger logger = Logger.getLogger(VehicleAssignmentService.class.getName());
    private final SimulationState state;
    //int unassignedOrdersCount = 0;

    public VehicleAssignmentService(SimulationState state) {
        this.state = state;
    }

    /**
     * Asigna órdenes a vehículos disponibles.
     */
    public List<VehicleAssignment> assignOrdersToVehicles(List<Order> orders, List<Vehicle> vehicles, Map<String, Route> routes) {
        List<VehicleAssignment> assignments = new ArrayList<>();

        /*// Contar órdenes sin asignar
        unassignedOrdersCount = (int) orders.stream()
                .filter(o -> o.getStatus() == Order.OrderStatus.REGISTERED ||
                        o.getStatus() == Order.OrderStatus.PARTIALLY_ASSIGNED)
                .count();*/

        for (Order order : orders) {
            if (!isOrderEligibleForAssignment(order)) {
                continue;
            }

            processOrderAssignment(order,
                    vehicles,
                    assignments,
                    routes.get(order.getDestinationUbigeo()));
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
            if (shouldCreateNewVehicle(order, route, state.getCurrentTime())) {
                Vehicle newVehicle = createNewVehicle(order.getOriginUbigeo(), unassignedPackages);
                availableVehicles.add(newVehicle);
                logger.info("Vehículo con código '" + newVehicle.getCode() +
                        "' para la orden " + order.getId() + " debido a restricciones de tiempo");
                //unassignedOrdersCount--;
            } else {
                logger.info("No hay vehículos disponibles en " + order.getOriginUbigeo() +
                        " para la orden " + order.getId());
                return;
            }

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

    private boolean shouldCreateNewVehicle(Order order, Route route, LocalDateTime currentTime) {
        /*// Generar un límite aleatorio entre 400 y 480
        int randomLimit = 400 + (int)(Math.random() * 81); // 81 porque 280-200+1 = 81 posibles números

        // Si hay más órdenes sin asignar que el límite, crear vehículo sin importar el tiempo
        if (unassignedOrdersCount > randomLimit) {
            logger.info("Creando vehículo debido a que hay más de " + randomLimit +
                    " órdenes sin asignar (actual: " + unassignedOrdersCount + ")");
            return true;
        }*/

        // Si hay menos órdenes que el límite aleatorio, verificar el criterio de tiempo
        long timeUntilDue = Duration.between(currentTime, order.getDueTime()).toMinutes();
        // Si el tiempo estimado de llegada excede el dueTime o está muy cerca
        long safetyMargin = Math.round(route.getTotalDuration() * 0.5);
        return timeUntilDue <= (route.getTotalDuration() + safetyMargin);
    }

    private Vehicle createNewVehicle(String warehouseUbigeo, int requiredCapacity) {
        // Determinar el tipo de vehículo basado en la capacidad requerida
        String type = determineVehicleType(requiredCapacity);
        int highestNumber = 0;

        // Encontrar el número más alto actual para el tipo de vehículo
        for (Vehicle vehicle : state.getVehicles()) {
            if (vehicle.getType().equals(type)) {
                String numberPart = vehicle.getCode().substring(1);
                int currentNumber = Integer.parseInt(numberPart);
                if (currentNumber > highestNumber) {
                    highestNumber = currentNumber;
                }
            }
        }

        // Crear nuevo código de vehículo
        String newCode = type + String.format("%03d", highestNumber + 1);
        int capacity = getCapacityForType(type);

        // Crear y configurar el nuevo vehículo
        Vehicle newVehicle = new Vehicle(newCode, type, capacity, warehouseUbigeo);
        newVehicle.setAvailable(true);
        newVehicle.setEstado(Vehicle.EstadoVehiculo.EN_ALMACEN);
        state.getVehicles().add(newVehicle);

        return newVehicle;
    }

    private String determineVehicleType(int requiredCapacity) {
        // Lógica para determinar el tipo de vehículo basado en la capacidad requerida
        if (requiredCapacity < 45) {
            return "C"; // Small vehicle
        } else if (requiredCapacity < 90) {
            return "B"; // Medium vehicle (45)
        } else {
            return "A"; // Large vehicle (90)
        }
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
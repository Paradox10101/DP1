package com.odiparpack.models;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class VehicleAssignment {
    private Vehicle vehicle;
    private Order order;
    private int assignedQuantity;
    private List<RouteSegment> routeSegments = new ArrayList<>();
    private LocalDateTime estimatedDeliveryTime = null;

    public VehicleAssignment(Vehicle vehicle, Order order, int assignedQuantity) {
        this.vehicle = vehicle;
        this.order = order;
        this.assignedQuantity = assignedQuantity;
    }

    public Vehicle getVehicle() {
        return vehicle;
    }

    public Order getOrder() {
        return order;
    }

    public int getAssignedQuantity() {
        return assignedQuantity;
    }

    public List<RouteSegment> getRouteSegments() {
        return routeSegments;
    }

    public void setRouteSegments(List<RouteSegment> routeSegments) {
        this.routeSegments = routeSegments;
    }

    public LocalDateTime getEstimatedDeliveryTime() {
        return estimatedDeliveryTime;
    }

    public void setEstimatedDeliveryTime(LocalDateTime estimatedDeliveryTime) {
        this.estimatedDeliveryTime = estimatedDeliveryTime;
    }
}
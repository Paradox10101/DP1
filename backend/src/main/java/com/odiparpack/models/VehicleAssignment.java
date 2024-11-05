package com.odiparpack.models;

import java.util.ArrayList;
import java.util.List;

public class VehicleAssignment {
    private Vehicle vehicle;
    private Order order;
    private int assignedQuantity;
    private List<RouteSegment> routeSegments = new ArrayList<>();

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
}
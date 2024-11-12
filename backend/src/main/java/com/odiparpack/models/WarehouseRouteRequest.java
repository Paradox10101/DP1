package com.odiparpack.models;

public class WarehouseRouteRequest {
    private Vehicle vehicle;
    private String originUbigeo;
    private String destinationUbigeo;

    public WarehouseRouteRequest(Vehicle vehicle, String originUbigeo, String destinationUbigeo) {
        this.vehicle = vehicle;
        this.originUbigeo = originUbigeo;
        this.destinationUbigeo = destinationUbigeo;
    }

    public Vehicle getVehicle() {
        return vehicle;
    }

    public String getOriginUbigeo() {
        return originUbigeo;
    }

    public String getDestinationUbigeo() {
        return destinationUbigeo;
    }
}

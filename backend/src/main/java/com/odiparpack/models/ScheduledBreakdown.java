package com.odiparpack.models;

import java.time.LocalDateTime;

public class ScheduledBreakdown {
    private String vehicleCode;
    private LocalDateTime scheduledTime;
    private String breakdownType;
    private String originUbigeo;
    private String destinationUbigeo;

    public ScheduledBreakdown(String vehicleCode, LocalDateTime scheduledTime, String breakdownType, String originUbigeo, String destinationUbigeo) {
        this.vehicleCode = vehicleCode;
        this.scheduledTime = scheduledTime;
        this.breakdownType = breakdownType;
        this.originUbigeo = originUbigeo;
        this.destinationUbigeo = destinationUbigeo;
    }

    // Getters
    public String getVehicleCode() {
        return vehicleCode;
    }

    public LocalDateTime getScheduledTime() {
        return scheduledTime;
    }

    public String getBreakdownType() {
        return breakdownType;
    }

    public String getOriginUbigeo() {
        return originUbigeo;
    }

    public String getDestinationUbigeo() {
        return destinationUbigeo;
    }

    // Setters
    public void setVehicleCode(String vehicleCode) {
        this.vehicleCode = vehicleCode;
    }

    public void setScheduledTime(LocalDateTime scheduledTime) {
        this.scheduledTime = scheduledTime;
    }

    public void setBreakdownType(String breakdownType) {
        this.breakdownType = breakdownType;
    }

    public void setOriginUbigeo(String originUbigeo) {
        this.originUbigeo = originUbigeo;
    }

    public void setDestinationUbigeo(String destinationUbigeo) {
        this.destinationUbigeo = destinationUbigeo;
    }
}
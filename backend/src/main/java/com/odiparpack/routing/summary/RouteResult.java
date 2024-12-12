package com.odiparpack.routing.summary;

public class RouteResult {
    private final String warehouse;
    private final boolean success;
    private final long totalTime;

    public RouteResult(String warehouse, boolean success, long totalTime) {
        this.warehouse = warehouse;
        this.success = success;
        this.totalTime = totalTime;
    }

    public String getWarehouse() {
        return warehouse;
    }

    public boolean isSuccess() {
        return success;
    }

    public long getTotalTime() {
        return totalTime;
    }
}
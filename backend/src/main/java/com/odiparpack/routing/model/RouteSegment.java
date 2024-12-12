package com.odiparpack.routing.model;

public class RouteSegment {
    private int fromNode;
    private int toNode;
    private long duration;
    private String fromUbigeo;
    private String toUbigeo;

    public RouteSegment(int fromNode, int toNode, long duration) {
        this.fromNode = fromNode;
        this.toNode = toNode;
        this.duration = duration;
    }

    public RouteSegment(String fromUbigeo, String toUbigeo, long durationMinutes) {
        this.fromUbigeo = fromUbigeo;
        this.toUbigeo = toUbigeo;
        this.duration = durationMinutes;
    }

    public int getFromNode() { return fromNode; }
    public int getToNode() { return toNode; }
    public long getDuration() { return duration; }
    public String getFromUbigeo() { return fromUbigeo; }
    public String getToUbigeo() { return toUbigeo; }
}
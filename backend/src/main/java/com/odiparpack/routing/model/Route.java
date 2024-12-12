package com.odiparpack.routing.model;

import com.odiparpack.models.RouteSegment;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Route {
    private List<RouteSegment> segments;
    private long totalDuration;
    private boolean successful;
    private String startUbigeo;
    private String endUbigeo;

    public Route(List<RouteSegment> segments, long totalDuration,
                 boolean successful, String startUbigeo, String endUbigeo) {
        this.segments = segments;
        this.totalDuration = totalDuration;
        this.successful = successful;
        this.startUbigeo = startUbigeo;
        this.endUbigeo = endUbigeo;
    }

    public List<RouteSegment> getSegments() { return segments; }
    public long getTotalDuration() { return totalDuration; }
    public boolean isSuccessful() { return successful; }
    public String getStartUbigeo() { return startUbigeo; }
    public String getEndUbigeo() { return endUbigeo; }

    public void inverse() {
        List<RouteSegment> reversedRoute = new ArrayList<>();

        // Intercambiar los ubigeos de inicio y fin de la ruta
        String tempUbigeo = this.startUbigeo;
        this.startUbigeo = this.endUbigeo;
        this.endUbigeo = tempUbigeo;

        for (int i = segments.size() - 1; i >= 0; i--) {
            RouteSegment originalSegment = segments.get(i);
            String[] locations = originalSegment.getName().split(" to ");
            String fromName = locations[1];
            String toName = locations[0];

            RouteSegment reversedSegment = new RouteSegment(
                    fromName + " to " + toName,
                    originalSegment.getToUbigeo(),
                    originalSegment.getFromUbigeo(),
                    originalSegment.getDurationMinutes()
            );

            reversedRoute.add(reversedSegment);
        }

        segments = reversedRoute;
    }

}
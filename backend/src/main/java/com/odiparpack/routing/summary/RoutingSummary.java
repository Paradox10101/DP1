package com.odiparpack.routing.summary;

import static com.odiparpack.Utils.formatTime;
import java.util.*;
import java.util.logging.Logger;

public class RoutingSummary {
    private static final Logger logger = Logger.getLogger(RoutingSummary.class.getName());
    private final Map<String, List<RouteResult>> resultsByDestination = new HashMap<>();

    public void addResult(String destination, String warehouse, boolean success, long totalTime) {
        resultsByDestination.computeIfAbsent(destination, k -> new ArrayList<>())
                .add(new RouteResult(warehouse, success, totalTime));
    }

    public void printSummary() {
        logger.info("\n=== RESUMEN DE RUTAS POR DESTINO ===");
        for (Map.Entry<String, List<RouteResult>> entry : resultsByDestination.entrySet()) {
            String destination = entry.getKey();
            List<RouteResult> results = entry.getValue();

            long successCount = results.stream().filter(r -> r.isSuccess()).count();

            logger.info("\nDestino: " + destination);
            logger.info("Rutas exitosas: " + successCount + "/" + results.size());

            logger.info("Detalle por almacén:");
            results.forEach(result -> {
                logger.info("- " + result.getWarehouse() + ": " +
                        (result.isSuccess() ? "ÉXITO (Tiempo: " + formatTime(result.getTotalTime()) + ")" : "FALLIDO"));
            });
        }
    }
}
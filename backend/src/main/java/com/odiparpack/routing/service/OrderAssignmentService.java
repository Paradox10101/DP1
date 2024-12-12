package com.odiparpack.routing.service;

import com.odiparpack.models.Order;
import com.odiparpack.routing.model.Route;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.logging.Logger;

public class OrderAssignmentService {
    private static final Logger logger = Logger.getLogger(OrderAssignmentService.class.getName());

    /**
     * Asigna almacenes de origen a las órdenes basándose en las mejores rutas calculadas.
     * Si no se encuentra una ruta para el destino de la orden, esta no será asignada.
     *
     * @param orders Lista de órdenes a procesar
     * @param bestRoutes Mapa de mejores rutas por destino
     * @return Lista de órdenes con almacén de origen asignado
     */
    public List<Order> assignWarehousesToOrders(List<Order> orders, Map<String, Route> bestRoutes) {
        List<Order> assignableOrders = new ArrayList<>();
        List<Order> unassignableOrders = new ArrayList<>();

        for (Order order : orders) {
            String destinationUbigeo = order.getDestinationUbigeo();
            Route bestRoute = bestRoutes.get(destinationUbigeo);

            if (bestRoute != null) {
                order.setOriginUbigeo(bestRoute.getStartUbigeo());
                assignableOrders.add(order);
                logger.info(String.format("Orden %s asignada al almacén %s para entrega en %s",
                        order.getId(),
                        bestRoute.getStartUbigeo(),
                        destinationUbigeo));
            } else {
                unassignableOrders.add(order);
                logger.warning(String.format("No se encontró ruta válida para la orden %s con destino %s",
                        order.getId(),
                        destinationUbigeo));
            }
        }

        // Loguear resumen de asignación
        logAssignmentSummary(assignableOrders, unassignableOrders);

        return assignableOrders;
    }

    private void logAssignmentSummary(List<Order> assignableOrders, List<Order> unassignableOrders) {
        logger.info("\n=== Resumen de asignación de almacenes ===");
        logger.info(String.format("Órdenes asignadas: %d", assignableOrders.size()));
        logger.info(String.format("Órdenes no asignables: %d", unassignableOrders.size()));

        if (!unassignableOrders.isEmpty()) {
            logger.warning("\nÓrdenes sin ruta válida:");
            unassignableOrders.forEach(order ->
                    logger.warning(String.format("- Orden %s (Destino: %s)",
                            order.getId(),
                            order.getDestinationUbigeo())));
        }
    }
}
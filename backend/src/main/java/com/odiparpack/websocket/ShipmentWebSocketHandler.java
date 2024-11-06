package com.odiparpack.websocket;
import com.google.gson.JsonObject;
import org.eclipse.jetty.websocket.api.Session;
import org.eclipse.jetty.websocket.api.annotations.*;
import java.io.IOException;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;

@WebSocket
public class ShipmentWebSocketHandler extends BaseWebSocketHandler{
    private static final Set<Session> sessions = new CopyOnWriteArraySet<>();
    private static final Object lock = new Object();
    private static JsonObject lastShipmentList;


    @Override
    protected void handleConnect(Session session) {
        sessions.add(session);
        // Enviar último estado conocido al nuevo cliente
        if (lastShipmentList != null) {
            try {
                session.getRemote().sendString(gson.toJson(lastShipmentList));
            } catch (IOException e) {
                logger.warning("Error sending initial state to new client: " + e.getMessage());
            }
        }
    }

    @Override
    protected void handleDisconnect(Session session) {
        sessions.remove(session);
    }

    @Override
    protected void broadcastMessage(JsonObject positions) {
        broadcastShipments(positions);
    }


    public static void broadcastShipments(JsonObject shipmentList) {

        lastShipmentList = shipmentList; // Actualizar cache
        String message = gson.toJson(shipmentList);

        // Log del mensaje JSON antes de enviarlo
        //logger.info("Mensaje JSON para WebSocket: " + message);

        sessions.removeIf(session -> {
            if (!session.isOpen()) {
                return true;
            }

            try {
                session.getRemote().sendString(message);
                return false;
            } catch (IOException e) {
                logger.warning("Error sending metrics to session: " + e.getMessage());
                return true;
            }
        });
    }




    /*
    public static void broadcastShipments() {

        if (lastShipmentStates != null) {
            List<Order> orders = lastShipmentStates.getOrders();
            JsonObject featureCollection = new JsonObject();
            featureCollection.addProperty("type", "FeatureCollection");
            JsonArray features = new JsonArray();
            JsonObject feature = new JsonObject();
            for (Order order : orders) {
                feature.addProperty("orderCode", order.getId());
                feature.addProperty("startTime", order.getOrderTime().format(DateTimeFormatter.ofPattern("dd/MM/yy HH:mm")));
                feature.addProperty("remainingTimeDays", Duration.between(order.getOrderTime(), order.getDueTime()).toDays());
                feature.addProperty("remainingTimeHours", Duration.between(order.getOrderTime(), order.getDueTime()).toHours() % 24);
                feature.addProperty("remainingTimeMinutes", Duration.between(order.getOrderTime(), order.getDueTime()).toMinutes() % 60);
                feature.addProperty("originUbigeo", order.getOriginUbigeo());
                feature.addProperty("destinyUbigeo", order.getDestinationUbigeo());
                feature.addProperty("remainingPackages", order.getQuantity());
                feature.addProperty("status", order.getStatus().toString());

                features.add(feature);
            }
            featureCollection.add("features", features);
            broadcast(featureCollection.toString());
        }
    }

    private static void broadcast(String message) {
        for (Session session : sessions) {
            if (session.isOpen()) {
                try {
                    session.getRemote().sendString(message);
                } catch (IOException e) {
                    System.err.println("(WebSocket de envíos) Error al enviar mensaje: " + e.getMessage());
                }
            }
        }
    }
    */

}

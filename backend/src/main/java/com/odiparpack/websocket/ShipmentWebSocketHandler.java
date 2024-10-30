package com.odiparpack.websocket;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.odiparpack.models.Location;
import com.odiparpack.models.Order;
import com.odiparpack.models.SimulationState;
import org.eclipse.jetty.websocket.api.Session;
import org.eclipse.jetty.websocket.api.annotations.*;

import java.io.IOException;
import java.time.Duration;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@WebSocket
public class ShipmentWebSocketHandler {
    private static Set<Session> sessions = ConcurrentHashMap.newKeySet();
    private static Gson gson = new Gson();
    private static SimulationState simulationState;

    public ShipmentWebSocketHandler() {
        // No-arg constructor required by Spark
    }

    // Provide a setter for simulationState
    public static void setSimulationState(SimulationState state) {
        simulationState = state;
    }

    public ShipmentWebSocketHandler(SimulationState state) {
        simulationState = state;
    }

    @OnWebSocketConnect
    public void onConnect(Session session) {
        sessions.add(session);
        System.out.println("(WebSocket de envíos) Cliente conectado : " + session.getRemoteAddress().getAddress());
    }

    @OnWebSocketClose
    public void onClose(Session session, int statusCode, String reason) {
        sessions.remove(session);
        System.out.println("(WebSocket de envíos) Cliente desconectado : " + session.getRemoteAddress().getAddress());
    }

    @OnWebSocketMessage
    public void onMessage(Session session, String message) {
        // Manejar mensajes entrantes si es necesario
    }

    @OnWebSocketError
    public void onError(Session session, Throwable error) {
        System.err.println("(WebSocket de envíos) Error: " + error.getMessage());
    }

    //envios de estados de los envios
    public static void broadcastShipments() {
        if (simulationState != null) {
            List<Order>orders = simulationState.getOrders();
            Map<String, Location> locations = simulationState.getLocations();
            JsonObject featureCollection = new JsonObject();
            featureCollection.addProperty("type", "FeatureCollection");
            JsonArray features = new JsonArray();
            JsonObject feature = new JsonObject();

            for (Order order : orders) {
                String status = order.getStatus().toString();
                feature.addProperty("orderCode", order.getId());
                feature.addProperty("startTime", order.getOrderTime().format(DateTimeFormatter.ofPattern("dd/MM/yy HH:mm")));
                if(!order.getStatus().equals(Order.OrderStatus.DELIVERED)&&!order.getStatus().equals(Order.OrderStatus.PENDING_PICKUP)){
                    feature.addProperty("remainingTimeDays",  Duration.between(simulationState.getCurrentTime(), order.getDueTime()).toDays());
                    feature.addProperty("remainingTimeHours", Duration.between(simulationState.getCurrentTime(), order.getDueTime()).toHours() % 24);
                }
                else{
                    feature.addProperty("remainingTimeDays", "--");
                    feature.addProperty("remainingTimeHours", "--");
                }

                feature.addProperty("originCity", locations.get(order.getOriginUbigeo()).getProvince());
                feature.addProperty("destinyCity", locations.get(order.getDestinationUbigeo()).getProvince());
                feature.addProperty("remainingPackages", order.getQuantity());
                feature.addProperty("status", status);
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
}

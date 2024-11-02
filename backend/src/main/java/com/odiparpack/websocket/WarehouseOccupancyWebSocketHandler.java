package com.odiparpack.websocket;

import com.google.gson.JsonObject;
import org.eclipse.jetty.websocket.api.Session;
import org.eclipse.jetty.websocket.api.annotations.WebSocket;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@WebSocket
public class WarehouseOccupancyWebSocketHandler extends BaseWebSocketHandler {
    private static final Set<Session> sessions = new CopyOnWriteArraySet<>();
    private static final Map<String, Double> lastOccupancyStates = new ConcurrentHashMap<>();
    private static final Object lock = new Object();

    @Override
    protected void handleConnect(Session session) {
        sessions.add(session);
        // Enviar estado actual al nuevo cliente
        if (!lastOccupancyStates.isEmpty()) {
            try {
                JsonObject currentState = createOccupancyUpdate(lastOccupancyStates);
                session.getRemote().sendString(gson.toJson(currentState));
            } catch (IOException e) {
                logger.warning("Error sending initial occupancy state: " + e.getMessage());
            }
        }
    }

    @Override
    protected void handleDisconnect(Session session) {
        sessions.remove(session);
    }

    @Override
    protected void broadcastMessage(JsonObject message) {
        broadcastOccupancyUpdate(message);
    }

    public static void broadcastOccupancyUpdate(String ubigeo, double occupancyPercentage) {
        synchronized (lock) {
            lastOccupancyStates.put(ubigeo, occupancyPercentage);
            JsonObject update = createOccupancyUpdate(ubigeo, occupancyPercentage);
            broadcastOccupancyUpdate(update);
        }
    }

    private static void broadcastOccupancyUpdate(JsonObject update) {
        String message = gson.toJson(update);
        logger.info("Broadcasting occupancy update: " + message);

        sessions.removeIf(session -> {
            if (!session.isOpen()) {
                return true;
            }

            try {
                session.getRemote().sendString(message);
                return false;
            } catch (IOException e) {
                logger.warning("Error sending occupancy update: " + e.getMessage());
                return true;
            }
        });
    }

    private static JsonObject createOccupancyUpdate(String ubigeo, double occupancyPercentage) {
        JsonObject update = new JsonObject();
        update.addProperty("type", "occupancy_update");
        update.addProperty("ubigeo", ubigeo);
        update.addProperty("occupiedPercentage", occupancyPercentage);
        update.addProperty("timestamp", System.currentTimeMillis());
        return update;
    }

    private static JsonObject createOccupancyUpdate(Map<String, Double> occupancyStates) {
        JsonObject update = new JsonObject();
        update.addProperty("type", "occupancy_update_batch");
        JsonObject states = new JsonObject();
        occupancyStates.forEach(states::addProperty);
        update.add("states", states);
        update.addProperty("timestamp", System.currentTimeMillis());
        return update;
    }

    public static void clearOccupancyState(String ubigeo) {
        lastOccupancyStates.remove(ubigeo);
    }

    public static Map<String, Double> getLastOccupancyStates() {
        return new ConcurrentHashMap<>(lastOccupancyStates);
    }
}
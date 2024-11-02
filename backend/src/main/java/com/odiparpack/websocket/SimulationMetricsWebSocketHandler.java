package com.odiparpack.websocket;

import com.google.gson.JsonObject;
import org.eclipse.jetty.websocket.api.Session;
import org.eclipse.jetty.websocket.api.annotations.WebSocket;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;

@WebSocket
public class SimulationMetricsWebSocketHandler extends BaseWebSocketHandler {
    private static final Set<Session> sessions = new CopyOnWriteArraySet<>();
    private static final int METRICS_BUFFER_SIZE = 1; // Solo necesitamos el último estado
    private static JsonObject lastMetrics; // Cache del último estado

    @Override
    protected void handleConnect(Session session) {
        sessions.add(session);
        // Enviar último estado conocido al nuevo cliente
        if (lastMetrics != null) {
            try {
                session.getRemote().sendString(gson.toJson(lastMetrics));
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
    protected void broadcastMessage(JsonObject metrics) {
        broadcastSimulationMetrics(metrics);
    }

    public static void broadcastSimulationMetrics(JsonObject metrics) {
        lastMetrics = metrics; // Actualizar cache
        String message = gson.toJson(metrics);

        // Log del mensaje JSON antes de enviarlo
        logger.info("Mensaje JSON para WebSocket: " + message);

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
}
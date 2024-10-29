package com.odiparpack.websocket;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.odiparpack.models.SimulationState;
import org.eclipse.jetty.websocket.api.Session;
import org.eclipse.jetty.websocket.api.annotations.*;

import java.io.IOException;
import java.util.Map;
import java.util.Queue;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

import static com.odiparpack.Main.logger;

@WebSocket
public class VehicleWebSocketHandler {
    private static class SessionInfo {
        final Session session;
        long lastUpdateTime;
        int missedUpdates;

        SessionInfo(Session session) {
            this.session = session;
            this.lastUpdateTime = System.currentTimeMillis();
            this.missedUpdates = 0;
        }
    }
    private static final Gson gson = new Gson();
    private static final Map<Session, SessionInfo> sessions = new ConcurrentHashMap<>();
    private static final int MAX_MISSED_UPDATES = 5;
    private static final Queue<JsonObject> positionBuffer = new ConcurrentLinkedQueue<>();
    private static final int BUFFER_SIZE = 5;

    @OnWebSocketConnect
    public void onConnect(Session session) {
        sessions.put(session, new SessionInfo(session));
        System.out.println("Cliente conectado: " + session.getRemoteAddress().getAddress());
    }

    @OnWebSocketClose
    public void onClose(Session session, int statusCode, String reason) {
        sessions.remove(session);
        System.out.println("Cliente desconectado: " + session.getRemoteAddress().getAddress());
    }

    public static void broadcastVehiclePositions(JsonObject positions) {
        // Mantener un buffer de posiciones recientes
        positionBuffer.offer(positions);
        while (positionBuffer.size() > BUFFER_SIZE) {
            positionBuffer.poll();
        }

        String message = gson.toJson(positions);
        long currentTime = System.currentTimeMillis();

        sessions.entrySet().removeIf(entry -> {
            SessionInfo info = entry.getValue();
            Session session = entry.getKey();

            if (!session.isOpen() || info.missedUpdates >= MAX_MISSED_UPDATES) {
                return true;
            }

            try {
                session.getRemote().sendString(message);
                info.lastUpdateTime = currentTime;
                info.missedUpdates = 0;
                return false;
            } catch (IOException e) {
                info.missedUpdates++;
                logger.warning("Error sending to session: " + e.getMessage());
                return false;
            }
        });
    }
}

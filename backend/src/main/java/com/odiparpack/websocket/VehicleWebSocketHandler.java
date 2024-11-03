package com.odiparpack.websocket;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
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
public class VehicleWebSocketHandler extends BaseWebSocketHandler {
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

    private static final Map<Session, SessionInfo> sessions = new ConcurrentHashMap<>();
    private static final int MAX_MISSED_UPDATES = 3;
    private static final Gson gson = new GsonBuilder()
            .disableHtmlEscaping()
            .create();

    @Override
    protected void handleConnect(Session session) {
        sessions.put(session, new SessionInfo(session));
    }

    @Override
    protected void handleDisconnect(Session session) {
        sessions.remove(session);
    }

    @Override
    protected void broadcastMessage(JsonObject positions) {
        broadcastVehiclePositions(positions);
    }

    public static void broadcastVehiclePositions(JsonObject positions) {
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
                return info.missedUpdates >= MAX_MISSED_UPDATES;
            }
        });
    }
}

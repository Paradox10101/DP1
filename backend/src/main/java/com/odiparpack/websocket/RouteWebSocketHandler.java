package com.odiparpack.websocket;

import com.google.gson.JsonObject;
import org.eclipse.jetty.websocket.api.Session;
import org.eclipse.jetty.websocket.api.annotations.OnWebSocketMessage;
import org.eclipse.jetty.websocket.api.annotations.WebSocket;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;

@WebSocket
public class RouteWebSocketHandler extends BaseWebSocketHandler{
    private static final Set<Session> sessions = new CopyOnWriteArraySet<>();
    private static final Object lock = new Object();
    private static JsonObject lastRouteList;
    private static String lastClientMessage = null;

    @Override
    protected void handleConnect(Session session) {
        sessions.add(session);
        // Enviar último estado conocido al nuevo cliente
        if (lastRouteList != null) {
            try {
                session.getRemote().sendString(gson.toJson(lastRouteList));
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
    protected void broadcastMessage(JsonObject routes) {
        broadcastRoutes(routes);
    }

    @OnWebSocketMessage
    public void handleMessage(Session session, String message) {
        System.out.println("Mensaje recibido del cliente: " + message);
        lastClientMessage = message;
    }

    public static void broadcastRoutes(JsonObject routeList) {
        // Si se proporciona una cadena opcional, agrégala al JSON con la clave "message"
        lastRouteList = routeList; // Actualizar cache
        String message = gson.toJson(routeList);

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
                logger.warning("Error sending blocked and current routes to session: " + e.getMessage());
                return true;
            }
        });
    }

}
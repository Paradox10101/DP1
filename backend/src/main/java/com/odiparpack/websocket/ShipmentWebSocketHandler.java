package com.odiparpack.websocket;
import com.google.gson.JsonObject;
import org.eclipse.jetty.websocket.api.Session;
import org.eclipse.jetty.websocket.api.annotations.*;

import javax.swing.plaf.synth.SynthTextAreaUI;
import java.io.IOException;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;

@WebSocket
public class ShipmentWebSocketHandler extends BaseWebSocketHandler{
    private static final Set<Session> sessions = new CopyOnWriteArraySet<>();
    private static final Object lock = new Object();
    private static JsonObject lastShipmentList;
    private static String lastClientMessage = null;

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

    @OnWebSocketMessage
    public void handleMessage(Session session, String message) {
        System.out.println("Mensaje recibido del cliente: " + message);
        lastClientMessage = message;
    }

    public static void broadcastShipments(JsonObject shipmentList) {
        // Si se proporciona una cadena opcional, agrégala al JSON con la clave "message"
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

    public static String getLastClientMessage() {
        return lastClientMessage;
    }

}

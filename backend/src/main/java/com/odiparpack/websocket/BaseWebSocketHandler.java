package com.odiparpack.websocket;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import org.eclipse.jetty.websocket.api.Session;
import org.eclipse.jetty.websocket.api.annotations.*;

import java.util.logging.Logger;

public abstract class BaseWebSocketHandler {
    protected static final Logger logger = Logger.getLogger(BaseWebSocketHandler.class.getName());
    protected static final Gson gson = new Gson();

    @OnWebSocketConnect
    public void onConnect(Session session) {
        // Establecer el tiempo de espera de inactividad a 10 minutos (600,000 ms)
        session.getPolicy().setIdleTimeout(600000);
        handleConnect(session);
        logger.info("Nueva conexión WebSocket establecida: " + session.getRemoteAddress().getAddress());
    }

    @OnWebSocketClose
    public void onClose(Session session, int statusCode, String reason) {
        handleDisconnect(session);
        logger.info("Conexión WebSocket cerrada: " + session.getRemoteAddress().getAddress());
    }

    @OnWebSocketError
    public void onError(Session session, Throwable error) {
        logger.severe("Error en la conexión WebSocket: " + error.getMessage());
        // Aquí puedes añadir lógica adicional para manejar el error
    }

    // Métodos abstractos que las implementaciones deben definir
    protected abstract void handleConnect(Session session);
    protected abstract void handleDisconnect(Session session);
    protected abstract void broadcastMessage(JsonObject data);
}
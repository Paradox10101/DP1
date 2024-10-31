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
import java.util.concurrent.CopyOnWriteArraySet;
import java.util.logging.Logger;

public abstract class BaseWebSocketHandler {
    protected static final Logger logger = Logger.getLogger(BaseWebSocketHandler.class.getName());
    protected static final Gson gson = new Gson();

    @OnWebSocketConnect
    public void onConnect(Session session) {
        handleConnect(session);
        logger.info("Nueva conexión WebSocket establecida: " + session.getRemoteAddress().getAddress());
    }

    @OnWebSocketClose
    public void onClose(Session session, int statusCode, String reason) {
        handleDisconnect(session);
        logger.info("Conexión WebSocket cerrada: " + session.getRemoteAddress().getAddress());
    }

    // Métodos abstractos que las implementaciones deben definir
    protected abstract void handleConnect(Session session);
    protected abstract void handleDisconnect(Session session);
    protected abstract void broadcastMessage(JsonObject data);
}
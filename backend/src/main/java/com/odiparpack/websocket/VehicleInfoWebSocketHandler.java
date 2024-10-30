package com.odiparpack.websocket;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.odiparpack.models.*;
import org.eclipse.jetty.websocket.api.Session;
import org.eclipse.jetty.websocket.api.annotations.*;

import java.io.IOException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@WebSocket
public class VehicleInfoWebSocketHandler {

    private static Set<Session> sessions = ConcurrentHashMap.newKeySet();
    private static Gson gson = new Gson();
    private static SimulationState simulationState;

    public VehicleInfoWebSocketHandler() {
        // No-arg constructor required by Spark
    }

    // Provide a setter for simulationState
    public static void setSimulationState(SimulationState state) {
        simulationState = state;
    }

    public VehicleInfoWebSocketHandler(SimulationState state) {
        simulationState = state;
    }

    @OnWebSocketConnect
    public void onConnect(Session session) {
        sessions.add(session);
        System.out.println("Cliente conectado: " + session.getRemoteAddress().getAddress());
    }

    @OnWebSocketClose
    public void onClose(Session session, int statusCode, String reason) {
        sessions.remove(session);
        System.out.println("Cliente desconectado: " + session.getRemoteAddress().getAddress());
    }

    @OnWebSocketMessage
    public void onMessage(Session session, String message) {
        // Manejar mensajes entrantes si es necesario
    }

    @OnWebSocketError
    public void onError(Session session, Throwable error) {
        System.err.println("Error en WebSocket: " + error.getMessage());
    }

    //envios de estados de los envios
    public static void broadcastVehicles() {
        // Retrieve all vehicles from the simulation state
        Map<String, Vehicle> vehicles = simulationState.getVehicles();
        LocalDateTime simulationTime = simulationState.getCurrentTime();
        JsonObject featureCollection = new JsonObject();
        // Prepare a JSON array to hold the formatted vehicle information
        JsonArray vehicleArray = new JsonArray();
        for (Vehicle vehicle : vehicles.values()) {
            Position currentPosition = vehicle.getCurrentPosition(simulationTime);
            String currentLocation = vehicle.getCurrentLocationUbigeo();
            String nextLocation = vehicle.getRoute() != null && !vehicle.getRoute().isEmpty() && vehicle.getCurrentSegmentIndex() < vehicle.getRoute().size()
                    ? vehicle.getRoute().get(vehicle.getCurrentSegmentIndex()).getToUbigeo()
                    : "Unknown";

            // Calculate remaining time
            //Duration remainingTime = Duration.between(simulationTime, vehicle.estimatedDeliveryTime);

            long days = 24; //hardcode
            long hours = 8; //hardcode
            //long days = remainingTime.toDays();
            //long hours = remainingTime.toHours() % 24;

            // Prepare vehicle data in JSON format
            JsonObject vehicleJson = new JsonObject();
            vehicleJson.addProperty("id", Integer.parseInt(vehicle.getCode().replaceAll("\\D+", ""))); // Extract numeric ID from code
            JsonArray geocode = new JsonArray();
            geocode.add(currentPosition.getLongitude());
            geocode.add(currentPosition.getLatitude());
            vehicleJson.add("geocode", geocode);
            vehicleJson.addProperty("ubicacionActual", currentLocation);
            vehicleJson.addProperty("ubicacionSiguiente", nextLocation);
            //vehicleJson.addProperty("fechaDeInicio", vehicle.getJourneyStartTime().format(DateTimeFormatter.ofPattern("dd/MM/yyyy, hh:mm a")));
            vehicleJson.addProperty("tiempoRestante", String.format("%dd %dh", days, hours));
            vehicleJson.addProperty("capacidadUsada", vehicle.getCurrentOrder() != null ? vehicle.getCurrentOrder().getDeliveredPackages() : 0);
            vehicleJson.addProperty("capacidadMaxima", vehicle.getCapacity());
            vehicleJson.addProperty("estado", vehicle.getEstado().toString());
            vehicleJson.addProperty("codigo", vehicle.getCode());
            ///vehicleJson.addProperty("velocidad", vehicle.getStatus().getCurrentSpeed());
            vehicleJson.addProperty("tipo", vehicle.getType());
            //vehicleJson.addProperty("fechaEstimadaLlegada", vehicle.estimatedDeliveryTime.format(DateTimeFormatter.ofPattern("dd/MM/yyyy hh:mm a")));
            vehicleArray.add(vehicleJson);
        }
        featureCollection.addProperty("type", "FeatureCollection");
        featureCollection.add("features", vehicleArray);
        broadcast(featureCollection.toString());
    }

    private static void broadcast(String message) {
        for (Session session : sessions) {
            if (session.isOpen()) {
                try {
                    session.getRemote().sendString(message);
                } catch (IOException e) {
                    System.err.println("(WebSocket de vehiculos) Error al enviar mensaje: " + e.getMessage());
                }
            }
        }
    }
}

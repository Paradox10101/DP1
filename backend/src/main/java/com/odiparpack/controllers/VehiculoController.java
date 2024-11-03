package com.odiparpack.controllers;

import com.google.gson.Gson;
import com.odiparpack.models.*;
import com.odiparpack.models.Vehicle.EstadoVehiculo;

import spark.Service;

import java.util.List;
import java.util.Map;

import static spark.Spark.*;

public class VehiculoController {
    private final SimulationState simulationState;
    private final Gson gson = new Gson();

    public VehiculoController(SimulationState simulationState) {
        this.simulationState = simulationState;
        setupRoutes();
    }

    private void setupRoutes() {
        // Middleware para manejo de CORS
        options("/*", (request, response) -> {
            String accessControlRequestHeaders = request.headers("Access-Control-Request-Headers");
            if (accessControlRequestHeaders != null) {
                response.header("Access-Control-Allow-Headers", accessControlRequestHeaders);
            }

            String accessControlRequestMethod = request.headers("Access-Control-Request-Method");
            if (accessControlRequestMethod != null) {
                response.header("Access-Control-Allow-Methods", accessControlRequestMethod);
            }

            return "OK";
        });

        before((request, response) -> {
            response.header("Access-Control-Allow-Origin", "*");
            response.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            response.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
        });

        // Endpoint para obtener el estado de todos los vehículos
        get("/vehicles", (request, response) -> {
            Map<String, Vehicle> vehicles = simulationState.getVehicles();
            response.type("application/json");
            return gson.toJson(vehicles);
        });

        // Endpoint para reiniciar la simulación
        post("/resetSimulation", (request, response) -> {
            try {
                simulationState.reset();
                response.status(200);
                return "Simulación reiniciada con éxito.";
            } catch (Exception e) {
                response.status(500);
                return "Error al reiniciar la simulación: " + e.getMessage();
            }
        });

        // Endpoint para obtener el estado de un vehículo específico
        get("/vehicleState/:vehicleCode", (request, response) -> {
            String vehicleCode = request.params(":vehicleCode");
            EstadoVehiculo vehicleState = simulationState.getVehicles().get(vehicleCode).getEstado();
            
            if (vehicleState == null) {
                response.status(404);
                return "No se encontró el estado del vehículo con código " + vehicleCode;
            }

            response.type("application/json");
            return gson.toJson(vehicleState);
        });

        // Endpoint para asignar una orden a un vehículo
        post("/assignOrder", (request, response) -> {
            String vehicleCode = request.queryParams("vehicleCode");
            String orderId = request.queryParams("orderId");
            int assignedQuantity = Integer.parseInt(request.queryParams("quantity"));

            if (vehicleCode == null || orderId == null) {
                response.status(400);
                return "Parámetros faltantes: vehicleCode y orderId son obligatorios.";
            }

            Vehicle vehicle = simulationState.getVehicles().get(vehicleCode);
            Order order = simulationState.getOrders().stream()
                    .filter(o -> o.getId() == Integer.parseInt(orderId))
                    .findFirst()
                    .orElse(null);

            if (vehicle == null) {
                response.status(404);
                return "No se encontró el vehículo con código " + vehicleCode;
            }
            
            if (order == null) {
                response.status(404);
                return "No se encontró la orden con ID " + orderId;
            }

            VehicleAssignment assignment = new VehicleAssignment(vehicle, order, assignedQuantity);
            simulationState.getVehicles().get(vehicleCode).startJourney(simulationState.getCurrentTime(), order);
            
            response.status(200);
            return "Orden asignada al vehículo con éxito.";
        });

       

        // Endpoint para actualizar el estado de un vehículo (ej. en tránsito o disponible)
        put("/vehicleStatus/:vehicleCode", (request, response) -> {
            String vehicleCode = request.params(":vehicleCode");
            EstadoVehiculo vehicleState = simulationState.getVehicles().get(vehicleCode).getEstado();

            if (vehicleState == null) {
                response.status(404);
                return "No se encontró el estado del vehículo con código " + vehicleCode;
            }

            String newUbigeo = request.queryParams("currentUbigeo");
            boolean inTransit = Boolean.parseBoolean(request.queryParams("inTransit"));

            if (newUbigeo != null) {
                //vehicleState.setCurrentUbigeo(newUbigeo);
            }

            //vehicleState.setInTransit(inTransit);
            response.status(200);
            return "Estado del vehículo actualizado con éxito.";
        });

        // Endpoint para obtener el log de averías por vehículo
        get("/vehicleBreakdowns/:vehicleCode", (request, response) -> {
            String vehicleCode = request.params(":vehicleCode");
            List<String> breakdownLogs = SimulationState.breakdownLogs.get(vehicleCode);

            if (breakdownLogs == null) {
                response.status(404);
                return "No se encontraron logs de averías para el vehículo con código " + vehicleCode;
            }

            response.type("application/json");
            return gson.toJson(breakdownLogs);
        });

        // Manejador de excepciones
        exception(Exception.class, (exception, request, response) -> {
            exception.printStackTrace();
            response.status(500);
            response.body("Error interno del servidor: " + exception.getMessage());
        });

        after((request, response) -> {
            System.out.println("Respuesta enviada para " + request.pathInfo() + " con estado " + response.status());
        });
    }
}

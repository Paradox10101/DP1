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
            List<Vehicle> vehicles = simulationState.getVehicles();
            response.type("application/json");
            return gson.toJson(vehicles);
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

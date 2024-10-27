package com.odiparpack.controllers;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.odiparpack.models.Location;
import com.odiparpack.services.LocationService;
import spark.Route;

import java.util.List;

import static spark.Spark.get;

public class EnvioController {
    private final LocationService locationService = LocationService.getInstance();
    private final Gson gson = new Gson();

    public EnvioController() {
        setupRoutes();
    }

    private void setupRoutes() {
        //get("/envios", getAllEnvios);
    }

    // Endpoint para obtener listado de almacenes
    private final Route getAllEnvios = (request, response) -> {
        response.type("application/json");

        JsonArray envios = new JsonArray();
        JsonObject envioInfo = new JsonObject();
        envioInfo.addProperty("ubigeo", "uno");
        envioInfo.addProperty("province", "dos");
        /*
        for (String ubigeo : almacenesPrincipales) {
            Location location = locationService.getLocation(ubigeo);
            if (location != null) {
                JsonObject almacenInfo = new JsonObject();
                almacenInfo.addProperty("ubigeo", ubigeo);
                almacenInfo.addProperty("province", location.getProvince());
                almacenInfo.addProperty("latitude", location.getLatitude());
                almacenInfo.addProperty("longitude", location.getLongitude());
                almacenInfo.addProperty("type", "Almacen Principal");
                envios.add(almacenInfo);
            } else {
                System.err.println("Advertencia: No se encontró la ubicación para el ubigeo " + ubigeo);
            }
        }
        */
        envios.add(envioInfo);
        return gson.toJson(envios);
    };
}

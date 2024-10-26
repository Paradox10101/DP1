package com.odiparpack.controllers;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.odiparpack.models.Location;
import com.odiparpack.services.LocationService;
import spark.Route;

import java.util.List;
import static spark.Spark.*;

public class AlmacenController {
    private final LocationService locationService = LocationService.getInstance();
    private final Gson gson = new Gson();

    public AlmacenController() {
        setupRoutes();
    }

    private void setupRoutes() {
        get("/almacenes", getAllAlmacenes);
    }

    // Endpoint para obtener listado de almacenes
    private final Route getAllAlmacenes = (request, response) -> {
        response.type("application/json");

        // Lista de ubigeos que son almacenes principales (hardcodeado)
        List<String> almacenesPrincipales = List.of("150101", "040101", "130101"); // Lima, Arequipa, Trujillo

        JsonArray almacenes = new JsonArray();
        for (String ubigeo : almacenesPrincipales) {
            Location location = locationService.getLocation(ubigeo);
            if (location != null) {
                JsonObject almacenInfo = new JsonObject();
                almacenInfo.addProperty("ubigeo", ubigeo);
                almacenInfo.addProperty("province", location.getProvince());
                almacenInfo.addProperty("latitude", location.getLatitude());
                almacenInfo.addProperty("longitude", location.getLongitude());
                almacenInfo.addProperty("type", "Almacen Principal");
                almacenes.add(almacenInfo);
            } else {
                System.err.println("Advertencia: No se encontró la ubicación para el ubigeo " + ubigeo);
            }
        }

        return gson.toJson(almacenes);
    };
}
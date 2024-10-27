package com.odiparpack.controllers;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.odiparpack.services.LocationService;
import spark.Route;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import static spark.Spark.*;

public class OficinaController {
    private final LocationService locationService = LocationService.getInstance();
    private final Gson gson = new Gson();

    public OficinaController() {
        setupRoutes();
    }

    private void setupRoutes() {
        get("/oficinas", getAllOficinas);
    }

    // Endpoint para obtener listado de oficinas
    private final Route getAllOficinas = (request, response) -> {
        response.type("application/json");
        return gson.toJson(locationService.getAllLocations().values().stream()
                .filter(loc -> !isAlmacenPrincipal(loc.getUbigeo())) // Filtrar ubicaciones que no son almacenes
                                                                     // principales (es decir, oficinas)
                .map(loc -> {
                    JsonObject officeInfo = new JsonObject();
                    officeInfo.addProperty("ubigeo", loc.getUbigeo());
                    officeInfo.addProperty("department", loc.getDepartment());
                    officeInfo.addProperty("province", loc.getProvince());
                    officeInfo.addProperty("latitude", loc.getLatitude());
                    officeInfo.addProperty("longitude", loc.getLongitude());
                    officeInfo.addProperty("naturalRegion", loc.getNaturalRegion());
                    officeInfo.addProperty("capacityTotal", loc.getWarehouseCapacity()); // Capacidad total
                    officeInfo.addProperty("capacityCurrent", 0); // Capacidad actual inicia en 0
                    return officeInfo;
                })
                .collect(Collectors.toList()));
    };

    private boolean isAlmacenPrincipal(String ubigeo) {
        // Lista de ubigeos que son almacenes principales (hardcodeado)
        List<String> almacenesPrincipales = Collections.unmodifiableList(Arrays.asList("150101", "040101", "130101"));

        return almacenesPrincipales.contains(ubigeo);
    }
}
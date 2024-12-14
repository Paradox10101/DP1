package com.odiparpack.api.routers;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.odiparpack.models.Position;
import com.odiparpack.models.SimulationState;
import com.odiparpack.models.Vehicle;
import spark.Spark;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;

import static com.odiparpack.Main.logger;

public class VehicleRouter extends BaseRouter {
    public VehicleRouter() {
    }

    @Override
    public void setupRoutes() {
        // Ruta para obtener posición de un vehículo específico
        Spark.get("/api/v1/vehicles/position/:code", (request, response) -> {
            response.type("application/json");
            String vehicleCode = request.params(":code");
            return getVehiclePosition(vehicleCode);
        });

        // Ruta para obtener todas las posiciones
        Spark.get("/api/v1/vehicles/positions", (request, response) -> {
            response.type("application/json");
            return getAllVehiclePositions();
        });

        // Ruta para provocar averías
        Spark.post("/api/v1/vehicles/breakdown", (request, response) -> {
            String vehicleCode = request.queryParams("vehicleCode");
            String breakdownType = request.queryParams("breakdownType");

            if (vehicleCode == null || breakdownType == null) {
                response.status(400);
                return "{\"error\": \"vehicleCode y breakdownType son requeridos\"}";
            }

            simulationState.provocarAveria(vehicleCode, breakdownType);
            return "{\"message\": \"Avería provocada exitosamente\"}";
        });

        // Ruta para obtener historial de averías
        Spark.get("/api/v1/vehicles/breakdown/history/:code", (request, response) -> {
            response.type("application/json");
            String vehicleCode = request.params(":code");
            List<String> logs = simulationState.getBreakdownLogs().get(vehicleCode);

            if (logs == null || logs.isEmpty()) {
                response.status(404);
                return "{\"error\": \"No hay historial de averías para este vehículo\"}";
            }

            return toJson(logs);
        });

        // Ruta para carga masiva de vehículos
        Spark.post("/api/v1/config/vehiculos/upload", (request, response) -> {
            response.type("application/json");
            JsonObject jsonResponse = new JsonObject();
            List<String> successfulRecords = new ArrayList<>();
            List<String> failedRecords = new ArrayList<>();

            try {
                JsonObject body = JsonParser.parseString(request.body()).getAsJsonObject();
                JsonArray records = body.getAsJsonArray("records");

                for (JsonElement elem : records) {
                    try {
                        JsonObject record = elem.getAsJsonObject();
                        String content = record.get("content").getAsString();

                        // Parsear el contenido (formato: CODIGO,TIPO,CAPACIDAD,UBIGEO)
                        String[] parts = content.split(",");
                        if (parts.length != 4) {
                            throw new IllegalArgumentException("Formato inválido");
                        }

                        String code = parts[0].trim();
                        String type = parts[1].trim();
                        int capacity = Integer.parseInt(parts[2].trim());
                        String ubigeo = parts[3].trim();

                        // Validaciones
                        if (!code.matches("[A-C]\\d{3}")) {
                            throw new IllegalArgumentException("Código inválido");
                        }
                        if (!type.matches("[A-C]")) {
                            throw new IllegalArgumentException("Tipo inválido");
                        }
                        if (capacity <= 0) {
                            throw new IllegalArgumentException("Capacidad inválida");
                        }
                        if (!ubigeo.matches("\\d{6}")) {
                            throw new IllegalArgumentException("Ubigeo inválido");
                        }

                        // Verificar que el código comience con el tipo
                        if (!code.startsWith(type)) {
                            throw new IllegalArgumentException("El código debe empezar con el tipo de vehículo");
                        }

                        // Crear y registrar el vehículo
                        Vehicle vehicle = new Vehicle(
                                code,
                                type,
                                capacity,
                                ubigeo
                        );
                        successfulRecords.add(code);

                    } catch (Exception e) {
                        logger.log(Level.WARNING, "Error processing vehicle record", e);
                        failedRecords.add(elem.toString() + " - Error: " + e.getMessage());
                    }
                }

                // Preparar respuesta
                jsonResponse.addProperty("success", true);
                jsonResponse.addProperty("totalProcessed", records.size());
                jsonResponse.addProperty("successfulCount", successfulRecords.size());
                jsonResponse.addProperty("failedCount", failedRecords.size());

                JsonArray successfulArray = new JsonArray();
                successfulRecords.forEach(successfulArray::add);
                jsonResponse.add("successfulRecords", successfulArray);

                JsonArray failedArray = new JsonArray();
                failedRecords.forEach(failedArray::add);
                jsonResponse.add("failedRecords", failedArray);

                response.status(200);
                return jsonResponse;

            } catch (Exception e) {
                logger.log(Level.SEVERE, "Error processing vehicles bulk upload", e);
                response.status(400);
                jsonResponse.addProperty("success", false);
                jsonResponse.addProperty("error", "Error en la carga masiva: " + e.getMessage());
                return jsonResponse;
            }
        });
    }

    private JsonObject getVehiclePosition(String vehicleCode) {
        Vehicle vehicle = simulationState.findVehicleByCode(simulationState.getVehicles(), vehicleCode);
        if (vehicle == null) {
            return createErrorResponse("Vehículo no encontrado");
        }

        Position position = vehicle.getCurrentPosition(simulationState.getCurrentTime(), simulationState.getSimulationType());
        if (position == null) {
            return createErrorResponse("Posición no disponible");
        }

        return createPositionResponse(vehicleCode, position);
    }

    private JsonObject getAllVehiclePositions() {
        JsonObject featureCollection = new JsonObject();
        featureCollection.addProperty("type", "FeatureCollection");
        JsonArray features = new JsonArray();

        for (Vehicle vehicle : simulationState.getVehicles()) {
            Position position = vehicle.getCurrentPosition(simulationState.getCurrentTime(), simulationState.getSimulationType());
            if (position != null) {
                features.add(createFeature(vehicle.getCode(), position));
            }
        }

        featureCollection.add("features", features);
        return featureCollection;
    }

    private JsonObject createFeature(String vehicleCode, Position position) {
        JsonObject feature = new JsonObject();
        feature.addProperty("type", "Feature");

        JsonObject geometry = new JsonObject();
        geometry.addProperty("type", "Point");
        JsonArray coordinates = new JsonArray();
        coordinates.add(position.getLongitude());
        coordinates.add(position.getLatitude());
        geometry.add("coordinates", coordinates);

        JsonObject properties = new JsonObject();
        properties.addProperty("vehicleCode", vehicleCode);

        feature.add("geometry", geometry);
        feature.add("properties", properties);

        return feature;
    }

    private JsonObject createErrorResponse(String message) {
        JsonObject error = new JsonObject();
        error.addProperty("error", message);
        return error;
    }

    private JsonObject createPositionResponse(String vehicleCode, Position position) {
        JsonObject feature = new JsonObject();
        feature.addProperty("type", "Feature");

        JsonObject geometry = new JsonObject();
        geometry.addProperty("type", "Point");
        JsonArray coordinates = new JsonArray();
        coordinates.add(position.getLongitude());
        coordinates.add(position.getLatitude());
        geometry.add("coordinates", coordinates);
        feature.add("geometry", geometry);

        JsonObject properties = new JsonObject();
        properties.addProperty("vehicleCode", vehicleCode);
        feature.add("properties", properties);

        return feature;
    }
}

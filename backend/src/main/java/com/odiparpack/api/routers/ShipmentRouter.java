package com.odiparpack.api.routers;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.odiparpack.models.Order;
import com.odiparpack.models.Position;
import com.odiparpack.models.SimulationState;
import com.odiparpack.models.Vehicle;
import spark.Spark;

import java.time.Duration;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

public class ShipmentRouter extends BaseRouter {

    public ShipmentRouter() {
    }

    @Override
    public void setupRoutes() {
        // Ruta para obtener posición de un vehículo específico
        Spark.get("/api/v1/shipments", (request, response) -> {
            List<Order>orders = simulationState.getOrders();
            JsonObject featureCollection = new JsonObject();
            featureCollection.addProperty("type", "FeatureCollection");
            JsonArray features = new JsonArray();
            JsonObject feature = new JsonObject();
            for (Order order : orders) {
                feature.addProperty("orderCode", order.getId());
                feature.addProperty("startTime", order.getOrderTime().format(DateTimeFormatter.ofPattern("dd/MM/yy HH:mm")));
                feature.addProperty("remainingTimeDays", Duration.between(order.getOrderTime(), order.getDueTime()).toDays());
                feature.addProperty("remainingTimeHours", Duration.between(order.getOrderTime(), order.getDueTime()).toHours() % 24);
                feature.addProperty("remainingTimeMinutes", Duration.between(order.getOrderTime(), order.getDueTime()).toMinutes() % 60);
                feature.addProperty("originUbigeo", order.getOriginUbigeo());
                feature.addProperty("destinyUbigeo", order.getDestinationUbigeo());
                feature.addProperty("remainingPackages", order.getQuantity());
                feature.addProperty("status", order.getStatus().toString());

                features.add(feature);
            }
            featureCollection.add("features", features);
            response.type("application/json");
            return gson.toJson(featureCollection);
        });

        /*
        // Ruta para obtener todas las posiciones
        Spark.get("/api/v1/vehicles/positions", (request, response) -> {
            response.type("application/json");
            return getAllVehiclePositions();
        });
        */

        /*
        // Ruta para provocar averías
        Spark.post("/api/v1/vehicles/breakdown", (request, response) -> {
            String vehicleCode = request.queryParams("vehicleCode");

            if (vehicleCode == null || breakdownType == null) {
                response.status(400);
                return "{\"error\": \"vehicleCode y breakdownType son requeridos\"}";
            }

            simulationState.provocarAveria(vehicleCode, breakdownType);
            return "{\"message\": \"Avería provocada exitosamente\"}";
        });
        */
    }
}


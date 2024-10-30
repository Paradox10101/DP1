package com.odiparpack.api.routers;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.odiparpack.models.*;
import spark.Spark;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

public class ShipmentRouter extends BaseRouter {
    private final SimulationState simulationState;

    public ShipmentRouter(SimulationState simulationState) {
        this.simulationState = simulationState;
    }

    @Override
    public void setupRoutes() {
        // Ruta para obtener posición de un vehículo específico
        Spark.get("/api/v1/shipments", (request, response) -> {
            List<Order>orders = simulationState.getOrders();
            Map<String, Location>locations = simulationState.getLocations();
            JsonObject featureCollection = new JsonObject();
            featureCollection.addProperty("type", "FeatureCollection");
            JsonArray features = new JsonArray();
            JsonObject feature = new JsonObject();
            for (Order order : orders) {
                String status = order.getStatus().toString();
                feature.addProperty("orderCode", order.getId());
                feature.addProperty("startTime", order.getOrderTime().format(DateTimeFormatter.ofPattern("dd/MM/yy HH:mm")));
                if(!order.getStatus().equals(Order.OrderStatus.DELIVERED)){
                    feature.addProperty("remainingTimeDays",  Duration.between(simulationState.getCurrentTime(), order.getDueTime()).toDays());
                    feature.addProperty("remainingTimeHours", Duration.between(simulationState.getCurrentTime(), order.getDueTime()).toHours() % 24);
                }
                else{
                        feature.addProperty("remainingTimeDays", "--");
                        feature.addProperty("remainingTimeHours", "--");
                }

                feature.addProperty("originCity", locations.get(order.getOriginUbigeo()).getProvince());
                feature.addProperty("destinyCity", locations.get(order.getDestinationUbigeo()).getProvince());
                feature.addProperty("remainingPackages", order.getQuantity());
                feature.addProperty("status", status);
                features.add(feature);
            }
            featureCollection.add("features", features);
            response.type("application/json");
            return gson.toJson(featureCollection);
        });



        // Ruta para provocar averías
        Spark.post("/api/v1/shipment", (request, response) -> {
            response.type("application/json");
            String orderIdSelected = request.queryParams("orderId");

            Optional<Order> order = simulationState.getOrders().stream()
                    .filter(ordenS -> ordenS.getId() == Integer.parseInt(orderIdSelected))
                    .findFirst();

            if(!order.isPresent()){
                response.status(400);
                return "{\"error\": \"Se debe ingresar un id de orden valido\"}";
            }
            Map<String, Location>locations = simulationState.getLocations();
            JsonObject featureCollection = new JsonObject();
            featureCollection.addProperty("type", "FeatureCollection");
            JsonObject feature = new JsonObject();
            String status = order.get().getStatus().toString();
            JsonArray transportPlans = new JsonArray();

            feature.addProperty("orderCode", order.get().getId());
            feature.addProperty("startTime", order.get().getOrderTime().format(DateTimeFormatter.ofPattern("dd/MM/yy HH:mm")));
            if(!order.get().getStatus().equals(Order.OrderStatus.DELIVERED)){
                feature.addProperty("remainingTimeDays",  Duration.between(simulationState.getCurrentTime(), order.get().getDueTime()).toDays());
                feature.addProperty("remainingTimeHours", Duration.between(simulationState.getCurrentTime(), order.get().getDueTime()).toHours() % 24);
            }
            else{
                feature.addProperty("remainingTimeDays", "--");
                feature.addProperty("remainingTimeHours", "--");
            }
            feature.addProperty("originCity", locations.get(order.get().getOriginUbigeo()).getProvince());
            feature.addProperty("destinyCity", locations.get(order.get().getDestinationUbigeo()).getProvince());
            feature.addProperty("originUbigeo", locations.get(order.get().getOriginUbigeo()).getUbigeo());
            feature.addProperty("destinyUbigeo", locations.get(order.get().getDestinationUbigeo()).getUbigeo());
            feature.addProperty("totalPackages", order.get().getQuantity());
            feature.addProperty("destinyRegion", locations.get(order.get().getDestinationUbigeo()).getNaturalRegion());
            feature.addProperty("status", status);

            List<Vehicle> associatedVehicles = simulationState.getVehicles().values().stream()
                    .filter(vehicle -> vehicle.getCurrentOrder() != null)
                    .filter(vehicle -> vehicle.getCurrentOrder().getId()==(order.get().getId()))
                    .collect(Collectors.toList());

            for(Vehicle associatedVehicle : associatedVehicles) {
                JsonObject transportPlan = new JsonObject();
                transportPlan.addProperty("type", "TransportPlan");
                transportPlan.addProperty("vehicleCode",associatedVehicle.getCode());
                transportPlan.addProperty("inTransportPackages",order.get().getQuantity() - associatedVehicle.getCurrentOrder().getDeliveredPackages());
                transportPlan.addProperty("attendedPackages",associatedVehicle.getCurrentOrder().getDeliveredPackages());
                transportPlans.add(transportPlan);
            }
            feature.add("transportPlans", transportPlans);
            featureCollection.add("feature", feature);
            return featureCollection.toString();
        });

    }
}


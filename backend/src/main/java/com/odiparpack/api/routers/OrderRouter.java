package com.odiparpack.api.routers;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.odiparpack.DataLoader;
import com.odiparpack.models.*;
import com.odiparpack.services.LocationService;
import spark.Spark;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.stream.Collectors;

public class OrderRouter extends BaseRouter {
    private static final Logger logger = Logger.getLogger(OrderRouter.class.getName());

    @Override
    public void setupRoutes() {
        Spark.post("/api/v1/orders/register", (request, response) -> {
            response.type("application/json");
            JsonObject jsonResponse = new JsonObject();
            List<String> successfulRecords = new ArrayList<>();
            List<String> failedRecords = new ArrayList<>();

            try {
                // Parse request body
                JsonObject body = JsonParser.parseString(request.body()).getAsJsonObject();
                DataLoader dataLoader = new DataLoader();
                LocationService locationService = LocationService.getInstance();

                try {
                    // Parse order datetime
                    String dateTimeStr = body.get("orderDateTime").getAsString();
                    LocalDateTime orderDateTime = ZonedDateTime.parse(dateTimeStr)
                            .toLocalDateTime();

                    // Get location information
                    String destinationUbigeo = body.get("destinationUbigeo").getAsString();
                    int quantity = body.get("quantity").getAsInt();

                    // Calculate delivery date
                    LocalDateTime dueTime = dataLoader.calculateDueDate(
                            orderDateTime,
                            destinationUbigeo,
                            locationService.getAllLocations()
                    );

                    // Create order
                    Order order = new Order(
                            OrderRegistry.getNextId(),
                            "******", // fixed origin with asterisks
                            destinationUbigeo,
                            quantity,
                            orderDateTime,
                            dueTime,
                            "SYSTEM" // default clientId
                    );

                    // Generate and set order code
                    String orderCode = String.format("ORD%07d", order.getId());
                    order.setOrderCode(orderCode);
                    order.setStatus(Order.OrderStatus.REGISTERED);

                    // Register the order
                    OrderRegistry.addOrder(order);

                    // Get SimulationState and add the order if simulation is running
                    if (simulationState != null && !simulationState.isStopped()) {
                        simulationState.addNewOrder(order);
                        logger.info("Nueva orden " + orderCode + " agregada a la simulación en tiempo real");
                    } else {
                        logger.warning("No se pudo agregar la orden a la simulación: simulación no está activa");
                    }

                    // Add to successful records
                    successfulRecords.add(orderCode);

                } catch (Exception e) {
                    logger.log(Level.WARNING, "Error processing order", e);
                    failedRecords.add(body.toString() + " - Error: " + e.getMessage());
                }

                // Prepare response
                jsonResponse.addProperty("success", true);
                jsonResponse.addProperty("totalProcessed", 1);
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
                logger.log(Level.SEVERE, "Error processing order registration", e);
                response.status(400);
                jsonResponse.addProperty("success", false);
                jsonResponse.addProperty("error", "Error al registrar el pedido: " + e.getMessage());
                return jsonResponse;
            }
        });

        Spark.post("/api/v1/orders/bulk-upload", (request, response) -> {
            response.type("application/json");
            JsonObject jsonResponse = new JsonObject();
            List<String> successfulRecords = new ArrayList<>();
            List<String> failedRecords = new ArrayList<>();

            try {
                // Parse request body
                JsonObject body = JsonParser.parseString(request.body()).getAsJsonObject();
                JsonArray records = body.getAsJsonArray("validRecords");

                DataLoader dataLoader = new DataLoader();
                LocationService locationService = LocationService.getInstance();

                // Procesar cada registro
                for (JsonElement elem : records) {
                    try {
                        JsonObject record = elem.getAsJsonObject();

                        // Obtener información de ubicación
                        String destinationUbigeo = record.get("destinationUbigeo").getAsString();

                        // Validar si el ubigeo existe
                        Location destinationLocation = locationService.getLocation(destinationUbigeo);
                        if (destinationLocation == null) {
                            throw new IllegalArgumentException("Ubigeo destino no encontrado: " + destinationUbigeo);
                        }

                        // Parse order datetime
                        String dateTimeStr = record.get("isoDate").getAsString();
                        LocalDateTime orderDateTime = ZonedDateTime.parse(dateTimeStr)
                                .toLocalDateTime();

                        int quantity = record.get("quantity").getAsInt();

                        // Calcular fecha de entrega
                        LocalDateTime dueTime = dataLoader.calculateDueDate(
                                orderDateTime,
                                destinationUbigeo,
                                locationService.getAllLocations()
                        );

                        // Crear orden
                        Order order = new Order(
                                OrderRegistry.getNextId(),
                                "******", // origen fijo con asteriscos
                                destinationUbigeo,
                                quantity,
                                orderDateTime,
                                dueTime,
                                "SYSTEM" // clientId por defecto
                        );

                        // Generar y establecer código de orden
                        String orderCode = String.format("ORD%07d", order.getId());
                        order.setOrderCode(orderCode);
                        order.setStatus(Order.OrderStatus.REGISTERED);

                        // Registrar la orden
                        OrderRegistry.addOrder(order);

                        // Get SimulationState and add the order if simulation is running
                        if (simulationState != null &&
                                simulationState.getSimulationType() == SimulationRouter.SimulationType.DAILY
                                && !simulationState.isStopped()) {
                            simulationState.addNewOrder(order);
                            logger.info("Nueva orden " + orderCode + " agregada a la simulación en tiempo real");
                        } else {
                            logger.warning("No se pudo agregar la orden a la simulación: simulación no está activa");
                        }

                        // Agregar a registros exitosos
                        successfulRecords.add(orderCode);

                    } catch (Exception e) {
                        logger.log(Level.WARNING, "Error processing record", e);
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
                logger.log(Level.SEVERE, "Error processing bulk upload", e);
                response.status(400);
                jsonResponse.addProperty("success", false);
                jsonResponse.addProperty("error", "Error en la carga masiva: " + e.getMessage());
                return jsonResponse;
            }
        });

        // Endpoint para obtener métricas de órdenes cargadas
        Spark.get("/api/v1/orders/metrics", (request, response) -> {
            response.type("application/json");
            JsonObject jsonResponse = new JsonObject();

            try {
                List<Order> orders = OrderRegistry.getAllOrders();

                // Filtrar órdenes que fueron cargadas por el sistema (bulk upload)
                List<Order> uploadedOrders = orders.stream()
                        .filter(order -> "SYSTEM".equals(order.getClientId()))
                        .collect(Collectors.toList());

                if (uploadedOrders.isEmpty()) {
                    jsonResponse.addProperty("success", true);
                    jsonResponse.addProperty("count", 0);
                    jsonResponse.addProperty("firstOrder", "");
                    jsonResponse.addProperty("lastOrder", "");
                    return jsonResponse;
                }

                // Encontrar primera y última orden por fecha de registro
                Order firstOrder = uploadedOrders.stream()
                        .min(Comparator.comparing(Order::getOrderTime))
                        .orElse(null);

                Order lastOrder = uploadedOrders.stream()
                        .max(Comparator.comparing(Order::getOrderTime))
                        .orElse(null);

                // Calcular fechas disponibles
                Set<LocalDate> availableDates = uploadedOrders.stream()
                        .map(order -> order.getOrderTime().toLocalDate())
                        .collect(Collectors.toSet());

                // Obtener horas disponibles del primer día
                List<LocalTime> availableTimes = uploadedOrders.stream()
                        .filter(order -> order.getOrderTime().toLocalDate().equals(firstOrder.getOrderTime().toLocalDate()))
                        .map(order -> order.getOrderTime().toLocalTime())
                        .sorted()
                        .collect(Collectors.toList());

                // Construir respuesta
                jsonResponse.addProperty("success", true);
                jsonResponse.addProperty("count", uploadedOrders.size());

                if (firstOrder != null) {
                    jsonResponse.addProperty("firstOrder", firstOrder.getOrderTime().toString());
                    jsonResponse.addProperty("firstOrderCode", firstOrder.getOrderCode());
                }

                if (lastOrder != null) {
                    jsonResponse.addProperty("lastOrder", lastOrder.getOrderTime().toString());
                    jsonResponse.addProperty("lastOrderCode", lastOrder.getOrderCode());
                }

                // Agregar array de fechas disponibles
                JsonArray datesArray = new JsonArray();
                availableDates.stream()
                        .sorted()
                        .forEach(date -> datesArray.add(date.toString()));
                jsonResponse.add("availableDates", datesArray);

                // Agregar array de horas disponibles del primer día
                JsonArray timesArray = new JsonArray();
                availableTimes.forEach(time -> timesArray.add(time.toString()));
                jsonResponse.add("availableTimes", timesArray);

                response.status(200);
                return jsonResponse;

            } catch (Exception e) {
                logger.log(Level.SEVERE, "Error fetching order metrics", e);
                response.status(500);
                jsonResponse.addProperty("success", false);
                jsonResponse.addProperty("error", "Error al obtener métricas: " + e.getMessage());
                return jsonResponse;
            }
        });

        Spark.get("/api/v1/orders/daily-metrics", (request, response) -> {
            response.type("application/json");
            JsonObject jsonResponse = new JsonObject();

            try {
                // Obtener todas las órdenes
                List<Order> allOrders = OrderRegistry.getAllOrders();
                LocationService locationService = LocationService.getInstance();

                // Calcular métricas básicas
                int totalOrders = allOrders.size();
                long validOrders = allOrders.stream()
                        .filter(order -> order.getStatus() == Order.OrderStatus.REGISTERED)
                        .count();

                // Calcular cantidad promedio por orden
                double averageQuantity = allOrders.stream()
                        .mapToInt(Order::getQuantity)
                        .average()
                        .orElse(0.0);

                // Calcular destinos
                Map<String, Long> destinationCounts = allOrders.stream()
                        .collect(Collectors.groupingBy(
                                Order::getDestinationUbigeo,
                                Collectors.counting()
                        ));

                // Ordenar destinos por cantidad de órdenes
                List<Map.Entry<String, Long>> sortedDestinations = destinationCounts.entrySet()
                        .stream()
                        .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                        .limit(5)
                        .collect(Collectors.toList());

                // Agregar nuevo cálculo de top clientes
                Map<String, Long> clientCounts = allOrders.stream()
                        .collect(Collectors.groupingBy(
                                Order::getClientId,
                                Collectors.counting()
                        ));

                List<Map.Entry<String, Long>> topClients = clientCounts.entrySet()
                        .stream()
                        .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                        .limit(5)
                        .collect(Collectors.toList());

                // Construir respuesta JSON
                jsonResponse.addProperty("success", true);
                jsonResponse.addProperty("totalOrders", totalOrders);
                jsonResponse.addProperty("validOrders", validOrders);
                jsonResponse.addProperty("averageQuantity", Math.round(averageQuantity * 100.0) / 100.0);
                jsonResponse.addProperty("uniqueDestinations", destinationCounts.size());

                // Calcular porcentaje de completitud
                double completionPercentage = totalOrders > 0
                        ? (validOrders * 100.0) / totalOrders
                        : 0.0;
                jsonResponse.addProperty("completionPercentage",
                        Math.round(completionPercentage * 100.0) / 100.0);

                // Agregar destinos con porcentajes
                JsonArray topDestinationsArray = new JsonArray();
                for (Map.Entry<String, Long> entry : sortedDestinations) {
                    JsonObject destination = new JsonObject();
                    String ubigeo = entry.getKey();
                    Location location = locationService.getLocation(ubigeo);
                    long count = entry.getValue();
                    double percentage = (count * 100.0) / totalOrders;

                    destination.addProperty("ubigeo", ubigeo);
                    if (location != null) {
                        destination.addProperty("location",
                                String.format("%s, %s",
                                        location.getProvince(),
                                        location.getDepartment()
                                )
                        );
                    } else {
                        destination.addProperty("location", "Ubicación desconocida");
                    }
                    destination.addProperty("count", count);
                    destination.addProperty("percentage", Math.round(percentage * 100.0) / 100.0);
                    topDestinationsArray.add(destination);
                }
                jsonResponse.add("topDestinations", topDestinationsArray);

                // Agregar top clientes
                JsonArray topClientsArray = new JsonArray();
                for (Map.Entry<String, Long> entry : topClients) {
                    JsonObject client = new JsonObject();
                    String clientId = entry.getKey();
                    long count = entry.getValue();
                    double percentage = (count * 100.0) / totalOrders;

                    client.addProperty("clientId", clientId);
                    client.addProperty("count", count);
                    client.addProperty("percentage", Math.round(percentage * 100.0) / 100.0);

                    // Calcular cantidad total de paquetes para este cliente
                    int totalClientQuantity = allOrders.stream()
                            .filter(order -> order.getClientId().equals(clientId))
                            .mapToInt(Order::getQuantity)
                            .sum();
                    client.addProperty("totalQuantity", totalClientQuantity);

                    topClientsArray.add(client);
                }
                jsonResponse.add("topClients", topClientsArray);

                // Agregar distribución completa de destinos
                JsonObject destinationDistribution = new JsonObject();
                int othersCount = 0;
                for (Map.Entry<String, Long> entry : destinationCounts.entrySet()) {
                    if (!sortedDestinations.contains(entry)) {
                        othersCount += entry.getValue();
                    }
                }
                if (othersCount > 0) {
                    double othersPercentage = (othersCount * 100.0) / totalOrders;
                    JsonObject othersObject = new JsonObject();
                    othersObject.addProperty("count", othersCount);
                    othersObject.addProperty("percentage", Math.round(othersPercentage * 100.0) / 100.0);
                    jsonResponse.add("otherDestinations", othersObject);
                }

                // Métricas adicionales
                jsonResponse.addProperty("totalQuantity",
                        allOrders.stream().mapToInt(Order::getQuantity).sum());

                // Estadísticas de tiempo
                JsonObject timeStats = new JsonObject();
                timeStats.addProperty("earliestOrder",
                        allOrders.stream()
                                .min(Comparator.comparing(Order::getOrderTime))
                                .map(order -> order.getOrderTime().toString())
                                .orElse("N/A"));
                timeStats.addProperty("latestOrder",
                        allOrders.stream()
                                .max(Comparator.comparing(Order::getOrderTime))
                                .map(order -> order.getOrderTime().toString())
                                .orElse("N/A"));
                jsonResponse.add("timeStats", timeStats);

                response.status(200);
                return jsonResponse;

            } catch (Exception e) {
                logger.log(Level.SEVERE, "Error calculating daily metrics", e);
                response.status(500);
                jsonResponse.addProperty("success", false);
                jsonResponse.addProperty("error", "Error al calcular métricas diarias: " + e.getMessage());
                return jsonResponse;
            }
        });
    }
}
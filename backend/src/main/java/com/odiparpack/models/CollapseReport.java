package com.odiparpack.models;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.TypeAdapter;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonWriter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.logging.Logger;

public class CollapseReport {
    private static final Logger logger = Logger.getLogger(CollapseReport.class.getName());

    private String codigoPedido;
    private String rutaPedido;
    private int cantidadPaquetes;
    private String fechaInicioPedido;
    private String fechaEntregaEstimada;
    private String fechaLimiteEntrega;
    private String estadoPedido;
    private Map<String, Map<String, Object>> camionesAsignados;
    private Order order;

    // Constructor que recibe el estado de la simulación y llama a los métodos para llenar cada campo.
    public CollapseReport(SimulationState state, String codigoPedido) {
        logger.info("Creando CollapseReport para el pedido con código: " + codigoPedido);

        this.codigoPedido = codigoPedido;
        this.order = getOrderRep(state.getOrders(), codigoPedido);

        if (this.order == null) {
            throw new IllegalArgumentException("No se encontró un pedido con el código: " + codigoPedido);
        }

        // Inicializar campos del reporte
        this.camionesAsignados = new HashMap<>();
        this.rutaPedido = calculateRutaPedido(state);
        this.cantidadPaquetes = calculateCantidadPaquetes();
        this.fechaInicioPedido = calculateFechaInicioPedido();
        this.fechaLimiteEntrega = calculateFechaLimiteEntrega();
        this.estadoPedido = calculateEstadoPedido();
        this.camionesAsignados = calculateCamionesAsignados(state);
    }

    // Método para obtener el pedido correspondiente al código proporcionado
    private Order getOrderRep(List<Order> orders, String codigoPedido) {
        return orders.stream()
                .filter(order -> order.getOrderCode().equals(codigoPedido))
                .findFirst()
                .orElse(null);
    }

    private String calculateRutaPedido(SimulationState state) {
        try {
            String originUbigeo = order.getOriginUbigeo();
            String destinationUbigeo = order.getDestinationUbigeo();

            Location originLocation = Optional.ofNullable(state.getLocations().get(originUbigeo))
                    .orElseThrow(() -> new IllegalArgumentException("Ubicación de origen no encontrada"));
            Location destinationLocation = Optional.ofNullable(state.getLocations().get(destinationUbigeo))
                    .orElseThrow(() -> new IllegalArgumentException("Ubicación de destino no encontrada"));

            return originLocation.getProvince() + " - " + destinationLocation.getProvince();
        } catch (Exception e) {
            logger.warning("Error al calcular la ruta del pedido: " + e.getMessage());
            return "Error al calcular la ruta del pedido";
        }
    }

    private int calculateCantidadPaquetes() {
        try {
            return order.getQuantity();
        } catch (Exception e) {
            logger.warning("Error al calcular la cantidad de paquetes: " + e.getMessage());
            return 0;
        }
    }

    private String calculateFechaInicioPedido() {
        try {
            return Optional.ofNullable(order.getOrderTime())
                    .map(LocalDateTime::toString)
                    .orElse("Fecha de inicio no disponible");
        } catch (Exception e) {
            logger.warning("Error al calcular la fecha de inicio del pedido: " + e.getMessage());
            return "Fecha de inicio no disponible";
        }
    }

    private String calculateFechaLimiteEntrega() {
        try {
            return Optional.ofNullable(order.getDueTime())
                    .map(LocalDateTime::toString)
                    .orElse("Fecha límite no disponible");
        } catch (Exception e) {
            logger.warning("Error al calcular la fecha límite de entrega: " + e.getMessage());
            return "Fecha límite no disponible";
        }
    }

    private String calculateEstadoPedido() {
        try {
            return Optional.ofNullable(order.getStatus())
                    .map(Order.OrderStatus::toString)
                    .orElse("Estado no disponible");
        } catch (Exception e) {
            logger.warning("Error al calcular el estado del pedido: " + e.getMessage());
            return "Estado no disponible";
        }
    }

    private Map<String, Map<String, Object>> calculateCamionesAsignados(SimulationState state) {
        List<VehicleAssignment> vehiculosAsignados = state.getVehicleAssignments(order.getId());
        Map<String, Map<String, Object>> camionesAsignados = new HashMap<>();

        if (vehiculosAsignados == null || vehiculosAsignados.isEmpty()) {
            logger.warning("No se encontraron vehículos asignados para el pedido con ID: " + order.getId());
            return camionesAsignados;
        }

        for (VehicleAssignment assignment : vehiculosAsignados) {
            try {
                Map<String, Object> camionData = new HashMap<>();
                camionData.put("paquetes", assignment.getAssignedQuantity() + " paquetes");

                // Cambiar formato de fecha a ISO_LOCAL_DATE_TIME
                LocalDateTime estimatedDeliveryTime = assignment.getEstimatedDeliveryTime();
                camionData.put("fechaEntregaEstimada", Optional.ofNullable(estimatedDeliveryTime)
                        .map(time -> time.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                        .orElse("Fecha no disponible"));

                List<Map<String, String>> rutaDelPedido = new ArrayList<>();

                // Verificar si el estado del pedido es entregado o pendiente por recogida
                if (order.getStatus() == Order.OrderStatus.DELIVERED || order.getStatus() == Order.OrderStatus.PENDING_PICKUP) {
                    // Marcar todos los tramos como "Tramo Recorrido"
                    for (RouteSegment segment : assignment.getRouteSegments()) {
                        Map<String, String> tramoData = new HashMap<>();
                        tramoData.put("origen", state.getLocations().get(segment.getFromUbigeo()).getProvince());
                        tramoData.put("destino", state.getLocations().get(segment.getToUbigeo()).getProvince());
                        tramoData.put("estadoTramo", "Tramo Recorrido");
                        rutaDelPedido.add(tramoData);
                    }
                } else {
                    // Verificar la ubicación actual del vehículo y marcar los tramos
                    String currentUbigeo = assignment.getVehicle().getCurrentLocationUbigeo();
                    boolean tramoActualEncontrado = false;

                    for (RouteSegment segment : assignment.getRouteSegments()) {
                        Map<String, String> tramoData = new HashMap<>();
                        tramoData.put("origen", state.getLocations().get(segment.getFromUbigeo()).getProvince());
                        tramoData.put("destino", state.getLocations().get(segment.getToUbigeo()).getProvince());

                        if (tramoActualEncontrado) {
                            tramoData.put("estadoTramo", "Tramo Por Recorrer");
                        } else if (currentUbigeo.equals(segment.getFromUbigeo())) {
                            tramoData.put("estadoTramo", "Tramo Por Recorrer");
                            tramoActualEncontrado = true;
                        } else {
                            tramoData.put("estadoTramo", "Tramo Recorrido");
                        }

                        rutaDelPedido.add(tramoData);
                    }
                }

                camionData.put("rutaDelPedido", rutaDelPedido);
                camionesAsignados.put(assignment.getVehicle().getCode(), camionData);
            } catch (Exception e) {
                logger.severe("Error al procesar el vehículo asignado: " + e.getMessage());
            }
        }

        return camionesAsignados;
    }

    // Método para convertir el reporte a JSON
    public String toJson() {
        Gson gson = new GsonBuilder()
                .registerTypeAdapter(LocalDateTime.class, new TypeAdapter<LocalDateTime>() {
                    @Override
                    public void write(JsonWriter jsonWriter, LocalDateTime localDateTime) throws IOException {
                        if (localDateTime == null) {
                            jsonWriter.nullValue();
                        } else {
                            jsonWriter.value(localDateTime.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
                        }
                    }

                    @Override
                    public LocalDateTime read(JsonReader jsonReader) throws IOException {
                        return LocalDateTime.parse(jsonReader.nextString(), DateTimeFormatter.ISO_LOCAL_DATE_TIME);
                    }
                })
                .create();
        return gson.toJson(this);
    }
}

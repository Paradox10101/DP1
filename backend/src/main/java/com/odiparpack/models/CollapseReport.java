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

import com.odiparpack.models.Vehicle; // Clase Vehicle existente en tu proyecto
import com.odiparpack.models.RouteStep; // Clase RouteStep existente en tu proyecto
import com.odiparpack.models.SimulationState; // Clase SimulationState para acceder al estado de la simulación

public class CollapseReport {
    private String codigoPedido;
    private String rutaPedido;
    private int cantidadPaquetes;
    private String fechaInicioPedido;
    private String fechaEntregaEstimada;
    private String fechaLimiteEntrega;
    private String estadoPedido;
    private Map<String, Map<String, Object>> camionesAsignados;
    private List<Order> orders;
    private Order order;
    // Constructor que recibe el estado de la simulación y llama a los métodos para
    // llenar cada campo.
    public CollapseReport(SimulationState state, String codigoPedido) {
        this.codigoPedido = codigoPedido; // Usamos el código del pedido proporcionado
        this.orders = state.getOrders();
        this.order = getOrderRep(codigoPedido);//este es el pedido que se elige desde front <----
        this.camionesAsignados = new HashMap<>();

        this.rutaPedido = calculateRutaPedido(state);
        this.cantidadPaquetes = calculateCantidadPaquetes(state);
        this.fechaInicioPedido = calculateFechaInicioPedido(state);
        this.fechaEntregaEstimada = calculateFechaEntregaEstimada(state);
        this.fechaLimiteEntrega = calculateFechaLimiteEntrega(state);
        this.estadoPedido = calculateEstadoPedido(state);
        this.camionesAsignados = calculateCamionesAsignados(state);
    }
    public Order getOrderRep(String codigoPedido) {
        // Iterar sobre la lista de pedidos para encontrar el pedido con el código dado
        for (Order order : orders) {
            if (order.getOrderCode().equals(codigoPedido)) {
                return order; // Retornar el pedido si coincide el código
            }
        }
        // Si no se encuentra el pedido, retornar null
        return null;
    }

    private String calculateRutaPedido(SimulationState state) {
        // Obtener los ubigeos del pedido
        String originUbigeo = order.getOriginUbigeo();
        String destinationUbigeo = order.getDestinationUbigeo();

        // Obtener las ubicaciones a partir de los ubigeos
        Location originLocation = state.getLocations().get(originUbigeo);
        Location destinationLocation = state.getLocations().get(destinationUbigeo);

        // Asegurarse de que las ubicaciones existan en el mapa
        if (originLocation == null || destinationLocation == null) {
            return "Ubicación no encontrada";
        }

        // Obtener los nombres de las ciudades
        String originCity = originLocation.getProvince();
        String destinationCity = destinationLocation.getProvince();

        // Construir y retornar la ruta en formato "Origen - Destino"
        return originCity + " - " + destinationCity;
    }

    private int calculateCantidadPaquetes(SimulationState state) {
        return order.getQuantity();
    }

    private String calculateFechaInicioPedido(SimulationState state) {
        return order.getOrderTime().toString();
    }

    private String calculateFechaEntregaEstimada(SimulationState state) {
        //return order.getEstimatedArrivalTime().toString();//este metodo es de vehiculo <-------- NO CREO QUE VAYA, YA QUE UN PEDIDO PUEDE TENER VARIOS VEHICULOS
        return "15/04/2024 - 19:00 pm"; //TIENE QUE IR POR CADA VEHICULO <-- CAMBIO EL DISEÑO
    }

    private String calculateFechaLimiteEntrega(SimulationState state) {
        // Retornar la fecha límite de entrega del pedido (hardcodeado por ahora)
        return order.getDueTime().toString();
    }

    private String calculateEstadoPedido(SimulationState state) {
        return order.getStatus().toString();
    }

    private Map<String, Map<String, Object>> calculateCamionesAsignados(SimulationState state) {
        List<VehicleAssignment> vehiculosAsignados = state.getVehicleAssignments(order.getId());
        //Map<String, Map<String, Object>> camionesAsignados = new HashMap<>();

        for (VehicleAssignment assignment : vehiculosAsignados) {
            Map<String, Object> camionData = new HashMap<>();
            camionData.put("paquetes", assignment.getAssignedQuantity() + " paquetes");

            // Manejar fecha nula
            LocalDateTime estimatedDeliveryTime = assignment.getEstimatedDeliveryTime();
            camionData.put("fechaEntregaEstimada", estimatedDeliveryTime != null
                    ? estimatedDeliveryTime.format(DateTimeFormatter.ofPattern("dd/MM/yyyy - HH:mm a"))
                    : "Fecha no disponible");

            List<Map<String, String>> rutaDelPedido = new ArrayList<>();
            for (RouteSegment segment : assignment.getRouteSegments()) {
                Map<String, String> tramoData = new HashMap<>();
                tramoData.put("origen", state.getLocations().get(segment.getFromUbigeo()).getProvince());
                tramoData.put("destino", state.getLocations().get(segment.getToUbigeo()).getProvince());

                String estadoTramo = "Tramo Por Recorrer";
                if (assignment.getVehicle().getCurrentSegmentIndex() > assignment.getRouteSegments().indexOf(segment)) {
                    estadoTramo = "Tramo Recorrido";
                }
                tramoData.put("estadoTramo", estadoTramo);
                rutaDelPedido.add(tramoData);
            }

            camionData.put("rutaDelPedido", rutaDelPedido);
            camionesAsignados.put(assignment.getVehicle().getCode(), camionData);
        }

        return camionesAsignados;
    }

    // Método para convertir el reporte a JSON
    public String toJson() {
        Gson gson = new GsonBuilder()
                .registerTypeAdapter(LocalDateTime.class, new TypeAdapter<LocalDateTime>() {
                    @Override
                    public void write(JsonWriter jsonWriter, LocalDateTime localDateTime) throws IOException {
                        jsonWriter.value(localDateTime.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
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

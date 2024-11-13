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
    private Order order;

    // Constructor que recibe el estado de la simulación y llama a los métodos para llenar cada campo.
    public CollapseReport(SimulationState state, String codigoPedido) {
        this.codigoPedido = codigoPedido; // Usamos el código del pedido proporcionado
        List<Order> orders = state.getOrders();
        this.order = getOrderRep(orders, codigoPedido); // Este es el pedido que se elige desde front
        this.camionesAsignados = new HashMap<>();

        if (this.order == null) {
            throw new IllegalArgumentException("No se encontró un pedido con el código: " + codigoPedido);
        }

        this.rutaPedido = calculateRutaPedido(state);
        this.cantidadPaquetes = calculateCantidadPaquetes(state);
        this.fechaInicioPedido = calculateFechaInicioPedido(state);
        //this.fechaEntregaEstimada = calculateFechaEntregaEstimada(state);//ESTO NO ES UTIL <-- NO SIRVE --> EL VERDADERO FECHA ESTIMADA ES POR CADA VEHICULO Y ESTA AHI DENTRO
        this.fechaLimiteEntrega = calculateFechaLimiteEntrega(state);
        this.estadoPedido = calculateEstadoPedido(state);
        this.camionesAsignados = calculateCamionesAsignados(state);
    }

    public Order getOrderRep(List<Order> orders, String codigoPedido) {
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
        try {
            String originUbigeo = order.getOriginUbigeo();
            String destinationUbigeo = order.getDestinationUbigeo();

            Location originLocation = state.getLocations().get(originUbigeo);
            Location destinationLocation = state.getLocations().get(destinationUbigeo);

            if (originLocation == null || destinationLocation == null) {
                return "Ubicación no encontrada";
            }

            String originCity = originLocation.getProvince();
            String destinationCity = destinationLocation.getProvince();

            return originCity + " - " + destinationCity;
        } catch (Exception e) {
            return "Error al calcular la ruta del pedido: " + e.getMessage();
        }
    }

    private int calculateCantidadPaquetes(SimulationState state) {
        try {
            return order.getQuantity();
        } catch (Exception e) {
            System.err.println("Error al calcular la cantidad de paquetes: " + e.getMessage());
            return 0;
        }
    }

    private String calculateFechaInicioPedido(SimulationState state) {
        try {
            return order.getOrderTime().toString();
        } catch (Exception e) {
            return "Error al calcular la fecha de inicio del pedido: " + e.getMessage();
        }
    }

    /*private String calculateFechaEntregaEstimada(SimulationState state) {
        return "15/04/2024 - 19:00 pm"; // TIENE QUE IR POR CADA VEHICULO <-- CAMBIO EL DISEÑO
    }*/

    private String calculateFechaLimiteEntrega(SimulationState state) {
        try {
            return order.getDueTime().toString();
        } catch (Exception e) {
            return "Error al calcular la fecha límite de entrega: " + e.getMessage();
        }
    }

    private String calculateEstadoPedido(SimulationState state) {
        try {
            return order.getStatus().toString();
        } catch (Exception e) {
            return "Error al calcular el estado del pedido: " + e.getMessage();
        }
    }

    private Map<String, Map<String, Object>> calculateCamionesAsignados(SimulationState state) {
        List<VehicleAssignment> vehiculosAsignados = state.getVehicleAssignments(order.getId());
        Map<String, Map<String, Object>> camionesAsignados = new HashMap<>();

        if (vehiculosAsignados == null) {
            System.err.println("No se encontraron vehículos asignados para el pedido con ID: " + order.getId());
            return camionesAsignados;
        }

        for (VehicleAssignment assignment : vehiculosAsignados) {
            try {
                Map<String, Object> camionData = new HashMap<>();
                camionData.put("paquetes", assignment.getAssignedQuantity() + " paquetes");

                // Cambiar formato de fecha a ISO_LOCAL_DATE_TIME
                LocalDateTime estimatedDeliveryTime = assignment.getEstimatedDeliveryTime();
                camionData.put("fechaEntregaEstimada", estimatedDeliveryTime != null
                        ? estimatedDeliveryTime.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                        : "Fecha no disponible");

                List<Map<String, String>> rutaDelPedido = new ArrayList<>();
                boolean inTransit = true;
                /*for (RouteSegment segment : assignment.getRouteSegments()) {
                    try {
                        Map<String, String> tramoData = new HashMap<>();
                        tramoData.put("origen", state.getLocations().get(segment.getFromUbigeo()).getProvince());
                        tramoData.put("destino", state.getLocations().get(segment.getToUbigeo()).getProvince());

                        String estadoTramo = "Tramo Por Recorrer";
                        if (assignment.getVehicle().getCurrentSegmentIndex() > assignment.getRouteSegments().indexOf(segment)) {
                            estadoTramo = "Tramo Recorrido";
                        }
                        tramoData.put("estadoTramo", estadoTramo);
                        rutaDelPedido.add(tramoData);
                    } catch (Exception e) {
                        System.err.println("Error al procesar el tramo de la ruta: " + e.getMessage());
                    }
                }*/
                // Verificar si el estado del pedido es entregado o pendiente por recogida
                if ("DELIVERED".equals(order.getStatus()) || "PENDING_PICKUP".equals(order.getStatus())) {
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
                    /*String currentUbigeo = assignment.getVehicle().getCurrentLocationUbigeo();
                    for (RouteSegment segment : assignment.getRouteSegments()) {
                        Map<String, String> tramoData = new HashMap<>();
                        tramoData.put("origen", state.getLocations().get(segment.getFromUbigeo()).getProvince());
                        tramoData.put("destino", state.getLocations().get(segment.getToUbigeo()).getProvince());

                        if (inTransit) {
                            if (currentUbigeo.equals(segment.getFromUbigeo())) {
                                // Si el ubigeo actual coincide con el origen del segmento, marcamos este como "actual"
                                tramoData.put("estadoTramo", "Tramo Por Recorrer");
                                inTransit = false; // Todos los tramos siguientes estarán por recorrer
                            } else {
                                // Todos los tramos anteriores al ubigeo actual se marcan como recorridos
                                tramoData.put("estadoTramo", "Tramo Recorrido");
                            }
                        } else {
                            // Todos los tramos después del ubigeo actual están "Por Recorrer"
                            tramoData.put("estadoTramo", "Tramo Por Recorrer");
                        }

                        rutaDelPedido.add(tramoData);
                    }*/
                    for (RouteSegment segment : assignment.getRouteSegments()) {
                        try {
                            Map<String, String> tramoData = new HashMap<>();
                            tramoData.put("origen", state.getLocations().get(segment.getFromUbigeo()).getProvince());
                            tramoData.put("destino", state.getLocations().get(segment.getToUbigeo()).getProvince());

                            String estadoTramo = "Tramo Por Recorrer";
                            if (assignment.getVehicle().getCurrentSegmentIndex() > assignment.getRouteSegments().indexOf(segment)) {
                                estadoTramo = "Tramo Recorrido";
                            }
                            tramoData.put("estadoTramo", estadoTramo);
                            rutaDelPedido.add(tramoData);
                        } catch (Exception e) {
                            System.err.println("Error al procesar el tramo de la ruta: " + e.getMessage());
                        }
                    }
                }

                camionData.put("rutaDelPedido", rutaDelPedido);
                camionesAsignados.put(assignment.getVehicle().getCode(), camionData);
            } catch (Exception e) {
                System.err.println("Error al procesar el vehículo asignado: " + e.getMessage());
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

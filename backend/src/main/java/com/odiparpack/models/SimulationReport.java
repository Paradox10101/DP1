package com.odiparpack.models;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.google.gson.Gson;
import com.google.protobuf.Duration;
import com.odiparpack.models.Order.OrderStatus;

public class SimulationReport {
    private double capacidadEfectiva;
    private int pedidosAtendidos;
    private double eficienciaRutas;
    private int promedioPedidos;
    private Map<String, Integer> demandasPorCiudad;
    private Map<String, Integer> paradasEnAlmacenes;

    // Constructor, getters y setters
    public SimulationReport(SimulationState state) {
        // Aquí vamos a calcular y setear todos los valores en base al estado de la
        // simulación.
        this.capacidadEfectiva = calculateCapacidadEfectiva(state);
        this.pedidosAtendidos = state.getOrders().size(); // Ejemplo: cantidad total de pedidos atendidos
        this.eficienciaRutas = calculateEficienciaRutas(state);
        this.promedioPedidos = calculatePromedioPedidos(state);
        this.demandasPorCiudad = calculateDemandasPorCiudad(state);
        this.paradasEnAlmacenes = calculateParadasEnAlmacenes(state);
    }

    // Métodos para calcular cada atributo
    private double calculateCapacidadEfectiva(SimulationState state) {
        double totalCapacityUsed = 0;
        double totalCapacity = 0;

        for (Vehicle vehicle : state.getVehicles().values()) {
            totalCapacityUsed += vehicle.getCapacityUsed(); // Capacidad usada actualmente
            totalCapacity += vehicle.getTotalCapacity(); // Capacidad total del vehículo
        }

        if (totalCapacity == 0) {
            return 0; // Si no hay vehículos con capacidad, devuelve 0 para evitar división por cero
        }
        return (totalCapacityUsed / totalCapacity) * 100; // Resultado en porcentaje
    }

    private double calculateEficienciaRutas(SimulationState state) {
        int totalOrders = state.getOrders().size();
        if (totalOrders == 0) {
            return 0;
        }

        int successfulOrders = (int) state.getOrders().stream()
                .filter(order -> order.isDeliveredOnTime())
                .count();

        return ((double) successfulOrders / totalOrders) * 100; // En porcentaje
    }

    private int calculatePromedioPedidos(SimulationState state) {
        long days = Duration.between(state.getStartTime(), state.getCurrentTime()).toDays();
        if (days == 0) {
            days = 1; // Para evitar dividir por cero
        }
        return (int) (state.getOrders().size() / days);
    }

    private Map<String, Integer> calculateDemandasPorCiudad(SimulationState state) {
        Map<String, Integer> demandas = new HashMap<>();
        for (Order order : state.getOrders()) {
            String destino = order.getDestinationCity();
            demandas.put(destino, demandas.getOrDefault(destino, 0) + 1);
        }
        return demandas;
    }

    private Map<String, Integer> calculateParadasEnAlmacenes(SimulationState state) {
        // Implementa la lógica para calcular las paradas en almacenes
        Map<String, Integer> paradas = new HashMap<>();
        for (Vehicle vehicle : state.getVehicles().values()) {
            for (String almacen : vehicle.getVisitedWarehouses()) {
                paradas.put(almacen, paradas.getOrDefault(almacen, 0) + 1);
            }
        }
        return paradas;
    }

    //Calcula la cantidad de pedidos atendidos
    private int calculatePedidosAtendidos(SimulationState state) {
        return (int) state.getOrders().stream()
                .filter(order -> order.isDeliveredOnTime())
                .count();
    }

    //Cuantas averias ocurrieron de cada tipo
    private Map<String, Integer> calculateBreakdownsByType(SimulationState state) {
        Map<String, Integer> breakdownCounts = new HashMap<>();
        breakdownCounts.put("Tipo 1", 0);
        breakdownCounts.put("Tipo 2", 0);
        breakdownCounts.put("Tipo 3", 0);

        for (String breakdown : state.getBreakdownLogs().values()) {
            breakdownCounts.put(breakdown, breakdownCounts.getOrDefault(breakdown, 0) + 1);
        }

        return breakdownCounts;
    }

    // Método para convertir el reporte a JSON
    public String toJson() {
        Gson gson = new Gson();
        return gson.toJson(this);
    }
}

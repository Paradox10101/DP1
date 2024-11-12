package com.odiparpack.models;

import com.google.gson.Gson;
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
    private Map<String, Camion> camionesAsignados;

    // Constructor que recibe el estado de la simulación y llama a los métodos para
    // llenar cada campo.
    public CollapseReport(SimulationState state, String codigoPedido) {
        this.codigoPedido = codigoPedido; // Usamos el código del pedido proporcionado
        this.rutaPedido = calculateRutaPedido(state);
        this.cantidadPaquetes = calculateCantidadPaquetes(state);
        this.fechaInicioPedido = calculateFechaInicioPedido(state);
        this.fechaEntregaEstimada = calculateFechaEntregaEstimada(state);
        this.fechaLimiteEntrega = calculateFechaLimiteEntrega(state);
        this.estadoPedido = calculateEstadoPedido(state);
        this.camionesAsignados = calculateCamionesAsignados(state);
    }

    // Métodos individuales que calculan los valores (actualmente hardcodeados)

    private String calculateRutaPedido(SimulationState state) {
        // Retornar la ruta del pedido (hardcodeado por ahora)
        return "Arequipa - Mariscal Nieto";
    }

    private int calculateCantidadPaquetes(SimulationState state) {
        // Retornar la cantidad de paquetes (hardcodeado por ahora)
        return 99;
    }

    private String calculateFechaInicioPedido(SimulationState state) {
        // Retornar la fecha de inicio del pedido (hardcodeado por ahora)
        return "15/04/2024 - 19:00 pm";
    }

    private String calculateFechaEntregaEstimada(SimulationState state) {
        // Retornar la fecha estimada de entrega del pedido (hardcodeado por ahora)
        return "17/04/2024 - 17:30 pm";
    }

    private String calculateFechaLimiteEntrega(SimulationState state) {
        // Retornar la fecha límite de entrega del pedido (hardcodeado por ahora)
        return "17/04/2024 - 19:00 pm";
    }

    private String calculateEstadoPedido(SimulationState state) {
        // Retornar el estado del pedido (hardcodeado por ahora)
        return "ENTREGADO";
    }

    private Map<String, Camion> calculateCamionesAsignados(SimulationState state) {
        // Valores hardcodeados de camiones asignados (luego se deberá implementar la
        // lógica correcta)
        Map<String, Camion> camiones = new HashMap<>();

        Camion camion1 = new Camion("90 paquetes", List.of(
                new RouteStep("Almacén de Arequipa", "Oficina de Melgar", "Tramo Recorrido"),
                new RouteStep("Oficina de Melgar", "Oficina de San Antonio de Putina", "Tramo Recorrido"),
                new RouteStep("Oficina de San Antonio de Putina", "Oficina de Mariscal Nieto", "Tramo Por Recorrer")));

        Camion camion2 = new Camion("9 paquetes", List.of(
                new RouteStep("Almacén de Arequipa", "Oficina de Melgar", "Tramo Recorrido"),
                new RouteStep("Oficina de Melgar", "Oficina de San Antonio de Putina", "Tramo Por Recorrer"),
                new RouteStep("Oficina de San Antonio de Putina", "Oficina de Mariscal Nieto", "Tramo Por Recorrer")));

        camiones.put("A058", camion1);
        camiones.put("A057", camion2);

        return camiones;
    }

    // Método para convertir el reporte a JSON
    public String toJson() {
        Gson gson = new Gson();
        return gson.toJson(this);
    }

    // Clase interna para representar cada camión
    public static class Camion {
        private String paquetes;
        private List<RouteStep> rutaDelPedido;

        public Camion(String paquetes, List<RouteStep> rutaDelPedido) {
            this.paquetes = paquetes;
            this.rutaDelPedido = rutaDelPedido;
        }
    }

    // Clase para representar cada paso de la ruta del pedido
    public static class RouteStep {
        private String origen;
        private String destino;
        private String estadoTramo;

        public RouteStep(String origen, String destino, String estadoTramo) {
            this.origen = origen;
            this.destino = destino;
            this.estadoTramo = estadoTramo;
        }
    }
}

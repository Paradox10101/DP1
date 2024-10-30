package com.odiparpack.models;

import java.util.HashMap;
import java.util.Map;

import com.google.gson.Gson;

public class SimulationReport {
    private double capacidadEfectiva;
    private int pedidosAtendidos;
    private double eficienciaRutas;
    private int promedioPedidos;
    private Map<String, Integer> demandasPorCiudad;
    private Map<String, Integer> paradasEnAlmacenes;

    // Constructor, getters y setters
    public SimulationReport(SimulationState state) {
        // Cálculo real de capacidad efectiva
        this.capacidadEfectiva = calculateCapacidadEfectiva(state);

        // Cálculo de otros atributos (inicialmente hardcodeados)
        this.pedidosAtendidos = calculatePedidosAtendidos(state);
        this.eficienciaRutas = calculateEficienciaRutas(state);
        this.promedioPedidos = calculatePromedioPedidos(state);
        this.demandasPorCiudad = calculateDemandasPorCiudad(state);
        this.paradasEnAlmacenes = calculateParadasEnAlmacenes(state);
    }

    // Método para calcular la capacidad efectiva
    private double calculateCapacidadEfectiva(SimulationState state) {//CADA VEZ QUE SE ASIGNA UN PEDIDO A UN VEHICULO <- SE SACA LA CAPACIDAD ACTUAL PARA SACAR LA "CAPACIDAD ACTUAL PROMEDIO" (HISTORIAL)
        return state.calculateAverageCapacity(); // Usar el promedio acumulado
    }

    // Métodos para calcular los atributos restantes (actualmente hardcodeados)

    private int calculatePedidosAtendidos(SimulationState state) {
        // Por ahora retornamos un valor hardcodeado
        return 150;
    }

    private double calculateEficienciaRutas(SimulationState state) {//ES IMPORTANTELA EFICIENCIA DEL CALCULO DE RUTA RESPECTO AL TIEMPO (CUANDO SE CALCULA RUTA DE VEHICULOS) -> VER SI SE PUEDE CALCULAR EL PROMEDIO PROGRESIVAMENTE Y NO AL FINAL
        // Por ahora retornamos un valor hardcodeado
        return 85.0;
    }

    private int calculatePromedioPedidos(SimulationState state) {
        // Por ahora retornamos un valor hardcodeado
        return 20;
    }

    private Map<String, Integer> calculateDemandasPorCiudad(SimulationState state) {
        // Valores hardcodeados por ahora
        Map<String, Integer> demandas = new HashMap<>();
        demandas.put("Lima", 50);
        demandas.put("Arequipa", 30);
        demandas.put("Trujillo", 20);
        demandas.put("Junín", 10);
        demandas.put("Huancayo", 40);
        return demandas;
    }

    private Map<String, Integer> calculateParadasEnAlmacenes(SimulationState state) {
        // Valores hardcodeados por ahora
        Map<String, Integer> paradas = new HashMap<>();
        paradas.put("Trujillo", 10);
        paradas.put("Lima", 15);
        paradas.put("Arequipa", 8);
        return paradas;
    }

    // Método para convertir el reporte a JSON
    public String toJson() {
        Gson gson = new Gson();
        return gson.toJson(this);
    }
}

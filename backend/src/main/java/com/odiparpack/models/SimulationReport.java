package com.odiparpack.models;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.stream.Collectors;
import com.google.gson.Gson;

public class SimulationReport {
    private double capacidadEfectiva;
    private int pedidosAtendidos;
    private double eficienciaRutas;
    private double promedioPedidos;
    private Map<String, Integer> demandasPorCiudad;
    private Map<String, Integer> paradasEnAlmacenes;
    private Map<String, Integer> averiasPorTipo;
    private Map<String, Integer> regionConMayorDemanda;
    private Map<String, Integer> estadoPaquetes;

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
        this.averiasPorTipo = calculateAveriasPorTipo(state);
        this.regionConMayorDemanda = calculateRegionConMayorDemanda(state);
        this.estadoPaquetes = calculateEstadoPaquetes(state);
    }

    // Método para calcular la capacidad efectiva
    private double calculateCapacidadEfectiva(SimulationState state) {// CADA VEZ QUE SE ASIGNA UN PEDIDO A UN VEHICULO
                                                                      // <- SE SACA LA CAPACIDAD ACTUAL PARA SACAR LA
                                                                      // "CAPACIDAD ACTUAL PROMEDIO" (HISTORIAL)
        return state.calculateAverageCapacity(); // Usar el promedio acumulado
    }

    // Métodos para calcular los atributos restantes (actualmente hardcodeados)

    private int calculatePedidosAtendidos(SimulationState state) {
        // Por ahora retornamos un valor hardcodeado
        //return state.obteinCountOrder();
        return state.obteinCountOrder();
    }

    private double calculateEficienciaRutas(SimulationState state) {// ES IMPORTANTELA EFICIENCIA DEL CALCULO DE RUTA
                                                                    // RESPECTO AL TIEMPO (CUANDO SE CALCULA RUTA DE
                                                                    // VEHICULOS) -> VER SI SE PUEDE CALCULAR EL
                                                                    // PROMEDIO PROGRESIVAMENTE Y NO AL FINAL
        // Por ahora retornamos un valor hardcodeado
        return 85.0;
    }

    private double calculatePromedioPedidos(SimulationState state) {
        // Por ahora retornamos un valor hardcodeado
        List<Integer> orderbyDays = state.getOrderbyDays();
        if (orderbyDays.isEmpty()) {
            return 0.0; // Evitar división por cero
        }

        int totalPedidos = 0;
        for (int pedidos : orderbyDays) {
            totalPedidos += pedidos;
        }

        return (double) totalPedidos / orderbyDays.size();
    }

    private Map<String, Integer> calculateDemandasPorCiudad(SimulationState state) {
        // Valores hardcodeados por ahora
        //Aqui se debe considerar solo cuando se realiza el pedido
        //!Cuando se entrega el pedido ya es otra metrica (que no estamos abarcando)
        //Entonces se debe colocar en el mismo lugar donde se esta asignando el pedido --> pero ahora la relevancia esta en el "DESTINO"
        // Obtener el mapa de demandas por ciudad desde el estado de simulación
        Map<String, Integer> cityOrderCount = state.getCityOrderCount();

        // Ordenar las ciudades por cantidad de pedidos de mayor a menor y limitar a las 5 primeras
        Map<String, Integer> topDemandCities = cityOrderCount.entrySet()
                .stream()
                .sorted((e1, e2) -> e2.getValue().compareTo(e1.getValue())) // Ordenar de mayor a menor demanda
                .limit(5) // Limitar a las 5 ciudades con mayor demanda
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (e1, e2) -> e1, // En caso de conflicto, mantener el valor existente
                        LinkedHashMap::new // Mantener el orden de inserción
                ));

        return topDemandCities;

        /*Map<String, Integer> demandas = new HashMap<>();
        demandas.put("Lima", 50);
        demandas.put("Arequipa", 30);
        demandas.put("Trujillo", 20);
        demandas.put("Junín", 10);
        demandas.put("Huancayo", 40);
        return demandas;*/
    }

    private Map<String, Integer> calculateParadasEnAlmacenes(SimulationState state) {
        // Valores hardcodeados por ahora
        //estos son las veces que el vehiculo regresa al almacen? o son las veces que un vehiculo sale de un almacen.
        Map<String, Integer> paradas = new HashMap<>();
        paradas.put("Trujillo", 10);
        paradas.put("Lima", 15);
        paradas.put("Arequipa", 8);
        return paradas;
    }

    private Map<String, Integer> calculateAveriasPorTipo(SimulationState state) {
        // Valores hardcodeados por ahora
        Map<String, Integer> averias = new HashMap<>();
        averias.put("Tipo 1", 5);
        averias.put("Tipo 2", 3);
        averias.put("Tipo 3", 2);
        return averias;
    }

    private Map<String, Integer> calculateRegionConMayorDemanda(SimulationState state) {
        // Valor hardcodeado por ahora
        // Calculamos la región con mayor demanda en base a las demandas por ciudad
        /*Map<String, Integer> demandas = calculateDemandasPorCiudad(state);
        int costa = demandas.getOrDefault("Lima", 0) + demandas.getOrDefault("Trujillo", 0);
        int sierra = demandas.getOrDefault("Junín", 0) + demandas.getOrDefault("Huancayo", 0);
        int selva = 0; // Hardcoded as there are no cities in the "selva" region in current data

        if (costa >= sierra && costa >= selva) {
            return "Costa";
        } else if (sierra >= costa && sierra >= selva) {
            return "Sierra";
        } else {
            return "Selva";
        }*/
        Map<String, Integer> regiones = new HashMap<>();
        regiones.put("Costa", 51);
        regiones.put("Sierra", 43);
        regiones.put("Selva", 20);
        return regiones;
    }

    private Map<String, Integer> calculateEstadoPaquetes(SimulationState state) {
        // Valores hardcodeados por ahora
        Map<String, Integer> estados = new HashMap<>();
        estados.put("En Almacén", 50);
        estados.put("En Oficina", 30);
        estados.put("En Entrega", 40); // "En Entrega" es equivalente a "En Tránsito"
        estados.put("Entregado", 80);
        return estados;
    }

    // Método para convertir el reporte a JSON
    public String toJson() {
        Gson gson = new Gson();
        return gson.toJson(this);
    }
}
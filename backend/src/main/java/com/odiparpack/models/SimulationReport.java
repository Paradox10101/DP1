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
    private Map<String, Integer> demandasEnAlmacenes;
    private Map<String, Integer> averiasPorTipo;
    private Map<String, Integer> regionConMayorDemanda;

    private Map<String, String> ubigeoToProvincia = new HashMap<String, String>() {{
        put("150101", "Lima");
        put("040101", "Arequipa");
        put("130101", "Trujillo");
    }};

    // Constructor, getters y setters
    public SimulationReport(SimulationState state) {
        // Cálculo real de capacidad efectiva
        this.capacidadEfectiva = calculateCapacidadEfectiva(state);

        // Cálculo de otros atributos
        this.pedidosAtendidos = calculatePedidosAtendidos(state);
        this.eficienciaRutas = calculateEficienciaRutas(state);
        this.promedioPedidos = calculatePromedioPedidos(state);
        this.demandasPorCiudad = calculateDemandasPorCiudad(state);
        this.demandasEnAlmacenes = calculateDemandasEnAlmacenes(state);
        this.averiasPorTipo = calculateAveriasPorTipo(state);
        this.regionConMayorDemanda = calculateRegionConMayorDemanda(state);
    }

    // Método para calcular la capacidad efectiva
    private double calculateCapacidadEfectiva(SimulationState state) {
        // CADA VEZ QUE SE ASIGNA UN PEDIDO A UN VEHICULO
        // <- SE SACA LA CAPACIDAD ACTUAL PARA SACAR LA
        // "CAPACIDAD ACTUAL PROMEDIO" (HISTORIAL)
        return state.calculateAverageCapacity() * 100; // Usar el promedio acumulado
    }

    // Métodos para calcular los atributos restantes (actualmente hardcodeados)

    private int calculatePedidosAtendidos(SimulationState state) {
        //return state.obteinCountOrder();
        return state.getTotalOrdersCount2();
    }

    private double calculateEficienciaRutas(SimulationState state) {
        // ES IMPORTANTE LA EFICIENCIA DEL CALCULO DE RUTA RESPECTO AL TIEMPO (CUANDO SE CALCULA RUTA DE
        // VEHICULOS) -> VER SI SE PUEDE CALCULAR EL
        // PROMEDIO PROGRESIVAMENTE Y NO AL FINAL
        //aqui lo que se hace es recoger el "map" y luego hacer sumatoria entre todos los valores encontrados (de la division)
        // y dividir entre la cantidad de pedidos totales.

        Map<String, Double> eficienciaPedidos = state.getEficienciaPedidos();
        // Sumar todas las eficiencias almacenadas en el mapa
        double sumaEficiencia = 0.0;
        for (double eficiencia : eficienciaPedidos.values()) {
            sumaEficiencia += eficiencia;
        }

        // Calcular el promedio de eficiencia
        double eficienciaPromedio = sumaEficiencia / eficienciaPedidos.size();

        System.out.println("Eficiencia promedio de rutas: " + eficienciaPromedio);
        return (1 - eficienciaPromedio) * 100;
    }

    private double calculatePromedioPedidos(SimulationState state) {
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

    private Map<String, Integer> calculateDemandasEnAlmacenes(SimulationState state) {
        // Obtener las paradas con los ubigeos del estado
        Map<String, Integer> demandasUbigeos = state.getDemandasAlmacenesOrderCount();
        Map<String, Integer> demandasConNombreProvincia = new HashMap<>();

        // Convertir cada entrada del ubigeo al nombre de la provincia correspondiente
        for (Map.Entry<String, Integer> entry : demandasUbigeos.entrySet()) {
            String ubigeo = entry.getKey();
            Integer count = entry.getValue();

            // Obtener el nombre de la provincia a partir del ubigeo
            String nombreProvincia = ubigeoToProvincia.get(ubigeo);

            if (nombreProvincia != null) {
                demandasConNombreProvincia.put(nombreProvincia, count);
            }
        }

        return demandasConNombreProvincia;
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

        Map<String, Integer> regiones = state.getPedidosPorRegion();
        //regiones.put("Costa", 51);
        //regiones.put("Sierra", 43);
        //regiones.put("Selva", 20);
        return regiones;
    }

    // Método para convertir el reporte a JSON
    public String toJson() {
        Gson gson = new Gson();
        return gson.toJson(this);
    }
}

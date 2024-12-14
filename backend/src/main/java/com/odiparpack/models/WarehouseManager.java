package com.odiparpack.models;

import com.odiparpack.websocket.WarehouseOccupancyWebSocketHandler;

import java.util.HashMap;
import java.util.Map;

import static com.odiparpack.Main.logger;

public class WarehouseManager {
    private Map<String, Integer> warehouseCapacities;
    private Map<String, Integer> currentCapacities;

    public WarehouseManager(Map<String, Location> locations) {
        warehouseCapacities = new HashMap<>();
        currentCapacities = new HashMap<>();
        for (Location location : locations.values()) {
            warehouseCapacities.put(location.getUbigeo(), location.getWarehouseCapacity());
            currentCapacities.put(location.getUbigeo(), location.getWarehouseCapacity());
        }
    }

    public void decreaseCapacity(String ubigeo, int amount) {
        synchronized (this) {
            int currentCapacity = currentCapacities.getOrDefault(ubigeo, 0);
            int totalCapacity = warehouseCapacities.getOrDefault(ubigeo, 0);
            int newCapacity = Math.max(0, currentCapacity - amount);

            currentCapacities.put(ubigeo, newCapacity);
            logCapacityChange(ubigeo, currentCapacity, newCapacity);

            // Calcular y enviar actualización de porcentaje de ocupación
            double occupancyPercentage = calculateOccupancyPercentage(ubigeo);
            WarehouseOccupancyWebSocketHandler.broadcastOccupancyUpdate(ubigeo, occupancyPercentage);
        }
    }

    public void increaseCapacity(String ubigeo, int amount) {
        synchronized (this) {
            int currentCapacity = currentCapacities.getOrDefault(ubigeo, 0);
            int totalCapacity = warehouseCapacities.getOrDefault(ubigeo, 0);
            int newCapacity = Math.min(totalCapacity, currentCapacity + amount);

            currentCapacities.put(ubigeo, newCapacity);
            logCapacityChange(ubigeo, currentCapacity, newCapacity);

            // Calcular y enviar actualización de porcentaje de ocupación
            double occupancyPercentage = calculateOccupancyPercentage(ubigeo);
            WarehouseOccupancyWebSocketHandler.broadcastOccupancyUpdate(ubigeo, occupancyPercentage);
        }
    }

    private double calculateOccupancyPercentage(String ubigeo) {
        int totalCapacity = warehouseCapacities.getOrDefault(ubigeo, 0);
        if (totalCapacity == 0) return 0.0;

        int currentCapacity = currentCapacities.getOrDefault(ubigeo, 0);
        int usedCapacity = totalCapacity - currentCapacity;
        return (double) usedCapacity / totalCapacity * 100.0;
    }

    private void logCapacityChange(String ubigeo, int oldCapacity, int newCapacity) {
        int totalCapacity = warehouseCapacities.getOrDefault(ubigeo, 0);
        logger.info(String.format("Almacén %s: Capacidad total: %d, Capacidad anterior: %d, Nueva capacidad: %d",
                ubigeo, totalCapacity, oldCapacity, newCapacity));
        if (newCapacity <= 0) {
            logger.warning(String.format("¡ADVERTENCIA! La capacidad del almacén %s ha llegado a %d", ubigeo, newCapacity));
        }
    }

    public int getCurrentCapacity(String ubigeo) {
        return currentCapacities.getOrDefault(ubigeo, 0);
    }

    public void resetCapacities() {
        synchronized (this) {
            // Restaurar todas las capacidades a sus valores iniciales
            for (Map.Entry<String, Integer> entry : warehouseCapacities.entrySet()) {
                String ubigeo = entry.getKey();
                int initialCapacity = entry.getValue();
                currentCapacities.put(ubigeo, initialCapacity);

                // Actualizar el porcentaje de ocupación a 0%
                WarehouseOccupancyWebSocketHandler.broadcastOccupancyUpdate(ubigeo, 0.0);
                logger.info(String.format("Almacén %s: Capacidad reseteada a valor inicial: %d",
                        ubigeo, initialCapacity));
            }
        }
    }
}
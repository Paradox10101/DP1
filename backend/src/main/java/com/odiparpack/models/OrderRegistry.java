package com.odiparpack.models;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

public class OrderRegistry {
    private static final Map<Integer, Order> orders = new ConcurrentHashMap<>();
    private static final AtomicInteger orderIdCounter = new AtomicInteger(1);

    public static int getNextId() {
        return orderIdCounter.getAndIncrement();
    }

    public static void addOrder(Order order) {
        orders.put(order.getId(), order);
    }

    public static Order getOrder(int id) {
        return orders.get(id);
    }

    /**
     * Obtiene todas las órdenes registradas
     * @return Lista de todas las órdenes
     */
    public static List<Order> getAllOrders() {
        return new ArrayList<>(orders.values());
    }

    /**
     * Obtiene todas las órdenes de un cliente específico
     * @param clientId ID del cliente
     * @return Lista de órdenes del cliente
     */
    public static List<Order> getOrdersByClientId(String clientId) {
        if (clientId == null || clientId.isEmpty()) {
            return new ArrayList<>();
        }

        return orders.values().stream()
                .filter(order -> clientId.equals(order.getClientId()))
                .collect(Collectors.toList());
    }

    /**
     * Limpia el registro de órdenes (útil para pruebas)
     */
    public static void clearOrders() {
        orders.clear();
        orderIdCounter.set(1);
    }
}
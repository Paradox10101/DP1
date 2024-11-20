package com.odiparpack.models;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

public class ClientRegistry {
    private static final Map<String, Client> clientsByPhone = new ConcurrentHashMap<>();
    private static final Map<String, Client> clientsByEmail = new ConcurrentHashMap<>();
    private static final AtomicInteger clientCounter = new AtomicInteger(1);

    public static Client findOrCreateClient(String firstName, String lastName, String phone, String email) {
        // Buscar cliente existente por teléfono
        Client existingClient = clientsByPhone.get(phone);
        if (existingClient != null) {
            return existingClient;
        }

        // Buscar por email si existe y no es vacío
        if (email != null && !email.isEmpty()) {
            existingClient = clientsByEmail.get(email);
            if (existingClient != null) {
                return existingClient;
            }
        }

        // Crear nuevo cliente
        String clientId = generateClientId();
        Client newClient = new Client(clientId, firstName, lastName, phone, email);

        clientsByPhone.put(phone, newClient);
        if (email != null && !email.isEmpty()) {
            clientsByEmail.put(email, newClient);
        }

        return newClient;
    }

    private static String generateClientId() {
        return String.format("CLI%05d", clientCounter.getAndIncrement());
    }
}
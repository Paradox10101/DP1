package com.odiparpack;

public class Utils {
    public static double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        // Fórmula del Haversine
        int R = 6371; // Radio de la tierra en kilómetros
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distance = R * c; // Distancia en kilómetros
        return distance;
    }

    public static double getAverageSpeed(String region1, String region2) {
        // Costa - Costa = 70 Km/h
        // Costa - Sierra = 50 Km/h
        // Sierra - Sierra = 60 Km/h
        // Sierra - Selva = 55 Km/h
        // Selva - Selva = 65 Km/h

        if (region1.equalsIgnoreCase("COSTA") && region2.equalsIgnoreCase("COSTA")) {
            return 70.0;
        } else if ((region1.equalsIgnoreCase("COSTA") && region2.equalsIgnoreCase("SIERRA")) ||
                (region1.equalsIgnoreCase("SIERRA") && region2.equalsIgnoreCase("COSTA"))) {
            return 50.0;
        } else if (region1.equalsIgnoreCase("SIERRA") && region2.equalsIgnoreCase("SIERRA")) {
            return 60.0;
        } else if ((region1.equalsIgnoreCase("SIERRA") && region2.equalsIgnoreCase("SELVA")) ||
                (region1.equalsIgnoreCase("SELVA") && region2.equalsIgnoreCase("SIERRA"))) {
            return 55.0;
        } else if (region1.equalsIgnoreCase("SELVA") && region2.equalsIgnoreCase("SELVA")) {
            return 65.0;
        } else {
            // Valor por defecto
            return 60.0;
        }
    }

    public static String formatTime(long minutes) {
        long days = minutes / (24 * 60);
        long hours = (minutes % (24 * 60)) / 60;
        long mins = minutes % 60;
        return String.format("%d días, %d horas, %d minutos", days, hours, mins);
    }
}

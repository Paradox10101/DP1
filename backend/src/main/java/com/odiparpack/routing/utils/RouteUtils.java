package com.odiparpack.routing.utils;

import java.util.HashMap;
import java.util.Map;

public class RouteUtils {

    /**
     * Crea una copia profunda de la matriz de tiempos
     * @param timeMatrix Matriz original de tiempos
     * @return Una nueva matriz con los mismos valores pero independiente
     */
    public static long[][] deepCopyTimeMatrix(long[][] timeMatrix) {
        if (timeMatrix == null) return null;

        long[][] copy = new long[timeMatrix.length][];
        for (int i = 0; i < timeMatrix.length; i++) {
            copy[i] = timeMatrix[i].clone();
        }
        return copy;
    }

    /**
     * Crea una copia profunda del mapa de índices de ubicaciones
     * @param locationIndices Mapa original de ubicaciones
     * @return Un nuevo mapa con los mismos valores pero independiente
     */
    public static Map<String, Integer> deepCopyLocationIndices(Map<String, Integer> locationIndices) {
        if (locationIndices == null) return null;
        return new HashMap<>(locationIndices);
    }
}
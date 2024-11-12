package com.odiparpack.models;

import java.util.Queue;
import java.util.concurrent.ConcurrentLinkedQueue;

public class StringBuilderPool {
    private final Queue<StringBuilder> pool;
    private final int initialCapacity;

    public StringBuilderPool(int poolSize, int initialCapacity) {
        this.pool = new ConcurrentLinkedQueue<>();
        this.initialCapacity = initialCapacity;

        // Pre-populate pool
        for (int i = 0; i < poolSize; i++) {
            pool.offer(new StringBuilder(initialCapacity));
        }
    }

    public StringBuilder borrow() {
        StringBuilder sb = pool.poll();
        if (sb == null) {
            // Si el pool está vacío, crear uno nuevo
            return new StringBuilder(initialCapacity);
        }
        sb.setLength(0); // Limpiar el StringBuilder
        return sb;
    }

    public void release(StringBuilder sb) {
        if (sb != null) {
            sb.setLength(0);
            pool.offer(sb);
        }
    }
}


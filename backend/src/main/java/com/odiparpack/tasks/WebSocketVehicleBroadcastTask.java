package com.odiparpack.tasks;

import com.google.gson.JsonObject;
import com.odiparpack.models.SimulationState;
import com.odiparpack.websocket.VehicleWebSocketHandler;

import java.util.concurrent.atomic.AtomicBoolean;
import java.util.logging.Level;

import static com.odiparpack.Main.logger;

public class WebSocketVehicleBroadcastTask implements Runnable {
    private final SimulationState state;
    private final AtomicBoolean isSimulationRunning;

    public WebSocketVehicleBroadcastTask(SimulationState state, AtomicBoolean isSimulationRunning) {
        this.state = state;
        this.isSimulationRunning = isSimulationRunning;
    }

    @Override
    public void run() {
        try {
            if (!isSimulationRunning.get() || state.isPaused() || state.isStopped()) {
                return;
            }
            // JsonObject positions = state.getCurrentPositionsGeoJSON();
            JsonObject positions = state.getCurrentVehiclesDataGeoJSON();
            VehicleWebSocketHandler.broadcastVehiclePositions(positions);
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Error in WebSocket broadcast task", e);
        }
    }
}
package com.odiparpack.tasks;

import com.google.gson.JsonObject;
import com.odiparpack.models.SimulationState;
import com.odiparpack.websocket.ShipmentWebSocketHandler;

import java.util.concurrent.atomic.AtomicBoolean;
import java.util.logging.Level;

import static com.odiparpack.Main.logger;

public class WebSocketShipmentBroadcastTask implements Runnable {
    private final SimulationState state;
    private final AtomicBoolean isSimulationRunning;

    public WebSocketShipmentBroadcastTask(SimulationState state, AtomicBoolean isSimulationRunning) {
        this.state = state;
        this.isSimulationRunning = isSimulationRunning;
    }

    @Override
    public void run() {
        try {
            if (!isSimulationRunning.get() || state.isPaused() || state.isStopped()) {
                return;
            }
            String lastClientMessage = ShipmentWebSocketHandler.getLastClientMessage();
            JsonObject shipmentList = state.getShipmentListJsonInPeriod(state.getSimulationStartTime(), state.getCurrentTime(), lastClientMessage);
            ShipmentWebSocketHandler.broadcastShipments(shipmentList);
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Error in shipment broadcast task", e);
        }
    }
}
package com.odiparpack.api.routers;

import com.google.gson.Gson;
import com.odiparpack.models.SimulationState;

public abstract class BaseRouter {
    protected final Gson gson = new Gson();
    protected SimulationState simulationState;

    // Método que cada router debe implementar
    public abstract void setupRoutes();

    public void setSimulationState(SimulationState simulationState) {
        this.simulationState = simulationState;
    }

    // Método helper para transformar objetos a JSON
    protected String toJson(Object object) {
        return gson.toJson(object);
    }
}
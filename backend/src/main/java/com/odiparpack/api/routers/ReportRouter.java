package com.odiparpack.api.routers;

import com.google.gson.Gson;
import com.odiparpack.models.SimulationReport;
import com.odiparpack.models.SimulationState;
import spark.Spark;

import java.util.logging.Logger;

public class ReportRouter extends BaseRouter {
    private final SimulationState simulationState;
    private static final Logger logger = Logger.getLogger(ReportRouter.class.getName());
    private static final Gson gson = new Gson();

    // Constructor
    public ReportRouter(SimulationState simulationState) {
        this.simulationState = simulationState;
    }

    @Override
    public void setupRoutes() {
        // Agregar el endpoint para el reporte de capacidades
        Spark.get("/api/v1/simulation/report", (request, response) -> {
            response.type("application/json");

            // Crear el reporte basándonos en el estado de la simulación
            SimulationReport simulationReport = new SimulationReport(simulationState);
            String reportJson = simulationReport.toJson();

            response.status(200);
            return reportJson;
        });
    }
}

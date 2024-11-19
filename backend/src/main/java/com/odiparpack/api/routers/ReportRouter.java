package com.odiparpack.api.routers;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.odiparpack.models.CollapseReport;
import com.odiparpack.models.Order;
import com.odiparpack.models.SimulationReport;
import com.odiparpack.models.SimulationState;
import spark.Spark;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
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

        Spark.get("/api/v1/simulation/list_pedidos", (request, response) -> {
            // Inicializar Gson y registrar el adaptador personalizado para LocalDateTime
            Gson gson = new GsonBuilder()
                    .registerTypeAdapter(LocalDateTime.class, new LocalDateTimeAdapter())
                    .create();
            response.type("application/json");

            try {
                // Obtener la lista de pedidos
                if (simulationState == null) {
                    response.status(400); // Bad Request
                    return gson.toJson(Collections.singletonMap("error", "Simulación no ha sido inicializada."));
                }

                List<Order> orders = simulationState.getOrders();

                // Convertir la lista de pedidos a JSON
                String reportJson = gson.toJson(orders);

                response.status(200); // OK
                return reportJson;

            } catch (Exception e) {
                // Manejo de errores para garantizar una buena respuesta si ocurre algún fallo
                response.status(500); // Internal Server Error
                return gson.toJson(Collections.singletonMap("error", "Error al obtener la lista de pedidos: " + e.getMessage()));
            }
        });

        // ReportRouter.java
        Spark.get("/api/v1/simulation/collapse_report/:codigoPedido", (request, response) -> {
            response.type("application/json");
            
            String codigoPedido = request.params("codigoPedido");

            try {
                CollapseReport collapseReport = new CollapseReport(simulationState, codigoPedido);
                String collapseReportJson = collapseReport.toJson();
                response.status(200);
                return collapseReportJson;
            } catch (IllegalArgumentException e) {
                response.status(400); // Bad Request
                return gson.toJson(Collections.singletonMap("error", "Pedido no encontrado: " + e.getMessage()));
            } catch (Exception e) {
                response.status(500); // Internal Server Error
                return gson.toJson(Collections.singletonMap("error", "Error al generar el reporte: " + e.getMessage()));
            }
        });
    }
}

package com.odiparpack;

import com.google.ortools.Loader;
import com.odiparpack.api.controllers.SimulationController;

import java.util.logging.*;

import java.io.IOException;

public class Main {
    public static final Logger logger = Logger.getLogger(Main.class.getName());

    public static void main(String[] args) throws IOException {
        Loader.loadNativeLibraries();
        SimulationController simulationController = new SimulationController();
        simulationController.start();

        // Para deshabilitar logs
        simulationController.enableLogging();
    }
}
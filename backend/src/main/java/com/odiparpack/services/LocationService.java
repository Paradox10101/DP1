package com.odiparpack.services;

import com.odiparpack.models.Location;
import com.odiparpack.DataLoader;
import com.odiparpack.models.SimulationState;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Logger;

public class LocationService {
    private static final Logger logger = Logger.getLogger(LocationService.class.getName());
    private static LocationService instance;
    private Map<String, Location> locations = new ConcurrentHashMap<>();

    private LocationService() {
        loadLocations();
    }

    // Método para obtener la instancia única de LocationService (singleton)
    public static synchronized LocationService getInstance() {
        if (instance == null) {
            instance = new LocationService();
        }
        return instance;
    }

    // Cargar ubicaciones desde el archivo utilizando DataLoader
    private void loadLocations() {
        DataLoader dataLoader = new DataLoader();
        this.locations = dataLoader.loadLocationsWithCapacityByRegion("src/main/resources/locations.txt", "160401"); //Se excluye el ubigeo 160401
        logger.info("Ubicaciones cargadas: " + locations.size());
    }

    // Obtener una ubicación por ubigeo
    public Location getLocation(String ubigeo) {
        return locations.get(ubigeo);
    }

    // Obtener todas las ubicaciones
    public Map<String, Location> getAllLocations() {
        return locations;
    }

    public void addTemporaryLocation(String ubigeo, double latitude, double longitude) {
        Location location = new Location();
        location.setUbigeo(ubigeo);
        location.setLatitude(latitude);
        location.setLongitude(longitude);
        location.setDepartment("Temporal");
        location.setProvince("Punto de Avería");
        locations.put(ubigeo, location);
        SimulationState.locations.put(ubigeo, location);
    }

    public void removeTemporaryLocation(String ubigeo) {
        if (locations.containsKey(ubigeo)) {
            locations.remove(ubigeo);
            SimulationState.locations.remove(ubigeo);
            logger.info("Ubicación temporal eliminada: " + ubigeo);
        } else {
            logger.warning("Intento de eliminar ubigeo temporal que no existe: " + ubigeo);
        }
    }

}

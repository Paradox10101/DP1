package com.odiparpack.models;

import com.odiparpack.DataLoader;
import com.odiparpack.api.routers.SimulationRouter;
import com.odiparpack.services.LocationService;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

import static com.odiparpack.DataLoader.getUbigeoFromName;
import static com.odiparpack.Main.locations;
import static com.odiparpack.Main.logger;
import static com.odiparpack.models.SimulationState.addBreakdownLog;

public class Vehicle {
    public void handleRepairCompletion(LocalDateTime currentTime) {
        if (this.repairEndTime != null && !currentTime.isBefore(this.repairEndTime)) {
            if (this.estado == EstadoVehiculo.AVERIADO_1) {
                this.continueCurrentRoute(currentTime);
                logger.info(String.format("Vehículo %s ha sido reparado y continúa su ruta actual.", this.getCode()));
            } else {
                this.setEstado(EstadoVehiculo.EN_ALMACEN);
                this.setAvailable(true);
                logger.info(String.format("Vehículo %s ha sido reparado y está nuevamente disponible en el almacén.", this.getCode()));
            }
            this.clearRepairTime();
        }
    }

    public int getCurrentCapacity() {
        return currentCapacity;
    }

    public void setCurrentCapacity(int currentCapacity) {
        this.currentCapacity = currentCapacity;
    }


    public enum EstadoVehiculo {
        HACIA_ALMACEN,
        EN_ALMACEN,
        ORDENES_CARGADAS,
        EN_TRANSITO_ORDEN,
        EN_ESPERA_EN_OFICINA,
        LISTO_PARA_RETORNO,
        AVERIADO_1,
        AVERIADO_2,
        AVERIADO_3,
        EN_MANTENIMIENTO,
        EN_REPARACION,
        EN_REEMPLAZO;

        public static EstadoVehiculo fromBreakdownType(String breakdownType) {
            switch (breakdownType) {
                case "1":
                    return EstadoVehiculo.AVERIADO_1;
                case "2":
                    return EstadoVehiculo.AVERIADO_2;
                case "3":
                    return EstadoVehiculo.AVERIADO_3;
                default:
                    throw new IllegalArgumentException("Tipo de avería no reconocido: " + breakdownType);
            }
        }
    }



    private String code;
    private String type; // A, B, C
    private int capacity;
    private int currentCapacity;
    private String currentLocationUbigeo;
    private boolean isAvailable;
    private String homeUbigeo;
    private VehicleStatus status;
    private boolean isRouteBeingCalculated;
    private LocalDateTime repairEndTime;
    private Order currentOrder;
    private List<RouteSegment> route;
    private int currentSegmentIndex; // Índice del tramo actual en la ruta
    private long elapsedTimeInSegment; // Tiempo transcurrido en el tramo actual (en minutos)
    LocalDateTime estimatedDeliveryTime;
    LocalDateTime tiempoLimitedeLlegada;
    private long totalAveriaTime; // Tiempo total en estado de avería (en minutos)
    private LocalDateTime averiaStartTime; // Tiempo de inicio de la avería
    // Hora de inicio del viaje
    private LocalDateTime journeyStartTime;
    private List<PositionTimestamp> positionHistory = new ArrayList<>();
    private LocalDateTime maintenanceStartTime;
    private long totalBreakdownTime = 0; // Should be in minutes or seconds based on simulation type
    private boolean isReplacementProcessInitiated = false;
    private Vehicle brokenVehicleBeingReplaced;

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (!(obj instanceof Vehicle)) return false;
        Vehicle other = (Vehicle) obj;
        return Objects.equals(this.code, other.code);
    }

    @Override
    public int hashCode() {
        return Objects.hash(code);
    }
    public Vehicle getBrokenVehicleBeingReplaced() {
        return brokenVehicleBeingReplaced;
    }

    public void setBrokenVehicleBeingReplaced(Vehicle brokenVehicleBeingReplaced) {
        this.brokenVehicleBeingReplaced = brokenVehicleBeingReplaced;
    }

    public boolean isReplacementProcessInitiated() {
        return isReplacementProcessInitiated;
    }

    public void setReplacementProcessInitiated(boolean initiated) {
        this.isReplacementProcessInitiated = initiated;
    }

    // Métodos getter y setter para maintenanceStartTime
    public LocalDateTime getMaintenanceStartTime() {
        return maintenanceStartTime;
    }

    public void setMaintenanceStartTime(LocalDateTime maintenanceStartTime) {
        this.maintenanceStartTime = maintenanceStartTime;
    }

    public int getCurrentSegmentIndex() {
        return currentSegmentIndex;
    }
    public void setCurrentSegmentIndex(int currentSegmentIndex) {
        this.currentSegmentIndex = currentSegmentIndex;
    }

    public LocalDateTime getEstimatedDeliveryTime() {
        return estimatedDeliveryTime;
    }
    public void setEstimatedDeliveryTime(LocalDateTime estimatedDeliveryTime) {
        this.estimatedDeliveryTime = estimatedDeliveryTime;
    }


    public VehicleStatus getStatus() {
        return status;
    }
    public void setStatus(VehicleStatus status) {
        this.status = status;
    }


    // Clase interna para almacenar posición y tiempo
    public static class PositionTimestamp {
        private LocalDateTime timestamp;
        private Position position;

        public PositionTimestamp(LocalDateTime timestamp, Position position) {
            this.timestamp = timestamp;
            this.position = position;
        }

        public LocalDateTime getTimestamp() { return timestamp; }
        public Position getPosition() { return position; }
    }

    /*// Método para agregar una posición al historial
    public void addPositionToHistory(LocalDateTime timestamp, Position position) {
        positionHistory.add(new PositionTimestamp(timestamp, position));
    }

    // Getter para el historial de posiciones
    public List<PositionTimestamp> getPositionHistory() {
        return positionHistory;
    }*/



    public Position getCurrentPosition(LocalDateTime simulationTime, SimulationRouter.SimulationType simulationType) {
        // Si el vehículo está averiado, retornar la posición guardada
        if (estado == EstadoVehiculo.AVERIADO_1 ||
                estado == EstadoVehiculo.AVERIADO_2 ||
                estado == EstadoVehiculo.AVERIADO_3) {
            return breakdownPosition;
        }

        // Si no está averiado, calcular la posición actual
        return calculateCurrentPosition(simulationTime, simulationType);
    }

    private String getUbigeoByName(String name, Map<String, Location> locations) {
        return locations.values().stream()
                .filter(loc -> loc.getProvince().equals(name))
                .map(Location::getUbigeo)
                .findFirst()
                .orElse(null);
    }

    public long getTotalAveriaTime() {
        return totalAveriaTime;
    }

    public void setTotalAveriaTime(long totalAveriaTime) {
        this.totalAveriaTime = totalAveriaTime;
    }

    public LocalDateTime getAveriaStartTime() {
        return averiaStartTime;
    }

    public void setAveriaStartTime(LocalDateTime averiaStartTime) {
        this.averiaStartTime = averiaStartTime;
    }

    public void addToTotalBreakdownTime(long breakdownDuration) {
        this.totalBreakdownTime += breakdownDuration;
    }

    public boolean isInMaintenance() {
        return this.estado == EstadoVehiculo.EN_MANTENIMIENTO;
    }

    public boolean isUnderRepair() {
        return this.estado == EstadoVehiculo.AVERIADO_1 ||
                this.estado == EstadoVehiculo.AVERIADO_2 ||
                this.estado == EstadoVehiculo.AVERIADO_3 ||
                this.estado == EstadoVehiculo.EN_REPARACION;
    }

    public boolean hasCompletedRepair(LocalDateTime currentTime) {
        return this.repairEndTime != null && !currentTime.isBefore(this.repairEndTime);
    }

    /**
     * Inicia el seguimiento del tiempo de avería.
     */
    public void startAveria(LocalDateTime currentTime) {
        this.averiaStartTime = currentTime;
        this.totalAveriaTime = 0;
    }

    /**
     * Actualiza el tiempo total de avería basado en el tiempo actual y el tipo de simulación.
     */
    public void updateAveriaTime(LocalDateTime currentTime, SimulationRouter.SimulationType simulationType) {
        if (this.averiaStartTime != null) {
            // Calcular el tiempo transcurrido según el tipo de simulación
            long timeSinceAveriaStart;
            if (simulationType == SimulationRouter.SimulationType.DAILY) {
                timeSinceAveriaStart = ChronoUnit.SECONDS.between(this.averiaStartTime, currentTime);
                logger.info(String.format("Vehículo %s ha estado averiado durante %d segundos desde que ocurrió la avería inicialmente.",
                        this.getCode(), timeSinceAveriaStart));
            } else {
                timeSinceAveriaStart = ChronoUnit.MINUTES.between(this.averiaStartTime, currentTime);
                logger.info(String.format("Vehículo %s ha estado averiado durante %d minutos desde que ocurrió la avería inicialmente.",
                        this.getCode(), timeSinceAveriaStart));
            }
        }
    }

    /**
     * Finaliza el seguimiento del tiempo de avería.
     */
    public void endAveria() {
        this.averiaStartTime = null;
    }

    public void continueCurrentRoute(LocalDateTime currentTime) {
        if (this.averiaStartTime != null) {
            long breakdownDuration = ChronoUnit.MINUTES.between(this.averiaStartTime, currentTime);
            this.totalAveriaTime = breakdownDuration;
            this.averiaStartTime = null;
        }
        this.estado = EstadoVehiculo.EN_TRANSITO_ORDEN;
        this.setAvailable(true);

        // Lógica para continuar la ruta actual
        if (this.route != null && this.currentSegmentIndex < this.route.size()) {
            RouteSegment currentSegment = this.route.get(this.currentSegmentIndex);
            long remainingTimeInSegment = currentSegment.getDurationMinutes() - this.elapsedTimeInSegment;

            // Actualizar el tiempo estimado de entrega sumando el tiempo de reparación (solo para avería tipo 1)
            if (this.estado == EstadoVehiculo.AVERIADO_1) {
                this.estimatedDeliveryTime = this.estimatedDeliveryTime.plusHours(4); // Ajustar según el tiempo de reparación
            }

            logger.info(String.format("Vehículo %s reanudará el tramo %d: %s. Tiempo restante en el tramo: %d minutos.",
                    this.getCode(),
                    this.currentSegmentIndex + 1,
                    currentSegment.getName(),
                    remainingTimeInSegment));

            // Actualizar el tiempo de fin del tramo
            this.status.setEstimatedArrivalTime(this.status.getEstimatedArrivalTime().plusHours(4));  // Agregar 4 horas adicionales

            // Finalizar el seguimiento del tiempo de avería
            this.endAveria();

            // Registrar la continuación de la ruta
            logger.info(String.format("Vehículo %s ha reanudado su ruta en el tramo %d: %s.",
                    this.getCode(),
                    this.currentSegmentIndex + 1,
                    currentSegment.getName()));
        } else {
            logger.warning(String.format("Vehículo %s no tiene una ruta válida para continuar.", this.getCode()));
        }
    }


    public void clearRepairTime() {
        this.repairEndTime = null;
    }


    public boolean shouldUpdateStatus() {
        return this.estado == EstadoVehiculo.EN_TRANSITO_ORDEN ||
                this.estado == EstadoVehiculo.HACIA_ALMACEN ||
                this.estado == EstadoVehiculo.EN_ESPERA_EN_OFICINA ||
                this.estado == EstadoVehiculo.EN_REEMPLAZO;
    }

    public boolean shouldCalculateNewRoute(LocalDateTime currentTime) {
        return this.estado == EstadoVehiculo.LISTO_PARA_RETORNO && !this.isRouteBeingCalculated() &&
                (this.getWaitStartTime() == null ||
                        ChronoUnit.MINUTES.between(this.getWaitStartTime(), currentTime) >= WAIT_TIME_MINUTES);
    }

    public EstadoVehiculo getEstado() {
        return estado;
    }

    public void setEstado(EstadoVehiculo estado) {
        this.estado = estado;
    }

    private EstadoVehiculo estado;
    private LocalDateTime departureTime;

    public boolean isListoParaRegresarAlmacen() {
        return listoParaRegresarAlmacen;
    }

    public LocalDateTime getRepairEndTime() {
        return repairEndTime;
    }

    public long getElapsedTimeInSegment() {
        return this.elapsedTimeInSegment;
    }

    public void setElapsedTimeInSegment(long elapsedTime) {
        this.elapsedTimeInSegment = elapsedTime;
    }

    public void setRepairEndTime(LocalDateTime repairEndTime) {
        this.repairEndTime = repairEndTime;
    }

    public void setListoParaRegresarAlmacen(boolean listoParaRegresarAlmacen) {
        this.listoParaRegresarAlmacen = listoParaRegresarAlmacen;
    }

    private boolean listoParaRegresarAlmacen;
    private LocalDateTime waitStartTime;
    public static final long WAIT_TIME_MINUTES = 60; // 1 hora (nuevo)
    private Position breakdownPosition; // Nueva variable para guardar la posición de la avería
    private LocalDateTime tiempoFinAveria;

    public LocalDateTime getWaitStartTime() {
        return waitStartTime;
    }

    public void setWaitStartTime(LocalDateTime waitStartTime) {
        this.waitStartTime = waitStartTime;
    }

    private Position calculateCurrentPosition(LocalDateTime currentTime, SimulationRouter.SimulationType simulationType) {
        LocationService locationService = LocationService.getInstance();

        if (route == null || route.isEmpty() || journeyStartTime == null) {
            if (this.code == "A006") {
                logger.info("Current location ubigeo: " + currentLocationUbigeo);
            }
            Location loc = locationService.getLocation(currentLocationUbigeo);
            if (loc == null) {
                logger.warning("No se encontró ubicación para el ubigeo: " + currentLocationUbigeo);
                return null;
            }
            return new Position(loc.getLatitude(), loc.getLongitude());
        }

        // Calcula el tiempo total transcurrido desde el inicio del viaje
        long totalElapsedTime = (simulationType == SimulationRouter.SimulationType.DAILY)
                ? ChronoUnit.SECONDS.between(journeyStartTime, currentTime)
                : ChronoUnit.MINUTES.between(journeyStartTime, currentTime);

        // Resta el tiempo total de avería
        long elapsedTime;
        if (simulationType == SimulationRouter.SimulationType.DAILY) {
            elapsedTime = totalElapsedTime - (totalAveriaTime * 60); // Convierte minutos a segundos
        } else {
            elapsedTime = totalElapsedTime - totalAveriaTime;
        }

        // Asegúrate de que adjustedElapsedTime no sea negativo
        if (elapsedTime < 0) {
            elapsedTime = 0;
        }

        long accumulatedTime = 0;
        for (RouteSegment segment : route) {
            accumulatedTime += segment.getDurationMinutes();
            if (elapsedTime <= accumulatedTime * (simulationType == SimulationRouter.SimulationType.DAILY ? 60 : 1)) {
                long timeInSegment;
                double progress;
                if (simulationType == SimulationRouter.SimulationType.DAILY) {
                    timeInSegment = elapsedTime - (accumulatedTime - segment.getDurationMinutes()) * 60;
                    progress = (double) timeInSegment / (segment.getDurationMinutes() * 60);
                } else {
                    timeInSegment = elapsedTime - (accumulatedTime - segment.getDurationMinutes());
                    progress = (double) timeInSegment / segment.getDurationMinutes();
                }

                Location fromLocation = locationService.getLocation(segment.getFromUbigeo());
                Location toLocation = locationService.getLocation(segment.getToUbigeo());

                if (fromLocation == null || toLocation == null) {
                    logger.warning("No se encontró ubicación para los ubigeos: " +
                            segment.getFromUbigeo() + ", " + segment.getToUbigeo());
                    return null;
                }

                double lat = fromLocation.getLatitude() +
                        (toLocation.getLatitude() - fromLocation.getLatitude()) * progress;
                double lon = fromLocation.getLongitude() +
                        (toLocation.getLongitude() - fromLocation.getLongitude()) * progress;

                return new Position(lat, lon);
            }
        }

        Location loc = locationService.getLocation(getCurrentLocationUbigeo());
        if (loc == null) {
            logger.warning("No se encontró ubicación para el ubigeo: " + currentLocationUbigeo);
            return null;
        }
        return new Position(loc.getLatitude(), loc.getLongitude());
    }


    public String handleBreakdown(LocalDateTime currentTime, EstadoVehiculo tipoAveria, SimulationRouter.SimulationType simulationType) {
        this.estado = tipoAveria;
        this.setAvailable(false);

        // Calcular y guardar la posición exacta donde ocurrió la avería
        this.breakdownPosition = calculateCurrentPosition(currentTime, simulationType);

        long repairHours;
        switch (tipoAveria) {
            case AVERIADO_1:
                repairHours = 4;
                break;
            case AVERIADO_2:
                repairHours = 36;
                break;
            case AVERIADO_3:
                repairHours = 72;
                break;
            default:
                logger.warning("Tipo de avería no reconocido");
                return null;
        }

        // Calcular el tiempo de finalización de la reparación basado en el tiempo de simulación
        LocalDateTime repairEndTime = currentTime.plusHours(repairHours);
        this.setRepairEndTime(repairEndTime);

        // Guardar tiempo fin averia
        tiempoFinAveria = repairEndTime;

        // Registrar el tramo actual y el tiempo transcurrido hasta la avería
        if (this.route != null && this.currentSegmentIndex < this.route.size()) {
            RouteSegment currentSegment = this.route.get(this.currentSegmentIndex);
            long elapsedMinutes = ChronoUnit.MINUTES.between(this.status.getSegmentStartTime(), currentTime);
            this.setElapsedTimeInSegment(elapsedMinutes);

            String segmentLog = String.format("Vehículo %s ha sufrido una avería tipo %s en el tramo %d: %s. Tiempo transcurrido en el tramo: %d minutos.",
                    this.getCode(), tipoAveria, this.currentSegmentIndex + 1, currentSegment.getName(), elapsedMinutes);
            addBreakdownLog(this.getCode(), segmentLog);
            logger.info(segmentLog);
        }

        // Iniciar el seguimiento del tiempo de avería
        this.startAveria(currentTime);

        String breakdownLog = String.format("Vehículo %s ha sufrido una avería tipo %s en %s. Estará detenido hasta %s.",
                this.getCode(), tipoAveria, this.getCurrentLocationUbigeo(), repairEndTime);
        addBreakdownLog(this.getCode(), breakdownLog);
        logger.info(breakdownLog);

        String temporaryUbigeo = "TEMP_" + this.getCode(); // Crear un ubigeo único para el punto de avería
        LocationService.getInstance().addTemporaryLocation(temporaryUbigeo, breakdownPosition.getLatitude(), breakdownPosition.getLongitude());
        this.currentLocationUbigeo = temporaryUbigeo;
        return temporaryUbigeo;
    }

    public List<RouteSegment> getAdjustedRemainingRouteSegments() {
        List<RouteSegment> adjustedRoute = new ArrayList<>();

        if (this.route == null || this.route.isEmpty()) {
            return adjustedRoute;
        }

        RouteSegment currentSegment = this.route.get(this.currentSegmentIndex);

        long elapsedMinutes = this.getElapsedTimeInSegment();
        long segmentDurationMinutes = currentSegment.getDurationMinutes();
        double segmentDistance = currentSegment.getDistance();

        double progress = (double) elapsedMinutes / segmentDurationMinutes;
        if (progress > 1.0) {
            progress = 1.0; // Asegurar que no sobrepase el 100%
        }

        double distanceCovered = segmentDistance * progress;
        double distanceRemaining = segmentDistance - distanceCovered;
        long timeRemaining = segmentDurationMinutes - elapsedMinutes;

        if (timeRemaining > 0) {
            // Crear un nuevo segmento ajustado desde el punto de avería
            RouteSegment adjustedSegment = new RouteSegment(
                    currentSegment.getName() + " (Averiado)",
                    this.getCurrentLocationUbigeo(),
                    currentSegment.getToUbigeo(),
                    timeRemaining
            );
            //adjustedSegment.setAdjusted(true); // Opcional: para depuración o lógica adicional
            adjustedRoute.add(adjustedSegment);
        } else {
            // Si el tiempo transcurrido supera el segmento, avanzar al siguiente segmento
            this.currentSegmentIndex++;
        }

        // Agregar los segmentos restantes de la ruta
        for (int i = this.currentSegmentIndex + 1; i < this.route.size(); i++) {
            adjustedRoute.add(this.route.get(i));
        }

        return adjustedRoute;
    }


    public Order getCurrentOrder() {
        return currentOrder;
    }

    public void setCurrentOrder(Order currentOrder) {
        this.currentOrder = currentOrder;
    }


    // Constructor
    public Vehicle(String code, String type, int capacity, String currentLocationUbigeo) {
        this.code = code;
        this.type = type;
        this.capacity = capacity;
        this.currentLocationUbigeo = currentLocationUbigeo;
        this.homeUbigeo = currentLocationUbigeo;
        this.isAvailable = true;
        this.estado = EstadoVehiculo.EN_ALMACEN;
        this.listoParaRegresarAlmacen = false;
    }

    // Getters and setters
    public String getCode() { return code; }
    public String getType() { return type; }
    public int getCapacity() { return capacity; }
    public String getCurrentLocationUbigeo() { return currentLocationUbigeo; }
    public void setCurrentLocationUbigeo(String ubigeo) { this.currentLocationUbigeo = ubigeo; }
    public String getHomeUbigeo() { return homeUbigeo; }
    public boolean isAvailable() { return isAvailable; }
    public void setAvailable(boolean available) { isAvailable = available; }
    public void setRoute(List<RouteSegment> route) {
        this.route = new ArrayList<>(route);
    }

    public void updateStatus(LocalDateTime currentTime, WarehouseManager warehouseManager, SimulationRouter.SimulationType type) {
        if (isWaiting(currentTime)) {
            return;
        }

        if (status == null) { // || currentOrder == null
            return;
        }

        if (route.isEmpty() && this.estado == EstadoVehiculo.EN_REEMPLAZO) {
            // Si la ruta es vacía, asumimos que el vehículo de reemplazo ya ha llegado a su destino en caso se haya averiado el vehiculo en el tramo de almacen al inicio
            // y no ha transcurrido más tiempo.
            completeDelivery(currentTime, warehouseManager);
            return;
        }

        if (hasArrivedAtDestination(currentTime)) { // para cada segmento
            handleArrivalAtDestination(currentTime, warehouseManager);
        } else {
            updateCurrentSegmentStatus(currentTime, type);
        }
    }

    private boolean isWaiting(LocalDateTime currentTime) {
        if (waitStartTime != null) {
            long waitedMinutes = ChronoUnit.MINUTES.between(waitStartTime, currentTime);
            if (waitedMinutes >= WAIT_TIME_MINUTES) {
                logger.info(String.format("Vehículo %s ha completado su tiempo de espera de %d minutos en %s",
                        this.getCode(), waitedMinutes, this.currentLocationUbigeo));
                waitStartTime = null;
                setAvailable(true);
                setListoParaRegresarAlmacen(true);
                estado = EstadoVehiculo.LISTO_PARA_RETORNO;
                return false;
            }
            logger.info(String.format("Vehículo %s aún en espera. Tiempo transcurrido: %d minutos",
                    this.getCode(), waitedMinutes));
            return true; // Still waiting
        }
        return false;
    }

    private boolean hasArrivedAtDestination(LocalDateTime currentTime) {
        return currentTime.isAfter(status.getEstimatedArrivalTime()) || currentTime.isEqual(status.getEstimatedArrivalTime());
    } // estimatedDeliveryTime

    private void handleArrivalAtDestination(LocalDateTime currentTime, WarehouseManager warehouseManager) {
        if (currentSegmentIndex >= route.size()) {
            // Ya se ha procesado todos los segmentos, completar la entrega
            completeDelivery(currentTime, warehouseManager);
            return;
        }

        // Obtener el segmento actual
        RouteSegment currentSegment = route.get(currentSegmentIndex);

        currentLocationUbigeo = currentSegment.getToUbigeo();

        currentSegmentIndex++;
        if (currentSegmentIndex >= route.size()) {
            completeDelivery(currentTime, warehouseManager);
        } else {
            updateCurrentSegment(currentTime);
        }
    }

    // Lo usamos tanto cuanto entrega paquetes como cuando se dirige hacia almacen.
    // y ahora tambien cuando el vehiculo de reemplazo llega a donde el vehiculo se encuentra averiado.
    private void completeDelivery(LocalDateTime currentTime, WarehouseManager warehouseManager) {
        logArrivalAtDestination(currentTime);

        if (estado == EstadoVehiculo.HACIA_ALMACEN) {
            String[] segment = status.getCurrentSegment().split(" to ");
            String toName = segment[1];

            // Obtener el ubigeo a partir del nombre de la ubicación
            currentLocationUbigeo = getUbigeoFromName(toName);

            if (currentLocationUbigeo != null) {
                logger.info(String.format("Ubicacion actual actualizada del vehiculo %s a: %s (%s).",
                        getCode(), currentLocationUbigeo, toName));
            } else {
                logger.warning(String.format("No se encontró el ubigeo para la ubicación: %s", toName));
            }
        } else if (estado == EstadoVehiculo.EN_TRANSITO_ORDEN) {
            int deliverablePackages = calculateDeliverablePackages();
            updateWarehouseCapacity(warehouseManager, deliverablePackages);
            updateOrderStatus(currentTime, deliverablePackages);
            startWaitingPeriod(currentTime);
        }

        if (estado != EstadoVehiculo.EN_REEMPLAZO) {
            resetVehicleStatus();
        }

        if (estado == EstadoVehiculo.EN_REEMPLAZO) {
            handleReplacementArrival(currentTime);
        }
    }

    /**
     * Obtiene los segmentos restantes de la ruta del vehículo averiado a partir del ubigeo actual.
     *
     * @param brokenVehicle El vehículo averiado.
     * @param currentUbigeo El ubigeo actual donde ocurrió la avería.
     * @return Lista de segmentos restantes.
     */
    private List<RouteSegment> getRemainingRouteSegments(Vehicle brokenVehicle, String currentUbigeo) {
        List<RouteSegment> originalRoute = brokenVehicle.getRoute();
        List<RouteSegment> remainingRoute = new ArrayList<>();

        boolean startAdding = false;
        for (RouteSegment segment : originalRoute) {
            if (segment.getFromUbigeo().equals(currentUbigeo)) {
                startAdding = true;
            }
            if (startAdding) {
                remainingRoute.add(segment);
            }
        }

        return remainingRoute;
    }

    private void handleReplacementArrival(LocalDateTime currentTime) {
        logger.info("Entering handleReplacementArrival for vehicle " + this.code);

        // Obtener el vehículo averiado que está siendo reemplazado
        Vehicle brokenVehicle = this.getBrokenVehicleBeingReplaced();

        if (brokenVehicle != null) {
            // Asignar el pedido y el estado de ruta al vehículo de reemplazo
            this.setCurrentOrder(brokenVehicle.getCurrentOrder());
            this.setCurrentCapacity(brokenVehicle.getCurrentCapacity());
            this.setEstimatedDeliveryTime(brokenVehicle.getEstimatedDeliveryTime());
            this.setStatus(brokenVehicle.getStatus());
            this.setCurrentLocationUbigeo(brokenVehicle.getCurrentLocationUbigeo());

            // Obtener los segmentos restantes de la ruta del vehículo averiado, ajustados
            List<RouteSegment> remainingRoute = brokenVehicle.getAdjustedRemainingRouteSegments();

            if (remainingRoute != null && !remainingRoute.isEmpty()) {
                this.setRoute(remainingRoute); // Asignar la ruta ajustada al vehículo de reemplazo
                this.currentSegmentIndex = 0;
                this.journeyStartTime = currentTime;
                this.estado = EstadoVehiculo.EN_TRANSITO_ORDEN;

                updateCurrentSegment(currentTime);

                String estimatedArrivalStr = calculateEstimatedArrivalTime(currentTime, remainingRoute)
                        .format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

                StringBuilder logBuilder = new StringBuilder();
                logBuilder.append("\n--- Continuación de Viaje después de Reemplazo ---\n");
                logBuilder.append("Código del Vehículo: ").append(this.getCode()).append("\n");
                logBuilder.append("Estado del vehiculo: ").append(this.getEstado()).append("\n");
                logBuilder.append("Capacidad actual del vehiculo: ").append(this.getCurrentCapacity()).append("\n");
                logBuilder.append("Ubicacion actual: ").append(this.getCurrentLocationUbigeo()).append("\n");
                logBuilder.append("Pedido Asignado: ").append(this.getCurrentOrder().getId()).append("\n");
                logBuilder.append("Estado Asignado: ").append(this.getStatus()).append("\n");

                logBuilder.append("Segmentos Restantes:\n");
                if (remainingRoute != null && !remainingRoute.isEmpty()) {
                    for (RouteSegment segment : remainingRoute) {
                        logBuilder.append(" - Segmento: ").append(segment.getName())
                                .append(", Desde: ").append(segment.getFromUbigeo())
                                .append(", Hacia: ").append(segment.getToUbigeo())
                                .append(", Distancia: ").append(segment.getDistance())
                                .append(" km, Duración: ").append(segment.getDurationMinutes())
                                .append(" min\n");
                    }
                } else {
                    logBuilder.append("No hay segmentos restantes.\n");
                }

                logBuilder.append("Tiempo de Inicio de Viaje: ").append(currentTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))).append("\n");
                logBuilder.append("Tiempo Estimado de Llegada: ").append(estimatedArrivalStr).append("\n");
                logBuilder.append("-------------------------");

                logger.info(logBuilder.toString());
            } else {
                logger.warning(String.format("No se encontraron segmentos restantes de ruta para el vehículo averiado %s.", brokenVehicle.getCode()));
            }

            /*String tempUbigeo = "TEMP_" + brokenVehicle.getCode();
            SimulationState.removeTemporaryLocation(tempUbigeo);*/

            // Actualizar el estado del vehículo averiado
            brokenVehicle.setEstado(EstadoVehiculo.EN_REPARACION);
            brokenVehicle.setCurrentOrder(null);
            brokenVehicle.setCurrentCapacity(0);

            // Obtener el primer punto de la ruta original del vehículo averiado
            if (brokenVehicle.getRoute() != null && !brokenVehicle.getRoute().isEmpty()) {
                String origenUbigeo = brokenVehicle.getRoute().get(0).getFromUbigeo();
                brokenVehicle.setCurrentLocationUbigeo(origenUbigeo);

                Location location = LocationService.getInstance().getLocation(origenUbigeo);
                if (location != null) {
                    String locationName = location.getDepartment() + " - " + location.getProvince();
                    logger.warning(String.format("El vehículo averiado %s se encuentra en el almacén %s siendo reparado.",
                            brokenVehicle.getCode(), locationName));
                } else {
                    logger.warning(String.format("No se encontró información para el ubigeo %s.", origenUbigeo));
                    brokenVehicle.setCurrentLocationUbigeo("Ubicación desconocida");
                }

            } else {
                logger.warning(String.format("El vehículo averiado %s no tiene ruta asignada para determinar su ubicación inicial.", brokenVehicle.getCode()));
                brokenVehicle.setCurrentLocationUbigeo("Ubicación desconocida");
            }

            brokenVehicle.setRoute(Collections.emptyList());
            brokenVehicle.setAvailable(false);
            // Limpiar la referencia al vehículo averiado
            this.setBrokenVehicleBeingReplaced(null);
        } else {
            logger.warning(String.format("Vehículo %s llegó al punto de avería, pero no se encontró el vehículo averiado a reemplazar.", this.getCode()));
        }
    }


    private void logArrivalAtDestination(LocalDateTime currentTime) {
        String arrivalTimeStr = currentTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        String departureTimeStr = departureTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        StringBuilder logBuilder = new StringBuilder();

        logBuilder.append("\n--- Vehículo Llegada A Destino ---\n");
        logBuilder.append("Código del Vehículo: ").append(this.getCode()).append("\n");
        logBuilder.append("Capacidad del Vehículo: ").append(this.getCapacity()).append(" paquetes\n");

        if (estado == EstadoVehiculo.HACIA_ALMACEN) {
            logBuilder.append("Tipo de Viaje: Hacia Almacén\n");
            logBuilder.append("Origen: ").append(locations.get(getCurrentLocationUbigeo()).getProvince()).append("\n");

            // Extraer los nombres de las ubicaciones del nombre del segmento
            String[] segment = status.getCurrentSegment().split(" to ");
            String fromName = segment[0];
            String toName = segment[1];
            logBuilder.append("Destino (Almacén): ").append(toName).append("\n");

        } else if (estado == EstadoVehiculo.EN_REEMPLAZO) {
            logBuilder.append("Tipo de Viaje: Reemplazo\n");

            // Obtener información del vehículo averiado que está siendo reemplazado
            Vehicle brokenVehicle = this.getBrokenVehicleBeingReplaced();
            if (brokenVehicle != null) {
                logBuilder.append("Vehículo Reemplazado:\n");
                logBuilder.append("  - Código del Vehículo: ").append(brokenVehicle.getCode()).append("\n");

                if (brokenVehicle.getCurrentOrder() != null) {
                    logBuilder.append("  - Código de la Orden: ").append(brokenVehicle.getCurrentOrder().getId()).append("\n");
                    logBuilder.append("  - Cantidad Total de la Orden: ").append(brokenVehicle.getCurrentOrder().getQuantity()).append(" paquetes\n");
                    logBuilder.append("  - Cantidad Restante a Entregar: ").append(brokenVehicle.getCurrentOrder().getRemainingPackagesToDeliver()).append(" paquetes\n");
                }
            } else {
                logBuilder.append("No se encontró información del vehículo averiado que está siendo reemplazado.\n");
            }
        } else {
            String dueTimeStr = currentOrder.getDueTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            logBuilder.append("Tipo de Viaje: Entrega de Orden\n");
            logBuilder.append("Orden Entregada:\n");
            logBuilder.append("  - Código de la Orden: ").append(currentOrder.getId()).append("\n");
            logBuilder.append("  - Cantidad Total de la Orden: ").append(currentOrder.getQuantity()).append(" paquetes\n");
            logBuilder.append("  - Cantidad Asignada al Vehículo: ").append(currentOrder.getRemainingPackagesToDeliver()).append(" paquetes\n");
            logBuilder.append("Origen: ").append(currentOrder.getOriginUbigeo()).append("\n");

            String destinoUbigeo = currentOrder.getDestinationUbigeo();
            Location destinoLocation = locations.get(destinoUbigeo);

            if (destinoLocation != null) {
                String destinoNombre = destinoLocation.getProvince();
                logBuilder.append("Destino: ").append(destinoNombre).append("\n");
                logBuilder.append("  - Ubigeo: ").append(destinoUbigeo).append("\n");
                logBuilder.append("  - Nombre: ").append(destinoNombre).append("\n");
            } else {
                logBuilder.append("Destino: Ubigeo desconocido: ").append(destinoUbigeo).append("\n");
            }

            logBuilder.append("Tiempo Límite de Entrega: ").append(dueTimeStr).append("\n");
        }

        logBuilder.append("Tiempo de Partida: ").append(departureTimeStr).append("\n");
        logBuilder.append("Tiempo de Llegada: ").append(arrivalTimeStr).append("\n");
        logBuilder.append("Duración del Viaje: ").append(Duration.between(departureTime, currentTime).toMinutes()).append(" minutos\n");
        logBuilder.append("--------------------------");

        logger.info(logBuilder.toString());
    }

    private int calculateDeliverablePackages() {
        int remainingAssignedPackages = currentOrder.getRemainingPackagesToDeliver();
        return Math.min(this.getCapacity(), remainingAssignedPackages);
    }

    private void updateWarehouseCapacity(WarehouseManager warehouseManager, int deliverablePackages) {
        // Actualizar la ubicación actual del vehículo al destino de la orden
        this.currentLocationUbigeo = currentOrder.getDestinationUbigeo();

        // Reducir la capacidad actual del vehículo según los paquetes entregados
        this.currentCapacity -= deliverablePackages;

        // Verificar que la capacidad actual no sea negativa (caso de error)
        if (this.currentCapacity < 0) {
            logger.warning(String.format("Capacidad actual del vehículo %s es negativa. Ajustando a 0.", this.getCode()));
            this.currentCapacity = 0;
        }

        // Disminuir la capacidad del almacén
        warehouseManager.decreaseCapacity(currentOrder.getDestinationUbigeo(), deliverablePackages);

        // Log de la actualización de la capacidad
        logger.info(String.format("Vehículo %s ha liberado %d paquetes. Capacidad actual: %d paquetes.",
                this.getCode(), deliverablePackages, this.currentCapacity));
    }

    private void updateOrderStatus(LocalDateTime currentTime, int deliverablePackages) {
        if (deliverablePackages > 0) {
            currentOrder.incrementDeliveredPackages(deliverablePackages);
            logger.info(String.format("Vehículo %s entrega %d paquetes de la orden %d.",
                    this.getCode(), deliverablePackages, currentOrder.getId()));
        }

        // Asegurarse de que no se exceda la cantidad total asignada
        if (currentOrder.getDeliveredPackages() > currentOrder.getAssignedPackages()) {
            currentOrder.setDeliveredPackages(currentOrder.getAssignedPackages());
            logger.warning(String.format("Vehículo %s ha intentado entregar más paquetes de los asignados para la orden %d. Ajustando a la cantidad asignada.",
                    this.getCode(), currentOrder.getId()));
        }

        // Actualizar el estado de la orden según la entrega
        if (currentOrder.isFullyDelivered()) {
            currentOrder.setStatus(Order.OrderStatus.PENDING_PICKUP);
            currentOrder.setPendingPickupStartTime(currentTime);
            logger.info(String.format("Orden %d completamente entregada y cambiada a estado PENDING_PICKUP a las %s",
                    currentOrder.getId(), currentTime.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)));
        } else {
            currentOrder.setStatus(Order.OrderStatus.PARTIALLY_ARRIVED);
            logger.info(String.format("Orden %d parcialmente entregada. Faltan %d paquetes por entregar",
                    currentOrder.getId(), currentOrder.getRemainingPackagesToDeliver()));
        }
    }

    private void startWaitingPeriod(LocalDateTime currentTime) {
        waitStartTime = currentTime;
        logger.info(String.format("Vehículo %s comienza periodo de espera de 1 hora en %s",
                this.getCode(), this.currentLocationUbigeo));
    }

    private void resetVehicleStatus() {
        status = null;
        currentOrder = null;
        route = null;
        this.setListoParaRegresarAlmacen(false);

        if (estado == EstadoVehiculo.HACIA_ALMACEN) {
            estado = EstadoVehiculo.EN_ALMACEN;
            logger.info(String.format("Estado del vehiculo %s actualizado a: EN ALMACEN - %s (%s)",
                    getCode(),
                    locations.get(getCurrentLocationUbigeo()).getProvince(),
                    getCurrentLocationUbigeo()));
        } else if (estado == EstadoVehiculo.EN_TRANSITO_ORDEN) {
            estado = EstadoVehiculo.EN_ESPERA_EN_OFICINA;
        }

        //this.setAvailable(true);
    }

    private void updateCurrentSegmentStatus(LocalDateTime currentTime, SimulationRouter.SimulationType simulationType) {
        long elapsedTime;
        String timeUnit;

        // Determinar la unidad de tiempo basada en el tipo de simulación
        if (simulationType == SimulationRouter.SimulationType.DAILY) {
            // Simulación diaria: calcular en segundos
            elapsedTime = ChronoUnit.SECONDS.between(status.getSegmentStartTime(), currentTime);
            timeUnit = "segundos";
        } else {
            // Otras simulaciones: calcular en minutos
            elapsedTime = ChronoUnit.MINUTES.between(status.getSegmentStartTime(), currentTime);
            timeUnit = "minutos";
        }

        // Registro actualizado con la unidad de tiempo correcta
        logger.info(String.format("Vehículo %s - Velocidad: %.2f km/h, Tramo: %s (%s)," +
                        "Ubicación actual: %s, Tiempo en tramo: %d %s",
                this.getCode(), status.getCurrentSpeed(), status.getCurrentSegment(),
                status.getCurrentSegmentUbigeo(), currentLocationUbigeo, elapsedTime, timeUnit));
    }

    public LocalDateTime calculateEstimatedArrivalTime(LocalDateTime startTime, List<RouteSegment> route) {
        long totalDurationMinutes = route.stream()
                .mapToLong(RouteSegment::getDurationMinutes)
                .sum();
        return startTime.plusMinutes(totalDurationMinutes);
    }

    /**
     * Inicia un viaje para el vehículo y registra detalles en los logs.
     * @param startTime        La hora de inicio del viaje.
     * @param order            La orden asignada al vehículo.
     */
    public void startJourney(LocalDateTime startTime, Order order, SimulationState state) {
        if (this.route == null || this.route.isEmpty()) {
            logger.warning(String.format("Intento de iniciar un viaje para el vehículo %s con una ruta vacía.", this.getCode()));
            return;
        }
        this.journeyStartTime = startTime;
        this.currentSegmentIndex = 0;
        this.elapsedTimeInSegment = 0;
        this.status = new VehicleStatus();
        this.currentOrder = order;
        this.departureTime = startTime;
        this.setAvailable(false);
        this.estado = EstadoVehiculo.EN_TRANSITO_ORDEN;

        updateCurrentSegment(startTime);

        String startTimeStr = startTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        estimatedDeliveryTime = calculateEstimatedArrivalTime(startTime, this.route);
        String estimatedArrivalStr = estimatedDeliveryTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        String dueTimeStr = order.getDueTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

        StringBuilder logBuilder = new StringBuilder();
        logBuilder.append("\n--- Inicio de Viaje ---\n");
        logBuilder.append("Código del Vehículo: ").append(this.getCode()).append("\n");
        logBuilder.append("Capacidad del Vehículo: ").append(this.getCapacity()).append(" paquetes\n");
        logBuilder.append("Orden a Entregar:\n");
        logBuilder.append("  - Código de la Orden: ").append(order.getId()).append("\n");
        logBuilder.append("  - Cantidad Total de la Orden: ").append(order.getQuantity()).append(" paquetes\n");
        logBuilder.append("  - Cantidad Asignada al Vehículo: ").append(order.getRemainingPackagesToDeliver()).append(" paquetes\n");
        logBuilder.append("Origen: ").append(order.getOriginUbigeo()).append(" (").append(DataLoader.ubigeoToNameMap.getOrDefault(order.getOriginUbigeo(), "Desconocido")).append(")\n");
        logBuilder.append("Destino: ").append(order.getDestinationUbigeo()).append(" (").append(DataLoader.ubigeoToNameMap.getOrDefault(order.getDestinationUbigeo(), "Desconocido")).append(")\n");
        logBuilder.append("Tiempo de Inicio de Viaje: ").append(startTimeStr).append("\n");
        logBuilder.append("Tiempo Estimado de Llegada: ").append(estimatedArrivalStr).append("\n");
        logBuilder.append("Tiempo Límite de Entrega: ").append(dueTimeStr).append("\n");
        logBuilder.append("-------------------------");

        // Agregar segmentos restantes al log
        logBuilder.append("Segmentos Restantes:\n");
        logBuilder.append(getRemainingSegmentsLog());

        this.tiempoLimitedeLlegada = order.getDueTime();
        // Llamar a la función calcularEficienciaPedido aquí
        state.calcularEficienciaPedido(this.getCode(),estimatedDeliveryTime, tiempoLimitedeLlegada);
        //order.setEstimedTime(estimatedDeliveryTime);

        logger.info(logBuilder.toString());
    }

    private String getRemainingSegmentsLog() {
        StringBuilder segmentsLog = new StringBuilder();
        for (int i = currentSegmentIndex; i < route.size(); i++) {
            RouteSegment segment = route.get(i);
            segmentsLog.append(" - Segmento: ").append(segment.getName());
            segmentsLog.append(", Desde: ").append(segment.getFromUbigeo())
                    .append(", Hacia: ").append(segment.getToUbigeo())
                    .append(", Distancia: ").append(segment.getDistance()).append(" km")
                    .append(", Duración: ").append(segment.getDurationMinutes()).append(" min\n");
        }
        return segmentsLog.toString();
    }


    public LocalDateTime getEstimatedArrivalTime() {
        return estimatedDeliveryTime;
    }

    public LocalDateTime getTiempoLimitedeLlegada() {
        return tiempoLimitedeLlegada;
    }

    public void startWarehouseJourney(LocalDateTime startTime, String destinationWarehouseUbigeo) {
        if (this.route == null || this.route.isEmpty()) {
            logger.warning(String.format("Intento de iniciar un viaje al almacén para el vehículo %s con una ruta vacía.", this.getCode()));
            return;
        }

        this.journeyStartTime = startTime; // Inicializar journeyStartTime
        this.currentSegmentIndex = 0;
        this.status = new VehicleStatus();
        this.currentOrder = null; // No hay orden activa en este viaje
        this.setAvailable(false); // no disponible porque se dirige a almacen
        this.estado = EstadoVehiculo.HACIA_ALMACEN;
        this.departureTime = startTime;

        updateCurrentSegment(startTime);

        String startTimeStr = startTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        String estimatedArrivalStr = calculateEstimatedArrivalTime(startTime, this.route).format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

        StringBuilder logBuilder = new StringBuilder();
        logBuilder.append("\n--- Inicio de Viaje al Almacén ---\n");
        logBuilder.append("Código del Vehículo: ").append(this.getCode()).append("\n");
        logBuilder.append("Capacidad del Vehículo: ").append(this.getCapacity()).append(" paquetes\n");
        logBuilder.append("Origen: ").append(this.getCurrentLocationUbigeo()).append(" (").append(DataLoader.ubigeoToNameMap.getOrDefault(this.getCurrentLocationUbigeo(), "Desconocido")).append(")\n");
        logBuilder.append("Destino (Almacén): ").append(destinationWarehouseUbigeo).append(" (").append(DataLoader.ubigeoToNameMap.getOrDefault(destinationWarehouseUbigeo, "Desconocido")).append(")\n");
        logBuilder.append("Tiempo de Inicio de Viaje: ").append(startTimeStr).append("\n");
        logBuilder.append("Tiempo Estimado de Llegada: ").append(estimatedArrivalStr).append("\n");
        logBuilder.append("-------------------------");

        logger.info(logBuilder.toString());
    }

    public void startJourneyToBreakdown(LocalDateTime startTime, String breakdownUbigeo) {
        if (this.route == null) {
            logger.warning(String.format("Intento de iniciar un viaje al punto de avería para el vehículo %s con una ruta nula.", this.getCode()));
            return;
        }

        if (this.route.isEmpty()) {
            logger.info(String.format("El vehículo %s ya se encuentra en la ubicación del vehículo averiado.", this.getCode()));
            // Actualizar el estado del vehículo directamente
            this.journeyStartTime = startTime;
            this.currentSegmentIndex = -1; // No hay segmentos
            this.status = new VehicleStatus();
            this.currentOrder = null;
            this.setAvailable(false);
            this.estado = EstadoVehiculo.EN_REEMPLAZO;
            this.departureTime = startTime;

            // Registrar que el vehículo ya está en el punto de avería
            StringBuilder logBuilder = new StringBuilder();
            logBuilder.append("\n--- Vehículo de Reemplazo Ya en el Punto de Avería ---\n");
            logBuilder.append("Código del Vehículo de Reemplazo: ").append(this.getCode()).append("\n");
            logBuilder.append("Ubicación Actual: ").append(this.getCurrentLocationUbigeo()).append(" (").append(DataLoader.ubigeoToNameMap.getOrDefault(this.getCurrentLocationUbigeo(), "Desconocido")).append(")\n");
            logBuilder.append("Tiempo de Inicio de Reemplazo: ").append(startTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))).append("\n");
            logBuilder.append("-------------------------");

            logger.info(logBuilder.toString());
            return;
        }

        // Si hay una ruta, proceder normalmente
        this.journeyStartTime = startTime;
        this.currentSegmentIndex = 0;
        this.status = new VehicleStatus();
        this.currentOrder = null; // No hay orden activa en este viaje
        this.setAvailable(false);
        this.estado = EstadoVehiculo.EN_REEMPLAZO;
        this.departureTime = startTime;

        String tempUbigeo = currentLocationUbigeo;
        updateCurrentSegment(startTime);
        currentLocationUbigeo = tempUbigeo;

        String startTimeStr = startTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        String estimatedArrivalStr = calculateEstimatedArrivalTime(startTime, this.route).format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

        StringBuilder logBuilder = new StringBuilder();
        logBuilder.append("\n--- Inicio de Viaje al Punto de Avería ---\n");
        logBuilder.append("Código del Vehículo: ").append(this.getCode()).append("\n");
        logBuilder.append("Capacidad del Vehículo: ").append(this.getCapacity()).append(" paquetes\n");
        logBuilder.append("Origen: ").append(this.getCurrentLocationUbigeo()).append(" (").append(DataLoader.ubigeoToNameMap.getOrDefault(this.getCurrentLocationUbigeo(), "Desconocido")).append(")\n");
        logBuilder.append("Destino (Punto de Avería): ").append(breakdownUbigeo).append(" (").append(DataLoader.ubigeoToNameMap.getOrDefault(breakdownUbigeo, "Desconocido")).append(")\n");
        logBuilder.append("Tiempo de Inicio de Viaje: ").append(startTimeStr).append("\n");
        logBuilder.append("Tiempo Estimado de Llegada: ").append(estimatedArrivalStr).append("\n");
        logBuilder.append("-------------------------");

        logger.info(logBuilder.toString());
    }


    private void updateCurrentSegment(LocalDateTime currentTime) {
        RouteSegment segment = route.get(currentSegmentIndex);
        status.setCurrentSegment(segment.getName());
        status.setCurrentSegmentUbigeo(segment.getToUbigeo());
        status.setSegmentStartTime(currentTime);
        status.setEstimatedArrivalTime(currentTime.plusMinutes(segment.getDurationMinutes()));
        status.setCurrentSpeed(segment.getDistance() / (segment.getDurationMinutes() / 60.0));
        currentLocationUbigeo = segment.getFromUbigeo();
    }

    public List<RouteSegment> getRoute() {
        return this.route;
    }

    public boolean isRouteBeingCalculated() {
        return isRouteBeingCalculated;
    }

    public void setRouteBeingCalculated(boolean routeBeingCalculated) {
        isRouteBeingCalculated = routeBeingCalculated;
    }
}

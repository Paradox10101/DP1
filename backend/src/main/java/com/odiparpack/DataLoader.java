package com.odiparpack;

import com.odiparpack.models.*;

import java.io.*;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.logging.Level;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.odiparpack.Main.logger;

public class DataLoader {
    private static final double TIME_UNIT = 60000.0; // 1 minuto en milisegundos
    // Mapa que relaciona ubigeos con nombres de ubicaciones
    public static Map<String, String> ubigeoToNameMap = new HashMap<>();
    // Mapa que relaciona nombres de ubicaciones con ubigeos
    public static Map<String, String> nameToUbigeoMap = new HashMap<>();

    public Map<String, Location> loadLocations(String filePath) {
        Map<String, Location> locations = new HashMap<>();
        try (BufferedReader br = new BufferedReader(new FileReader(filePath))) {
            String line;
            while ((line = br.readLine()) != null) {
                if (line.trim().isEmpty() || line.startsWith("#")) continue;
                String[] parts = line.split(",");
                if (parts.length < 7) continue; // Asegurarse de que hay suficientes campos
                String ubigeo = parts[0].trim();
                String department = parts[1].trim();
                String province = parts[2].trim();
                double latitude = Double.parseDouble(parts[3].trim());
                double longitude = Double.parseDouble(parts[4].trim());
                String naturalRegion = parts[5].trim();
                int warehouseCapacity = Integer.parseInt(parts[6].trim());

                Location location = new Location(ubigeo, department, province, latitude, longitude, naturalRegion, warehouseCapacity);
                locations.put(ubigeo, location);

                // Población automática de ubigeoToNameMap
                ubigeoToNameMap.put(ubigeo, province);

                // Población de nameToUbigeoMap
                nameToUbigeoMap.put(province, ubigeo);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        return locations;
    }

    public List<Vehicle> loadVehicles(String filePath) {
        List<Vehicle> vehicles = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new FileReader(filePath))) {
            String line;
            while ((line = br.readLine()) != null) {
                if (line.trim().isEmpty() || line.startsWith("#")) continue;
                String[] parts = line.split(",");
                if (parts.length < 4) continue;
                String code = parts[0].trim();
                String type = parts[1].trim();
                int capacity = Integer.parseInt(parts[2].trim());
                String currentUbigeo = parts[3].trim();

                Vehicle vehicle = new Vehicle(code, type, capacity, currentUbigeo);
                vehicle.setAvailable(true);
                vehicles.add(vehicle);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        return vehicles;
    }

    public List<Order> loadOrders(LocalDateTime startDateTime, LocalDateTime endDateTime, Map<String, Location> locations) {
        List<Order> orders = new ArrayList<>();
        AtomicInteger orderId = new AtomicInteger(1);
        Pattern timePattern = Pattern.compile("(\\d{2})\\s(\\d{2}:\\d{2}),\\s*(\\d+)\\s*=>\\s*(\\d+),\\s*(\\d+),\\s*(\\d+)");

        // Obtener los archivos relevantes
        List<String> files = endDateTime == null ?
                getAllOrderFiles() :
                getMonthFileNamesBetween(startDateTime, endDateTime);

        for (String filePath : files) {
            // Extraer año y mes del nombre del archivo
            String fileName = new File(filePath).getName();
            Matcher yearMonthMatcher = Pattern.compile("ventas(\\d{4})(\\d{2})").matcher(fileName);

            if (!yearMonthMatcher.find()) continue;

            int year = Integer.parseInt(yearMonthMatcher.group(1));
            int month = Integer.parseInt(yearMonthMatcher.group(2));

            try (BufferedReader br = new BufferedReader(new FileReader(filePath))) {
                String line;
                while ((line = br.readLine()) != null) {
                    Matcher m = timePattern.matcher(line);
                    if (!m.find()) continue;

                    try {
                        // Extraer componentes de la línea usando los grupos del patrón
                        int day = Integer.parseInt(m.group(1));
                        LocalTime time = LocalTime.parse(m.group(2));
                        String originUbigeo = m.group(3);
                        String destinationUbigeo = m.group(4);
                        int quantity = Integer.parseInt(m.group(5));
                        String clientId = String.format("%06d", Integer.parseInt(m.group(6)));

                        // Construir fecha
                        LocalDateTime orderDateTime = LocalDateTime.of(year, month, day, time.getHour(), time.getMinute());

                        // Verificar rango de fechas
                        if (orderDateTime.isBefore(startDateTime)) continue;
                        if (endDateTime != null && orderDateTime.isAfter(endDateTime)) continue;

                        // Crear orden
                        Order order = new Order(
                                orderId.getAndIncrement(),
                                originUbigeo,
                                destinationUbigeo,
                                quantity,
                                orderDateTime,
                                calculateDueDate(orderDateTime, destinationUbigeo, locations),
                                clientId
                        );

                        order.setOrderCode(String.format("P%d%06d", order.getId() / 1000000, order.getId() % 1000000));
                        orders.add(order);

                    } catch (NumberFormatException | DateTimeException e) {
                        logger.warning("Error parsing line: " + line);
                    }
                }
            } catch (IOException e) {
                logger.severe("Error reading file " + filePath + ": " + e.getMessage());
            }
        }

        return orders;
    }

    private List<String> getAllOrderFiles() {
        // Ya que los archivos están ordenados, podemos leerlos directamente
        File resourceDir = new File("src/main/resources");
        return Arrays.stream(resourceDir.listFiles())
                .filter(file -> file.getName().matches("c\\.1inf54\\.ventas\\d{6}\\.txt"))
                .map(File::getAbsolutePath)
                .collect(Collectors.toList());
    }

    private List<String> getMonthFileNamesBetween(LocalDateTime startDateTime, LocalDateTime endDateTime) {
        List<String> fileNames = new ArrayList<>();

        YearMonth startMonth = YearMonth.from(startDateTime);
        YearMonth endMonth = YearMonth.from(endDateTime);

        while (!startMonth.isAfter(endMonth)) {
            String fileName = String.format("src/main/resources/c.1inf54.ventas%04d%02d.txt", startMonth.getYear(), startMonth.getMonthValue());
            fileNames.add(fileName);
            startMonth = startMonth.plusMonths(1);
        }
        return fileNames;
    }

    private String extractDateFromFileName(String fileName) {
        Pattern pattern = Pattern.compile("ventas(\\d{6})");
        Matcher matcher = pattern.matcher(fileName);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return "";
    }

    private LocalDateTime parseOrderDateTime(String dayAndTimeStr, String filePath) {
        try {
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
            String fileName = new File(filePath).getName();
            Pattern pattern = Pattern.compile("ventas(\\d{6})");
            Matcher matcher = pattern.matcher(fileName);

            if (matcher.find()) {
                String yearMonthStr = matcher.group(1);
                YearMonth fileYearMonth = YearMonth.parse(yearMonthStr, DateTimeFormatter.ofPattern("yyyyMM"));

                String[] dayTimeParts = dayAndTimeStr.split(" ");
                int day = Integer.parseInt(dayTimeParts[0]);
                LocalTime time = LocalTime.parse(dayTimeParts[1], timeFormatter);

                return LocalDateTime.of(fileYearMonth.atDay(day), time);
            }
        } catch (Exception e) {
            logger.warning("Error parsing date time from " + dayAndTimeStr + " in file " + filePath);
        }
        return null;
    }

    private Order parseOrderData(String[] parts, LocalDateTime orderDateTime, int orderId, Map<String, Location> locations) {
        try {
            String[] locationParts = parts[1].split("=>");
            if (locationParts.length != 2) return null;

            String originUbigeo = locationParts[0].trim();
            String destinationUbigeo = locationParts[1].trim();
            int quantity = Integer.parseInt(parts[2].trim());
            String clientId = parts[3].trim();

            Order order = new Order(
                    orderId,
                    originUbigeo,
                    destinationUbigeo,
                    quantity,
                    orderDateTime,
                    calculateDueDate(orderDateTime, destinationUbigeo, locations),
                    clientId
            );

            order.setOrderCode(String.format("P%d%06d", order.getId() / 1000000, order.getId() % 1000000));
            return order;
        } catch (Exception e) {
            logger.warning("Error parsing order data: " + Arrays.toString(parts));
            return null;
        }
    }

    public LocalDateTime calculateDueDate(LocalDateTime orderDateTime, String destinationUbigeo, Map<String, Location> locations) {
        Location destination = locations.get(destinationUbigeo);
        if (destination == null) {
            return orderDateTime.plusDays(1); // Default due date
        }

        String naturalRegion = destination.getNaturalRegion();
        switch (naturalRegion.toUpperCase()) {
            case "COSTA":
                return orderDateTime.plusDays(1);
            case "SIERRA":
                return orderDateTime.plusDays(2);
            case "SELVA":
                return orderDateTime.plusDays(3);
            default:
                return orderDateTime.plusDays(1);
        }
    }

    public List<Edge> loadEdges(String filePath, Map<String, Location> locations) {
        List<Edge> edges = new ArrayList<>();
        //System.out.println("Cargando edges desde: " + filePath);
        try (BufferedReader br = new BufferedReader(new FileReader(filePath))) {
            String line;
            while ((line = br.readLine()) != null) {
                if (line.trim().isEmpty() || line.startsWith("#")) continue;
                String[] parts = line.split("=>");
                if (parts.length < 2) continue;
                String originUbigeo = parts[0].trim();
                String destinationUbigeo = parts[1].trim();

                //System.out.println("Procesando edge: " + originUbigeo + " => " + destinationUbigeo);

                Location origin = locations.get(originUbigeo);
                Location destination = locations.get(destinationUbigeo);

                if (origin != null && destination != null) {
                    double distance = Utils.calculateDistance(origin.getLatitude(), origin.getLongitude(),
                            destination.getLatitude(), destination.getLongitude());
                    double speed = Utils.getAverageSpeed(origin.getNaturalRegion(), destination.getNaturalRegion());
                    double travelTime = distance / speed; // en horas

                    Edge edge = new Edge(originUbigeo, destinationUbigeo, distance, travelTime);
                    edges.add(edge);
                    //System.out.println("Edge agregado: " + edge);
                } else {
                    System.out.println("¡Advertencia! No se pudo encontrar la ubicación para " + originUbigeo + " o " + destinationUbigeo);
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        //System.out.println("Total de edges cargados: " + edges.size());
        return edges;
    }

    public List<Blockage> loadBlockages(String filePath) {
        List<Blockage> blockages = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new FileReader(filePath))) {
            String line;
            while ((line = br.readLine()) != null) {
                if (line.trim().isEmpty() || line.startsWith("#")) continue;
                try {
                    // Formato: UG-Ori => UG-Des;mmdd-inicio,hh:mm-inicio==mmdd-fin,hh:mm-fin
                    String[] parts = line.split(";");
                    if (parts.length < 2) continue;
                    String[] nodes = parts[0].split("=>");
                    String originUbigeo = nodes[0].trim();
                    String destinationUbigeo = nodes[1].trim();

                    String[] times = parts[1].split("==");
                    String startStr = times[0].trim();
                    String endStr = times[1].trim();

                    LocalDateTime startTime = Utils.parseBlockageDateTime(startStr);
                    LocalDateTime endTime = Utils.parseBlockageDateTime(endStr);

                    Blockage blockage = new Blockage(originUbigeo, destinationUbigeo, startTime, endTime);
                    blockages.add(blockage);
                } catch (Exception e) {
                    logger.warning("Error al procesar la línea de bloqueo: " + line + ". Error: " + e.getMessage());
                }
            }
        } catch (IOException e) {
            logger.severe("Error al leer el archivo de bloqueos: " + e.getMessage());
        }
        return blockages;
    }

    /*public long[][] createTimeMatrix(List<Location> locations, List<Edge> edges) {
        int n = locations.size();
        long[][] timeMatrix = new long[n][n];

        // Inicializar la matriz con valores muy grandes
        for (int i = 0; i < n; i++) {
            Arrays.fill(timeMatrix[i], Long.MAX_VALUE);
            timeMatrix[i][i] = 0; // Distancia a sí mismo es 0
        }

        // Llenar la matriz con los tiempos de viaje conocidos
        for (Edge edge : edges) {
            //System.out.println("Origen: " + edge.getOriginUbigeo() + ", Destino: " + edge.getDestinationUbigeo() + ", Tiempo de Viaje: " + edge.getTravelTime());
            int fromIndex = getLocationIndex(locations, edge.getOriginUbigeo());
            int toIndex = getLocationIndex(locations, edge.getDestinationUbigeo());
            if (fromIndex != -1 && toIndex != -1) {
                long travelTime = (long) (edge.getTravelTime() * 60); // Convertir horas a minutos
                timeMatrix[fromIndex][toIndex] = travelTime;
                timeMatrix[toIndex][fromIndex] = travelTime; // Asumiendo que el viaje es bidireccional
            }
        }

        // Aplicar el algoritmo de Floyd-Warshall para completar la matriz
        for (int k = 0; k < n; k++) {
            for (int i = 0; i < n; i++) {
                for (int j = 0; j < n; j++) {
                    if (timeMatrix[i][k] != Long.MAX_VALUE && timeMatrix[k][j] != Long.MAX_VALUE) {
                        timeMatrix[i][j] = Math.min(timeMatrix[i][j], timeMatrix[i][k] + timeMatrix[k][j]);
                    }
                }
            }
        }

        // Imprimir
        //printTimeMatrix(timeMatrix);

        return timeMatrix;
    }*/

    public long[][] createTimeMatrix(List<Location> locations, List<Edge> edges) {
        int n = locations.size();
        long[][] timeMatrix = new long[n][n];

        // Inicializar la matriz con valores muy grandes
        for (int i = 0; i < n; i++) {
            Arrays.fill(timeMatrix[i], Long.MAX_VALUE);
            timeMatrix[i][i] = 0; // Distancia a sí mismo es 0
        }

        // Llenar la matriz solo con los tiempos de viaje conocidos
        for (Edge edge : edges) {
            int fromIndex = getLocationIndex(locations, edge.getOriginUbigeo());
            int toIndex = getLocationIndex(locations, edge.getDestinationUbigeo());
            if (fromIndex != -1 && toIndex != -1) {
                long travelTime = (long) (edge.getTravelTime() * 60); // Convertir horas a minutos
                timeMatrix[fromIndex][toIndex] = travelTime;
                timeMatrix[toIndex][fromIndex] = travelTime; // Asumiendo que el viaje es bidireccional
            }
        }

        // Log para imprimir la cantidad de nodos (locations)
        logger.info("Cantidad total de nodos (locations): " + n);

        return timeMatrix;
    }

    private void printTimeMatrix(long[][] timeMatrix) {
        System.out.println("Matriz de Tiempos (en minutos):");
        for (int i = 0; i < timeMatrix.length; i++) {
            for (int j = 0; j < timeMatrix[i].length; j++) {
                if (timeMatrix[i][j] >= Integer.MAX_VALUE / 2) {
                    System.out.print("INF\t");
                } else {
                    System.out.print(timeMatrix[i][j] + "\t");
                }
            }
            System.out.println();
        }
    }

    private int getLocationIndex(List<Location> locations, String ubigeo) {
        for (int i = 0; i < locations.size(); i++) {
            if (locations.get(i).getUbigeo().equals(ubigeo)) {
                return i;
            }
        }
        return -1;
    }

    public List<Maintenance> loadMaintenanceSchedule(String filePath) {
        List<Maintenance> maintenances = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMdd");
        DateTimeFormatter outputFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

        logger.info("Iniciando carga del plan de mantenimiento desde: " + filePath);

        try (BufferedReader br = new BufferedReader(new FileReader(filePath))) {
            String line;
            int lineNumber = 0;
            while ((line = br.readLine()) != null) {
                lineNumber++;
                if (line.trim().isEmpty() || line.startsWith("#")) continue;
                String[] parts = line.split(":");
                if (parts.length != 2) {
                    logger.warning("Línea " + lineNumber + " mal formateada: " + line);
                    continue;
                }

                String dateStr = parts[0];
                String vehicleCode = parts[1];

                try {
                    LocalDate date = LocalDate.parse(dateStr, formatter);
                    LocalDateTime startTime = date.atStartOfDay();
                    LocalDateTime endTime = date.plusDays(2).atTime(23, 59);

                    Maintenance maintenance = new Maintenance(vehicleCode, startTime, endTime);
                    maintenances.add(maintenance);

                    logger.info(String.format("Mantenimiento cargado - Vehículo: %s, Inicio: %s, Fin: %s",
                            vehicleCode,
                            startTime.format(outputFormatter),
                            endTime.format(outputFormatter)));
                } catch (DateTimeParseException e) {
                    logger.warning("Error al parsear la fecha en la línea " + lineNumber + ": " + dateStr);
                }
            }
        } catch (IOException e) {
            logger.log(Level.SEVERE, "Error al cargar el plan de mantenimiento", e);
        }

        logger.info("Carga del plan de mantenimiento completada. Total de mantenimientos: " + maintenances.size());

        return maintenances;
    }

    /**
     * Obtiene un mapa que relaciona ubigeos con nombres de ubicaciones.
     *
     * @return Un mapa inmutable de ubigeo a nombre de ubicación.
     */
    public Map<String, String> getUbigeoToNameMap() {
        return Collections.unmodifiableMap(ubigeoToNameMap);
    }

    public static String getUbigeoFromName(String locationName) {
        // Verificar si el mapa contiene el nombre de la ubicación
        if (nameToUbigeoMap.containsKey(locationName)) {
            // Devolver el ubigeo correspondiente
            return nameToUbigeoMap.get(locationName);
        } else {
            // Si no se encuentra la ubicación, loguear una advertencia y devolver null
            logger.warning(String.format("No se encontró el ubigeo para la ubicación: %s", locationName));
            return null;
        }
    }


}

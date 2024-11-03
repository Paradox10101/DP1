import { Button, Input } from "@nextui-org/react";
import { Filter, Map } from "lucide-react";
import { useAtom } from "jotai";
import { useState, useEffect, useCallback } from "react";
import { vehiclePositionsAtom, loadingAtom } from "../atoms";
import BarraProgreso from "./BarraProgreso";
import CardVehiculo from "@/app/Components/CardVehiculo";
import { useWebSocket } from "../../hooks/useWebSocket"; // WebSocket hook

export default function OpcionVehiculos() {
  const [vehiculos, setVehiculos] = useAtom(vehiclePositionsAtom); // Access and set vehicle data
  const [isLoading, setLoading] = useAtom(loadingAtom); // Access loading state
  const [error, setError] = useState(null); // Local state for errors
  const [searchInput, setSearchInput] = useState(""); // Local search input state

  // Ensure vehiculos is an array to avoid TypeError
  const vehiculosArray = Array.isArray(vehiculos.features) ? vehiculos.features : [];

  // Filter vehiculosArray based on search input
  const filteredVehiculosArray = vehiculosArray.filter((vehiculo) =>
    vehiculo.properties.vehicleCode.toLowerCase().includes(searchInput.toLowerCase())
  );

  // Calculate total used and max capacity
  const capacidadUsadaTotal = filteredVehiculosArray.reduce(
    (total, vehiculo) => total + (vehiculo.properties.capacidadUsada || 0), 0
  );
  const capacidadTotalMaxima = filteredVehiculosArray.reduce(
    (total, vehiculo) => total + (vehiculo.properties.capacidadMaxima || 0), 0
  );

  // WebSocket message handler
  const handleWebSocketMessage = useCallback((data) => {
    setVehiculos(data); // Update vehicle positions
  }, [setVehiculos]);

  // Connection change handler
  const handleConnectionChange = useCallback((status) => {
    setLoading(status === 'loading');
    if (status === 'failed') {
      setError("Connection failed. Please try again.");
    }
  }, [setLoading, setError]);

  // Initialize WebSocket and define connection handlers
  const { connect, disconnect, checkStatus, isRetrying } = useWebSocket({
    onMessage: handleWebSocketMessage,
    onConnectionChange: handleConnectionChange,
  });

  // Initial check of simulation status
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Retry handler for connection issues
  const handleRetry = useCallback(() => {
    if (error?.includes("connection")) {
      connect();
    }
  }, [error, connect]);

  useEffect(() => {
    console.log("Vehiculos actualizados:", filteredVehiculosArray);
  }, [filteredVehiculosArray]);

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex flex-row justify-between items-center gap-2">
        <Input
          type="text"
          placeholder="Buscar por código"
          startContent={<Map size="18" />}
          className="focus:outline-none  rounded-xl pequenno w-3/4"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)} // Update search input on change
          onClear={() => setSearchInput('')}
          isClearable
        />
        <Button
        disableRipple={true}
        startContent={<Filter size="18" />}
        className="bg-[#F4F4F4]"
        >
        Filtros
        </Button>
      </div>

      <div className="text-right pequenno text-[#939393]">
        Cantidad de vehículos: {filteredVehiculosArray.length}
      </div>

      <div className="flex flex-col gap-2">
        <div className="pequenno_bold text-center">Capacidad Total de los Vehículos</div>
        <div className="flex flex-col gap-1">
          <BarraProgreso porcentaje={(capacidadUsadaTotal / capacidadTotalMaxima) * 100} />
          <div className="flex flex-row justify-between">
            <div className="pequenno">Ocupado: {capacidadUsadaTotal}</div>
            <div className="pequenno_bold">
              {capacidadTotalMaxima ? parseFloat(((capacidadUsadaTotal / capacidadTotalMaxima) * 100).toFixed(2)) : 0}%
            </div>
            <div className="pequenno">Máximo: {capacidadTotalMaxima}</div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-gray-500">Cargando vehículos...</div>
      ) : (
        <div className="flex flex-col gap-3 overflow-y-scroll max-h-[65vh] scroll-area">
          {filteredVehiculosArray.map((vehiculo) => (
            <CardVehiculo key={vehiculo.properties.vehicleCode} vehiculo={vehiculo.properties} />
          ))}
        </div>
      )}

      {error && (
        <div className="text-center text-red-500 mt-4">
          {error} <Button onClick={handleRetry}>Reintentar</Button>
        </div>
      )}
    </div>
  );
}

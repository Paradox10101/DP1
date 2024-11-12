import { Progress } from "@nextui-org/react";
import { Car, CarFront, Truck, MapPin, Calendar, Package } from "lucide-react";
import BarraProgreso from "@/app/Components/BarraProgreso";
import IconoEstado from "./IconoEstado";

export default function CardVehiculo({ vehiculo }) {
    // Helper function to format status text
    const formatStatus = (status) => {
        if (status === "EN_TRANSITO_ORDEN") return "En Tránsito";
        return status
            .toLowerCase()
            .replace(/_/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    return (
        <div className="flex flex-col p-4 border-2 stroke-black rounded-xl gap-1">
            <div className="flex flex-row justify-between">
                <div className="flex flex-row gap-2 items-center">
                    {vehiculo.tipo === "A" ? (
                        <IconoEstado Icono={Truck} classNameContenedor="bg-blue-500 w-[25px] h-[25px] relative rounded-full flex items-center justify-center" classNameContenido="w-[15px] h-[15px] stroke-blanco z-10"/>
                    ) : vehiculo.tipo === "B" ? (
                        <IconoEstado Icono={CarFront} classNameContenedor="bg-blue-500 w-[25px] h-[25px] relative rounded-full flex items-center justify-center" classNameContenido="w-[15px] h-[15px] stroke-blanco z-10"/>
                    ) : vehiculo.tipo === "C" ? (
                        <IconoEstado Icono={Car} classNameContenedor="bg-blue-500 w-[25px] h-[25px] relative rounded-full flex items-center justify-center" classNameContenido="w-[15px] h-[15px] stroke-blanco z-10"/>
                    ) : null}
                    <div className="pequenno_bold">{vehiculo.vehicleCode}</div>
                </div>
                <div className={`pequenno border rounded-xl w-[140px] text-center ${
                    vehiculo.status === "EN_TRANSITO_ORDEN" ? "bg-[#284BCC] text-[#BECCFF]" :
                    vehiculo.status === "EN_ALMACEN" ? "bg-[#DEA71A] text-[#F9DF9B]" :
                    vehiculo.status === "AVERIADO" ? "bg-[#BE0627] text-[#FFB9C1]" :
                    vehiculo.status === "EN_MANTENIMIENTO" ? "bg-[#7B15FA] text-[#D0B0F8]" : ""
                }`}>
                    {formatStatus(vehiculo.status)}
                </div>
            </div>
            <div className="flex flex-row gap-2 items-center">
                <MapPin size={16} />
                <div className="pequenno">Tramo actual: {vehiculo.ubicacionActual} ➔ {vehiculo.ubicacionSiguiente}</div>
            </div>
            <div className="flex flex-row gap-2 items-center">
                <Calendar size={16} />
                <div className="pequenno">Velocidad: {vehiculo.velocidad} km/h</div>
            </div>
            <div className="flex flex-row gap-2 items-center">
                <Package size={16} />
                <div className="pequenno">Capacidad utilizada: {vehiculo.capacidadUsada} / {vehiculo.capacidadMaxima}</div>
            </div>
            <div className="flex flex-col gap-1">
                <BarraProgreso porcentaje={(vehiculo.capacidadUsada / vehiculo.capacidadMaxima) * 100} />
                <span className="pequenno text-[#555555]">
                    {parseFloat((vehiculo.capacidadUsada / vehiculo.capacidadMaxima * 100).toFixed(2))}% ocupado
                </span>
            </div>
        </div>
    );
}

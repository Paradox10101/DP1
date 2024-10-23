import { Button, Input } from "@nextui-org/react";
import { Filter, Map } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import CardEnvio from "@/app/Components/CardEnvio"
import { ScrollArea } from "@radix-ui/react-scroll-area";
import CardAlmacen from "./CardAlmacen";
import BarraProgreso from "./BarraProgreso";
import CardVehiculo from "@/app/Components/CardVehiculo";

export default function OpcionVehiculos({vehiculos}){
//const [vehiculos, setVehiculos] = useState([])

const capacidadUsadaTotal = vehiculos.reduce((total, vehiculo)=>{return total+(vehiculo.capacidadUsada || 0)}, 0) 
const capacidadTotalMaxima = vehiculos.reduce((total, vehiculo)=>{return total+(vehiculo.capacidadMaxima|| 0)}, 0)

const vehiculosEjemplo = [
    {
        codigo: "A001",
        ubicacionActual: "Piura",
        ubicacionSiguiente: "Trujillo",
        tipo: "A",
        capacidadUsada: 10,
        capacidadMaxima: 20,
        estado: "En Tránsito",
        velocidad: 30
    },
    {
        codigo: "A002",
        ubicacionActual: "Piura",
        ubicacionSiguiente: "",
        tipo: "A",
        capacidadUsada: 0,
        capacidadMaxima: 20,
        estado: "En Mantenimiento",
        velocidad: 0
    },
    {
        codigo: "A003",
        ubicacionActual: "Piura",
        ubicacionSiguiente: "Arequipa",
        tipo: "A",
        capacidadUsada: 10,
        capacidadMaxima: 20,
        estado: "Averiado",
        velocidad: 0
    },
    {
        codigo: "B001",
        ubicacionActual: "Lima",
        ubicacionSiguiente: "",
        tipo: "B",
        capacidadUsada: 10,
        capacidadMaxima: 60,
        estado: "En Preparación",
        velocidad: 0
    },
    {
        codigo: "B002",
        ubicacionActual: "Piura",
        ubicacionSiguiente: "Trujillo",
        tipo: "B",
        capacidadUsada: 0,
        capacidadMaxima: 60,
        estado: "En Tránsito",
        velocidad: 30
    },
    {
        codigo: "C001",
        ubicacionActual: "Piura",
        ubicacionSiguiente: "Trujillo",
        tipo: "C",
        capacidadUsada: 20,
        capacidadMaxima: 90,
        estado: "En Tránsito",
        velocidad: 30
    },
    
]

/*
useEffect(()=>{
    setVehiculos(vehiculos);
}, [])
*/

return (
        <div className="h-full">
            <div className="flex justify-between flex-row items-center">
                <Input
                type="text"
                placeholder="Buscar por código"
                className="focus:outline-none border-2 stroke-black rounded-2xl h-8 pequenno w-[77%]"
                startContent={<Map className="mr-2"/>}
                />
                <Button
                disableRipple={true}
                startContent={<Filter className="size-2"/>}
                className="focus:outline-none border stroke-black rounded h-8 pequenno w-[22%] bg-[#F4F4F4]"
                >
                Filtros
                </Button>
            </div>
            <div className="text-right pequenno text-[#939393]">
                Cantidad de vehículos: {vehiculos.length}
            </div>
            <div className="flex flex-col gap-2">
                <div className="pequenno_bold text-center">
                    Capacidad Total de los Vehículos
                </div>
                <div className="flex flex-col gap-1">
                    <BarraProgreso
                        porcentaje={capacidadUsadaTotal/capacidadTotalMaxima*100}/>
                    <div className="flex flex-row justify-between">
                        <div className="pequenno">
                            Usado: {capacidadUsadaTotal}
                        </div>
                        <div className="pequenno_bold">
                            {parseFloat((capacidadUsadaTotal/capacidadTotalMaxima*100).toFixed(2))}%
                        </div>
                        <div className="pequenno">
                            Máximo: {capacidadTotalMaxima}
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex flex-col gap-3 overflow-y-scroll max-h-[65vh] scroll-area">
                {vehiculos.map((vehiculo)=>{
                    return(
                        <CardVehiculo vehiculo={vehiculo} />
                    )
                    }
                )}
            </div>
        </div>
    )
}
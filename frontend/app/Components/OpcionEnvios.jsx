import { Button, Input } from "@nextui-org/react";
import { Filter, Map } from "lucide-react";
import { useEffect, useState } from "react";
import CardEnvio from "@/app/Components/CardEnvio"
import { ScrollArea } from "@radix-ui/react-scroll-area";



export default function OpcionEnvios(){
const [pedidos, setPedidos] = useState([])

const pedidosEjemplo = [
    {
        codigo: "0P0010",
        ciudadOrigen: "Trujillo",
        ciudadDestino: "Piura",
        fechaDeInicio: "26/08/2024, 03:45 PM",
        tiempoRestante: "1d 3h",
        cantidadPaquetes: "1",
        estado: "En Tránsito"
    },
    {
        codigo: "0P0011",
        ciudadOrigen: "Lima",
        ciudadDestino: "Trujillo",
        fechaDeInicio: "26/08/2024, 03:45 PM",
        tiempoRestante: "1d 3h",
        cantidadPaquetes: "15",
        estado: "Registrado"
    },
    {
        codigo: "0P0012",
        ciudadOrigen: "Lima",
        ciudadDestino: "Ica",
        fechaDeInicio: "26/08/2024, 03:45 PM",
        tiempoRestante: "1d 3h",
        cantidadPaquetes: "12",
        estado: "En Oficina"

    },
    {
        codigo: "0P0013",
        ciudadOrigen: "Lima",
        ciudadDestino: "Ica",
        fechaDeInicio: "26/08/2024, 03:45 PM",
        tiempoRestante: "1d 3h",
        cantidadPaquetes: "12",
        estado: "En Oficina"

    },
    {
        codigo: "0P0014",
        ciudadOrigen: "Lima",
        ciudadDestino: "Ica",
        fechaDeInicio: "26/08/2024, 03:45 PM",
        tiempoRestante: "1d 3h",
        cantidadPaquetes: "12",
        estado: "En Oficina"

    },
    {
        codigo: "0P0015",
        ciudadOrigen: "Trujillo",
        ciudadDestino: "Piura",
        fechaDeInicio: "26/08/2024, 03:45 PM",
        tiempoRestante: "1d 3h",
        cantidadPaquetes: "1",
        estado: "En Tránsito"
    },
    {
        codigo: "0P0016",
        ciudadOrigen: "Trujillo",
        ciudadDestino: "Piura",
        fechaDeInicio: "26/08/2024, 03:45 PM",
        tiempoRestante: "1d 3h",
        cantidadPaquetes: "1",
        estado: "En Tránsito"
    },
]


useEffect(()=>{
    setPedidos(pedidosEjemplo);
}, [])

return (
        <div className="h-full">
            <div className="flex justify-between flex-row items-center">
                <Input
                type="text"
                placeholder="ID de envio, ciudad origen / destino"
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
                Cantidad de envíos: {pedidos.length}
            </div>
            <div className="flex flex-col gap-3 overflow-y-scroll max-h-[70vh] scroll-area">
                {pedidos.map((pedido)=>{
                    return(
                        <CardEnvio pedido={pedido} />
                    )
                    }
                )}
            </div>
        </div>
    )

}
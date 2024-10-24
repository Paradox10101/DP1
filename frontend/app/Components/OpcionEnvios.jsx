import { Button, Input } from "@nextui-org/react";
import { Filter, Map } from "lucide-react";
import { useEffect, useState } from "react";
import CardEnvio from "@/app/Components/CardEnvio"
import { ScrollArea } from "@radix-ui/react-scroll-area";



export default function OpcionEnvios({datos}){

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
                Cantidad de envíos: {datos.pedidos&&datos.pedidos?datos.pedidos.length:0}
            </div>
            <div className="flex flex-col gap-3 overflow-y-scroll max-h-[70vh] scroll-area">
            {datos&&datos.pedidos&&
                datos.pedidos.map((pedido)=>{
                    return(
                        <CardEnvio pedido={pedido} />
                    )
                    }
            )}
            </div>
        </div>
    )

}
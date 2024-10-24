import { Button, Input } from "@nextui-org/react";
import { Filter, Map } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import CardEnvio from "@/app/Components/CardEnvio"
import { ScrollArea } from "@radix-ui/react-scroll-area";
import CardAlmacen from "./CardAlmacen";
import BarraProgreso from "./BarraProgreso";



export default function OpcionAlmacenes({datos}){

const capacidadUsadaTotal = datos&&datos.almacenes?datos.almacenes.reduce((total, almacen)=>{return total+(almacen.capacidadUtilizada || 0)}, 0):0
const capacidadTotalMaxima = datos&&datos.almacenes?datos.almacenes.reduce((total, almacen)=>{return total+(almacen.capacidadMaxima|| 0)}, 0):0



return (
        <div className="h-full">
            <div className="flex justify-between flex-row items-center">
                <Input
                type="text"
                placeholder="Buscar por nombre o ubigeo"
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
                Cantidad de almacenes: {datos&&datos.almacenes?datos.almacenes.length:0}
            </div>
            <div className="flex flex-col gap-2">
                <div className="pequenno_bold text-center">
                    Capacidad Total de las Oficinas
                </div>
                <div className="flex flex-col gap-1">
                    <BarraProgreso
                        porcentaje={capacidadUsadaTotal/capacidadTotalMaxima*100}/>
                    <div className="flex flex-row justify-between">
                        <div className="pequenno">
                            Ocupado: {capacidadUsadaTotal}
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
                {datos&&datos.almacenes&&
                datos.almacenes.map((almacen)=>{
                    return(
                        <CardAlmacen almacen={almacen} />
                    )
                    }
                )}
            </div>
        </div>
    )
}
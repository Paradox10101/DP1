import { NextUIProvider, Progress } from "@nextui-org/react";
import { Building, Clock, Hash, MapPin, Package, Warehouse } from "lucide-react";
import BarraProgreso from "@/app/Components/BarraProgreso"
import IconoEstado from "./IconoEstado";

export default function CardAlmacen({almacen}){
    return (
        <div className="flex flex-col p-4 border-2 stroke-black rounded-xl gap-1">
            <div className="flex flex-row justify-between">
                <div className="flex flex-row gap-2 items-center">
                    {almacen.tipo=="Oficina"?
                    <IconoEstado Icono={Building} classNameContenedor={"bg-blue-500 w-[25px] h-[25px] relative rounded-full flex items-center justify-center"} classNameContenido={"w-[15px] h-[15px] stroke-blanco z-10"}/>
                    :
                    <IconoEstado Icono={Warehouse} classNameContenedor={"bg-black w-[25px] h-[25px] relative rounded-full flex items-center justify-center"} classNameContenido={"w-[15px] h-[15px] stroke-blanco z-10"}/>
                    }
                    <div className="pequenno_bold">
                        {(almacen.tipo=="Almacén"?"Almacén Principal: ":"Oficina: ") + almacen.ciudad}
                    </div>
                </div>
                <div className={"pequenno border " +
                    (
                    almacen.tipo==="Almacen"?"bg-[#284BCC] text-[#BECCFF] rounded-xl w-[80px] text-center" :
                    almacen.tipo==="Oficina"?"bg-[#03AF00] text-[#BAFFB9] rounded-xl w-[80px] text-center" :
                    ""
                    )
                }>
                    {almacen.tipo}
                </div>
            </div>
            <div className="flex flex-row gap-2 items-center">
                <MapPin size={16}/>
                <div className="pequenno">{"Ubigeo: " + almacen.ubigeo}</div>
            </div>
            
            {almacen.tipo=="Oficina"&&
                <>
                <div className="flex flex-row gap-2 items-center">
                    <Package size={16}/>
                    <div 
                    className="pequenno">{"Capacidad utilizada: " + almacen.capacidadUtilizada + " / " + almacen.capacidadMaxima}</div>
                </div>
                <div className="flex flex-col gap-1">
                    <BarraProgreso porcentaje={almacen.capacidadUtilizada/almacen.capacidadMaxima*100}/>
                    <span className="pequenno text-[#555555]">{parseFloat((almacen.capacidadUsada/almacen.capacidadMaxima*100).toFixed(2))}% ocupado</span>
                </div>
                </>
            }    
        </div>
    )
}

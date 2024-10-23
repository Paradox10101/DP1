import { NextUIProvider, Progress } from "@nextui-org/react";
import { Building, Clock, Hash, MapPin, Package, Warehouse } from "lucide-react";
import BarraProgreso from "@/app/Components/BarraProgreso"

export default function CardAlmacen({almacen}){
    return (
        <div className="flex flex-col p-4 border-2 stroke-black rounded-xl gap-1">
            <div className="flex flex-row justify-between">
                <div className="flex flex-row gap-2 items-center">
                    {almacen.tipo=="Oficina"?
                    <Building size={16} className="stroke-blue-500"/>
                    :
                    <Warehouse size={16} />
                    }
                    <div className="pequenno_bold">
                        {(almacen.tipo=="Almacén"?"Almacén Principal: ":"Oficina: ") + almacen.ciudad}
                    </div>
                </div>
                <div className={"pequenno border " +
                    (
                    almacen.tipo==="Almacén"?"bg-[#284BCC] text-[#BECCFF] rounded-xl w-[80px] text-center" :
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
                    className="pequenno">{"Capacidad utilizada: " + almacen.capacidadUsada + " / " + almacen.capacidadMaxima}</div>
                </div>
                <div className="flex flex-col gap-1">
                    <BarraProgreso porcentaje={almacen.capacidadUsada/almacen.capacidadMaxima*100}/>
                    <span className="pequenno text-[#555555]">{parseFloat((almacen.capacidadUsada/almacen.capacidadMaxima*100).toFixed(2))}% ocupado</span>
                </div>
                </>
            }    
        </div>
    )
}

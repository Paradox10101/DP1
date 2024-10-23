import { Clock, Hash, MapPin, Package } from "lucide-react";

export default function CardEnvio({pedido}){
    return (
        <div className="flex flex-col p-4 border-2 stroke-black rounded-xl gap-1">
            <div className="flex flex-row justify-between">
                <div className="flex flex-row gap-2 items-center">
                    <Hash size={16}/>
                    <div className="pequenno_bold">{pedido.codigo}</div>    
                </div>
                <div className="pequenno">{pedido.fechaDeInicio}</div>
            </div>
            <div className="flex flex-row justify-between">
                <div className="flex flex-row gap-2 items-center">
                    <MapPin size={16}/>
                    <div className="pequenno">{pedido.ciudadOrigen + " -> " + pedido.ciudadDestino}</div>
                </div>
                <div className={"pequenno border " +
                    (
                    pedido.estado==="En Tránsito"?"bg-[#284BCC] text-[#BECCFF] rounded-xl w-[80px] text-center" :
                    pedido.estado==="Registrado"?"bg-[#B0F8F4] text-[#4B9490] rounded-xl w-[80px] text-center" :
                    pedido.estado==="En Oficina"?"bg-[#D0B0F8] text-[#7B15FA] rounded-xl w-[80px] text-center" :
                    ""
                    )
                }>
                    {pedido.estado}</div>
            </div>
            <div className="flex flex-row justify-between">
                <div className="flex flex-row gap-2 items-center">
                    <Package size={16}/>
                    <div 
                    className="pequenno">{pedido.cantidadPaquetes + (pedido.cantidadPaquetes>1?" paquetes":" paquete")}</div>
                </div>
                <div className="flex flex-row gap-2 items-center">
                    <Clock size={16}/>
                    <div className="pequenno">{pedido.tiempoRestante}</div>
                </div>
            </div>
            
        </div>
    )
}
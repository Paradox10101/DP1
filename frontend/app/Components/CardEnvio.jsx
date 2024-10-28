import { Clock, Hash, MapPin, Package } from "lucide-react";

export default function CardEnvio({shipment}){
    return (
        <div className="flex flex-col p-4 border-2 stroke-black rounded-xl gap-1">
            <div className="flex flex-row justify-between">
                <div className="flex flex-row gap-2 items-center">
                    <Hash size={16}/>
                    <div className="pequenno_bold">{'P' + String(shipment.orderCode).padStart(5, '0')}</div>    
                </div>
                <div className="pequenno">{shipment.startTime}</div>
            </div>
            <div className="flex flex-row justify-between">
                <div className="flex flex-row gap-2 items-center">
                    <MapPin size={16}/>
                    <div className="pequenno">{shipment.originUbigeo + " -> " + shipment.destinyUbigeo}</div>
                </div>
                <div className={"pequenno border " +
                    (
                        shipment.status==="En Tránsito"?"bg-[#284BCC] text-[#BECCFF] rounded-xl w-[80px] text-center" :
                        shipment.status==="REGISTERED"?"bg-[#B0F8F4] text-[#4B9490] rounded-xl w-[80px] text-center" :
                        shipment.status==="DELIVERED"?"bg-[#D0B0F8] text-[#7B15FA] rounded-xl w-[80px] text-center" :
                    ""
                    )
                }>
                    {shipment.status}</div>
            </div>
            <div className="flex flex-row justify-between">
                <div className="flex flex-row gap-2 items-center">
                    <Package size={16}/>
                    <div 
                    className="pequenno">{shipment.remainingPackages + (shipment.remainingPackages>1?" paquetes":" paquete")}</div>
                </div>
                <div className="flex flex-row gap-2 items-center">
                    <Clock size={16}/>
                    <div className="pequenno">{shipment.remainingTimeDays + "d " + String(shipment.remainingTimeHours).padStart(2, '0')+"h:"+String(shipment.remainingTimeMinutes).padStart(2, '0') + "m"}</div>
                </div>
            </div>
            
        </div>
    )
}
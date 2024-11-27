"use client"
import { ArrowLeft, Calendar, Clock, Hash, MapPin, Package } from "lucide-react";
import ModalContainer from "@/app/Components/ModalContainer"
import { useDisclosure } from "@nextui-org/react";
import ModalEnvios from "@/app/Components/ModalEnvios"
import ModalRutaVehiculoEnvio from "@/app/Components/ModalRutaVehiculoEnvio"
import { memo, useState } from "react";

const CardEnvio = memo(({
    orderCode,
    status,
    quantity,
    originCity,
    destinationCity,
    orderTime,
    dueTime,
    timeElapsedDays,
    timeElapsedHours,
    quantityVehicles,
}) => {
    return (
        
        <div className="flex flex-col p-4 gap-1">
            <div className="flex flex-row justify-between">
                <div className="flex flex-row gap-2 items-center">
                    <Hash size={16}/>
                    <div className="pequenno_bold">{orderCode}</div>    
                </div>
                {
                    status === "REGISTERED"? (
                        <div className={"flex w-[95px] items-center pequenno border text-center justify-center bg-[#B0F8F4] text-[#4B9490] rounded-xl"}>REGISTRADO</div>
                    ) : status === "DELIVERED" || status === "PENDING_PICKUP" ? (
                        <div className={"flex w-[95px] items-center pequenno border text-center justify-center bg-[#D0B0F8] text-[#7B15FA] rounded-xl"}>ENTREGADO</div>
                    ) : status === "IN_TRANSIT" || status === "PARTIALLY_ARRIVED" || status === "FULLY_ASSIGNED" || status === "PARTIALLY_ASSIGNED"? (
                        <div className={"flex w-[95px] items-center pequenno border text-center justify-center bg-[#284BCC] text-[#BECCFF] rounded-xl"}>EN TRÁNSITO</div>
                    ) : (
                        <></>
                    )
                }

            </div>
            
            <div className="flex flex-row justify-between">
                <div className="flex flex-row gap-2 items-center">
                    <MapPin size={16}/>
                    <div className="pequenno">{originCity + " -> " + destinationCity}</div>
                </div>
            </div>
            <div className="flex flex-row justify-between">
                <div className="flex flex-row gap-2 items-center">
                    <Package size={16}/>
                    <div 
                    className="pequenno">{quantity + (quantity>1?" paquetes":" paquete")}</div>
                </div>
            </div>
            <div className="flex flex-row justify-between">
                <div className="flex flex-row gap-2 items-center">
                    <Clock size={16}/>
                    <div className="pequenno">Fecha de inicio: {new Date(orderTime).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '')}</div>
                </div>
            </div>
            <div className="flex flex-row justify-between">
                <div className="flex flex-row gap-2 items-center">
                    <Calendar size={16}/>
                    <div className="pequenno">Fecha Limite: {new Date(dueTime).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '')}</div>
                </div>
                <div className="flex flex-row gap-2 items-center">
                    <Clock size={16}/>
                    <div className="pequenno">{`${timeElapsedDays} d ${String(timeElapsedHours).padStart(2, '0')} h`}</div>
                </div>
            </div>
            
            
        </div>
        
    )
});

export default CardEnvio;
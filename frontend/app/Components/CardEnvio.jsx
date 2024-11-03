"use client"
import { ArrowLeft, Calendar, Clock, Hash, MapPin, Package } from "lucide-react";
import ModalContainer from "@/app/Components/ModalContainer"
import { useDisclosure } from "@nextui-org/react";
import ModalEnvios from "@/app/Components/ModalEnvios"
import ModalRutaVehiculoEnvio from "@/app/Components/ModalRutaVehiculoEnvio"
import { useState } from "react";

export default function CardEnvio({shipment}){
    const {isOpen, onOpen, onOpenChange} = useDisclosure();
    const [selectedVehicle, setSelectedVehicle] = useState(null)
    return (
        <>
        <button className="w-full" onClick={onOpen}>
        <div className="flex flex-col p-4 border-2 stroke-black rounded-xl gap-1">
            <div className="flex flex-row justify-between">
                <div className="flex flex-row gap-2 items-center">
                    <Hash size={16}/>
                    <div className="pequenno_bold">{'P' + String(shipment.id).padStart(5, '0')}</div>    
                </div>
                {
                shipment.status==="REGISTERED"?
                <div className={"flex w-[95px] items-center pequenno border text-center justify-center bg-[#B0F8F4] text-[#4B9490] rounded-xl"}>REGISTRADO</div>
                :
                shipment.status==="DELIVERED"||shipment.status==="PENDING_PICKUP"?
                <div className={"flex w-[95px] items-center pequenno border text-center justify-center bg-[#D0B0F8] text-[#7B15FA] rounded-xl"}>ENTREGADO</div>
                :
                shipment.status==="FULLY_ASSIGNED"?
                <div className={"flex w-[95px] items-center pequenno border text-center justify-center bg-[#284BCC] text-[#BECCFF] rounded-xl" }>EN TRÁNSITO</div>
                :
                <></>
            }
            </div>
            
            <div className="flex flex-row justify-between">
                <div className="flex flex-row gap-2 items-center">
                    <MapPin size={16}/>
                    <div className="pequenno">{shipment.originCity + " -> " + shipment.destinationCity}</div>
                </div>
            </div>
            <div className="flex flex-row justify-between">
                <div className="flex flex-row gap-2 items-center">
                    <Package size={16}/>
                    <div 
                    className="pequenno">{shipment.quantity + (shipment.quantity>1?" paquetes":" paquete")}</div>
                </div>
            </div>
            <div className="flex flex-row justify-between">
                <div className="flex flex-row gap-2 items-center">
                    <Clock size={16}/>
                    <div className="pequenno">Fecha de inicio: {new Date(shipment.orderTime).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '')}</div>
                </div>
            </div>
            <div className="flex flex-row justify-between">
                <div className="flex flex-row gap-2 items-center">
                    <Calendar size={16}/>
                    <div className="pequenno">Fecha Limite: {new Date(shipment.dueTime).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '')}</div>
                </div>
                <div className="flex flex-row gap-2 items-center">
                    <Clock size={16}/>
                    <div className="pequenno">{`${shipment.timeElapsedDays} d ${String(shipment.timeElapsedHours).padStart(2, '0')} h`}</div>
                </div>
            </div>
            
            
        </div>
        </button>
        {
        selectedVehicle===null?
        <ModalContainer isOpen={isOpen} onOpen={onOpen} onOpenChange={onOpenChange}
        header={
            <div className="flex flex-row gap-2">
                <div className="subEncabezado">Información del envío {'P' + String(shipment.orderCode).padStart(5, '0')}</div>
                <div className={"flex w-[80px] items-center pequenno border text-center justify-center " +
                    (
                        shipment.status==="En Tránsito"?"bg-[#284BCC] text-[#BECCFF] rounded-xl" :
                        shipment.status==="REGISTERED"?"bg-[#B0F8F4] text-[#4B9490] rounded-xl" :
                        shipment.status==="DELIVERED"?"bg-[#D0B0F8] text-[#7B15FA] rounded-xl" :
                    ""
                    )
                }>
                {shipment.status}
                </div>
            </div>
            
        }
        body={
            <ModalEnvios shipment={shipment} setSelectedVehicle={setSelectedVehicle}/>
        }
        />
        :
        <ModalContainer isOpen={isOpen} onOpen={onOpen} onOpenChange={onOpenChange}
        doBeforeClose={()=>{setSelectedVehicle(null)}}
        header={
            <div className="flex flex-row gap-2">
                <button onClick={()=>{setSelectedVehicle(null)}}>
                    <ArrowLeft size={24}/>
                </button>
                <div className="flex flex-row gap-2">
                    <div className="subEncabezado">Rutas del vehículo {'A505'}</div>
                </div>
            </div>
        }
        body={
            <ModalRutaVehiculoEnvio selectedVehicle={selectedVehicle} setSelectedVehicle={setSelectedVehicle}/>
        }
        />
        }
        </>
        
    )
}

/*

:

*/
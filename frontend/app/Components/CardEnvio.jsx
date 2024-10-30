"use client"
import { ArrowLeft, Calendar, Clock, Hash, MapPin, Package } from "lucide-react";
import ModalContainer from "@/app/Components/ModalContainer"
import { useDisclosure } from "@nextui-org/react";
import ModalEnvios from "@/app/Components/ModalEnvios"
import ModalRutaVehiculoEnvio from "@/app/Components/ModalRutaVehiculoEnvio"
import { useEffect, useState } from "react";

export default function CardEnvio({shipment}){
    const {isOpen, onOpen, onOpenChange} = useDisclosure();
    const [selectedVehicle, setSelectedVehicle] = useState(null)
    const [extraShipmentInfo, setExtraShipmentInfo] = useState(null)

    useEffect(()=>{
        if(isOpen){
            
            const fetchOrderData = async () => {
                try {
                    const response = await fetch(`http://localhost:4567/api/v1/shipment?orderId=${shipment.orderCode}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    });
    
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    const data = await response.json();
                    console.log("siervo siervoyamada: " + data.features)
                    if(data)
                        setExtraShipmentInfo(data.feature)
                } catch (error) {
                    console.log("No se pudo recibir los datos: " + error)
                }
            }
            fetchOrderData()
        }
    },[onOpenChange])


    return (
        <>
        <button className="w-full" onClick={onOpen}>
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
                    <div className="pequenno">{shipment.originCity + " -> " + shipment.destinyCity}</div>
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
                    <Package size={16}/>
                    <div 
                    className="pequenno">{shipment.remainingPackages + (shipment.remainingPackages>1?" paquetes":" paquete")}</div>
                </div>
            </div>
            <div className="flex flex-row gap-2 items-center">
                    <Calendar size={16}/>
                    <div className="pequenno">Fecha límite: {shipment.limitTime}</div>
            </div>
            <div className="flex flex-row gap-2 items-center">
                    <Clock size={16}/>
                    <div className="pequenno">Tiempo transcurrido: {shipment.remainingTimeDays + " d " + String(shipment.remainingTimeHours).padStart(2, '0')+" h"}</div>
            </div>
        </div>
        </button>
        {
        selectedVehicle===null?
        <ModalContainer isOpen={isOpen} onOpen={onOpen} onOpenChange={onOpenChange}
        header={
            (extraShipmentInfo &&
            <div className="flex flex-row gap-2">
                <div className="subEncabezado">Información del envío {'P' + String(extraShipmentInfo.orderCode).padStart(5, '0')}</div>
                {extraShipmentInfo&&(
                    extraShipmentInfo.status==="REGISTERED"?
                    <div className={"flex w-[95px] items-center pequenno border text-center justify-center bg-[#B0F8F4] text-[#4B9490] rounded-xl"}>REGISTRADO</div>
                    :
                    extraShipmentInfo.status==="DELIVERED"||shipment.status==="PENDING_PICKUP"?
                    <div className={"flex w-[95px] items-center pequenno border text-center justify-center bg-[#D0B0F8] text-[#7B15FA] rounded-xl"}>ENTREGADO</div>
                    :
                    extraShipmentInfo.status==="FULLY_ASSIGNED"?
                    <div className={"flex w-[95px] items-center pequenno border text-center justify-center bg-[#284BCC] text-[#BECCFF] rounded-xl" }>EN TRÁNSITO</div>
                    :
                    <></>
                    
                )}
            </div>
            )
        }
        body={
            <ModalEnvios shipment={extraShipmentInfo} setSelectedVehicle={setSelectedVehicle}/>
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
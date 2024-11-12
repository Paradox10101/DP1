"use client";

import { ArrowLeft, Calendar, Clock, Hash, MapPin, Package } from "lucide-react";
import ModalContainer from "@/app/Components/ModalContainer";
import { useDisclosure } from "@nextui-org/react";
import ModalEnvios from "@/app/Components/ModalEnvios";
import ModalRutaVehiculoEnvio from "@/app/Components/ModalRutaVehiculoEnvio";
import { useEffect, useState } from "react";

export default function CardEnvio({ shipment }) {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [extraShipmentInfo, setExtraShipmentInfo] = useState(null);

    useEffect(() => {
        if (isOpen) {
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
                    console.log("Datos del envío: ", data.features);
                    if (data) setExtraShipmentInfo(data.feature);
                } catch (error) {
                    console.log("No se pudo recibir los datos: ", error);
                }
            };
            fetchOrderData();
        }
    }, [isOpen, shipment.orderCode]); // Asegúrate de que use `isOpen` y `shipment.orderCode` como dependencias

    return (
        <div className="flex flex-col p-4 gap-1">
            <div className="flex flex-row justify-between">
                <div className="flex flex-row gap-2 items-center">
                    <Hash size={16} />
                    <div className="pequenno_bold">{shipment.orderCode}</div> {/* Usar shipment.orderCode */}
                </div>
                {shipment.status === "REGISTERED" || shipment.quantityVehicles === 0 ? (
                    <div className="flex w-[95px] items-center pequenno border text-center justify-center bg-[#B0F8F4] text-[#4B9490] rounded-xl">
                        REGISTRADO
                    </div>
                ) : shipment.status === "DELIVERED" || shipment.status === "PENDING_PICKUP" ? (
                    <div className="flex w-[95px] items-center pequenno border text-center justify-center bg-[#D0B0F8] text-[#7B15FA] rounded-xl">
                        ENTREGADO
                    </div>
                ) : (
                    <div className="flex w-[95px] items-center pequenno border text-center justify-center bg-[#284BCC] text-[#BECCFF] rounded-xl">
                        EN TRÁNSITO
                    </div>
                )}
            </div>

            {/* Información del Envío */}
            <div className="flex flex-row justify-between">
                <div className="flex flex-row gap-2 items-center">
                    <MapPin size={16} />
                    <div className="pequenno">{`${shipment.originCity} -> ${shipment.destinyCity}`}</div>
                </div>
            </div>

            <div className="flex flex-row justify-between">
                <div className="flex flex-row gap-2 items-center">
                    <Package size={16} />
                    <div className="pequenno">{`${shipment.quantity} ${shipment.quantity > 1 ? "paquetes" : "paquete"}`}</div>
                </div>
            </div>

            <div className="flex flex-row justify-between">
                <div className="flex flex-row gap-2 items-center">
                    <Clock size={16} />
                    <div className="pequenno">
                        Fecha de inicio:{" "}
                        {new Date(shipment.orderTime).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                        }).replace(",", "")}
                    </div>
                </div>
            </div>

            <div className="flex flex-row justify-between">
                <div className="flex flex-row gap-2 items-center">
                    <Calendar size={16} />
                    <div className="pequenno">
                        Fecha Limite:{" "}
                        {new Date(shipment.dueTime).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                        }).replace(",", "")}
                    </div>
                </div>
            </div>

            {/* Botón para abrir el modal */}
            <button onClick={onOpen}>
                {selectedVehicle === null ? (
                    <ModalContainer
                        isOpen={isOpen}
                        onOpen={onOpen}
                        onOpenChange={onOpenChange}
                        header={
                            extraShipmentInfo && (
                                <div className="flex flex-row gap-2">
                                    <div className="subEncabezado">
                                        Información del envío {`P${String(extraShipmentInfo.orderCode).padStart(5, "0")}`}
                                    </div>
                                    {extraShipmentInfo && (
                                        extraShipmentInfo.status === "REGISTERED" ? (
                                            <div className="flex w-[95px] items-center pequenno border text-center justify-center bg-[#B0F8F4] text-[#4B9490] rounded-xl">
                                                REGISTRADO
                                            </div>
                                        ) : extraShipmentInfo.status === "DELIVERED" || extraShipmentInfo.status === "PENDING_PICKUP" ? (
                                            <div className="flex w-[95px] items-center pequenno border text-center justify-center bg-[#D0B0F8] text-[#7B15FA] rounded-xl">
                                                ENTREGADO
                                            </div>
                                        ) : (
                                            <div className="flex w-[95px] items-center pequenno border text-center justify-center bg-[#284BCC] text-[#BECCFF] rounded-xl">
                                                EN TRÁNSITO
                                            </div>
                                        )
                                    )}
                                </div>
                            )
                        }
                        body={<ModalEnvios shipment={extraShipmentInfo} setSelectedVehicle={setSelectedVehicle} />}
                    />
                ) : (
                    <ModalContainer
                        isOpen={isOpen}
                        onOpen={onOpen}
                        onOpenChange={onOpenChange}
                        doBeforeClose={() => {
                            setSelectedVehicle(null);
                        }}
                        header={
                            <div className="flex flex-row gap-2">
                                <button onClick={() => setSelectedVehicle(null)}>
                                    <ArrowLeft size={24} />
                                </button>
                                <div className="subEncabezado">Rutas del vehículo {'A505'}</div>
                            </div>
                        }
                        body={<ModalRutaVehiculoEnvio selectedVehicle={selectedVehicle} setSelectedVehicle={setSelectedVehicle} />}
                    />
                )}
            </button>
        </div>
    );
}

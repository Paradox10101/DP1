"use client";
import { Modal, ModalBody, ModalContent, ModalHeader } from "@nextui-org/react";
import CollapseDashboard from "./CollapseDashboard";
import Dashboard from "./Dashboard";
import { useEffect, useState } from "react";

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? process.env.NEXT_PUBLIC_API_BASE_URL_PROD
  : process.env.NEXT_PUBLIC_API_BASE_URL;

export default function SimulationReport({simulationType, isOpen, onOpenChange}){
    const [tiempos, setTiempos] = useState(null);

    useEffect(() => {
        const fetchTiempos = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/simulation/report`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.tiempos && data.tiempos.length >= 2) {
                        setTiempos({
                            inicio: new Date(data.tiempos[0]),
                            fin: new Date(data.tiempos[1])
                        });
                    }
                }
            } catch (error) {
                console.error('Error al obtener los tiempos:', error);
            }
        };

        if (isOpen) {
            fetchTiempos();
        }
    }, [isOpen]);

    const formatDateTime = (date) => {
        if (!date) return '';
        return date.toLocaleString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };
    return(
        <Modal
            closeButton
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            isDismissable={false}
            blur="true"
        >
            <ModalContent className="h-[800px] min-w-[900px]">
                <ModalHeader>
                    <div className="flex flex-row gap-2">
                        <div className="text-xl font-bold">{"Reporte de Simulación " + simulationType}</div>
                        {tiempos && (
                            <div className="text-sm text-gray-600 flex gap-2 items-center">
                                <span className="font-semibold">Periodo:</span>
                                <div className="flex items-center gap-2">
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                        {formatDateTime(tiempos.inicio)}
                                    </span>
                                    <span>→</span>
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                        {formatDateTime(tiempos.fin)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </ModalHeader>
            <ModalBody>
            {simulationType==='semanal'?
                <Dashboard onClose={onOpenChange}/>
            :
            simulationType==='colapso'?
                <CollapseDashboard />
            :
            <></>
            }
            </ModalBody>
            </ModalContent>
        </Modal>
    )
}
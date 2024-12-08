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

    const capitalize = (str) => {
        if (typeof str !== 'string') return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
      };
      
    return(
        <Modal
            closeButton
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            isDismissable={false}
            blur="true"
            scrollBehavior="normal"
        >
            <ModalContent className="h-[800px] min-w-[900px] overflow-y-auto">
                <ModalHeader>
                    <div className="text-xl font-bold">
                        {"Reporte de Simulación " + capitalize(simulationType)}
                    </div>
                </ModalHeader>
                <ModalBody>
                {simulationType==='semanal'?
                    <Dashboard onClose={onOpenChange} tiempos={tiempos}/>
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
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
    const [showCollapse, setShowCollapse] = useState(false);

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
                <ModalHeader className="flex flex-col gap-4">
                    {/* Primera fila: Botón de regreso (si es necesario) */}
                    {showCollapse && (
                        <div className="self-start">
                            <button 
                                onClick={() => setShowCollapse(false)}
                                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                            >
                                <svg 
                                    width="20" 
                                    height="20" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                >
                                    <path d="M19 12H5"/>
                                    <path d="M12 19l-7-7 7-7"/>
                                </svg>
                                Volver al Dashboard
                            </button>
                        </div>
                    )}

                    {/* Segunda fila: Título centrado y botón de Última Planificación */}
                    <div className="flex justify-between items-center w-full">
                        <div className="flex-1">
                            {/* Espacio vacío para mantener el título centrado */}
                        </div>
                        <div className="text-xl font-bold flex-1 text-center">
                            {"Reporte de Simulación " + capitalize(simulationType)}
                        </div>
                        <div className="flex-1 flex justify-end">
                            {simulationType === 'semanal' && !showCollapse && (
                                <button 
                                    onClick={() => setShowCollapse(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                                >
                                    <svg 
                                        width="20" 
                                        height="20" 
                                        viewBox="0 0 24 24" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        strokeWidth="2" 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round"
                                    >
                                        <path d="M21 9V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3"/>
                                        <path d="M3 16v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3"/>
                                        <path d="M12 12v-3"/>
                                        <path d="M12 12l-3-3"/>
                                        <path d="M12 12l3-3"/>
                                    </svg>
                                    Última Planificación
                                </button>
                            )}
                        </div>
                    </div>
                </ModalHeader>
                <ModalBody>
                    {simulationType === 'semanal' ? (
                        showCollapse ? (
                            <CollapseDashboard 
                                tiempos={tiempos} 
                            />
                        ) : (
                            <Dashboard 
                                onClose={onOpenChange} 
                                tiempos={tiempos}
                            />
                        )
                    ) : simulationType === 'colapso' ? (
                        <CollapseDashboard tiempos={tiempos} />
                    ) : (
                        <></>
                    )}
                </ModalBody>
            </ModalContent>
        </Modal>
    )
}
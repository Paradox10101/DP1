import { Modal, ModalBody, ModalContent, ModalHeader } from "@nextui-org/react";
import CollapseDashboard from "./CollapseDashboard";
import Dashboard from "./Dashboard";

export default function SimulationReport({simulationType, isOpen, onOpenChange}){
    return(
        <Modal
            closeButton
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            isDismissable={true}
            blur
        >
            <ModalContent className="h-[775px] min-w-[850px]">
            <ModalHeader>
            <div className="flex flex-row gap-2">
                    <div className="text-xl font-bold">{"Reporte de Simulación " + simulationType}</div>
                </div>
            </ModalHeader>
            <ModalBody>
            {simulationType==='semanal'?
                <Dashboard />
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
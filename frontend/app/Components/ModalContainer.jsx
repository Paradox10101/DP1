"use client";
// components/MiModal.js
import React from "react";
import { Modal, Button, useDisclosure, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/react";
import { X } from "lucide-react";

export default function ModalEjemplo({isOpen, onOpen, onOpenChange, header, body, doBeforeClose=undefined}) {

  return (
    <>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        className="fixed inset-0 flex items-center justify-center w-full"
        closeButton // Habilita el botón de cerrar en la cabecera
        blur // Desactiva la interacción con el resto de la página
      >
        <div className="bg-white rounded-lg shadow-lg mx-auto absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-4 w-[45vw] z-50 min-w-[650px]">
          <ModalHeader className="text-center text-black w-full">
            <div className="flex flex-row justify-between w-full">
              {header}
              <Button auto flat color="error"
              onPress={()=>{
                if(doBeforeClose!==undefined)
                  doBeforeClose()
                onOpenChange(false)
                }} disableRipple> {/* Desactiva el efecto ripple aquí también */}
              <X size={24}/>
              </Button>  
            </div>
            </ModalHeader>
          <ModalBody className="text-center bg-white text-black">
              {body}
          </ModalBody>
          <ModalFooter className="flex justify-center bg-white">
            
          </ModalFooter>
        </div>
      </Modal>
    </>
  );
}

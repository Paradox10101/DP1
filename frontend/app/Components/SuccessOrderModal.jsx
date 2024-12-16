import React from 'react';
import {Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button} from "@nextui-org/react";
import { CheckCircle2 } from 'lucide-react';

const SuccessOrderModal = ({ isOpen, onClose, orderCode }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      placement="center"
      backdrop="blur"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col items-center gap-1 pt-8">
              <div className="rounded-full bg-green-100 p-3 mb-2">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">
                ¡Envío registrado con éxito!
              </h2>
            </ModalHeader>
            <ModalBody>
              <div className="text-center space-y-6">
                <p className="text-gray-600">
                  Tu envío ha sido registrado correctamente. Por favor, guarda el siguiente código para dar seguimiento a tu pedido.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg mx-auto max-w-xs">
                  <p className="text-sm text-gray-500 mb-1">Código de Pedido</p>
                  <p className="text-lg font-semibold text-gray-900">{orderCode}</p>
                </div>
              </div>
            </ModalBody>
            <ModalFooter className="pb-6">
              <Button
                color="primary"
                onPress={onClose}
                className="w-full"
              >
                Volver al inicio
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default SuccessOrderModal;
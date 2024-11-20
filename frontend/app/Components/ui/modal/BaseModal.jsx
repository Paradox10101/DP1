import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Divider
  } from "@nextui-org/react"
  
export const BaseModal = ({
    title,
    subtitle,
    children,
    footer,
    size = "4xl",
    isOpen = true,
    onClose
  }) => (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={size}
      isDismissable={false}
      classNames={{
        closeButton: "hidden"
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-bold">{title}</h2>
          {subtitle && (
            <p className="text-sm text-default-500">{subtitle}</p>
          )}
        </ModalHeader>
        <Divider />
        <ModalBody className="gap-4">
          {children}
        </ModalBody>
        <Divider />
        <ModalFooter>
          {footer}
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
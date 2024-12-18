import React, { useEffect } from 'react';
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  Button,
  Radio,
  RadioGroup,
  Spinner
} from "@nextui-org/react";
import { AlertCircle } from 'lucide-react';
import { useAtomValue } from 'jotai';
import { simulationTypeAtom } from '@/atoms/simulationAtoms';

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? process.env.NEXT_PUBLIC_API_BASE_URL_PROD || 'https://fallback-production-url.com' // Optional: Fallback URL for production
  : process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'; // Optional: Local development fallback

const breakdownTypes = [
  { 
    value: "1", 
    label: "Tipo 1 - Avería Leve", 
    description: "Problemas menores que requieren una reparación rápida (4 horas)" 
  },
  { 
    value: "2", 
    label: "Tipo 2 - Avería Moderada", 
    description: "Problemas que requieren una reparación más extensa (36 horas)" 
  },
  { 
    value: "3", 
    label: "Tipo 3 - Avería Grave", 
    description: "Problemas mayores que requieren una reparación prolongada (72 horas)" 
  },
];

const BreakdownModal = ({ isOpen, onClose, vehicleCode, onSuccess }) => {
  const [selectedType, setSelectedType] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [simulationType,] = useAtomValue(simulationTypeAtom)

  const handleSubmit = async () => {
    if (!selectedType) {
      setError("Por favor seleccione un tipo de avería");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/vehicles/breakdown?vehicleCode=${vehicleCode}&breakdownType=${selectedType}`,
        { method: 'POST' }
      );

      if (!response.ok) {
        throw new Error('Error al provocar la avería');
      }

      onSuccess?.();
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  useEffect(()=>{
    if(!loading)
      setError(false);
  },[vehicleCode])

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalContent>
        <ModalHeader>
          <h3 className="text-lg font-semibold">Provocar Avería</h3>
        </ModalHeader>
        <ModalBody>
          <p className="text-gray-600 mb-4">
            Seleccione el tipo de avería para el vehículo {vehicleCode}
          </p>
          
          <RadioGroup
            value={selectedType}
            onValueChange={setSelectedType}
            classNames={{
              wrapper: "gap-4"
            }}
          >
            {breakdownTypes.map((type) => (
              <Radio
                key={type.value}
                value={type.value}
                description={type.description}
                classNames={{
                  base: "border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                }}
              >
                {type.label}
              </Radio>
            ))}
          </RadioGroup>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-danger-50 text-danger-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            variant="flat"
            color="default"
            onPress={onClose}
            isDisabled={loading}
          >
            Cancelar
          </Button>
          {simulationType&&simulationType==='colapso'&&
          <Button
            color="primary"
            onPress={handleSubmit}
            isDisabled={loading}
            startContent={loading ? <Spinner size="sm" /> : null}
          >
            Provocar Avería
          </Button>
          }
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default BreakdownModal;
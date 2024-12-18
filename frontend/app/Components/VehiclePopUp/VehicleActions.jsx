import React from 'react';
import { Button } from "@nextui-org/react";
import { AlertCircle } from 'lucide-react';
import { simulationTypeAtom } from '@/atoms/simulationAtoms';
import { useAtomValue } from 'jotai';

const VehicleActions = ({ onProvoke, onViewDetail, isInTransit }) => {
  const [simulationType,] = useAtomValue(simulationTypeAtom)
  return(
  <div className="p-4 bg-gray-50 flex items-center justify-between gap-3">
    {simulationType&&simulationType==='colapso'&&
    <Button
      onClick={onProvoke}
      variant="flat"
      color="danger"
      startContent={<AlertCircle className="w-4 h-4" />}
      isDisabled={!isInTransit}
      className="font-medium"
    >
      Provocar Avería
    </Button>
    }
    <Button
      onClick={onViewDetail}
      color="primary"
      className="flex-1 font-medium"
    >
      Ver Detalle
    </Button>
  </div>
  )
};

export default VehicleActions;
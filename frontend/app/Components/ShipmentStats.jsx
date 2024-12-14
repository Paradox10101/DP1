import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { filteredShipmentsAtom } from '../../atoms/shipmentAtoms';
import LinearProgressBar from '../Components/LinearProgressBar';

const ShipmentStats = () => {
  const shipments = useAtomValue(filteredShipmentsAtom);

  const stats = useMemo(() => {
    if (!shipments) return {
      total: 0,
      delivered: 0,
      inTransit: 0,
      registered: 0,
      percentageDelivered: 0
    };

    const total = shipments.length;
    const delivered = shipments.filter(s => 
      s.status === "DELIVERED" || s.status === "PENDING_PICKUP"
    ).length;
    const inTransit = shipments.filter(s => 
      (s.quantityVehicles > 0 || s.vehicles.length > 0) && 
      !(s.status === "DELIVERED" || s.status === "PENDING_PICKUP")
    ).length;
    const registered = shipments.filter(s => 
      (!(s.quantityVehicles > 0 || s.vehicles.length > 0) && 
      !(s.status === "DELIVERED" || s.status === "PENDING_PICKUP")) || 
      s.status === "REGISTERED"
    ).length;

    return {
      total,
      delivered,
      inTransit,
      registered,
      percentageDelivered: total > 0 ? (delivered / total) * 100 : 0
    };
  }, [shipments]);

  return (
    <div className="flex flex-col gap-2 p-4 border rounded-xl w-full h-[100px]">
      <h3 className="text-[15px] font-medium text-gray-800">
        Estado de los envíos
      </h3>
      <LinearProgressBar
        percentage={Math.round(stats.percentageDelivered)}
        height={8}
        backgroundColor="#E5E7EB"
        progressColor="#3B82F6"
        showPercentage={false}
        animate={true}
      />
      <div className="flex flex-row justify-between text-xs text-gray-600">
        <span>{stats.registered} registrados</span>
        <span>{stats.inTransit} en tránsito</span>
        <span>{stats.delivered} entregados</span>
        <span>Total: {stats.total}</span>
      </div>
    </div>
  );
};

export default ShipmentStats;
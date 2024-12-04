import { Button } from "@nextui-org/react"
import { Package, BarChart3 } from 'lucide-react'
import { BaseModal } from '../ui/modal/BaseModal'
import { MetricCard } from './MetricCard'
import { TimeRangeCard } from './TimeRangeCard'
import { DestinationsCard } from './DestinationsCard'
import { TopClientsCard } from './TopClientsCard'
import { useDailyOperation } from '../../../hooks/useDailyOperation'
import { useAtom } from 'jotai'
import { simulationStatusAtom, showSimulationModalAtom } from '@/atoms/simulationAtoms'
import { Router } from "next/router"
import { useRouter } from "next/navigation"

export const DailyOperationsModal = ({ metrics, isOpenReport, onCloseReport }) => {
  const { startSimulation } = useDailyOperation()
  const [simulationStatus] = useAtom(simulationStatusAtom)
  const [, setShowModal] = useAtom(showSimulationModalAtom)
  
  // El modal solo se muestra cuando la simulación está detenida
  const isOpen = simulationStatus === 'stopped'
  const router = useRouter();
  const {
    totalOrders = 0,
    averageQuantity = 0,
    totalQuantity = 0,
    uniqueDestinations = 0,
    topDestinations = [],
    topClients = [],
    otherDestinations = { count: 0, percentage: 0 },
    timeStats = { earliestOrder: 'N/A', latestOrder: 'N/A' }
  } = metrics

  const handleClose = () => {
    onCloseReport()
    setShowModal(false)
  }


  const handleStartSimulation = async () => {
    try {
      await startSimulation()
      setShowModal(false) // Cerrar el modal después de iniciar la simulación
    } catch (error) {
      console.error('Error al iniciar la simulación:', error)
    }
  }

  const renderFooter = () => (
    <>
    {
    isOpenReport?
    <Button
        color="primary"
        variant="shadow"
        onPress={handleClose}
      >
        Cerrar
      </Button>
    :
    isOpen?
      
      <Button
        color="primary"
        variant="shadow"
        onPress={handleStartSimulation}
        isDisabled={totalOrders === 0 || simulationStatus!=='stopped'}
      >
        Iniciar Operaciones
      </Button>
      
    :
    <></>
    }
    </>
    
  )

  

  return (
    <BaseModal
      title="Resumen de Operaciones Diarias"
      subtitle="Resumen de órdenes y métricas para la simulación del día"
      footer={renderFooter()}
      isOpen={isOpen || isOpenReport}
      onClose={handleClose}
    >
      {/* Layout Grid Principal - 2 columnas */}
      <div className="grid grid-cols-2 gap-4">
        {/* Columna Izquierda */}
        <div className="space-y-4">
          {/* Métricas y Tiempo */}
          <div className="grid grid-cols-2 gap-4">
            <MetricCard
              title="Total de Órdenes"
              value={totalOrders}
              subtext={`${totalQuantity} paquetes en total`}
              icon={Package}
            />
            <MetricCard
              title="Cantidad Promedio"
              value={averageQuantity}
              subtext="paquetes por orden"
              icon={BarChart3}
            />
          </div>
          <TimeRangeCard timeStats={timeStats} />
        </div>
        {/* Columna Derecha */}
        <div className="space-y-4">
          <DestinationsCard
            topDestinations={topDestinations}
            otherDestinations={otherDestinations}
            uniqueDestinations={uniqueDestinations}
          />
          <TopClientsCard topClients={topClients} />
        </div>
      </div>
    </BaseModal>
  )
}

export default DailyOperationsModal
import { Card, CardHeader, CardBody } from "@nextui-org/react"
import { Clock } from 'lucide-react'
import { formatTime } from '../../../lib/utils/formatters'

export const TimeRangeCard = ({ timeStats }) => (
  <Card>
    <CardHeader className="pb-0">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-default-400" />
        <h4 className="text-sm font-semibold">Rango Horario</h4>
      </div>
    </CardHeader>
    <CardBody>
      <div className="flex justify-between text-sm">
        <span>Primera orden: {formatTime(timeStats.earliestOrder)}</span>
        <span>Última orden: {formatTime(timeStats.latestOrder)}</span>
      </div>
    </CardBody>
  </Card>
)
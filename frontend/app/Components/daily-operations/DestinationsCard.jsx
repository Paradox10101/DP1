import { Card, CardHeader, CardBody } from "@nextui-org/react"
import { Building, MapPin } from 'lucide-react'

export const DestinationsCard = ({ 
  topDestinations, 
  otherDestinations, 
  uniqueDestinations 
}) => (
  <Card>
    <CardHeader className="pb-0">
      <div className="flex items-center gap-2">
        <Building className="h-4 w-4 text-default-400" />
        <h4 className="text-sm font-semibold">
          Distribución de Destinos
          <span className="text-xs font-normal ml-2 text-default-400">
            ({uniqueDestinations} destinos únicos)
          </span>
        </h4>
      </div>
    </CardHeader>
    <CardBody className="gap-2">
      {topDestinations.map((dest) => (
        <DestinationItem key={dest.ubigeo} destination={dest} />
      ))}
      {otherDestinations.count > 0 && (
        <OtherDestinationsItem otherDestinations={otherDestinations} />
      )}
    </CardBody>
  </Card>
)

const DestinationItem = ({ destination }) => (
  <div className="flex items-center justify-between py-1">
    <div className="flex items-center gap-2">
      <MapPin className="h-4 w-4 text-default-400" />
      <span className="text-sm">{destination.location}</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">{destination.count} órdenes</span>
      <span className="text-xs text-default-400">({destination.percentage}%)</span>
    </div>
  </div>
)

const OtherDestinationsItem = ({ otherDestinations }) => (
  <div className="flex items-center justify-between py-1 border-t">
    <span className="text-sm text-default-500">Otros destinos</span>
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">{otherDestinations.count} órdenes</span>
      <span className="text-xs text-default-400">({otherDestinations.percentage}%)</span>
    </div>
  </div>
)
import { Card, CardHeader, CardBody } from "@nextui-org/react"
import { Users, User } from 'lucide-react'

export const TopClientsCard = ({ topClients }) => (
  <Card>
    <CardHeader className="pb-0">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-default-400" />
        <h4 className="text-sm font-semibold">Top 5 Clientes</h4>
      </div>
    </CardHeader>
    <CardBody className="gap-2">
      {topClients.map((client) => (
        <ClientItem key={client.clientId} client={client} />
      ))}
    </CardBody>
  </Card>
)

const ClientItem = ({ client }) => (
  <div className="flex items-center justify-between py-1">
    <div className="flex items-center gap-2">
      <User className="h-4 w-4 text-default-400" />
      <span className="text-sm">Cliente {client.clientId}</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">{client.count} órdenes</span>
      <span className="text-xs text-default-400">
        ({client.totalQuantity} paquetes)
      </span>
      <span className="text-xs text-default-400">
        ({client.percentage}%)
      </span>
    </div>
  </div>
)
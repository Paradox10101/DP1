import { Card, CardBody } from "@nextui-org/react"

export const MetricCard = ({ title, value, subtext, icon: Icon }) => (
  <Card className="w-full">
    <CardBody className="gap-2">
      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold text-default-600">{title}</p>
        <Icon className="h-4 w-4 text-default-400" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-2xl font-bold">{value}</span>
        {subtext && (
          <p className="text-xs text-default-400">{subtext}</p>
        )}
      </div>
    </CardBody>
  </Card>
)
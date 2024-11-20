type TimeStats = {
    earliestOrder: string
    latestOrder: string
  }
  
  type Destination = {
    ubigeo: string
    location: string
    count: number
    percentage: number
  }
  
  type Client = {
    clientId: string
    count: number
    totalQuantity: number
    percentage: number
  }
  
  type OtherDestinations = {
    count: number
    percentage: number
  }
  
  type Metrics = {
    totalOrders: number
    averageQuantity: number
    totalQuantity: number
    uniqueDestinations: number
    topDestinations: Destination[]
    topClients: Client[]
    otherDestinations: OtherDestinations
    timeStats: TimeStats
  }
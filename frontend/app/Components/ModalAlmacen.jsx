import { Button } from "@nextui-org/react"
import { AlertTriangle, ArrowRight, Building, Building2Icon, Calendar, Car, CarFront, Check, Circle, CircleAlert, CircleAlertIcon, Clock, Eye, Filter, Flag, Gauge, Globe, Globe2, GlobeIcon, MapPin, Package, Pin, Truck, Warehouse } from "lucide-react"
import BarraProgreso from "./BarraProgreso"
import IconoEstado from "./IconoEstado"
import { useEffect, useMemo, useState } from "react"
import { filteredShipmentsAtom } from "@/atoms/shipmentAtoms"
import { useAtomValue } from "jotai"
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList as List } from 'react-window';

export default function ModalAlmacen({warehouse}){
    const shipments = useAtomValue(filteredShipmentsAtom);
    const [shipmentsPerWarehouse, setShipmentsPerWarehouse] = useState([]);

    useEffect(()=>{
        if(shipments!=null)
            setShipmentsPerWarehouse(shipments.filter(shipment => shipment.originCity === warehouse.province))
    }, [shipments])


    const Row = ({ index, style }) => {
        const shipment = shipmentsPerWarehouse[index];
        return (
            <div key={shipment.code} style={style} className="grid grid-cols-10 w-full items-center p-1 border-b-3">
                <div className="text-center col-span-1 pequenno">{shipment.code}</div>
                <div className="text-center col-span-1 pequenno">{shipment.quantity}</div>
                {
                    shipment.status==="REGISTERED"?
                    <div className={"p-1 col-span-2 items-center pequenno border text-center justify-center bg-[#B0F8F4] text-[#4B9490] rounded-xl"}>REGISTRADO</div>
                    :
                    shipment.status==="DELIVERED"||shipment.status==="PENDING_PICKUP"?
                    <div className={"p-1 col-span-2 items-center pequenno border text-center justify-center bg-[#D0B0F8] text-[#7B15FA] rounded-xl"}>ENTREGADO</div>
                    :
                    <div className={"p-1 col-span-2 items-center pequenno border text-center justify-center bg-[#284BCC] text-[#BECCFF] rounded-xl" }>EN TRÁNSITO</div>
                }
                <div className="text-center col-span-2 pequenno">{new Date(shipment.dueTime).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', '')}</div>
                <div className="text-center col-span-2 pequenno">{shipment.originCity}</div>
                <div className="text-center col-span-2 break-all pequenno">{shipment.destinationCity}</div>
            </div>
            
        );
    };
    
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-row justify-between">
                <div className="flex flex-col gap-2">
                    <div className="flex flex-row gap-1">
                        <MapPin size={16}/>
                        <div className="regular">Detalle de ubicación</div>
                    </div>
                    <div className="flex flex-col gap-2 pl-2">
                        <div className="pequenno flex flex-row gap-2">
                            <Building2Icon size={16}/>
                            <p>{"Departamento: " + warehouse.department}</p>
                        </div>
                        <div className="pequenno flex flex-row gap-2">
                            <Pin size={16}/>
                            <p>{"Coordenadas(latitud, longitud): " + warehouse.latitude + ", " + warehouse.longitude}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="flex flex-row justify-between">
                <div className="text-black regular_bold">Envíos atendidos</div>
                <Button
                disableRipple={true}
                startContent={<Filter className="size-2"/>}
                className="focus:outline-none border stroke-black rounded h-8 pequenno w-[22%] bg-[#F4F4F4]"
                >
                Filtros
                </Button>
            </div>
            <div className="flex flex-col gap-0">
                    <div className="bg-gray-50 text-gray-500 uppercase text-sm leading-normal w-full grid grid-cols-10 items-center">
                        <div className="py-3 px-2 text-center col-span-1">CÓDIGO DE ENVÍO</div>
                        <div className="py-3 px-2 text-center col-span-1">CANTIDAD DE PAQUETES</div>
                        <div className="py-3 px-2 text-center col-span-2">ESTADO</div>
                        <div className="py-3 px-2 text-center col-span-2">FECHA LÍMITE</div>
                        <div className="py-3 px-2 text-center col-span-2">ORIGEN</div>
                        <div className="py-3 px-2 text-center col-span-2">DESTINO</div>
                    </div>

                <div className="overflow-y-auto h-[350px] border stroke-black rounded w-full scroll-area overflow-x-hidden">
                    <AutoSizer>
                        {({ height, width }) => (
                            <List
                                height={height}
                                itemCount={shipmentsPerWarehouse.length}
                                itemSize={60}
                                width={width}
                                className="scroll-area"
                            >
                            {Row}
                            </List>
                        )}
                    </AutoSizer>
                                
                </div>
                </div>
                <div className="text-right text-[#939393] regular">Cantidad de envíos atendidos: {shipmentsPerWarehouse.length}</div>
        </div>
    )
}

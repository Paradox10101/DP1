"use client"
import { Button, Card, CardBody, DateInput, Tab, Tabs, DatePicker, calendar } from "@nextui-org/react";
import { debounce } from "lodash";
import { Calendar, Calendar1, ChartColumnIncreasing, Clock, MoveLeft, Pause, Play, Square, Truck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import OpcionSimulacion from "@/app/Components/OpcionSimulacion"
import OpcionEnvios from "@/app/Components/OpcionEnvios"
import OpcionAlmacenes from "@/app/Components/OpcionAlmacenes"
import OpcionVehiculos from "@/app/Components/OpcionVehiculos"

export default function PanelSimulacion({estadoSimulacion, setEstadoSimulacion, vehiculos}){
    const [currentTime, setCurrentTime] = useState(new Date())
    const [opcionSimulacionActiva, setOpcionSimulacionActiva] = useState(1)
    const [tipoSimulacion, setTipoSimulacion] = useState(1)
    const [tiemposSimulacion, setTiemposSimulacion] = useState(null)
    const [fechaError, setFechaError] = useState(false);
    const [date, setDate] = useState(null)
    const [opcionSeleccionada, setOpcionSelecionada] = useState(1)

    useEffect(()=>{
        const intervalId = setInterval(()=>{
            setCurrentTime(new Date());
        }, 1000)
        return () => clearInterval(intervalId)
    }, []);

    
    
    return(
    <div className="bg-blanco w-30vw h-[95%] p-[22px] flex flex-col gap-3 absolute left-5 z-50 top-1/2 transform -translate-y-1/2 rounded">
        <div className="flex flex-row justify-between">
            <div className="flex flex-row gap-1 items-center">
                <Truck size={40} className="stroke-principal inline"/>
                <div>
                    <span className="text-negro">Odipar</span>
                    <span className="text-principal">Pack</span>
                </div>
            </div>
            <div className="inline-flex bg-grisFondo rounded px-3 py-2 gap-2">
                <Clock className="inline-block"/>
                <span>{currentTime.getDate()}/{String(currentTime.getMonth()+1).padStart(2, '0')}/{currentTime.getFullYear()}
                , {String(currentTime.getHours()).padStart(2,'0')}:{String(currentTime.getMinutes()).padStart(2,'0')}:{String(currentTime.getSeconds()).padStart(2,'0')}</span>
            </div>
        </div>
        <div className="flex flex-col gap-2">
            <div className="flex flex-row gap-3">
                <button onClick={()=>{alert("Pantalla anterior")}}>
                    <MoveLeft className="inline"/>
                </button>
                <span className="encabezado">Simulación de escenarios</span>
            </div>
            
            <div>
                <Tabs
                    className="bg-grisFondo flex flex-col px-[5px] py-[5px] rounded h-full"
                    selectedKey={opcionSeleccionada}
                    onSelectionChange={setOpcionSelecionada}
                >
                    <Tab key="1" title={"Simulación"}
                        className={`${opcionSeleccionada!=="1"?" ":'bg-blanco text-negro'}` + "rounded focus:outline-none h-fit pequenno"}
                        onClick={()=>{setOpcionSelecionada(1)}}
                        >
                            
                    </Tab>
                    <Tab key="2" title={"Envíos"}
                        className={`${opcionSeleccionada!=="2"?" ":'bg-blanco text-negro'}` + "rounded focus:outline-none h-full pequenno"}
                        onClick={()=>{setOpcionSelecionada(2)}}
                        >
                    </Tab>
                    <Tab key="3" title={"Almacenes"}
                        className={`${opcionSeleccionada!=="3"?" ":'bg-blanco text-negro'}` + "rounded focus:outline-none h-full pequenno"}
                        onClick={()=>{setOpcionSelecionada(3)}}
                        >
                    </Tab>
                    <Tab key="4" title={"Vehiculos"}
                        className={`${opcionSeleccionada!=="4"?" ":'bg-blanco text-negro'}` + "rounded focus:outline-none h-full pequenno"}
                        onClick={()=>{setOpcionSelecionada(4)}}
                        >
                    </Tab>
                </Tabs>
            </div>
        </div>
        {
            opcionSeleccionada==1 ? <OpcionSimulacion tipoSimulacion={tipoSimulacion} setTipoSimulacion={setTipoSimulacion} date={date} fechaError={fechaError} tiemposSimulacion={tiemposSimulacion} estadoSimulacion={estadoSimulacion} setEstadoSimulacion={setEstadoSimulacion}/>
            :
            opcionSeleccionada==2 ? <OpcionEnvios />
            :
            opcionSeleccionada==3 ? <OpcionAlmacenes />
            :
            opcionSeleccionada==4 ? <OpcionVehiculos />
            :
            <></>
        }
        
    </div>
    )
}
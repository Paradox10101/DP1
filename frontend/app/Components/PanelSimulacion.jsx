"use client"
import { Button, Card, CardBody, DatePicker, Tab, Tabs } from "@nextui-org/react";
import { Calendar, ChartColumnIncreasing, Clock, MoveLeft, Pause, Play, Square, Truck } from "lucide-react";
import { useEffect, useRef, useState } from "react";


export default function PanelSimulacion(){
    const [currentTime, setCurrentTime] = useState(new Date())
    const [opcionActiva, setOpcionActiva] = useState(1)
    const [tipoSimulacion, setTipoSimulacion] = useState(1)
    const [tiemposSimulacion, setTiemposSimulacion] = useState(null)

    useEffect(()=>{
        const intervalId = setInterval(()=>{
            setCurrentTime(new Date());
        }, 1000)
        return () => clearInterval(intervalId)
    }, []);

    
    return(
    <div className="bg-blanco w-full h-full px-[22px]">
        <div>
            <Truck size={40} className="stroke-principal inline"/>
            <span className="text-negro">Odipar</span>
            <span className="text-principal">Pack</span>
            <div className="inline-flex bg-grisFondo">
                <Clock className="inline-block"/>
                <span>{currentTime.getDate()}/{String(currentTime.getMonth()+1).padStart(2, '0')}/{currentTime.getFullYear()}
                , {String(currentTime.getHours()).padStart(2,'0')}:{String(currentTime.getMinutes()).padStart(2,'0')}:{String(currentTime.getSeconds()).padStart(2,'0')}</span>
            </div>
        </div>
        <div>
            <MoveLeft className="inline"/>
            <span className="encabezado">Simulación de escenarios</span>
        </div>
        
        <div className="w-full">
            <Tabs
                className="bg-grisFondo flex flex-col px-[5px] py-[5px] rounded h-full"
                selectedKey={opcionActiva}
                onSelectionChange={setOpcionActiva}
                
            >
                <Tab key="1" title={"Datos de Simulación"}
                    className={`${opcionActiva!=="1"?" ":'bg-blanco text-negro'}` + "rounded focus:outline-none h-fit"}>
                </Tab>
                <Tab key="2" title={"Envíos"}
                    className={`${opcionActiva!=="2"?" ":'bg-blanco text-negro'}` + "rounded focus:outline-none h-full"}>
                </Tab>
                <Tab key="3" title={"Almacenes"}
                    className={`${opcionActiva!=="3"?" ":'bg-blanco text-negro'}` + "rounded focus:outline-none h-full"}>
                </Tab>
            </Tabs>
        </div>

        <div className="w-full">
            <div className="w-full">
                <div>
                    <MoveLeft className="inline"/>
                    <span className="encabezado">Tipo de Simulación</span>
                </div>
                <Tabs
                    className="bg-grisFondo flex flex-col rounded border-2 border-black"
                    selectedKey={tipoSimulacion}
                    onSelectionChange={setTipoSimulacion}
                >
                    <Tab key="1" title={"Semanal"} className={`${tipoSimulacion==="1"?"bg-principal text-blanco":'bg-blanco text-negro'}`+" rounded focus:outline-none"}>
                        <Card>
                        <CardBody>
                        </CardBody>
                        </Card>  
                    </Tab>
                    <Tab key="2" title={"Colapso"} className={`${tipoSimulacion==="2"?"bg-principal text-blanco":'bg-blanco text-negro'}`+" rounded focus:outline-none"}>
                        <Card>
                        <CardBody>
                        </CardBody>
                        </Card>  
                    </Tab>
                </Tabs>
            </div>
            
            <div className="w-full">
                <div>
                    <span className="encabezado">Fecha de Inicio</span>
                </div>
                <div className="flex w-full gap-4">
                    <DatePicker
                        className="border max-w-[150px] border-black rounded z-30 px-2"
                        
                    />
                </div>
            </div>
            <div className="flex w-full flex-col">
                <div>
                    <span className="encabezado">Ejecución</span>
                </div>
                <div className="flex justify-around w-full flex-row ">
                    <div className="flex flex-col w-full text-center items-center">
                        <button className="flex items-center justify-center w-[40px] h-[40px] rounded-full bg-capacidadDisponible"
                            onClick={()=>{alert("INICIADO")}}>
                            <Play color="white" />
                        </button>
                        <div className="subEncabezado text-capacidadDisponible">
                            Inicio
                        </div>
                    </div>
                    <div className="flex flex-col w-full text-center items-center">
                        <button className="flex items-center justify-center w-[40px] h-[40px] rounded-full bg-capacidadSaturada"
                            onClick={()=>{alert("PAUSA")}}>
                            <Pause color="white" />
                        </button>
                        <div className="subEncabezado text-capacidadSaturada">
                            Pausa
                        </div>
                    </div>
                    <div className="flex flex-col w-full text-center items-center">
                        <button className="flex items-center justify-center w-[40px] h-[40px] rounded-full bg-capacidadLlena"
                            onClick={()=>{alert("TERMINADO")}}>
                            <Square color="white" />
                        </button>
                        <div className="subEncabezado text-capacidadLlena">
                            Terminar
                        </div>
                    </div>
                </div>    
            </div>
            
            <div>
                <div>
                    <span className="regular_bold">Resumen de la simulación</span>
                </div>
                <div>
                    <div className="flex w-full flex-wrap gap-4">
                        <Calendar
                            className="max-w-[240px]"
                        />
                        <span className="regular">Inicio de la simulacion: {tiemposSimulacion===null?"--/--/---- --:--":""}</span>
                    </div>
                    <div className="flex w-full flex-wrap gap-4">
                        <Calendar
                            className="max-w-[240px]"
                        />
                        <span className="regular">Fin de la simulacion: {tiemposSimulacion===null?"--/--/---- --:--":""}</span>
                    </div>
                    <div className="flex w-full flex-wrap gap-4">
                        <Clock
                            className="max-w-[240px]"
                        />
                        <span className="regular">Tiempo simulado: {tiemposSimulacion===null?"-- --:--":""}</span>
                    </div>
                    <div className="flex w-full flex-wrap gap-4">
                        <Clock
                            className="max-w-[240px]"
                        />
                        <span className="regular">Tiempo real en simulación: {tiemposSimulacion===null?"-- --:--":""}</span>
                    </div>
                </div>
            </div>

        </div>
        
        <div>
            <Button disableRipple={true} className="bg-placeholder text-blanco w-full rounded regular py-[12px]" startContent={<ChartColumnIncreasing />}>
                Visualizar Reporte
            </Button>    
        </div>
    </div>
    )
}
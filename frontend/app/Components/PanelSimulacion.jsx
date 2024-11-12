"use client"
import { Button, Card, CardBody, DateInput, Tab, Tabs, DatePicker, calendar } from "@nextui-org/react";
import { debounce } from "lodash";
import { Calendar, Calendar1, ChartColumnIncreasing, Clock, MoveLeft, PanelLeftClose, PanelRightClose, Pause, Play, Square, Truck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import OpcionSimulacion from "@/app/Components/OpcionSimulacion"
import OpcionEnvios from "@/app/Components/OpcionEnvios"
import OpcionAlmacenes from "@/app/Components/OpcionAlmacenes"
import OpcionVehiculos from "@/app/Components/OpcionVehiculos"
import dynamic from "next/dynamic";

<<<<<<< HEAD
export default function PanelSimulacion({simulationStatus, handleSimulationControl, datos, toggleControls, error, shipments, vehicles}){
=======
const ClockContainer = dynamic(() => import('@/app/Components/ClockContainer'), { ssr: false });

export default function PanelSimulacion({simulationStatus, handleSimulationControl, datos, toggleControls, error}){
>>>>>>> 3ea7c0fccae3d4027d771983996a2ada537b7fba
    
    const [tipoSimulacion, setTipoSimulacion] = useState(1)
    const [opcionSeleccionada, setOpcionSelecionada] = useState(1)    
    
    return(
    <>
        <div className={"bg-blanco w-[22vw] h-[95%] p-[22px] flex flex-col gap-3 absolute left-5 z-50 top-1/2 transform -translate-y-1/2 rounded min-w-[400px]"}>
            <div className="flex flex-row justify-between w-full ">
                <div className="flex flex-row gap-2 items-center">
                    <button onClick={toggleControls} className="flex flex-row gap-1 items-center basis-1/7 cursor-pointer">
                        <PanelLeftClose size={30} className="stroke-principal inline"/>
                    </button>
                    <div className="flex flex-row gap-2 items-center hover:bg-gray-100 transition-all duration-300 ease-in-out rounded-lg p-2 cursor-pointer group">
                        <Truck size={30} className="stroke-principal" />
                        <div>
                            <span className="text-negro encabezado group-hover:text-gray-800 transition-colors duration-300">Odipar</span>
                            <span className="text-principal encabezado group-hover:brightness-110 transition-all duration-300">Pack</span>
                        </div>
                    </div>
                </div>
                <ClockContainer/>
            </div>
            <div className="flex flex-col gap-2">
                <div className="flex flex-row gap-3">
                    <button onClick={()=>{alert("Pantalla anterior")}}>
                        <MoveLeft className="inline"/>
                    </button>
                    <span className="text-lg font-medium">Simulación de escenarios</span>
                </div>
                
                <div>
                    <Tabs
                        className="bg-grisFondo flex flex-col px-[5px] py-[5px] rounded h-full w-full"
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
                opcionSeleccionada==1 ? <OpcionSimulacion tipoSimulacion={tipoSimulacion} setTipoSimulacion={setTipoSimulacion} error={error}/>
                :
                opcionSeleccionada==2 ? <OpcionEnvios/>
                :
                opcionSeleccionada==3 ? <OpcionAlmacenes />
                :
<<<<<<< HEAD
                opcionSeleccionada==4 ? <OpcionVehiculos vehicles = {vehicles}/>
=======
                opcionSeleccionada==4 ? <OpcionVehiculos />
>>>>>>> 3ea7c0fccae3d4027d771983996a2ada537b7fba
                :
                <></>
            }
        </div>
        
    </>
    )
}
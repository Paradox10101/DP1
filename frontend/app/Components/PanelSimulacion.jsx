"use client"
import { Button, Card, CardBody, DateInput, Tab, Tabs, DatePicker, calendar } from "@nextui-org/react";
import { debounce } from "lodash";
import { Calendar, Calendar1, ChartColumnIncreasing, Clock, MoveLeft, PanelLeftClose, PanelRightClose, Pause, Play, Square, Truck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import OpcionSimulacion from "@/app/Components/OpcionSimulacion"
import OpcionEnvios from "@/app/Components/OpcionEnvios"
import OpcionAlmacenes from "@/app/Components/OpcionAlmacenes"
import OpcionVehiculos from "@/app/Components/OpcionVehiculos"

export default function PanelSimulacion({simulationStatus, handleSimulationControl, datos, toggleControls, error, shipments}){
    
    const [currentTime, setCurrentTime] = useState(new Date())
    const [tipoSimulacion, setTipoSimulacion] = useState(1)
    const [opcionSeleccionada, setOpcionSelecionada] = useState(1)

    const [horaActual, setHoraActual] = useState(null);
    const [esCliente, setEsCliente] = useState(false);

  useEffect(() => {
    // Esto asegura que el componente solo se renderice en el cliente
    setEsCliente(true);

    if (esCliente) {
      // Solo actualiza la hora si está en el cliente
      const actualizarHora = () => {
        setHoraActual(new Date());
      };

      actualizarHora(); // Muestra la hora actual de inmediato
      const intervalo = setInterval(actualizarHora, 1000);

      // Limpia el intervalo al desmontar el componente
      return () => clearInterval(intervalo);
    }
  }, [esCliente]);


    
    
    return(
    <>
        <div className={"bg-blanco w-[22vw] h-[95%] p-[22px] flex flex-col gap-3 absolute left-5 z-50 top-1/2 transform -translate-y-1/2 rounded min-w-[400px]"}>
            <div className="flex flex-row justify-between w-full ">
                <div className="flex flex-row gap-1 items-center basis-1/4">
                    <Truck size={40} className="stroke-principal inline"/>
                    <div>
                        <span className="text-negro encabezado">Odipar</span>
                        <span className="text-principal encabezado">Pack</span>
                    </div>
                </div>
                <div className="inline-flex bg-grisFondo rounded px-3 py-2 gap-2 basis-3/6 items-center">
                    <Clock className="inline-block"/>
                    {horaActual&&<span className="pequenno">{horaActual.getDate()}/{String(horaActual.getMonth()+1).padStart(2, '0')}/{horaActual.getFullYear()}
                    , {String(horaActual.getHours()).padStart(2,'0')}:{String(horaActual.getMinutes()).padStart(2,'0')}:{String(horaActual.getSeconds()).padStart(2,'0')}</span>}
                    
                </div>
                <button onClick={toggleControls} className="flex flex-row gap-1 items-center basis-1/7 cursor-pointer">
                    <PanelLeftClose size={40} className="stroke-principal inline"/>
                </button>
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
                opcionSeleccionada==1 ? <OpcionSimulacion tipoSimulacion={tipoSimulacion} setTipoSimulacion={setTipoSimulacion}  simulationStatus={simulationStatus} handleSimulationControl={handleSimulationControl} error={error}/>
                :
                opcionSeleccionada==2 ? <OpcionEnvios shipments={shipments}/>
                :
                opcionSeleccionada==3 ? <OpcionAlmacenes datos={datos} />
                :
                opcionSeleccionada==4 ? <OpcionVehiculos vehiculos = {datos.vehiculos}/>
                :
                <></>
            }
        </div>
        
    </>
    )
}
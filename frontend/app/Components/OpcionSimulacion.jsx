import { Button, Tab, Tabs } from "@nextui-org/react"
import { Calendar, ChartColumnIncreasing, Clock, Pause, Play, Square } from "lucide-react"

export default function OpcionSimulacion({tipoSimulacion, setTipoSimulacion, date, fechaError, tiemposSimulacion, estadoSimulacion, setEstadoSimulacion}){

return (

        <div className="h-full flex flex-col justify-between">
            <div className="flex flex-col gap-3 justify-between">
                <div className="w-full flex flex-col gap-2 justify-between">
                    <div >
                        <span className="encabezado">Tipo de Simulación</span>
                    </div>
                    <Tabs
                        className="bg-grisFondo flex flex-col rounded border-2 border-black"
                        selectedKey={tipoSimulacion}
                        onSelectionChange={setTipoSimulacion}
                    >
                        <Tab key="1" title={"Semanal"} className={`${tipoSimulacion==="1"?"bg-principal text-blanco":'bg-blanco text-negro'}`+" rounded focus:outline-none"}>
                        </Tab>
                        <Tab key="2" title={"Colapso"} className={`${tipoSimulacion==="2"?"bg-principal text-blanco":'bg-blanco text-negro'}`+" rounded focus:outline-none"}>
                        </Tab>
                    </Tabs>
                </div>
                
                <div className="w-full flex flex-col gap-1">
                    <div>
                        <span className="encabezado">Fecha de Inicio</span>
                    </div>
                    <div className="flex w-full gap-4">
                        <div className="flex flex-col gap-1">
                            <div>
                            <input
                                id="date-input"
                                type="date"
                                value={date}
                                className="border-2 stroke-black rounded-2xl w-[180px] px-2"
                            />
                            </div>
                            <div className={`text-red-500 regular h-4`}>{fechaError?"Error en la fecha ingresada":" "}</div>
                        </div>
                    </div>
                </div>
                <div className="flex w-full flex-col gap-3">
                    <div>
                        <span className="encabezado">Ejecución</span>
                    </div>
                    <div className="flex justify-around w-full flex-row ">
                        <div className="flex flex-col w-full text-center items-center">
                            <button className="flex items-center justify-center w-[40px] h-[40px] rounded-full bg-capacidadDisponible"
                                onClick={()=>{setEstadoSimulacion("EJECUCION")}}>
                                <Play color="white" />
                            </button>
                            <div className="subEncabezado text-capacidadDisponible">
                                Inicio
                            </div>
                        </div>
                        <div className="flex flex-col w-full text-center items-center">
                            <button className="flex items-center justify-center w-[40px] h-[40px] rounded-full bg-capacidadSaturada"
                                onClick={()=>{setEstadoSimulacion("INICIAL")}}>
                                <Pause color="white" />
                            </button>
                            <div className="subEncabezado text-capacidadSaturada">
                                Pausa
                            </div>
                        </div>
                        <div className="flex flex-col w-full text-center items-center">
                            <button className="flex items-center justify-center w-[40px] h-[40px] rounded-full bg-capacidadLlena"
                                onClick={()=>{setEstadoSimulacion("INICIAL")}}>
                                <Square color="white" />
                            </button>
                            <div className="subEncabezado text-capacidadLlena">
                                Terminar
                            </div>
                        </div>
                    </div>    
                </div>
                
                <div className="flex flex-col gap-3">
                    <div>
                        <span className="regular_bold">Resumen de la simulación</span>
                    </div>
                    <div className="flex flex-col gap-1">
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
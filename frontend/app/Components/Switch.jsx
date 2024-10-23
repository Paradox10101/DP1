import { Tab, Tabs } from "@nextui-org/react";

export default function Switch({estado, setEstado}){
    return (
    <>
        <div className="flex flex-row gap-2 regular bg-white w-fit p-3 rounded-2xl items-center">
            <Tabs
                className="bg-grisFondo flex flex-col rounded-2xl border-2 border-black"
                selectedKey={estado}
                onSelectionChange={setEstado}
                onClick={()=>setEstado((currentKey)=>{return (currentKey==="1"?"2":"1")})}
            >
                <Tab key="2" className={`${estado==="1"?"bg-principal text-blanco":'bg-blanco text-negro'}`+" rounded-full focus:outline-none w-1/2"}>
                </Tab>
                <Tab key="1" className={`${estado==="2"?"bg-gray-500 text-blanco":'bg-blanco text-negro'}`+" rounded-full focus:outline-none w-1/2"}>
                </Tab>
                
            </Tabs>
            <div>
                {estado==="1"?'Ocultar Rutas':estado==="2"?"Mostrar Rutas":""}
            </div>
            
        </div>
    </>
    )
}
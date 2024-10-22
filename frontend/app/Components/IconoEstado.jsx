"use client"
export default function IconoEstado({Icono, classNameIconoContenedor, classNameIconoContenido}){
    return (
        <div className={classNameIconoContenedor}>
            <Icono className={classNameIconoContenido}/>
        </div>
    )
}
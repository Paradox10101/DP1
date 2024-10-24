import { AlertTriangle } from "lucide-react";

const IconoEstado = ({Icono, classNameContenedor, classNameContenido}) =>{
    return (
        <div className={classNameContenedor}>
            <Icono className={classNameContenido}/>
        </div>
    )
}

export default IconoEstado;
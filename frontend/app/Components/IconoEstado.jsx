import { AlertTriangle } from "lucide-react";

const IconoEstado = ({Icono, classNameContenedor, classNameContenido, alerta=false, alertClassname=""}) =>{
    return (
        <div className={classNameContenedor}>
            {alerta&&<AlertTriangle className={alertClassname}/>}
            <Icono className={classNameContenido}/>
        </div>
    )
}

export default IconoEstado;
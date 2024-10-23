const BarraProgreso = ({ porcentaje }) => {
    return (
      <div className="relative w-full h-2 bg-gray-200 rounded-full">
        <div
          className={"absolute h-full rounded-full transition-all duration-300 " 
            +
            (porcentaje <= 40 ? "bg-capacidadDisponible"
            :
            porcentaje > 40 && porcentaje < 80 ? "bg-capacidadSaturada"
            :
            porcentaje >=80 ? "bg-capacidadLlena"
            :
            " bg-gray-500"
            )
            
          }
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    );
};

export default BarraProgreso;
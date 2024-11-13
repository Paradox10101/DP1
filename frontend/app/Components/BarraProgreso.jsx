const BarraProgreso = ({ porcentaje, uniqueColor }) => {
    return (
      <div className="relative w-full h-2 bg-gray-200 rounded-full">
        
        
        <div
          className={"absolute h-full rounded-full transition-all duration-300 overflow-x-hidden " 
            +
            (uniqueColor? "bg-blue-500"
            :
            porcentaje <= 40 ? "bg-capacidadDisponible"
            :
            porcentaje > 40 && porcentaje < 80 ? "bg-capacidadSaturada"
            :
            porcentaje >=80 ? "bg-capacidadLlena"
            :
            " bg-gray-500"
            )
            
          }
          style={{ width: `${porcentaje>100?100:porcentaje}%` }}
        />
        </div>
        
        
        
    );
};

export default BarraProgreso;
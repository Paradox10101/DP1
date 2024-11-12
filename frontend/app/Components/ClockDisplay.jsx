import { Clock } from "lucide-react";

const ClockDisplay = ({ horaActual }) => {
    const formatTime = (date) => {
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      
      hours = hours % 12;
      hours = hours ? hours : 12;
      hours = String(hours).padStart(2, '0');
  
      return `${hours}:${minutes}:${seconds} ${ampm}`;
    };
  
    const formatDate = (date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}/${month}/${year}`;
    };
  
    return (
      <div className="flex flex-row gap-2 bg-gray-100 hover:bg-gray-200/80 rounded-lg p-2 items-center cursor-pointer transition-all duration-300 ease-in-out group">
        <Clock 
          size={18} 
          className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300 ease-in-out"
        />
        <span className="pequenno group-hover:text-gray-700 transition-colors duration-300 ease-in-out">
          {formatDate(horaActual)}, {formatTime(horaActual)}
        </span>
      </div>
    );
  };  
  
  export default ClockDisplay;
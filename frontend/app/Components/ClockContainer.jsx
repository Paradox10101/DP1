import { useEffect, useState } from "react";
import ClockDisplay from "./ClockDisplay";

const ClockContainer = () => {
    const [horaActual, setHoraActual] = useState(new Date());
  
    useEffect(() => {
      const timer = setInterval(() => {
        setHoraActual(new Date());
      }, 1000);
      return () => clearInterval(timer);
    }, []);
  
    return <ClockDisplay horaActual={horaActual} />;
  };

export default ClockContainer;
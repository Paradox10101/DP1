import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  Button, 
  Select, 
  SelectItem
} from "@nextui-org/react";
import { useState, useMemo, useEffect } from "react";
import { simulationStatusAtom, simulationTypeAtom, showSimulationModalAtom } from "@/atoms/simulationAtoms";
import { useAtom } from "jotai";

export default function SimulationModal() {
  const [isOpen, setIsOpen] = useAtom(showSimulationModalAtom);
  const [selectedType, setSelectedType] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [simulationStatus, setSimulationStatus] = useAtom(simulationStatusAtom);
  const [simulationType, setSimulationType] = useAtom(simulationTypeAtom);
  
  const [availableDays, setAvailableDays] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [firstAvailableDateTime, setFirstAvailableDateTime] = useState(null);

  const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_API_BASE_URL_PROD
    : process.env.NEXT_PUBLIC_API_BASE_URL;

  // Generar opciones de mes-año
  const monthOptions = useMemo(() => {
    const months = [];
    const startDate = new Date(2024, 6); // Junio 2024
    const endDate = new Date(2026, 11);   // Noviembre 2026

    while (startDate <= endDate) {
      const monthYear = startDate.toLocaleDateString('es', { 
        month: 'long', 
        year: 'numeric' 
      });
      const value = startDate.toISOString().split('T')[0].substring(0, 7); // YYYY-MM
      months.push({ value, label: monthYear });
      startDate.setMonth(startDate.getMonth() + 1);
    }
    return months;
  }, []);

  // Generar horas del día en formato AM/PM
  const timeOptions = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => {
      const hour = i % 12 || 12;
      const ampm = i < 12 ? 'AM' : 'PM';
      const time = `${hour}:00 ${ampm}`;
      return { value: time, label: time };
    });
  }, []);

  // Modificar la función handleMonthChange para generar el rango de días y horas
  const handleMonthChange = async (month) => {
    setSelectedMonth(month);
    setSelectedDate(""); 
    setSelectedTime(""); 
    setAvailableDays([]);
    setAvailableTimes([]);
    setFirstAvailableDateTime(null);

    try {
      const response = await fetch(`${API_BASE_URL}/simulation/first-available-date?monthYear=${month}`);
      const data = await response.json();

      if (data.success) {
        const { date, time } = data;
        setFirstAvailableDateTime({ date, time });

        // Generar rango de días disponibles
        const [year, monthNum, startDay] = date.split('-').map(Number);
        const lastDay = new Date(year, monthNum, 0).getDate(); // Obtiene el último día del mes
        
        const daysArray = [];
        for (let day = startDay; day <= lastDay; day++) {
          const formattedDay = day < 10 ? `0${day}` : day;
          daysArray.push(`${year}-${monthNum < 10 ? '0' + monthNum : monthNum}-${formattedDay}`);
        }
        setAvailableDays(daysArray);

        // Generar horas disponibles
        const timeArray = generateTimeOptions(time);
        setAvailableTimes(timeArray);

        // Establecer valores iniciales seleccionados
        setSelectedDate(date);
        setSelectedTime(timeArray[0]); // Primera hora disponible
      } else {
        console.error(data.error);
        setAvailableDays([]);
        setAvailableTimes([]);
        setSelectedDate("");
        setSelectedTime("");
      }
    } catch (error) {
      console.log('Error al obtener la fecha disponible:', error);
      setAvailableDays([]);
      setAvailableTimes([]);
      setSelectedDate("");
      setSelectedTime("");
    }
  };

  // Función para generar las horas disponibles
  const generateTimeOptions = (startTime) => {
    // Convertir la hora inicial a formato de 24 horas
    const [time, period] = startTime.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    // Redondear a la hora anterior
    const startHour = hours;

    const timeArray = [];
    for (let hour = startHour; hour < 24; hour++) {
      const h = hour % 12 || 12;
      const ampm = hour < 12 ? 'AM' : 'PM';
      timeArray.push(`${h}:00 ${ampm}`);
    }
    return timeArray;
  };

  // Actualizar el handler de fecha para regenerar las horas si es el primer día
  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedTime("");

    if (date === firstAvailableDateTime?.date) {
      // Si es el primer día, usar las horas desde la hora inicial
      const timeArray = generateTimeOptions(firstAvailableDateTime.time);
      setAvailableTimes(timeArray);
    } else {
      // Para otros días, mostrar todas las horas
      const allHours = Array.from({ length: 24 }, (_, i) => {
        const hour = i % 12 || 12;
        const ampm = i < 12 ? 'AM' : 'PM';
        return `${hour}:00 ${ampm}`;
      });
      setAvailableTimes(allHours);
    }
  };

  const handleStart = async () => {
    if (selectedType && selectedDate && selectedTime) {
      try {
        const response = await fetch(`${API_BASE_URL}/simulation/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: selectedType,
            startDate: selectedDate,
            startTime: selectedTime
          })
        });
  
        if (!response.ok) {
          // Manejar error
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to start simulation');
        } else {
          // Simulación iniciada exitosamente
          setSimulationType(selectedType); // Guardar el tipo de simulación
          setSimulationStatus('running');
          setIsOpen(false);
          window.dispatchEvent(new Event('newSimulation'));
        }
      } catch (error) {
        console.error('Error starting simulation:', error);
        // Manejar error (por ejemplo, mostrar una notificación)
      }
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => setIsOpen(false)} 
      hideCloseButton
      className="min-w-[400px]"
    >
      <ModalContent>
        <ModalHeader>
          <div className="flex flex-col gap-2 w-full">
            <h2 className="text-xl font-bold">Inicia una simulación</h2>
            <p className="text-sm text-gray-500">
              Usa datos de envíos variados para realizar una simulación semanal
              o hasta el colapso de las operaciones.
            </p>
          </div>
        </ModalHeader>
        <ModalBody className="gap-6 py-6">
          <Select
            label="Tipo"
            placeholder="Selecciona el tipo de simulación"
            selectedKeys={selectedType ? [selectedType] : []}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <SelectItem key="semanal" value="semanal">Semanal</SelectItem>
            <SelectItem key="colapso" value="colapso">Hasta colapso</SelectItem>
          </Select>

          <div className="flex gap-2">
            <Select
              label="Mes"
              placeholder="Selecciona el mes"
              className="flex-1"
              selectedKeys={selectedMonth ? [selectedMonth] : []}
              onChange={(e) => handleMonthChange(e.target.value)}
            >
              {monthOptions.map(({value, label}) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </Select>

            <Select
              label="Día"
              placeholder="Selecciona el día"
              className="flex-1"
              selectedKeys={selectedDate ? [selectedDate] : []}
              onChange={(e) => handleDateChange(e.target.value)}
              isDisabled={!selectedMonth || availableDays.length === 0}
            >
              {availableDays.map((day) => {
                const [year, month, date] = day.split('-').map(Number);
                const dateObj = new Date(year, month - 1, date);
                return (
                  <SelectItem key={day} value={day}>
                    {dateObj.toLocaleDateString('es', { weekday: 'short', day: 'numeric' })}
                  </SelectItem>
                );
              })}
            </Select>
          </div>

          <Select
            label="Hora"
            placeholder="Selecciona la hora"
            selectedKeys={selectedTime ? [selectedTime] : []}
            onChange={(e) => setSelectedTime(e.target.value)}
            isDisabled={!selectedDate || availableTimes.length === 0}
          >
            {availableTimes.map((time) => (
              <SelectItem key={time} value={time}>
                {time}
              </SelectItem>
            ))}
          </Select>

          <div className="flex justify-between gap-2 pt-4">
            <Button 
              color="default" 
              variant="flat" 
              className="flex-1"
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              color="primary" 
              className="flex-1"
              onClick={handleStart}
              disabled={!selectedType || !selectedDate || !selectedTime}
            >
              Iniciar
            </Button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

import React, { useEffect, useState } from 'react';

const PruebaSocket = () => {
  const [time, setTime] = useState('Esperando hora...')
  const [counter, setCounter] = useState(0)

  useEffect(() => {
    // Crear conexión WebSocket
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL);

    ws.onopen = () => {
      console.log('Conectado al WebSocket');
    };

    ws.onmessage = (event) => {
      // Actualizar el mensaje recibido desde el servidor en tiempo real
      console.log(event)
      const message = JSON.parse(event.data)
      setTime(message.hora)
      setCounter(message.contador)
    };

    ws.onerror = (error) => {
      console.log('Error en el WebSocket:', error);
    };

    ws.onclose = () => {
      console.log('Conexión WebSocket cerrada');
    };

    // Limpiar la conexión WebSocket al desmontar el componente
    return () => {
      ws.close();
    };
  }, []);

  return (
    <div>
      <h1>Hora en tiempo real:</h1>
      <p>Hora actual: {time}</p>
      <p>Segundos de conexión: {counter}</p>
    </div>
  );
};

export default PruebaSocket;


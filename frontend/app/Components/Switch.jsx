const Switch = ({isOn, setIsOn}) => {
  
  // Función para manejar el cambio de estado
  const toggleSwitch = () => {
    setIsOn(prevState => !prevState); // Cambia el estado
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center' }} className="flex-row justify-center w-full items-center gap-2">
      <div
        onClick={toggleSwitch}
        style={{
          width: '60px',
          height: '30px',
          backgroundColor: isOn ? '#1A37A1' : 'gray',
          borderRadius: '15px',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: '30px',
            height: '30px',
            backgroundColor: 'white',
            borderRadius: '50%',
            position: 'absolute',
            top: '0',
            left: isOn ? '30px' : '0',
            transition: 'left 0.2s ease-in-out',
          }}
        />
      </div>
      <span style={{ marginRight: '8px' }} className="regular">
        Mostrar Rutas
      </span>
    </div>
  );
};

export default Switch;

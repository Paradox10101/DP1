import { useState, useCallback } from 'react';
import { Button } from "@nextui-org/react";
import { Clock } from "lucide-react";

const SimulationSpeedControl = ({ simulationStatus }) => {
    const [currentSpeed, setCurrentSpeed] = useState('SLOW');
    const [isChanging, setIsChanging] = useState(false);

    const speeds = [
        { key: 'FAST', label: 'x8', value: 8 },
        { key: 'MEDIUM', label: 'x6', value: 6 },
        { key: 'SLOW', label: 'x5', value: 5 }
    ];

    const handleSpeedChange = useCallback(async (speed) => {
        if (simulationStatus === 'DISCONNECTED') return;
        
        setIsChanging(true);
        try {
            const response = await fetch('http://localhost:4567/api/v1/simulation/speed', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ speed: speed.key }),
            });

            if (!response.ok) {
                throw new Error('Failed to change simulation speed');
            }

            setCurrentSpeed(speed.key);
        } catch (error) {
            console.error('Error changing simulation speed:', error);
        } finally {
            setIsChanging(false);
        }
    }, [simulationStatus]);

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Velocidad de Simulación</span>
            </div>
            <div className="flex gap-2">
                {speeds.map((speed) => (
                    <Button
                        key={speed.key}
                        size="sm"
                        disabled={simulationStatus === 'DISCONNECTED' || isChanging}
                        className={`px-4 py-2 transition-all duration-200 ${
                            currentSpeed === speed.key
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        onClick={() => handleSpeedChange(speed)}
                    >
                        {speed.label}
                        <span className="text-xs ml-1">
                            {currentSpeed === speed.key && '•'}
                        </span>
                    </Button>
                ))}
            </div>
            <div className="text-xs text-gray-500">
                {`${speeds.find(s => s.key === currentSpeed)?.value} minutos por segundo`}
            </div>
        </div>
    );
};

export default SimulationSpeedControl;
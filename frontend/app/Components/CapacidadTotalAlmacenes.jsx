import React from 'react'
import LinearProgressBar from '../Components/LinearProgressBar';

const CapacidadTotalAlmacenes = () => {
  return (
    <div className='flex flex-col gap-2 p-4 border rounded-xl w-full h-[100px]'>
        <h3 className='text-[15px] font-medium text-gray-800'>Capacidad total de las oficinas</h3>
        <LinearProgressBar
          percentage={75}
          height={8}
          backgroundColor="#E5E7EB"
          progressColor="#3B82F6"
          showPercentage={false}
          animate={true}
        />
        <div className='flex flex-row justify-between text-xs text-gray-600'>
            <span>569 paquetes</span>
            <span>21% ocupado</span>
            <span>12500 paquetes (max)</span>
        </div>
    </div>
  )
}

export default CapacidadTotalAlmacenes
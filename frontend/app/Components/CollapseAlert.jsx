
export default function ColapsoAlert({ onShowReport }) {
    return (
        <div className="flex flex-col items-center justify-center p-6 text-center">
            <div className="animate-pulse mb-4">
                <svg 
                    className="w-16 h-16 text-red-600" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="2" 
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                </svg>
            </div>
            <h2 className="text-3xl font-bold text-red-600 mb-4">
                ¡COLAPSO LOGÍSTICO!
            </h2>
            <p className="text-gray-700 text-lg mb-6">
                Se ha detectado una situación crítica en el sistema logístico debido al exceso de capacidad de las oficinas o un pedido no atendido a tiempo.
            </p>
            <button 
                onClick={onShowReport}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-semibold"
            >
                <svg 
                    className="w-5 h-5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="2" 
                        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                </svg>
                Ver Reporte Detallado
            </button>
        </div>
    )
}
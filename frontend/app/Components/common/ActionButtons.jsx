export const ActionButtons = ({ 
  onCancel, 
  onNext, 
  onBack, 
  nextDisabled = false,
  currentStep = 1,
  totalSteps = 3,
  nextLabel = "Siguiente",
  backLabel = "Anterior"
}) => (
  <div className="flex justify-between pt-6">
    <div>
      {currentStep > 1 && (
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium text-gray-700
            bg-white border border-gray-300 rounded-md
            hover:bg-gray-50 focus:outline-none focus:ring-2
            focus:ring-offset-2 focus:ring-blue-500"
        >
          {backLabel}
        </button>
      )}
      {currentStep === 1 && (
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700
            bg-white border border-gray-300 rounded-md
            hover:bg-gray-50 focus:outline-none focus:ring-2
            focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancelar
        </button>
      )}
    </div>
    <button
      type="button"
      onClick={onNext}
      disabled={nextDisabled}
      className={`px-4 py-2 text-sm font-medium text-white
        border border-transparent rounded-md
        focus:outline-none focus:ring-2
        focus:ring-offset-2 focus:ring-blue-500
        ${nextDisabled 
          ? 'bg-blue-300 cursor-not-allowed' 
          : 'bg-blue-600 hover:bg-blue-700'
        }`}
    >
      {currentStep === totalSteps ? 'Confirmar' : nextLabel}
    </button>
  </div>
);
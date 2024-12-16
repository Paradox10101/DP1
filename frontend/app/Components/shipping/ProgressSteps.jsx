import { Package, Truck } from 'lucide-react';

const steps = [
  {
    icon: <Package className="w-6 h-6" />,
    label: "Detalles del paquete",
    step: 1
  },
  {
    icon: <Truck className="w-6 h-6" />,
    label: "Confirmación",
    step: 2
  }
];

export const ProgressSteps = ({ currentStep }) => (
  <div className="flex justify-between items-center mb-12 relative">
    {steps.map((step, index) => (
      <div
        key={step.label}
        className="flex-1 flex flex-col items-center relative"
      >
        <div
          className={`
            w-12 h-12 rounded-full flex items-center justify-center relative z-10
            ${step.step === currentStep
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-500'}
          `}
        >
          {step.icon}
        </div>
        <div className="mt-2 text-sm text-gray-500 text-center">{step.label}</div>
        {index < steps.length - 1 && (
          <div className="absolute top-6 left-1/2 w-full h-0.5 bg-gray-200 -z-0" />
        )}
      </div>
    ))}
  </div>
);

export default ProgressSteps;
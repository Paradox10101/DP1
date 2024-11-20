import { MoveLeft } from "lucide-react";
import { Button } from "@nextui-org/react";
import { useRouter } from "next/navigation";

const Navigation = ({ tipoSimulacion }) => {
  const router = useRouter();
  
  const titleText = tipoSimulacion === 'diaria'
    ? 'Operaciones diarias'
    : 'Simulación de escenarios';

  const handleBack = () => {
    router.push('/');
  };

  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-100">
      <Button
        isIconOnly
        variant="light"
        onClick={handleBack}
        className="text-gray-600 hover:text-gray-900 transition-colors"
        radius="full"
      >
        <MoveLeft size={18} strokeWidth={2.5} />
      </Button>
      
      <div className="flex flex-col">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          Panel de control
        </span>
        <h2 className="text-base font-medium text-gray-800">
          {titleText}
        </h2>
      </div>
    </div>
  );
};

export default Navigation;
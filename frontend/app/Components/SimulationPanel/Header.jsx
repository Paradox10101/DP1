import { PanelLeftClose, Truck, PanelRightOpen } from "lucide-react";
import { Button } from "@nextui-org/react";
import { showControlsAtom } from "@/atoms/simulationAtoms";
import { useAtom } from "jotai";

const Header = () => {
  const [showControls, setShowControls] = useAtom(showControlsAtom);
  
  const toggleControls = () => setShowControls(!showControls);

  return (
    <div className="flex justify-between items-center w-full p-4 border-b">
      <div className="flex items-center gap-4">
        <Button
          isIconOnly
          variant="light"
          onClick={toggleControls}
          className="text-primary transition-transform duration-300"
        >
          {showControls ? (
            <PanelLeftClose size={24} />
          ) : (
            <PanelRightOpen size={24} />
          )}
        </Button>
        <Button
          className="bg-transparent hover:bg-secondary-50 transition-all"
          startContent={<Truck className="text-primary" size={24} />}
        >
          <span className="font-semibold">
            <span className="text-foreground">Odipar</span>
            <span className="text-primary">Pack</span>
          </span>
        </Button>
      </div>
    </div>
  );
};

export default Header;
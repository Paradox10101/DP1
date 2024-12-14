import React, { useState } from 'react';
import { Tabs, Tab, Card, CardBody } from "@nextui-org/react";
import { FileUpload } from './FileUpload';
import { 
  Truck, 
  MapPin, 
  Route, 
  Tool, 
  Ban,
  Package,
  TruckIcon,
  MapPinIcon,
  RouteIcon,
  PenToolIcon,
  BanIcon,
  PackageIcon
} from 'lucide-react';

const ConfigurationPanel = () => {
  const [selected, setSelected] = useState("vehiculos");

  const uploadConfigs = {
    vehiculos: {
      title: "Carga de Vehículos",
      description: "Cargar flota de vehículos disponibles",
      acceptedFormats: ".txt",
      icon: <TruckIcon className="w-5 h-5"/>,
      placeholder: "01 ABC123, 5000, A1"
    },
    ubicaciones: {
      title: "Carga de Ubicaciones",
      description: "Cargar ubicaciones y almacenes",
      acceptedFormats: ".txt",
      icon: <MapPinIcon className="w-5 h-5"/>,
      placeholder: "010101, Lima, -12.0464, -77.0428, A1"
    },
    tramos: {
      title: "Carga de Tramos",
      description: "Cargar rutas y conexiones",
      acceptedFormats: ".txt",
      icon: <RouteIcon className="w-5 h-5"/>,
      placeholder: "010101 => 010102, 45, 80"
    },
    mantenimientos: {
      title: "Programación de Mantenimientos",
      description: "Cargar horarios de mantenimiento",
      acceptedFormats: ".txt",
      icon: <PenToolIcon className="w-5 h-5"/>,
      placeholder: "ABC123, 08:00, 4"
    },
    bloqueos: {
      title: "Registro de Bloqueos",
      description: "Cargar bloqueos de rutas",
      acceptedFormats: ".txt",
      icon: <BanIcon className="w-5 h-5"/>,
      placeholder: "010101 => 010102, 14:30, 2"
    },
    ordenes: {
      title: "Carga de Órdenes",
      description: "Cargar órdenes del día",
      acceptedFormats: ".txt",
      icon: <PackageIcon className="w-5 h-5"/>,
      placeholder: "01 14:30, ****** => 030101, 50"
    }
  };

  return (
    <div className="flex w-full flex-col">
      <Card className="max-w-full">
        <CardBody>
          <Tabs 
            aria-label="Opciones" 
            selectedKey={selected} 
            onSelectionChange={setSelected}
            color="primary"
            variant="bordered"
            classNames={{
              tabList: "gap-4 w-full relative rounded-lg p-2",
              cursor: "w-full bg-primary",
              tab: "max-w-fit px-4 h-10",
              tabContent: "group-data-[selected=true]:text-white"
            }}
          >
            {Object.entries(uploadConfigs).map(([key, config]) => (
              <Tab
                key={key}
                title={
                  <div className="flex items-center space-x-2">
                    {config.icon}
                    <span>{config.title}</span>
                  </div>
                }
              >
                <FileUpload
                  title={config.title}
                  description={config.description}
                  acceptedFormats={config.acceptedFormats}
                  placeholder={config.placeholder}
                  uploadType={key}
                />
              </Tab>
            ))}
          </Tabs>
        </CardBody>
      </Card>
    </div>
  );
};

export default ConfigurationPanel;
import { Logo } from '../Components/panel/Logo';
import { PanelSection } from '../Components/panel/PanelSection';
import { Package, Upload, Box, Plane, Calendar } from 'lucide-react';

export default function ControlPanel() {
  const sections = [
    {
      title: "Gestión de envíos",
      description: "Administre sus envíos de forma individual o masiva",
      items: [
        {
          icon: <Package className="text-blue-600" size={24} />,
          label: "Registrar envío individual",
          description: "Crear y gestionar envíos uno a uno",
          href: "/register-shipment"
        },
        {
          icon: <Upload className="text-blue-600" size={24} />,
          label: "Carga masiva de envíos",
          description: "Importar múltiples envíos simultáneamente",
          href: "/bulk-upload"
        }
      ]
    },
    {
      title: "Operaciones",
      description: "Supervise y gestione las operaciones diarias",
      items: [
        {
          icon: <Box className="text-emerald-600" size={24} />,
          label: "Recepción de envíos",
          description: "Gestionar entrada de paquetes",
          href: "/shipments-reception"
        },
        {
          icon: <Plane className="text-emerald-600" size={24} />,
          label: "Ver operaciones día a día",
          description: "Monitoreo de actividades diarias",
          href: "/daily-operations"
        }
      ]
    },
    {
      title: "Simulación de Operaciones",
      description: "Analice diferentes escenarios operativos",
      items: [
        {
          icon: <Calendar className="text-purple-600" size={24} />,
          label: "Simulación de escenarios",
          description: "Evaluar diferentes situaciones operativas",
          href: "/simulation"
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex items-center justify-between mb-12">
          <Logo className="h-10 w-auto" />
          <h1 className="text-2xl font-semibold text-gray-900">Panel de Control</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sections.map((section, idx) => (
            <div 
              key={idx} 
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-6"
            >
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
                  <p className="text-sm text-gray-500">{section.description}</p>
                </div>
                
                <div className="space-y-4">
                  {section.items.map((item, itemIdx) => (
                    <a
                      key={itemIdx}
                      href={item.href}
                      className="group flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="flex-shrink-0">{item.icon}</div>
                      <div className="flex-1 space-y-1">
                        <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                          {item.label}
                        </p>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <footer className="mt-16 pt-8 border-t border-gray-100">
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} OdiparPack. Todos los derechos reservados.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
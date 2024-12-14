"use client"

import { Building, Car, CarFront, AlertTriangle, Truck, Warehouse, ChevronDown, Spline, Route } from "lucide-react";
import { useState } from "react";

const IconoEstado = ({ Icono, containerClass, iconClass }) => (
  <div className={`flex items-center justify-center rounded-full ${containerClass}`}>
    <Icono className={iconClass} />
  </div>
);

const LegendSection = ({ title, items }) => (
  <div className="space-y-2">
    <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-3 text-gray-600 hover:text-gray-900 transition-colors">
          {item.icon ? (
            <IconoEstado
              Icono={item.icon}
              containerClass={item.containerClass}
              iconClass={"w-4 h-4 " + (item.iconClass?item.iconClass:"text-white")}
            />
          ) : (
            <div className={`w-4 h-4 rounded ${item.colorClass}`} />
          )}
          <span className="text-sm">{item.label}</span>
        </div>
      ))}
    </div>
  </div>
);

export default function MapLegend({ cornerPosition = "right-6" }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const legendSections = [
    {
      title: "Estados de Vehículos - Operación",
      items: [
        {
          icon: Car,
          containerClass: "bg-[#A8D5BA] w-8 h-8",
          label: "En operación normal"
        },
        {
          icon: Car,
          containerClass: "bg-[#00BFFF] w-8 h-8 border-2 border-black",
          label: "En reemplazo"
        },
        {
          icon: Car,
          containerClass: "bg-[#0000FF] w-8 h-8 border-2 border-black",
          label: "Retornando a almacén"
        }
      ]
    },
    {
      title: "Estados de Vehículos - Averías",
      items: [
        {
          icon: AlertTriangle,
          containerClass: "bg-white w-8 h-8 border-2 border-black",
          label: "Avería leve"
        },
        {
          icon: AlertTriangle,
          containerClass: "bg-[#808080] w-8 h-8 border-2 border-black",
          label: "Avería moderada"
        },
        {
          icon: AlertTriangle,
          containerClass: "bg-[#404040] w-8 h-8 border-2 border-black",
          label: "Avería grave"
        }
      ]
    },
    {
      title: "Capacidad de Vehículos y Oficinas",
      items: [
        {
          colorClass: "bg-[#A8D5BA]",
          label: "0-40%"
        },
        {
          colorClass: "bg-[#EAB308]",
          label: "41-80%"
        },
        {
          colorClass: "bg-[#F97316]",
          label: "81-100%"
        }
      ]
    },
    {
      title: "Ubicaciones",
      items: [
        {
          icon: Warehouse,
          containerClass: "bg-blue-500 w-8 h-8",
          label: "Almacén"
        },
        {
          icon: Building,
          containerClass: "bg-green-500 w-8 h-8",
          label: "Oficina"
        }
      ]
    },
    {
      title: "Tipos de Vehículos",
      items: [
        {
          icon: Truck,
          containerClass: "bg-[#A8D5BA] w-8 h-8 rounded-full border-2 border-white shadow-sm",
          label: "Vehículo Tipo A"
        },
        {
          icon: CarFront,
          containerClass: "bg-[#A8D5BA] w-8 h-8 rounded-full border-2 border-white shadow-sm",
          label: "Vehículo Tipo B"
        },
        {
          icon: Car,
          containerClass: "bg-[#A8D5BA] w-8 h-8 rounded-full border-2 border-white shadow-sm",
          label: "Vehículo Tipo C"
        }
      ]
    },
    {
      title: "Rutas",
      items: [
        {
          icon: Route,
          containerClass: "bg-white w-8 h-8",
          label: "Recorrido actual",
          iconClass: "text-[#0000FF]"
        },
        {
          icon: Route,
          containerClass: "bg-white w-8 h-8",
          label: "Ruta bloqueda",
          iconClass: "text-[#FF0000]"
        }
      ]
    }
  ];

  return (
    <div className={`fixed ${cornerPosition} bottom-6`}>
      <div className="w-[450px]"> {/* Aumentado el ancho para mejor distribución */}
        <div className={`
          bg-white rounded-xl shadow-lg
          transform transition-all duration-300 ease-in-out
          ${isExpanded ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-95'}
        `}>
          {/* Botón de toggle sin cambios */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between px-6 py-3 bg-white hover:bg-gray-50 transition-colors duration-200 rounded-xl shadow-sm"
          >
            <span className="text-sm font-medium text-gray-700">
              {isExpanded ? "Ocultar Leyenda" : "Mostrar Leyenda"}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-gray-600 transition-transform duration-300 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Contenido de la leyenda */}
          <div 
            className={`
              overflow-hidden transition-all duration-300 ease-in-out
              ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}
            `}
          >
            <div className="p-6 pt-1 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Leyenda</h2>
              
              {/* Primera fila - Estados de Vehículos */}
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-1">
                  <LegendSection
                    title={legendSections[0].title}
                    items={legendSections[0].items}
                  />
                </div>
                <div className="col-span-1">
                  <LegendSection
                    title={legendSections[1].title}
                    items={legendSections[1].items}
                  />
                </div>
              </div>

              {/* Segunda fila - Capacidad y Ubicaciones */}
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-1">
                  <LegendSection
                    title={legendSections[2].title}
                    items={legendSections[2].items}
                  />
                </div>
                <div className="col-span-1">
                  <LegendSection
                    title={legendSections[3].title}
                    items={legendSections[3].items}
                  />
                </div>
              </div>

              {/* Tercera fila - Tipos de Vehículos y Rutas */}
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-1">
                  <LegendSection
                    title={legendSections[4].title}
                    items={legendSections[4].items}
                  />
                </div>
                <div className="col-span-1">
                  <LegendSection
                    title={legendSections[5].title}
                    items={legendSections[5].items}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
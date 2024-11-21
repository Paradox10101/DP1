"use client"

import { Building, Car, CarFront, AlertTriangle, Truck, Warehouse, ChevronDown } from "lucide-react";
import { useState } from "react";

const IconoEstado = ({ Icono, containerClass, iconClass }) => (
  <div className={`flex items-center justify-center rounded-full ${containerClass}`}>
    <Icono className={iconClass} />
  </div>
);

const LegendSection = ({ title, items }) => (
  <div className="space-y-3">
    <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-3 text-gray-600 hover:text-gray-900 transition-colors">
          {item.icon ? (
            <IconoEstado
              Icono={item.icon}
              containerClass={item.containerClass}
              iconClass="w-4 h-4 text-white"
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
      title: "Ubicaciones",
      items: [
        {
          icon: Warehouse,
          containerClass: "bg-black w-8 h-8",
          label: "Almacén"
        },
        {
          icon: Building,
          containerClass: "bg-blue-500 w-8 h-8",
          label: "Oficina"
        }
      ]
    },
    {
      title: "Vehículos",
      items: [
        {
          icon: Truck,
          containerClass: "bg-blue-500 w-8 h-8",
          label: "Vehículo Tipo A"
        },
        {
          icon: CarFront,
          containerClass: "bg-blue-500 w-8 h-8",
          label: "Vehículo Tipo B"
        },
        {
          icon: Car,
          containerClass: "bg-blue-500 w-8 h-8",
          label: "Vehículo Tipo C"
        },
        {
          icon: AlertTriangle,
          containerClass: "bg-yellow-500 w-8 h-8",
          label: "Vehículo averiado"
        }
      ]
    },
    {
      title: "Capacidad de Vehículos",
      items: [
        {
          colorClass: "bg-green-400",
          label: "0-40%"
        },
        {
          colorClass: "bg-yellow-400",
          label: "41-80%"
        },
        {
          colorClass: "bg-red-400",
          label: "81-100%"
        }
      ]
    }
  ];

  return (
    <div className={`fixed ${cornerPosition} bottom-6`}>
      <div className="w-72"> {/* Contenedor con ancho fijo */}
        <div className={`
          bg-white rounded-xl shadow-lg
          transform transition-all duration-300 ease-in-out
          ${isExpanded ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-95'}
        `}>
          {/* Botón de toggle - Ahora está arriba */}
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
            <div className="p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Leyenda</h2>
              <div className="space-y-6">
                {legendSections.map((section, index) => (
                  <LegendSection
                    key={index}
                    title={section.title}
                    items={section.items}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { AlertTriangle } from "lucide-react";
const AlmacenPopUp = ({ title, ubigeo, iconoHtmlString }) => {
  return (
      <div className="bg-white rounded p-4 w-80 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div dangerouslySetInnerHTML={{ __html: iconoHtmlString }} className="mr-3" />
          <h3 className="font-semibold text-base text-gray-800">{title}</h3>
          <span className="bg-[#284BCC] text-[#BECCFF] py-1 px-2 rounded-xl text-xs inline-block w-[100px] text-center">Almacén</span>
        </div>
        <div className="text-gray-700 mb-2">
          <span className="font-medium mr-1">Ubigeo:</span> {ubigeo}
        </div>
        <button className="bg-principal text-blanco py-1 px-3 rounded mt-2 self-end transition duration-300 hover:bg-principal/90">
          Ver Detalle
        </button>
      </div>
    );
};

const OficinaPopUp = ({ title, ubigeo, capacidadMaxima, capacidadUtilizada, iconoHtmlString, tipo = "Oficina" }) => {
  return (
    <div className="bg-white rounded p-4 w-80 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div dangerouslySetInnerHTML={{ __html: iconoHtmlString }} className="mr-3" />
          <h3 className="font-semibold text-base text-gray-800">{title}</h3>
        </div>
        <span className="bg-[#03AF00] text-[#BAFFB9] py-1 px-2 rounded-xl text-xs inline-block w-[100px] text-center">{tipo}</span>
      </div>
      <div className="text-gray-700 mb-2">
        <span className="font-medium mr-1">Ubigeo:</span> {ubigeo}
      </div>
      <div className="text-gray-700 mb-2">
        <span className="font-medium mr-1">Capacidad:</span> {capacidadUtilizada}/{capacidadMaxima} paquetes
      </div>
      <button className="bg-principal text-blanco py-1 px-3 rounded mt-2 self-end transition duration-300 hover:bg-principal/90">
        Ver Detalle
      </button>
    </div>
  );
};

const renderStatus = (status) => {
    switch (status) {
        case "EN_ALMACEN":
            return (
                <div className="pequenno border rounded-xl w-[140px] text-center bg-[#DEA71A] text-[#F9DF9B]">
                    En Almacén
                </div>
            );
        case "AVERIADO":
            return (
                <div className="pequenno border rounded-xl w-[140px] text-center bg-[#BE0627] text-[#FFB9C1]">
                    Averiado
                </div>
            );
        case "EN_MANTENIMIENTO":
            return (
                <div className="pequenno border rounded-xl w-[140px] text-center bg-[#7B15FA] text-[#D0B0F8]">
                    En Mantenimiento
                </div>
            );
        default:
            return (
                <div className="pequenno border rounded-xl w-[140px] text-center bg-[#284BCC] text-[#BECCFF]">
                    En Tránsito
                </div>
            );
    }
};

const VehiculoPopUp = ({ title, capacidadMaxima, capacidadUtilizada, iconoHtmlString, estado}) => {
  // Mover la generación de alertaIconHtmlString fuera del render para evitar problemas de renderización
  const alertaIconHtmlString = `<div class='text-white w-[20px] h-[20px] flex items-center justify-center'><svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' class='w-[16px] h-[16px]'><polygon points='12 2 22 20 2 20'></polygon><line x1='12' y1='8' x2='12' y2='12'></line><line x1='12' y1='16' x2='12' y2='16'></line></svg></div>`;
  
  return (
    <div className="bg-white rounded p-4 w-80 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div dangerouslySetInnerHTML={{ __html: iconoHtmlString }} className="mr-3" />
          <h3 className="font-semibold text-base text-gray-800">Vehículo: {title}</h3>
        </div>
        <span className={"pequenno border " +
          (
            estado === "En Tránsito" ? "bg-[#284BCC] text-[#BECCFF] rounded-xl w-[100px] text-center" :
            estado === "En Almacén" ? "bg-[#DEA71A] text-[#F9DF9B] rounded-xl w-[100px] text-center" :
            estado === "Averiado" ? "bg-[#BE0627] text-[#FFB9C1] rounded-xl w-[100px] text-center" :
            estado === "En Mantenimiento" ? "bg-[#7B15FA] text-[#D0B0F8] rounded-xl w-[100px] text-center" :
            ""
          )
        }>
          {estado}
        </span>
      </div>
      <div className="text-gray-700 mb-2">
        <span className="font-medium mr-1">Capacidad:</span> {capacidadUtilizada}/{capacidadMaxima} paquetes
      </div>
      <div className="flex justify-between items-center mt-2">
        <button className="bg-red-500 text-white py-1 px-3 rounded flex items-center transition duration-300 hover:bg-red-700">
          <div dangerouslySetInnerHTML={{ __html: alertaIconHtmlString }} className="mr-2" />
          Reportar Avería
        </button>
        <button className="bg-principal text-blanco py-1 px-3 rounded transition duration-300 hover:bg-principal/90">
          Ver Detalle
        </button>
      </div>
    </div>
  );
};

export { AlmacenPopUp, OficinaPopUp, VehiculoPopUp };

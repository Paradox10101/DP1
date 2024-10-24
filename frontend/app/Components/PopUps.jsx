import React from 'react';

const AlmacenPopUp = ({ title, ubigeo }) => {
  return (
    <div className="bg-gray-50 rounded-lg shadow-lg p-5 mb-4">
      <div className="flex items-center mb-3">
        <span className="text-principal mr-3">
          <i className="fas fa-warehouse text-2xl"></i>
        </span>
        <h3 className="font-semibold text-xl text-gray-800">{title}</h3>
      </div>
      <div className="text-gray-700 mb-3">
        <span className="font-medium mr-1">Ubigeo:</span> {ubigeo}
      </div>
      <button className="bg-principal text-blanco py-2 px-4 rounded-lg mt-3 transition duration-300 hover:bg-principal/90">
        Ver Detalle
      </button>
    </div>
  );
};

const OficinaPopUp = ({ title, ubigeo, capacidadMaxima, capacidadUtilizada }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-5 mb-4">
      <div className="flex items-center mb-3">
        <span className="text-principal mr-3">
          <i className="fas fa-building text-2xl"></i>
        </span>
        <h3 className="font-semibold text-xl text-gray-800">{title}</h3>
      </div>
      <div className="text-gray-700 mb-2">
        <span className="font-medium mr-1">Ubigeo:</span> {ubigeo}
      </div>
      <div className="text-gray-700 mb-3">
        <span className="font-medium mr-1">Capacidad:</span> {capacidadUtilizada}/{capacidadMaxima} paquetes
      </div>
      <button className="bg-principal text-blanco py-2 px-4 rounded-lg mt-3 transition duration-300 hover:bg-principal/90">
        Ver Detalle
      </button>
    </div>
  );
};

const VehiculoPopUp = ({ title, capacidadMaxima, capacidadUtilizada }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-5 mb-4">
      <div className="flex items-center mb-3">
        <span className="text-principal mr-3">
          <i className="fas fa-truck text-2xl"></i>
        </span>
        <h3 className="font-semibold text-xl text-gray-800">{title}</h3>
      </div>
      <div className="text-gray-700 mb-2">
        <span className="font-medium mr-1">Capacidad:</span> {capacidadUtilizada}/{capacidadMaxima} paquetes
      </div>
      <div className="flex space-x-2 mt-3">
        <button className="bg-capacidadLlena text-blanco py-2 px-4 rounded-lg transition duration-300 hover:bg-capacidadLlena/90">
          Reportar Avería
        </button>
        <button className="bg-principal text-blanco py-2 px-4 rounded-lg transition duration-300 hover:bg-principal/90">
          Ver Detalle
        </button>
      </div>
    </div>
  );
};

export { AlmacenPopUp, OficinaPopUp, VehiculoPopUp };

import React from 'react';

const InputField = ({
  label,
  icon: Icon,
  type = "text",
  placeholder,
  required = false,
  name,
  value,
  onChange,
  error,
  onBlur
}) => (
  <div className="flex flex-col">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}{required && '*'}
    </label>
    <div className="relative flex-grow">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className="h-5 w-5 text-gray-400" aria-hidden="true" />
      </div>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className={`
          pl-10 
          block 
          w-full 
          rounded-md 
          border 
          shadow-sm 
          py-2 
          bg-gray-50 
          text-gray-900
          focus:ring-2 
          focus:ring-blue-500 
          focus:border-blue-500
          ${error ? 'border-red-500' : 'border-gray-300'}
        `}
      />
      {error && (
        <div className="absolute mt-1 text-sm text-red-600">{error}</div>
      )}
    </div>
    {/* Espacio reservado para el mensaje de error */}
    {error && <div className="h-6" />}
  </div>
);

export default InputField;
import React from 'react';
import { Card, Button } from '@nextui-org/react';
import { Upload, AlertCircle, Eye } from 'lucide-react';

export const FileUploadSection = ({
  onFileSelect,
  onPreview,
  selectedFile,
  isUploading,
  validationErrors,
  disabled
}) => {
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Cargar archivo
        </h2>

        {/* Zona de arrastrar y soltar */}
        <div
          className={`
            border-2 border-dashed rounded-lg p-8
            ${disabled ? 'bg-gray-50 border-gray-200' : 'border-blue-200 hover:border-blue-300'}
            transition-colors duration-200
            flex flex-col items-center justify-center
            cursor-pointer
          `}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload').click()}
        >
          <Upload className="h-12 w-12 text-blue-500 mb-4" />
          <p className="text-sm text-gray-600 text-center">
            Arrastra tu archivo aquí o
            <span className="text-blue-500 font-medium mx-1">
              haz clic para seleccionar
            </span>
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Formatos permitidos: .csv, .txt
          </p>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept=".csv,.txt"
            onChange={(e) => onFileSelect(e.target.files[0])}
            disabled={disabled}
          />
        </div>

        {/* Información del archivo seleccionado */}
        {selectedFile && (
          <Card className="bg-default-50">
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <Upload className="h-5 w-5 text-gray-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Errores de validación */}
        {validationErrors && validationErrors.length > 0 && (
          <Card className="bg-danger-50 border-danger-200">
            <div className="p-3">
              <div className="flex items-center gap-2 text-danger">
                <AlertCircle className="h-4 w-4" />
                <ul className="list-disc pl-4 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-sm">
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        )}

        {/* Botón de previsualización */}
        <Button
          color="primary"
          className="w-full"
          onPress={onPreview}
          isDisabled={!selectedFile || disabled}
          isLoading={isUploading}
          startContent={<Eye size={20} />}
        >
          {isUploading ? 'Procesando...' : 'Previsualizar datos'}
        </Button>
      </div>
    </Card>
  );
};
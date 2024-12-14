import { useState } from 'react';
import { Card, Button, Progress } from "@nextui-org/react";
import { FileUp, CheckCircle, AlertCircle } from 'lucide-react';

export const FileUpload = ({ 
  title, 
  description, 
  acceptedFormats, 
  placeholder,
  uploadType 
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationErrors, setValidationErrors] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const validateFile = (file) => {
    const errors = [];
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    
    if (!acceptedFormats.includes(extension)) {
      errors.push(`El archivo debe tener extensión ${acceptedFormats}`);
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      errors.push('El archivo excede el tamaño máximo permitido (10MB)');
    }

    return errors;
  };

  const parseFileContent = async (file, type) => {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    // Validaciones específicas según el tipo
    const validators = {
      vehiculos: (line) => /^\d{2}\s+[A-Z0-9]+,\s*\d+,\s*[A-Z0-9]+$/.test(line),
      ubicaciones: (line) => /^\d{6},\s*[^,]+,\s*-?\d+\.\d+,\s*-?\d+\.\d+,\s*[A-Z0-9]+$/.test(line),
      tramos: (line) => /^\d{6}\s*=>\s*\d{6},\s*\d+,\s*\d+$/.test(line),
      mantenimientos: (line) => /^[A-Z0-9]+,\s*\d{2}:\d{2},\s*\d+$/.test(line),
      bloqueos: (line) => /^\d{6}\s*=>\s*\d{6},\s*\d{2}:\d{2},\s*\d+$/.test(line),
      ordenes: (line) => /^\d{2}\s+\d{2}:\d{2},\s*\*{6}\s*=>\s*\d{6},\s*\d+$/.test(line)
    };

    return lines.map((line, index) => {
      const isValid = validators[type]?.(line.trim());
      return {
        id: index,
        content: line,
        isValid,
        error: isValid ? null : 'Formato inválido'
      };
    });
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const errors = validateFile(file);
    setValidationErrors(errors.length > 0 ? errors : null);
    setSelectedFile(file);
    setUploadStatus(null);
    setUploadProgress(0);

    if (errors.length === 0) {
      const parsed = await parseFileContent(file, uploadType);
      setPreviewData(parsed);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !previewData.length) return;

    try {
      setUploadProgress(0);
      const validRecords = previewData.filter(record => record.isValid);

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(95, prev + 5));
      }, 500);

      const response = await fetch(`/api/upload/${uploadType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: validRecords })
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error('Error en la carga');
      }

      setUploadProgress(100);
      setUploadStatus('success');
    } catch (error) {
      setUploadStatus('error');
      setValidationErrors([error.message]);
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          {description}
        </div>

        <div className="border-2 border-dashed rounded-lg p-4 text-center">
          <input
            type="file"
            onChange={handleFileSelect}
            accept={acceptedFormats}
            className="hidden"
            id="fileInput"
          />
          <label 
            htmlFor="fileInput" 
            className="cursor-pointer flex flex-col items-center"
          >
            <FileUp className="w-8 h-8 text-gray-400" />
            <span className="mt-2 text-sm text-gray-500">
              Selecciona o arrastra un archivo
            </span>
            <span className="mt-1 text-xs text-gray-400">
              Formato esperado: {placeholder}
            </span>
          </label>
        </div>

        {validationErrors && (
          <div className="text-red-500 text-sm">
            {validationErrors.map((error, index) => (
              <div key={index} className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            ))}
          </div>
        )}

        {previewData.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold">Vista Previa</h4>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {previewData.slice(0, 5).map((item) => (
                <div 
                  key={item.id}
                  className={`text-sm p-2 rounded ${
                    item.isValid ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  {item.content}
                </div>
              ))}
              {previewData.length > 5 && (
                <div className="text-sm text-gray-500 italic">
                  Y {previewData.length - 5} líneas más...
                </div>
              )}
            </div>
          </div>
        )}

        {uploadStatus && (
          <div className={`flex items-center gap-2 ${
            uploadStatus === 'success' ? 'text-green-500' : 'text-red-500'
          }`}>
            {uploadStatus === 'success' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {uploadStatus === 'success' 
              ? 'Archivo cargado exitosamente' 
              : 'Error en la carga del archivo'
            }
          </div>
        )}

        {uploadProgress > 0 && (
          <Progress 
            value={uploadProgress} 
            color="primary"
            className="w-full"
          />
        )}

        <Button
          color="primary"
          isDisabled={!selectedFile || validationErrors || uploadStatus === 'success'}
          onPress={handleUpload}
          className="w-full"
        >
          Cargar Archivo
        </Button>
      </div>
    </Card>
  );
};
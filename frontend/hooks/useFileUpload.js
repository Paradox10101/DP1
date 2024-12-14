import { useState } from 'react';

export const useFileUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationErrors, setValidationErrors] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewData, setPreviewData] = useState([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_API_BASE_URL_PROD
    : process.env.NEXT_PUBLIC_API_BASE_URL;

  const validateFile = (file) => {
    const errors = [];
    
    const validExtensions = ['.csv', '.txt'];
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (!validExtensions.includes(fileExtension)) {
      errors.push('El archivo debe tener extensión .csv o .txt');
    }

    const maxSize = 10 * 1024 * 1024; // 10MB en bytes
    if (file.size > maxSize) {
      errors.push('El archivo excede el tamaño máximo permitido (10MB)');
    }

    return errors;
  };

  const formatDateTime = (time) => {
    const today = new Date();
    const [hours, minutes] = time.split(':');
    
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
    
    return {
      dateFormatted: date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }),
      timeFormatted: date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      isoDate: date.toISOString()
    };
  };

  const parseFileContent = async (file) => {
    try {
      const text = await file.text();
      const lines = text.split('\n')
        .filter(line => line.trim())
        .filter(line => line.trim().startsWith('01'));
      
      return lines.map((line, index) => {
        try {
          // Nuevo regex que solo considera tiempo, ubigeo destino y cantidad
          const regex = /^(\d{2})\s+(\d{2}:\d{2}),\s*\*{6}\s*=>\s*(\d{6}),\s*(\d+)$/;
          const match = line.trim().match(regex);

          if (!match) {
            return {
              id: index,
              raw: line,
              hasError: true,
              errorMessage: 'Formato de línea inválido',
              date: '-',
              time: '-',
              destinationUbigeo: '-',
              quantity: '-',
              status: 'error'
            };
          }

          const [, , time, destinationUbigeo, quantity] = match;
          const { dateFormatted, timeFormatted, isoDate } = formatDateTime(time);

          const hasError = parseInt(quantity) <= 0;

          return {
            id: index,
            date: dateFormatted,
            time: timeFormatted,
            destinationUbigeo,
            quantity: parseInt(quantity),
            hasError,
            errorMessage: hasError ? 'Datos inválidos' : null,
            status: hasError ? 'error' : 'valid',
            rawTime: time,
            isoDate
          };
        } catch (error) {
          return {
            id: index,
            raw: line,
            hasError: true,
            errorMessage: 'Error al procesar la línea',
            date: '-',
            time: '-',
            destinationUbigeo: '-',
            quantity: '-',
            status: 'error'
          };
        }
      }).sort((a, b) => {
        if (a.rawTime && b.rawTime) {
          return a.rawTime.localeCompare(b.rawTime);
        }
        return 0;
      });
    } catch (error) {
      console.error('Error parsing file:', error);
      throw new Error('Error al leer el archivo. Asegúrate de que el archivo tenga el formato correcto.');
    }
  };

  const handleFileSelect = (file) => {
    const errors = validateFile(file);
    setValidationErrors(errors.length > 0 ? errors : null);
    setSelectedFile(file);
    setUploadStatus(null);
    setUploadProgress(0);
    setPreviewData([]);
    setIsPreviewMode(false);
  };

  const handlePreview = async () => {
    if (!selectedFile || validationErrors) return;

    try {
      const parsedData = await parseFileContent(selectedFile);
      if (parsedData.length === 0) {
        setValidationErrors(['No se encontraron registros para el día 01 en el archivo.']);
        return;
      }
      setPreviewData(parsedData);
      setIsPreviewMode(true);
    } catch (error) {
      setValidationErrors([error.message]);
    }
  };

  const closePreview = () => {
    setIsPreviewMode(false);
    setPreviewData([]);
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile || !previewData.length) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const validRecords = previewData.filter(record => !record.hasError).map(record => ({
        ...record,
        date: record.isoDate
      }));

      if (validRecords.length === 0) {
        throw new Error('No hay registros válidos para procesar');
      }

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) return 95;
          return prev + Math.random() * 10;
        });
      }, 500);

      try {
        const response = await fetch(`${API_BASE_URL}/orders/bulk-upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            validRecords: validRecords
          })
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al cargar el archivo');
        }

        const result = await response.json();
        setUploadProgress(100);

        if (result.failedRecords?.length > 0) {
          setUploadStatus(result.successfulRecords?.length > 0 ? 'partial' : 'error');
        } else {
          setUploadStatus('success');
        }

        setIsPreviewMode(false);
        return result;
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }

    } catch (error) {
      console.error('Error en la carga:', error);
      setUploadStatus('error');
      setValidationErrors([error.message]);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setValidationErrors(null);
    setUploadStatus(null);
    setUploadProgress(0);
    setPreviewData([]);
    setIsPreviewMode(false);
  };

  return {
    handleFileSelect,
    handleFileUpload: handlePreview,
    handlePreview,
    handleConfirmUpload,
    uploadStatus,
    selectedFile,
    validationErrors,
    isUploading,
    uploadProgress,
    resetUpload,
    previewData,
    isPreviewMode,
    closePreview
  };
};
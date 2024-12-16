// useShipmentUpload.js
import { useState } from 'react';

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? process.env.NEXT_PUBLIC_API_BASE_URL_PROD
  : process.env.NEXT_PUBLIC_API_BASE_URL;

export const useShipmentUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationErrors, setValidationErrors] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewData, setPreviewData] = useState([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [fileYearMonth, setFileYearMonth] = useState(null);

  // Función para extraer año y mes del nombre del archivo
  const extractYearMonthFromFilename = (filename) => {
    const match = filename.match(/ventas(\d{4})(\d{2})\.txt$/i);
    if (match) {
      const [, year, month] = match;
      return { year: parseInt(year), month: parseInt(month) };
    }
    return null;
  };

  const validateFile = (file) => {
    const errors = [];
    
    if (!file.name.endsWith('.txt')) {
      errors.push('El archivo debe tener extensión .txt');
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push('El archivo excede el tamaño máximo permitido (10MB)');
    }

    return errors;
  };

  const validateShipmentLine = (line) => {
    const regex = /^(\d{2})\s+(\d{2}):(\d{2}),\s*\*{6}\s*=>\s*(\d{6}),\s*(\d+)$/;
    const match = line.trim().match(regex);
    
    if (!match) return false;
    
    const [, day, hour, minute, destinationUbigeo, quantity] = match;
    
    const dayNum = parseInt(day);
    if (dayNum < 1 || dayNum > 31) return false;
    
    const hourNum = parseInt(hour);
    if (hourNum < 0 || hourNum > 23) return false;
    
    const minuteNum = parseInt(minute);
    if (minuteNum < 0 || minuteNum > 59) return false;
    
    if (!/^\d{6}$/.test(destinationUbigeo)) return false;
    
    const quantityNum = parseInt(quantity);
    if (quantityNum <= 0) return false;
    
    return true;
  };

  const parseFileContent = async (file) => {
    try {
      const text = await file.text();
      const lines = text.split('\n')
        .filter(line => line.trim());
      
      return lines.map((line, index) => {
        const isValid = validateShipmentLine(line.trim());
        
        return {
          id: index,
          content: line.trim(),
          hasError: !isValid,
          errorMessage: isValid ? null : 'Formato de línea inválido',
          type: 'shipment'
        };
      });
    } catch (error) {
      console.error('Error parsing file:', error);
      throw new Error('Error al leer el archivo. Asegúrate de que el archivo tenga el formato correcto.');
    }
  };

  const handleFileSelect = (file) => {
    const errors = validateFile(file);
    
    // Intentar extraer año y mes del nombre del archivo
    const yearMonth = extractYearMonthFromFilename(file.name);
    setFileYearMonth(yearMonth);
    
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
        setValidationErrors(['No se encontraron registros válidos en el archivo.']);
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

  // Función auxiliar para convertir el formato de línea a formato del backend
  const convertToBackendFormat = (line) => {
    const match = line.match(/^(\d{2})\s+(\d{2}):(\d{2}),\s*\*{6}\s*=>\s*(\d{6}),\s*(\d+)$/);
    if (!match) return null;

    const [, day, hour, minute, destinationUbigeo, quantity] = match;
    
    let year, month;

    // Si tenemos año y mes del nombre del archivo, usarlos
    if (fileYearMonth) {
      year = fileYearMonth.year;
      month = fileYearMonth.month;
    } else {
      // Si no, usar fecha actual
      const now = new Date();
      year = now.getFullYear();
      month = now.getMonth() + 1;
    }
    
    const localDate = new Date(
      year,
      month - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute)
    );
    
    // Construir manualmente el string ISO manteniendo la hora local
    const isoDate = localDate.getFullYear() + '-' +
      String(localDate.getMonth() + 1).padStart(2, '0') + '-' +
      String(localDate.getDate()).padStart(2, '0') + 'T' +
      String(localDate.getHours()).padStart(2, '0') + ':' +
      String(localDate.getMinutes()).padStart(2, '0') + ':00.000-05:00';

    return {
      isoDate,
      destinationUbigeo,
      quantity: parseInt(quantity)
    };
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile || !previewData.length) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const validRecords = previewData
        .filter(record => !record.hasError)
        .map(record => convertToBackendFormat(record.content))
        .filter(record => record !== null);

      if (validRecords.length === 0) {
        throw new Error('No hay registros válidos para procesar');
      }

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) return 95;
          return prev + Math.random() * 10;
        });
      }, 500);  
      
      // Log de datos antes del envío
      console.log('Datos a enviar al backend:', {
        validRecords,
        uploadType: fileYearMonth ? 'historical' : 'current',
        yearMonth: fileYearMonth ? 
          `${fileYearMonth.year}-${String(fileYearMonth.month).padStart(2, '0')}` : 
          null
      });

      try {
        const response = await fetch(`${API_BASE_URL}/orders/bulk-upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            validRecords,
            uploadType: fileYearMonth ? 'historical' : 'current',
            yearMonth: fileYearMonth ? 
              `${fileYearMonth.year}-${String(fileYearMonth.month).padStart(2, '0')}` : 
              null
          })
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al cargar el archivo');
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Error en el procesamiento del archivo');
        }

        setUploadProgress(100);
        setUploadStatus(result.failedRecords?.length > 0 ? 'partial' : 'success');
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
    setFileYearMonth(null);
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
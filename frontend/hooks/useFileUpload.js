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
    const regex = /^(?:(\d{2}|\bdd\b)\s+(?:(\d{2}:\d{2})|(?:\bhh:mm\b))),\s*\*{6}\s*=>\s*(\d{6}),\s*(\d+)(?:\s+\d+)?$/;
    const match = line.trim().match(regex);
    
    if (!match) return false;
    
    const [, day, timeStr, destinationUbigeo, quantity] = match;
    
    // Si no es "dd", validar el día
    if (day !== 'dd') {
      const dayNum = parseInt(day);
      if (dayNum < 1 || dayNum > 31) return false;
    }
    
    // Si no es "hh:mm", validar la hora
    if (timeStr && timeStr !== 'hh:mm') {
      const [hour, minute] = timeStr.split(':').map(Number);
      if (hour < 0 || hour > 23) return false;
      if (minute < 0 || minute > 59) return false;
    }
    
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
  const getCurrentTimeValues = () => {
    const now = new Date();
    return {
      day: String(now.getDate()).padStart(2, '0'),
      time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    };
  };
  
  const convertToBackendFormat = (line) => {
    // Log para debugging
    console.log('Procesando línea:', line);
  
    const regex = /^(?:(\d{2}|\bdd\b)\s+(?:(\d{2}:\d{2})|(?:\bhh:mm\b))),\s*\*{6}\s*=>\s*(\d{6}),\s*(\d+)(?:\s+\d+)?$/;
    const match = line.match(regex);
    
    if (!match) {
      console.log('No match encontrado para la línea');
      return null;
    }
    
    // Log del match para debugging
    console.log('Match encontrado:', match);
    
    const [fullMatch, day, timeStr, destinationUbigeo, quantity] = match;
    const currentTime = getCurrentTimeValues();
    
    console.log('Valores extraídos:', { day, timeStr, destinationUbigeo, quantity });
    
    // Determinar día y hora
    const finalDay = day === 'dd' ? currentTime.day : day;
    const finalTime = (timeStr === 'hh:mm' || !timeStr) ? currentTime.time : timeStr;
    
    let year, month;
    if (fileYearMonth) {
      year = fileYearMonth.year;
      month = fileYearMonth.month;
    } else {
      const now = new Date();
      year = now.getFullYear();
      month = now.getMonth() + 1;
    }
  
    // Extraer hora y minuto del tiempo final
    let hours = 0, minutes = 0;
    if (finalTime && finalTime.includes(':')) {
      [hours, minutes] = finalTime.split(':').map(Number);
    } else {
      // Si no hay tiempo válido, usar tiempo actual
      const now = new Date();
      hours = now.getHours();
      minutes = now.getMinutes();
    }
    
    // Log de los valores de tiempo
    console.log('Valores de tiempo:', { finalDay, hours, minutes });
  
    // Crear la fecha con timezone America/Lima (-05:00)
    const localDate = new Date(
      year,
      month - 1,
      parseInt(finalDay),
      hours,
      minutes
    );
  
    // Formatear la fecha ISO
    const isoDate = `${localDate.getFullYear()}-${
      String(localDate.getMonth() + 1).padStart(2, '0')}-${
      String(localDate.getDate()).padStart(2, '0')}T${
      String(localDate.getHours()).padStart(2, '0')}:${
      String(localDate.getMinutes()).padStart(2, '0')}:00.000-05:00`;
  
    const result = {
      isoDate,
      destinationUbigeo: destinationUbigeo.trim(),
      quantity: parseInt(quantity)
    };
  
    // Log del resultado final
    console.log('Resultado convertido:', result);
  
    return result;
  };
  
  const handleConfirmUpload = async () => {
    if (!selectedFile || !previewData.length) return;
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const validRecords = previewData
        .filter(record => !record.hasError)
        .map(record => {
          const converted = convertToBackendFormat(record.content);
          console.log('Convirtiendo registro:', {
            original: record.content,
            convertido: converted
          });
          return converted;
        })
        .filter(record => record !== null);
      
      if (validRecords.length === 0) {
        throw new Error('No hay registros válidos para procesar');
      }
  
      // Log para debugging
      console.log('Payload a enviar:', JSON.stringify({
        validRecords,
        uploadType: fileYearMonth ? 'historical' : 'current',
        yearMonth: fileYearMonth ?
          `${fileYearMonth.year}-${String(fileYearMonth.month).padStart(2, '0')}` :
          null
      }, null, 2));
  
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
            validRecords,
            uploadType: fileYearMonth ? 'historical' : 'current',
            yearMonth: fileYearMonth ?
              `${fileYearMonth.year}-${String(fileYearMonth.month).padStart(2, '0')}` :
              null
          })
        });
  
        clearInterval(progressInterval);
        
        const responseData = await response.json();
        
        if (!response.ok) {
          console.error('Error en la respuesta:', responseData);
          throw new Error(responseData.error || 'Error al cargar el archivo');
        }
  
        if (!responseData.success) {
          console.error('Detalles del error:', responseData);
          throw new Error(responseData.error || 'Error en el procesamiento del archivo');
        }
  
        setUploadProgress(100);
        setUploadStatus(responseData.failedRecords?.length > 0 ? 'partial' : 'success');
        setIsPreviewMode(false);
        return responseData;
        
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
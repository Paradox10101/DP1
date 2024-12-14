import { useState } from 'react';

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? process.env.NEXT_PUBLIC_API_BASE_URL_PROD
  : process.env.NEXT_PUBLIC_API_BASE_URL;

export const useConfigUpload = (uploadType) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationErrors, setValidationErrors] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewData, setPreviewData] = useState([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const validateFile = (file) => {
    const errors = [];
    
    const validExtensions = ['.txt'];
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (!validExtensions.includes(fileExtension)) {
      errors.push('El archivo debe tener extensión .txt');
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      errors.push('El archivo excede el tamaño máximo permitido (10MB)');
    }

    return errors;
  };

  const validators = {
    vehiculos: (line) => {
      const regex = /^([A-C]\d{3}),([A-C]),(\d+),(\d{6})$/;
      const match = line.trim().match(regex);
      if (!match) return false;
      
      const [, codigo, tipo, capacidad] = match;
      // Validar que el código empiece con el tipo correcto
      if (codigo[0] !== tipo) return false;
      
      return true;
    },
    ubicaciones: (line) => {
      const regex = /^(\d{6}),([^,]+),([^,]+),([-]?\d+\.\d+),([-]?\d+\.\d+),(COSTA|SIERRA|SELVA),(\d+)$/;
      const match = line.trim().match(regex);
      if (!match) return false;
      
      const [, ubigeo, departamento, provincia, latitud, longitud, region, capacidad] = match;
      
      // Validaciones adicionales
      if (latitud < -20 || latitud > 0) return false; // Rango válido para Perú
      if (longitud < -85 || longitud > -65) return false; // Rango válido para Perú
      if (parseInt(capacidad) <= 0) return false; // Capacidad debe ser positiva
      
      return true;
    },
    tramos: (line) => {
      const regex = /^(\d{6})\s*=>\s*(\d{6})$/;
      const match = line.trim().match(regex);
      if (!match) return false;
      
      const [, origen, destino] = match;
      // Valida que origen y destino sean diferentes
      if (origen === destino) return false;
      
      return true;
    },
    mantenimientos: (line) => {
        // Formato esperado: AAAAMMDD:CODIGO
        const regex = /^(\d{4})(\d{2})(\d{2}):([A-C]\d{3})$/;
        const match = line.trim().match(regex);
        
        if (!match) return false;
        
        const [, year, month, day, vehicleCode] = match;
        
        // Validar fecha
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));;
        
        // 1. La fecha sea válida
        if (date.getFullYear() !== parseInt(year) ||
            (date.getMonth() + 1) !== parseInt(month) ||
            date.getDate() !== parseInt(day)) {
          return false;
        }
        
        // 3. El código del vehículo comience con la letra correcta (A, B o C)
        // y tenga 3 dígitos después
        const vehicleType = vehicleCode[0];
        const vehicleNumber = vehicleCode.substring(1);
        if (!['A', 'B', 'C'].includes(vehicleType) || !/^\d{3}$/.test(vehicleNumber)) {
          return false;
        }
        
        return true;
      },
      bloqueos: (line) => {
        // Formato esperado: XXXXXX => YYYYYY;MMDD,HH:MM==MMDD,HH:MM
        const regex = /^(\d{6})\s*=>\s*(\d{6});(\d{2})(\d{2}),(\d{2}):(\d{2})==(\d{2})(\d{2}),(\d{2}):(\d{2})$/;
        const match = line.trim().match(regex);
        
        if (!match) return false;
        
        const [
          ,
          ubiOrigen,
          ubiDestino,
          mesInicio,
          diaInicio,
          horaInicio,
          minutoInicio,
          mesFin,
          diaFin,
          horaFin,
          minutoFin
        ] = match;
        
        // Validar que los ubigeos sean diferentes
        if (ubiOrigen === ubiDestino) return false;
        
        // Función auxiliar para validar mes/día
        const isValidDate = (month, day) => {
          const year = new Date().getFullYear();
          const date = new Date(year, parseInt(month) - 1, parseInt(day));
          return date.getMonth() === parseInt(month) - 1 && 
                 date.getDate() === parseInt(day);
        };
        
        // Validar fechas
        if (!isValidDate(mesInicio, diaInicio) || !isValidDate(mesFin, diaFin)) {
          return false;
        }
        
        // Validar horas
        const horaInicioNum = parseInt(horaInicio);
        const minutoInicioNum = parseInt(minutoInicio);
        const horaFinNum = parseInt(horaFin);
        const minutoFinNum = parseInt(minutoFin);
        
        if (horaInicioNum < 0 || horaInicioNum > 23 ||
            horaFinNum < 0 || horaFinNum > 23 ||
            minutoInicioNum < 0 || minutoInicioNum > 59 ||
            minutoFinNum < 0 || minutoFinNum > 59) {
          return false;
        }
        
        // Crear objetos Date para comparar períodos
        const year = new Date().getFullYear();
        const fechaInicio = new Date(year, parseInt(mesInicio) - 1, parseInt(diaInicio), 
                                    horaInicioNum, minutoInicioNum);
        const fechaFin = new Date(year, parseInt(mesFin) - 1, parseInt(diaFin), 
                                 horaFinNum, minutoFinNum);
        
        // Validar que la fecha de fin sea posterior a la de inicio
        if (fechaFin <= fechaInicio) {
          return false;
        }
        
        return true;
      },
    ordenes: (line) => /^\d{2}\s+\d{2}:\d{2},\s*\*{6}\s*=>\s*\d{6},\s*\d+$/.test(line)
  };

  const parseFileContent = async (file) => {
    try {
      const text = await file.text();
      const lines = text.split('\n')
        .filter(line => line.trim());
      
      return lines.map((line, index) => {
        try {
          const isValid = validators[uploadType]?.(line.trim());
          
          return {
            id: index,
            content: line.trim(),
            hasError: !isValid,
            errorMessage: isValid ? null : 'Formato de línea inválido',
            status: isValid ? 'valid' : 'error'
          };
        } catch (error) {
          return {
            id: index,
            content: line,
            hasError: true,
            errorMessage: 'Error al procesar la línea',
            status: 'error'
          };
        }
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

  const handleConfirmUpload = async () => {
    if (!selectedFile || !previewData.length) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const validRecords = previewData.filter(record => !record.hasError);

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
        const response = await fetch(`${API_BASE_URL}/config/${uploadType}/upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            records: validRecords
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
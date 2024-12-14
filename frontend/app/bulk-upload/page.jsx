'use client'

import React from 'react';
import { Header } from '../Components/layout/Header';
import { Footer } from '../Components/layout/Footer';
import { BackButton } from '../Components/common/BackButton';
import { FileUploadSection } from '../Components/upload/FileUploadSection';
import { FileFormatGuide } from '../Components/upload/FileFormatGuide';
import { UploadStatus } from '../Components/upload/UploadStatus';
import { useShipmentUpload } from '../../hooks/useFileUpload';
import {DataPreview} from '../Components/upload/DataPreview';


const shipmentUploadConfig = {
  title: "Registro Masivo de Envíos",
  description: "Carga masiva de órdenes de envío",
  acceptedFormats: ".txt",
  placeholder: "01 00:01, ****** =>  190201, 2",
  structure: {
    format: "DD HH:MM, ****** => UBIGEO, CANTIDAD",
    fields: [
      { label: "DD", desc: "día del mes (01-31)" },
      { label: "HH:MM", desc: "hora y minuto del registro" },
      { label: "******", desc: "ubigeo origen (6 asteriscos)" },
      { label: "=>", desc: "separador de dirección" },
      { label: "UBIGEO", desc: "ubigeo destino (6 dígitos)" },
      { label: "CANTIDAD", desc: "cantidad de paquetes (número positivo)" }
    ]
  },
  examples: [
    "01 00:01, ****** =>  190201, 2",
    "01 00:09, ****** =>  120301, 10",
    "01 00:13, ****** =>  061301, 6"
  ],
  validations: [
    "El archivo debe tener el formato: c.1inf54.ventasYYYYMM.txt",
    "El día debe estar entre 01 y 31",
    "La hora debe estar en formato 24 horas (00:00 - 23:59)",
    "El ubigeo destino debe tener 6 dígitos",
    "La cantidad debe ser un número entero positivo",
    "La línea debe seguir exactamente el formato especificado"
  ]
};

export default function BulkShipmentUpload() {
  const {
    handleFileSelect,
    handleFileUpload,
    uploadStatus,
    selectedFile,
    validationErrors,
    isUploading,
    uploadProgress,
    resetUpload,
    previewData,
    isPreviewMode,
    handlePreview,
    handleConfirmUpload,
    closePreview
  } = useShipmentUpload();

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gray-50">
      <Header />
      <main className="max-w-6xl mx-auto pt-8 pb-16 px-4">
        <div className="mb-8">
          <BackButton onBack={isPreviewMode ? closePreview : undefined} />
        </div>
        <h1 className="text-3xl font-semibold text-gray-900 text-center mb-8">
          {shipmentUploadConfig.title}
        </h1>

        {isPreviewMode ? (
          <DataPreview
            data={previewData}
            onConfirm={handleConfirmUpload}
            onCancel={closePreview}
            isLoading={isUploading}
            type="shipment"
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <FileFormatGuide 
              type='shipment'
            />
            <div className="space-y-6">
              <FileUploadSection
                onFileSelect={handleFileSelect}
                onPreview={handlePreview}
                selectedFile={selectedFile}
                isUploading={isUploading}
                validationErrors={validationErrors}
                disabled={isUploading}
                acceptedFormats={shipmentUploadConfig.acceptedFormats}
                description={shipmentUploadConfig.description}
                placeholder={shipmentUploadConfig.placeholder}
              />
              {(isUploading || uploadStatus) && (
                <UploadStatus
                  status={uploadStatus}
                  progress={uploadProgress}
                  isUploading={isUploading}
                  onReset={resetUpload}
                />
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
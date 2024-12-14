'use client'
import React from 'react';
import { Header } from '../Components/layout/Header';
import { Footer } from '../Components/layout/Footer';
import { BackButton } from '../Components/common/BackButton';
import { Tabs, Tab } from "@nextui-org/react";
import { useConfigUpload } from '../../hooks/useConfigUpload';
import { DataPreview } from '../Components/upload/DataPreview';
import { FileUploadSection } from '../Components/upload/FileUploadSection';
import { FileFormatGuide } from '../Components/upload/FileFormatGuide';
import { UploadStatus } from '../Components/upload/UploadStatus';
import { Truck, BanIcon, RouteIcon, MapPinIcon, PenTool } from 'lucide-react';

const uploadConfigs = {
    vehiculos: {
      title: "Carga de Vehículos",
      description: "Cargar flota de vehículos disponibles",
      acceptedFormats: ".txt",
      icon: <Truck className="w-5 h-5"/>,
      placeholder: "A001,A,90,150101"
    },
    ubicaciones: {
      title: "Carga de Ubicaciones",
      description: "Cargar ubicaciones y oficinas provinciales",
      acceptedFormats: ".txt",
      icon: <MapPinIcon className="w-5 h-5"/>,
      placeholder: "030101,APURIMAC,ABANCAY,-13.6373465,-72.87887764,SIERRA,103"
    },
    tramos: {
      title: "Carga de Tramos",
      description: "Cargar conexiones entre provincias",
      acceptedFormats: ".txt",
      icon: <RouteIcon className="w-5 h-5"/>,
      placeholder: "010201 => 010301"
    },
    mantenimientos: {
      title: "Programación de Mantenimientos",
      description: "Cargar horarios de mantenimiento",
      acceptedFormats: ".txt",
      icon: <PenTool className="w-5 h-5"/>,
      placeholder: "ABC123, 08:00, 4"
    },
    bloqueos: {
      title: "Registro de Bloqueos",
      description: "Cargar bloqueos de rutas",
      acceptedFormats: ".txt",
      icon: <BanIcon className="w-5 h-5"/>,
      placeholder: "010101 => 010102, 14:30, 2"
    }
};

export default function ConfigPage() {
    const [selected, setSelected] = React.useState("vehiculos");
    
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
    } = useConfigUpload(selected);
  
    return (
      <div className="min-h-screen w-full overflow-x-hidden bg-gray-50">
        <Header />
        <main className="max-w-6xl mx-auto pt-8 pb-16 px-4">
          <div className="mb-8">
            <BackButton onBack={isPreviewMode ? closePreview : undefined} />
          </div>
          <h1 className="text-3xl font-semibold text-gray-900 text-center mb-8">
            Configuración del Sistema
          </h1>
  
          {isPreviewMode ? (
            <DataPreview
              data={previewData}
              onConfirm={handleConfirmUpload}
              onCancel={closePreview}
              isLoading={isUploading}
              type={selected}
            />
          ) : (
            <div className="space-y-8">
              <div className="w-full">
                <Tabs 
                  selectedKey={selected}
                  onSelectionChange={(key) => setSelected(key.toString())}
                  color="primary"
                  variant="solid"
                  classNames={{
                    base: "w-full",
                    tabList: "gap-4 relative rounded-xl p-2 border border-gray-200 bg-white",
                    tab: "px-4 py-2 rounded-lg data-[selected=true]:bg-blue-500 data-[selected=true]:text-white",
                    tabContent: "text-sm",
                    cursor: "bg-blue-500"
                  }}
                >
                  {Object.entries(uploadConfigs).map(([key, config]) => (
                    <Tab
                      key={key}
                      title={
                        <div className="flex items-center gap-2">
                          {config.icon}
                          <span>{config.title}</span>
                        </div>
                      }
                    />
                  ))}
                </Tabs>
              </div>
  
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <FileFormatGuide type={selected} />
                <div className="space-y-6">
                  <FileUploadSection
                    onFileSelect={handleFileSelect}
                    onPreview={handlePreview}
                    selectedFile={selectedFile}
                    isUploading={isUploading}
                    validationErrors={validationErrors}
                    disabled={isUploading}
                    acceptedFormats={uploadConfigs[selected].acceptedFormats}
                    description={uploadConfigs[selected].description}
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
            </div>
          )}
        </main>
        <Footer />
      </div>
    );
  }
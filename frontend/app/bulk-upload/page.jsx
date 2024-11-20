'use client'

import React from 'react';
import { Header } from '../Components/layout/Header';
import { Footer } from '../Components/layout/Footer';
import { BackButton } from '../Components/common/BackButton';
import { FileUploadSection } from '../Components/upload/FileUploadSection';
import { FileFormatGuide } from '../Components/upload/FileFormatGuide';
import { UploadStatus } from '../Components/upload/UploadStatus';
import { useFileUpload } from '../../hooks/useFileUpload';
import {DataPreview} from '../Components/upload/DataPreview';

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
    } = useFileUpload();
  
    return (
      <div className="min-h-screen w-screen overflow-x-hidden bg-gray-50">
        <Header />
        <main className="max-w-6xl mx-auto pt-8 pb-16 px-4">
          <div className="mb-8">
            <BackButton onBack={isPreviewMode ? closePreview : undefined} />
          </div>
          
          <h1 className="text-3xl font-semibold text-gray-900 text-center mb-8">
            Registro Masivo de Envíos
          </h1>
  
          {isPreviewMode ? (
            <DataPreview
              data={previewData}
              onConfirm={handleConfirmUpload}
              onCancel={closePreview}
              isLoading={isUploading}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <FileFormatGuide />
              <div className="space-y-6">
                <FileUploadSection
                  onFileSelect={handleFileSelect}
                  onPreview={handlePreview}
                  selectedFile={selectedFile}
                  isUploading={isUploading}
                  validationErrors={validationErrors}
                  disabled={isUploading}
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
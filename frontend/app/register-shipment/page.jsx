'use client'

import React, { useState } from 'react';
import { Header } from '../Components/layout/Header';
import { Footer } from '../Components/layout/Footer';
import { BackButton } from '../Components/common/BackButton';
import { ProgressSteps } from '../Components/shipping/ProgressSteps';
import { PackageDetailsForm } from '../Components/shipping/PackageDetailsForm';
import { ConfirmationStep } from '../Components/shipping/ConfirmationStep';
import { ActionButtons } from '../Components/common/ActionButtons';
import SuccessOrderModal from '../Components/SuccessOrderModal';
import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RegisterShipment() {
  const router = useRouter();
  const TOTAL_STEPS = 2;
  const [currentStep, setCurrentStep] = useState(1);
  const [formState, setFormState] = useState({
    packageDetails: null,
    confirmation: null
  });
  const [currentStepValid, setCurrentStepValid] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderData, setOrderData] = useState({ orderCode: '' });

  const handleDataChange = (step, { data, isValid }) => {
    setCurrentStepValid(isValid);
    setFormState(prev => ({
      ...prev,
      [step]: data
    }));
  };

  const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_API_BASE_URL_PROD
    : process.env.NEXT_PUBLIC_API_BASE_URL;

  const submitOrder = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destinationUbigeo: formState.packageDetails.destinationCity,
          quantity: parseInt(formState.packageDetails.quantity),
          orderDateTime: new Intl.DateTimeFormat('sv-SE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          }).format(new Date()).replace(' ', 'T') + '.000Z'
        })
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar el envío');
      }
  
      if (data.success && data.successfulRecords?.length > 0) {
        setOrderData({
          orderCode: data.successfulRecords[0]
        });
        setShowSuccessModal(true);
        return true;
      } else {
        throw new Error(data.failedRecords?.[0] || 'Error desconocido al procesar el envío');
      }
  
    } catch (error) {
      console.error('Error submitting order:', error);
      setSubmitError(error.message);
      return false;
    }
  };
  
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.push('/');
  };

  const handleNext = async () => {
    if (!currentStepValid) {
      setShowError(true);
      return;
    }
    
    setShowError(false);
    
    if (currentStep === TOTAL_STEPS) {
      setIsSubmitting(true);
      setSubmitError(null);
      
      try {
        const success = await submitOrder();
        if (!success) {
          return;
        }
      } catch (error) {
        console.error('Error en el envío:', error);
        setSubmitError('Error al procesar el envío. Por favor, inténtelo de nuevo.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
    
    setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    if (currentStep === 2) {
      setCurrentStepValid(formState.packageDetails?.isValid ?? false);
    }
    setShowError(false);
    setSubmitError(null);
  };

  const handleCancel = () => {
    if (window.confirm('¿Está seguro que desea cancelar? Se perderán los datos ingresados.')) {
      router.back();
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <PackageDetailsForm
            onDataChange={(data) => handleDataChange('packageDetails', data)}
            initialData={formState.packageDetails}
          />
        );
      case 2:
        return (
          <ConfirmationStep
            formData={formState}
            onDataChange={(data) => handleDataChange('confirmation', data)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen w-screen overflow-x-hidden bg-gray-50">
      <Header />
      <main className="max-w-3xl mx-auto pt-8 pb-16 px-4">
        <div className="mb-8">
          <BackButton />
        </div>
        
        <h1 className="text-3xl font-semibold text-gray-900 text-center mb-8">
          Registrar envío individual
        </h1>
        
        <ProgressSteps currentStep={currentStep} totalSteps={TOTAL_STEPS} />
        
        <div className="bg-white shadow-sm rounded-lg p-6 space-y-6">
          {showError && !currentStepValid && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p>Por favor, complete todos los campos requeridos correctamente.</p>
            </div>
          )}
          
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p>{submitError}</p>
            </div>
          )}
          
          {renderStepContent()}
          
          <ActionButtons
            onCancel={handleCancel}
            onNext={handleNext}
            onBack={handleBack}
            nextDisabled={!currentStepValid || isSubmitting}
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS}
            nextLabel={currentStep === TOTAL_STEPS ? (isSubmitting ? "Procesando..." : "Confirmar envío") : "Siguiente"}
            backLabel="Anterior"
          />
        </div>
      </main>
      <Footer />
      <SuccessOrderModal 
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        orderCode={orderData.orderCode}
      />
    </div>
  );
}
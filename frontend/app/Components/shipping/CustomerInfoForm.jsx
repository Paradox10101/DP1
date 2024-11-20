'use client'
import { User, Phone, Mail } from 'lucide-react';
import { useState, useEffect } from 'react';
import { validateEmail, validatePhone, validateName } from '../../../utils/validations';
import InputField from '../../Components/common/InputField';

export const CustomerInfoForm = ({ onDataChange, initialData }) => {
  // Ensure initialData is an object even if null/undefined is passed
  const safeInitialData = initialData || {};
  
  const [formData, setFormData] = useState({
    firstName: safeInitialData?.firstName ?? '',
    lastName: safeInitialData?.lastName ?? '',
    phone: safeInitialData?.phone ?? '',
    email: safeInitialData?.email ?? ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (name, value) => {
    switch (name) {
      case 'firstName':
      case 'lastName':
        return !validateName(value) ? 'Debe contener solo letras y tener al menos 2 caracteres' : '';
      case 'phone':
        return !validatePhone(value) ? 'Debe contener 9 dígitos numéricos' : '';
      case 'email':
        return !validateEmail(value) ? 'Email inválido' : '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    if (touched[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(name, value),
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value),
    }));
  };

  useEffect(() => {
    const hasErrors = Object.values(errors).some((error) => error !== '');
    const isComplete = Boolean(formData.firstName && formData.lastName && formData.phone);
    
    onDataChange?.({
      data: formData,
      isValid: !hasErrors && isComplete,
      errors,
    });
  }, [formData, errors]);

  return (
    <div className="space-y-6">
      <InputField
        label="Nombre del cliente"
        icon={User}
        placeholder="Nombres completos"
        required
        name="firstName"
        value={formData.firstName}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.firstName ? errors.firstName : ''}
      />
      <InputField
        label="Apellidos del cliente"
        icon={User}
        placeholder="Apellidos completos"
        required
        name="lastName"
        value={formData.lastName}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.lastName ? errors.lastName : ''}
      />
      <InputField
        label="Teléfono"
        icon={Phone}
        type="tel"
        placeholder="Número de contacto"
        required
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.phone ? errors.phone : ''}
      />
      <InputField
        label="Email"
        icon={Mail}
        type="email"
        placeholder="Correo electrónico"
        name="email"
        value={formData.email}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.email ? errors.email : ''}
      />
    </div>
  );
};
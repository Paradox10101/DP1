export const validateEmail = (email) => {
    if (!email) return true; // Email es opcional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  export const validatePhone = (phone) => {
    const phoneRegex = /^\d{9}$/;
    return phoneRegex.test(phone);
  };
  
  export const validateName = (name) => {
    return name.length >= 2 && /^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]+$/.test(name);
  };

  export const validateQuantity = (value) => {
    const number = parseInt(value);
    return !isNaN(number) && number > 0 && Number.isInteger(number);
  };
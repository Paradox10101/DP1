import { ArrowLeft } from 'lucide-react';

export const BackButton = () => (
  <button 
    className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
    onClick={() => window.history.back()}
  >
    <ArrowLeft className="w-5 h-5 mr-2" />
    Volver
  </button>
);

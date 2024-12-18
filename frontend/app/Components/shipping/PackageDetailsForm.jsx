import { useState, useEffect, useMemo } from 'react';
import { Package, MapPin, Search } from 'lucide-react';
import { Select, SelectItem } from "@nextui-org/select";
import { Spinner } from "@nextui-org/react";
import InputField from '../../Components/common/InputField';
import { validateQuantity } from '../../../utils/validations';
import { locationService } from '../../../services/locationService';

export const PackageDetailsForm = ({ onDataChange, initialData }) => {
  const safeInitialData = initialData || {};

  const [formData, setFormData] = useState({
    quantity: safeInitialData?.quantity ?? '',
    destinationCity: safeInitialData?.destinationCity ?? '',
    destinationCityName: safeInitialData?.destinationCityName ?? ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [locationsData, setLocationsData] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const data = await locationService.fetchLocations();
        setLocationsData(data);
        
        const citiesArray = Object.entries(data).map(([ubigeo, location]) => ({
          id: ubigeo,
          name: location.province,
          ubigeo: ubigeo,  // Agregamos el ubigeo explícitamente
          naturalRegion: location.naturalRegion // Agregamos la región natural
        }));
        
        setCities(citiesArray);
      } catch (error) {
        console.error('Error cargando ubicaciones:', error);
        setLoadError('No se pudieron cargar las ciudades. Por favor, inténtelo de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  // Filtrado de ciudades basado en la búsqueda
  const filteredCities = useMemo(() => {
    return cities.filter((city) =>
      city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      city.ubigeo.includes(searchQuery)
    );
  }, [cities, searchQuery]);

  const validateField = (name, value) => {
    switch (name) {
      case 'quantity':
        return !validateQuantity(value) ? 'La cantidad debe ser un número mayor a 0' : '';
      case 'destinationCity':
        return !value ? 'Debe seleccionar una ciudad de destino' : '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target || e;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (touched[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: validateField(name, value),
      }));
    }
  };

  const handleSelectChange = (value) => {
    const ubigeo = Array.from(value)[0];
    const selectedCity = cities.find(city => city.id === ubigeo);
    
    if (selectedCity) {
      setFormData(prev => ({
        ...prev,
        destinationCity: ubigeo,
        destinationCityName: selectedCity.name
      }));

      if (touched.destinationCity) {
        setErrors(prev => ({
          ...prev,
          destinationCity: validateField('destinationCity', ubigeo),
        }));
      }
    }
  };

  const handleBlur = (name) => {
    setTouched(prev => ({
      ...prev,
      [name]: true,
    }));
    setErrors(prev => ({
      ...prev,
      [name]: validateField(name, formData[name]),
    }));
  };

  useEffect(() => {
    const hasErrors = Object.values(errors).some((error) => error !== '');
    const isComplete = Boolean(
      formData.quantity && 
      formData.destinationCity
    );

    if (isComplete && !hasErrors && locationsData) {
      const orderDateTime = new Date();
      const dueDate = locationService.calculateDueDate(
        orderDateTime,
        formData.destinationCity,
        locationsData
      );

      onDataChange?.({
        data: { 
          ...formData, 
          locations: locationsData,
          dueDate: dueDate,
        },
        isValid: true,
        errors,
      });
    } else {
      onDataChange?.({
        data: { 
          ...formData, 
          locations: locationsData,
          dueDate: formData.dueDate // Mantener la fecha previa si existe
        },
        isValid: !hasErrors && isComplete,
        errors,
      });
    }
  }, [formData, errors, locationsData]);

  // Inicializar con datos previos
  useEffect(() => {
    if (safeInitialData?.locations && !locationsData) {
      setLocationsData(safeInitialData.locations);
    }
  }, [safeInitialData, locationsData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md">
        <p className="text-red-600">{loadError}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <InputField
        label="Cantidad de paquetes"
        icon={Package}
        type="number"
        placeholder="Cantidad a registrar"
        required
        name="quantity"
        value={formData.quantity}
        onChange={handleChange}
        onBlur={() => handleBlur('quantity')}
        error={touched.quantity ? errors.quantity : ''}
        min="1"
      />

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">
          Ciudad de destino<span className="text-red-500">*</span>
        </label>
        
        <InputField
          icon={Search}
          type="text"
          placeholder="Buscar por ciudad o ubigeo..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mb-2"
        />

        <Select
          isRequired
          variant="bordered"
          placeholder="Selecciona la ciudad de destino"
          selectedKeys={formData.destinationCity ? [formData.destinationCity] : []}
          value={formData.destinationCity ? cities.find(city => city.id === formData.destinationCity)?.name : ''}
          className="w-full"
          onSelectionChange={handleSelectChange}
          onBlur={() => handleBlur('destinationCity')}
          errorMessage={touched.destinationCity ? errors.destinationCity : ''}
          isInvalid={touched.destinationCity && errors.destinationCity ? true : false}
          startContent={<MapPin className="text-gray-400 h-5 w-5" />}
          items={filteredCities}
        >
          {(city) => (
            <SelectItem key={city.id} textValue={`${city.name} (${city.ubigeo})`}>
              {city.name} ({city.ubigeo})
            </SelectItem>
          )}
        </Select>
      </div>
    </div>
  );
};

export default PackageDetailsForm;
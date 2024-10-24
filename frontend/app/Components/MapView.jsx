"use client";
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import ReactDOMServer from "react-dom/server";
import IconoEstado from "@/app/Components/IconoEstado";
import { Building, Truck, Warehouse } from "lucide-react";

export default function MapView({ datos, mostrarRutas, estadoSimulacion }) {
  const mapContainerRef = useRef(null); 
  const mapRef = useRef(null);

  // Estado para asegurarse de que el componente se renderice solo en el cliente
  const [isClient, setIsClient] = useState(false);

  // Definición de los iconos usando divIcon
  const oficinaIconHtmlString = ReactDOMServer.renderToStaticMarkup(
    <IconoEstado
      Icono={Building}
      classNameContenedor={"bg-blue-500 w-[20px] h-[20px] relative rounded-full flex items-center justify-center z-10"}
      classNameContenido={"w-[16px] h-[16px] stroke-blanco z-20"}
    />
  );

  const almacenIconHtmlString = ReactDOMServer.renderToStaticMarkup(
    <IconoEstado
      Icono={Warehouse}
      classNameContenedor={"bg-black w-[25px] h-[25px] relative rounded-full flex items-center justify-center z-30"}
      classNameContenido={"w-[15px] h-[15px] stroke-blanco z-40"}
    />
  );

  const vehiculoIconHtmlString = ReactDOMServer.renderToStaticMarkup(
    <IconoEstado
      Icono={Truck}
      classNameContenedor={"bg-capacidadDisponible w-[25px] h-[25px] relative rounded-full flex items-center justify-center"}
      classNameContenido={"w-[15px] h-[15px] stroke-blanco z-10"}
    />
  );

  // useEffect para verificar si el componente ya se ha montado (solo en el cliente)
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    try {
      // Solo inicializar el mapa si estamos en el cliente
      if (!isClient) return;

      // Inicializar el mapa
      if (mapRef.current) return;
      
      mapRef.current = new maplibregl.Map({
        container: mapContainerRef.current,
        style: 'https://api.maptiler.com/maps/openstreetmap/style.json?key=i1ya2uBOpNFu9czrsnbD', //https://basemaps.cartocdn.com/gl/positron-gl-style/style.json
        center: [-77.0428, -12.0464], // Coordenadas de Lima, Perú ?
        zoom: 6
      });
      

      const map = mapRef.current;
      
      // Función para crear marcadores personalizados
      const createMarker = (geocode, popupContent, iconHtml) => {
        const el = document.createElement("div");
        el.innerHTML = iconHtml;
        new maplibregl.Marker(el)
          .setLngLat(geocode)
          .setPopup(new maplibregl.Popup().setHTML(popupContent))
          .addTo(map);
      };

      
      if (datos && datos.oficinas) {
        datos.oficinas.forEach(oficina => {
          const markerDiv = document.createElement('div');
          markerDiv.innerHTML = oficinaIconHtmlString
          markerDiv.style.textAlign = 'center'; // Alineación del texto
          markerDiv.style.cursor = 'pointer'; // Cambia el cursor al pasar el mouse
          const popupContent = `<h1>Provincia: ${oficina.popup}</h1>`;
          const popup = new maplibregl.Popup({ offset: 25 }) // Offset ajusta la posición del popup
              .setHTML(popupContent);
          const marker = new maplibregl.Marker({ element: markerDiv })
            .setLngLat(oficina.geocode) // Establece la ubicación del marcador
            .addTo(map)
            .setPopup(popup); // Añade el marcador al mapa
        });
      }
      

      // Agregar marcadores de almacenes
    
    if (datos && datos.almacenes) {
      datos.almacenes.forEach(almacen => {
        const markerDiv = document.createElement('div');
        markerDiv.innerHTML = almacenIconHtmlString
        markerDiv.style.textAlign = 'center'; // Alineación del texto
        markerDiv.style.cursor = 'pointer'; // Cambia el cursor al pasar el mouse
        const popupContent = `<h1>Código: ${almacen.popup}</h1>`;
        const popup = new maplibregl.Popup({ offset: 25 }) // Offset ajusta la posición del popup
            .setHTML(popupContent);
        const marker = new maplibregl.Marker({ element: markerDiv })
          .setLngLat(almacen.geocode) // Establece la ubicación del marcador
          .addTo(map)
          .setPopup(popup); // Añade el marcador al mapa
      });
      }

      // Agregar marcadores de camiones y las rutas si es necesario
      if (datos && datos.vehiculos) {
        datos.vehiculos.forEach(vehiculo => {
          const markerDiv = document.createElement('div');
          markerDiv.innerHTML = vehiculoIconHtmlString
          markerDiv.style.textAlign = 'center'; // Alineación del texto
          markerDiv.style.cursor = 'pointer'; // Cambia el cursor al pasar el mouse
          const popupContent = `<h1>Código: ${vehiculo.codigo}</h1><p>${vehiculo.capacidadUsada}/${vehiculo.capacidadMaxima}</p>`;
          const popup = new maplibregl.Popup({ offset: 25 }) // Offset ajusta la posición del popup
            .setHTML(popupContent);
          const marker = new maplibregl.Marker({ element: markerDiv })
            .setLngLat(vehiculo.geocode) // Establece la ubicación del marcador
            .addTo(map)
            .setPopup(popup); // Añade el marcador al mapa
        });
      }

      {(estadoSimulacion!=="INICIAL" && mostrarRutas)&&
      map.on('load', () => {
        // Suponiendo que tienes una colección de vehículos
        if (datos && datos.vehiculos) {
          datos.vehiculos.forEach(vehiculo => {
            const lineData = {
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  geometry: {
                    type: "LineString",
                    coordinates: [vehiculo.geocode, [-72.66825, -2.4471967]], // Coordenadas
                  },
                  properties: {
                    // Puedes agregar propiedades adicionales si es necesario
                  },
                },
              ],
            };
      
            // Agregar la fuente de datos
            map.addSource(`ruta-${vehiculo.id}`, {
              type: "geojson",
              data: lineData,
            });
      
            // Agregar la capa de la línea
            map.addLayer({
              id: `ruta-${vehiculo.id}`,
              type: "line",
              source: `ruta-${vehiculo.id}`, // Asegúrate de usar el nombre de la fuente correcta
              layout: {
                "line-join": "round", // Esquinas redondeadas
                "line-cap": "round", // Extremos redondeados
              },
              paint: {
                "line-color": "purple", // Color de la línea (morado)
                "line-width": 2, // Grosor de la línea
              },
            });
          });
        }
      })};
      

      // Limpiar el mapa al desmontar el componente
      return () => {
        if (map) map.remove();
        mapRef.current = null;
      };

    } catch (error) {
      console.error("Error loading the map:", error); 
    }
  }, [isClient, datos, mostrarRutas, estadoSimulacion]); 

  return <div ref={mapContainerRef} className="map-wrap" />;
}
/*
oficinas.forEach(oficina => {
        createMarker(
          oficina.geocode,
          `<h1><b>${oficina.popup}</b></h1><h2><b>${oficina.capacidadUtilizada}/${oficina.capacidadMaxima}</b></h2>`,
          oficinaIconHtml
        ); 
      });
*/
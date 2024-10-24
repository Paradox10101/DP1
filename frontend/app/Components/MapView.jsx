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
  const oficinaIconHtml = ReactDOMServer.renderToStaticMarkup(
    <IconoEstado
      Icono={Building}
      classNameContenedor={"bg-blue-500 w-[20px] h-[20px] relative rounded-full flex items-center justify-center z-10"}
      classNameContenido={"w-[16px] h-[16px] stroke-blanco z-20"}
    />
  );

  const almacenIconHtml = ReactDOMServer.renderToStaticMarkup(
    <IconoEstado
      Icono={Warehouse}
      classNameContenedor={"bg-black w-[25px] h-[25px] relative rounded-full flex items-center justify-center z-30"}
      classNameContenido={"w-[15px] h-[15px] stroke-blanco z-40"}
    />
  );

  const camionIconHtml = ReactDOMServer.renderToStaticMarkup(
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

      // Agregar marcadores de oficinas
      const oficinas = [{id:0 , geocode: [-72.878876, -13.637346], popup: 'ABANCAY', capacidadUtilizada: 0, capacidadMaxima: 103}, {id:1 , geocode: [-73.38991, -13.656409], popup: 'ANDAHUAYLAS', capacidadUtilizada: 0, capacidadMaxima: 31}, {id:2 , geocode: [-72.87779, -14.364756], popup: 'ANTABAMBA', capacidadUtilizada: 0, capacidadMaxima: 30}, {id:3 , geocode: [-73.24427, -14.294712], popup: 'AYMARAES', capacidadUtilizada: 0, capacidadMaxima: 15}, {id:4 , geocode: [-73.7228, -13.518027], popup: 'CHINCHEROS', capacidadUtilizada: 0, capacidadMaxima: 94}, {id:5 , geocode: [-72.174446, -13.946195], popup: 'COTABAMBAS', capacidadUtilizada: 0, capacidadMaxima: 76}, {id:6 , geocode: [-72.70764, -14.10538], popup: 'GRAU', capacidadUtilizada: 0, capacidadMaxima: 94}, {id:7 , geocode: [-72.71162, -16.624918], popup: 'CAMANA', capacidadUtilizada: 0, capacidadMaxima: 58}, {id:8 , geocode: [-73.36541, -15.772139], popup: 'CARAVELI', capacidadUtilizada: 0, capacidadMaxima: 237}, {id:9 , geocode: [-72.49209, -16.076603], popup: 'CASTILLA', capacidadUtilizada: 0, capacidadMaxima: 158}, {id:10 , geocode: [-71.60198, -15.636742], popup: 'CAYLLOMA', capacidadUtilizada: 0, capacidadMaxima: 247}, {id:11 , geocode: [-72.65147, -15.839238], popup: 'CONDESUYOS', capacidadUtilizada: 0, capacidadMaxima: 21}, {id:12 , geocode: [-72.01544, -17.029276], popup: 'ISLAY', capacidadUtilizada: 0, capacidadMaxima: 139}, {id:13 , geocode: [-72.88816, -15.212908], popup: 'LA UNION', capacidadUtilizada: 0, capacidadMaxima: 228}, {id:14 , geocode: [-74.14368, -13.629325], popup: 'CANGALLO', capacidadUtilizada: 0, capacidadMaxima: 37}, {id:15 , geocode: [-74.22578, -13.160271], popup: 'HUAMANGA', capacidadUtilizada: 0, capacidadMaxima: 66}, {id:16 , geocode: [-74.333885, -13.919884], popup: 'HUANCA SANCOS', capacidadUtilizada: 0, capacidadMaxima: 20}, {id:17 , geocode: [-74.247894, -12.939914], popup: 'HUANTA', capacidadUtilizada: 0, capacidadMaxima: 89}, {id:18 , geocode: [-73.98111, -13.012666], popup: 'LA MAR', capacidadUtilizada: 0, capacidadMaxima: 103}, {id:19 , geocode: [-74.1242, -14.694042], popup: 'LUCANAS', capacidadUtilizada: 0, capacidadMaxima: 57}, {id:20 , geocode: [-73.78089, -15.016977], popup: 'PARINACOCHAS', capacidadUtilizada: 0, capacidadMaxima: 32}, {id:21 , geocode: [-73.34436, -15.278873], popup: 'PAUCAR DEL SARA SARA', capacidadUtilizada: 0, capacidadMaxima: 39}, {id:22 , geocode: [-73.838844, -14.011257], popup: 'SUCRE', capacidadUtilizada: 0, capacidadMaxima: 85}, {id:23 , geocode: [-74.0663, -13.752455], popup: 'VICTOR FAJARDO', capacidadUtilizada: 0, capacidadMaxima: 107}, {id:24 , geocode: [-73.953865, -13.653027], popup: 'VILCAS HUAMAN', capacidadUtilizada: 0, capacidadMaxima: 89}, {id:25 , geocode: [-71.683495, -13.919203], popup: 'ACOMAYO', capacidadUtilizada: 0, capacidadMaxima: 103}, {id:26 , geocode: [-72.14879, -13.471593], popup: 'ANTA', capacidadUtilizada: 0, capacidadMaxima: 88}, {id:27 , geocode: [-71.95605, -13.321749], popup: 'CALCA', capacidadUtilizada: 0, capacidadMaxima: 93}, {id:28 , geocode: [-71.43203, -14.216944], popup: 'CANAS', capacidadUtilizada: 0, capacidadMaxima: 27}, {id:29 , geocode: [-71.2265, -14.272991], popup: 'CANCHIS', capacidadUtilizada: 0, capacidadMaxima: 64}, {id:30 , geocode: [-72.082085, -14.450169], popup: 'CHUMBIVILCAS', capacidadUtilizada: 0, capacidadMaxima: 41}, {id:31 , geocode: [-71.97876, -13.516702], popup: 'CUSCO', capacidadUtilizada: 0, capacidadMaxima: 56}, {id:32 , geocode: [-71.41288, -14.793119], popup: 'ESPINAR', capacidadUtilizada: 0, capacidadMaxima: 28}, {id:33 , geocode: [-72.69288, -12.863322], popup: 'LA CONVENCION', capacidadUtilizada: 0, capacidadMaxima: 107}, {id:34 , geocode: [-71.84744, -13.761323], popup: 'PARURO', capacidadUtilizada: 0, capacidadMaxima: 46}, {id:35 , geocode: [-71.596725, -13.317805], popup: 'PAUCARTAMBO', capacidadUtilizada: 0, capacidadMaxima: 21}, {id:36 , geocode: [-71.62558, -13.687855], popup: 'QUISPICANCHI', capacidadUtilizada: 0, capacidadMaxima: 72}, {id:37 , geocode: [-72.11599, -13.30593], popup: 'URUBAMBA', capacidadUtilizada: 0, capacidadMaxima: 29}, {id:38 , geocode: [-71.3589, -12.836182], popup: 'MANU', capacidadUtilizada: 0, capacidadMaxima: 40}, {id:39 , geocode: [-69.577415, -10.944943], popup: 'TAHUAMANU', capacidadUtilizada: 0, capacidadMaxima: 84}, {id:40 , geocode: [-69.17625, -12.594216], popup: 'TAMBOPATA', capacidadUtilizada: 0, capacidadMaxima: 82}, {id:41 , geocode: [-70.970055, -16.673923], popup: 'GENERAL SANCHEZ CERRO', capacidadUtilizada: 0, capacidadMaxima: 20}, {id:42 , geocode: [-71.345314, -17.645824], popup: 'ILO', capacidadUtilizada: 0, capacidadMaxima: 86}, {id:43 , geocode: [-70.9347, -17.193804], popup: 'MARISCAL NIETO', capacidadUtilizada: 0, capacidadMaxima: 49}, {id:44 , geocode: [-70.19534, -14.9085245], popup: 'AZANGARO', capacidadUtilizada: 0, capacidadMaxima: 68}, {id:45 , geocode: [-70.43136, -14.068453], popup: 'CARABAYA', capacidadUtilizada: 0, capacidadMaxima: 25}, {id:46 , geocode: [-69.459236, -16.213324], popup: 'CHUCUITO', capacidadUtilizada: 0, capacidadMaxima: 41}, {id:47 , geocode: [-69.638596, -16.086866], popup: 'EL COLLAO', capacidadUtilizada: 0, capacidadMaxima: 17}, {id:48 , geocode: [-69.76144, -15.204116], popup: 'HUANCANE', capacidadUtilizada: 0, capacidadMaxima: 112}, {id:49 , geocode: [-70.367546, -15.364678], popup: 'LAMPA', capacidadUtilizada: 0, capacidadMaxima: 49}, {id:50 , geocode: [-70.59009, -14.881829], popup: 'MELGAR', capacidadUtilizada: 0, capacidadMaxima: 86}, {id:51 , geocode: [-69.49989, -15.360712], popup: 'MOHO', capacidadUtilizada: 0, capacidadMaxima: 73}, {id:52 , geocode: [-70.02801, -15.840612], popup: 'PUNO', capacidadUtilizada: 0, capacidadMaxima: 40}, {id:53 , geocode: [-69.86856, -14.91416], popup: 'SAN ANTONIO DE PUTINA', capacidadUtilizada: 0, capacidadMaxima: 78}, {id:54 , geocode: [-70.13554, -15.493232], popup: 'SAN ROMAN', capacidadUtilizada: 0, capacidadMaxima: 57}, {id:55 , geocode: [-69.46661, -14.323019], popup: 'SANDIA', capacidadUtilizada: 0, capacidadMaxima: 26}, {id:56 , geocode: [-69.09257, -16.244268], popup: 'YUNGUYO', capacidadUtilizada: 0, capacidadMaxima: 114}, {id:57 , geocode: [-70.2504, -17.268188], popup: 'CANDARAVE', capacidadUtilizada: 0, capacidadMaxima: 145}, {id:58 , geocode: [-70.7624, -17.613832], popup: 'JORGE BASADRE', capacidadUtilizada: 0, capacidadMaxima: 139}, {id:59 , geocode: [-70.25079, -18.0137], popup: 'TACNA', capacidadUtilizada: 0, capacidadMaxima: 41}, {id:60 , geocode: [-70.03211, -17.474718], popup: 'TARATA', capacidadUtilizada: 0, capacidadMaxima: 164}, {id:61 , geocode: [-73.75484, -10.729728], popup: 'ATALAYA', capacidadUtilizada: 0, capacidadMaxima: 77}, {id:62 , geocode: [-74.53224, -8.383243], popup: 'CORONEL PORTILLO', capacidadUtilizada: 0, capacidadMaxima: 57}, {id:63 , geocode: [-75.50862, -9.036876], popup: 'PADRE ABAD', capacidadUtilizada: 0, capacidadMaxima: 71}, {id:64 , geocode: [-70.71008, -9.77236], popup: 'PURUS', capacidadUtilizada: 0, capacidadMaxima: 28}, {id:65 , geocode: [-77.61072, -9.780206], popup: 'AIJA', capacidadUtilizada: 0, capacidadMaxima: 105}, {id:66 , geocode: [-77.01683, -9.101036], popup: 'ANTONIO RAYMONDI', capacidadUtilizada: 0, capacidadMaxima: 256}, {id:67 , geocode: [-77.36604, -9.162093], popup: 'ASUNCION', capacidadUtilizada: 0, capacidadMaxima: 23}, {id:68 , geocode: [-77.1568, -10.152066], popup: 'BOLOGNESI', capacidadUtilizada: 0, capacidadMaxima: 190}, {id:69 , geocode: [-77.64629, -9.281765], popup: 'CARHUAZ', capacidadUtilizada: 0, capacidadMaxima: 242}, {id:70 , geocode: [-77.32913, -9.0943575], popup: 'CARLOS FERMIN FITZCARRALD', capacidadUtilizada: 0, capacidadMaxima: 40}, {id:71 , geocode: [-78.30544, -9.47608], popup: 'CASMA', capacidadUtilizada: 0, capacidadMaxima: 136}, {id:72 , geocode: [-77.89804, -8.570422], popup: 'CORONGO', capacidadUtilizada: 0, capacidadMaxima: 55}, {id:73 , geocode: [-77.52886, -9.529975], popup: 'HUARAZ', capacidadUtilizada: 0, capacidadMaxima: 33}, {id:74 , geocode: [-77.17096, -9.347401], popup: 'HUARI', capacidadUtilizada: 0, capacidadMaxima: 96}, {id:75 , geocode: [-78.15227, -10.0687065], popup: 'HUARMEY', capacidadUtilizada: 0, capacidadMaxima: 138}, {id:76 , geocode: [-77.81007, -9.048588], popup: 'HUAYLAS', capacidadUtilizada: 0, capacidadMaxima: 20}, {id:77 , geocode: [-77.35749, -8.864946], popup: 'MARISCAL LUZURIAGA', capacidadUtilizada: 0, capacidadMaxima: 259}, {id:78 , geocode: [-77.39679, -10.403464], popup: 'OCROS', capacidadUtilizada: 0, capacidadMaxima: 157}, {id:79 , geocode: [-78.00902, -8.392909], popup: 'PALLASCA', capacidadUtilizada: 0, capacidadMaxima: 18}, {id:80 , geocode: [-77.46025, -8.820532], popup: 'POMABAMBA', capacidadUtilizada: 0, capacidadMaxima: 245}, {id:81 , geocode: [-77.45615, -9.722085], popup: 'RECUAY', capacidadUtilizada: 0, capacidadMaxima: 207}, {id:82 , geocode: [-78.593575, -9.074542], popup: 'SANTA', capacidadUtilizada: 0, capacidadMaxima: 48}, {id:83 , geocode: [-77.63122, -8.554587], popup: 'SIHUAS', capacidadUtilizada: 0, capacidadMaxima: 109}, {id:84 , geocode: [-77.7449, -9.139891], popup: 'YUNGAY', capacidadUtilizada: 0, capacidadMaxima: 61}, {id:85 , geocode: [-77.14068, -12.060342], popup: 'CALLAO', capacidadUtilizada: 0, capacidadMaxima: 241}, {id:86 , geocode: [-74.57118, -12.844325], popup: 'ACOBAMBA', capacidadUtilizada: 0, capacidadMaxima: 49}, {id:87 , geocode: [-74.718544, -12.983049], popup: 'ANGARAES', capacidadUtilizada: 0, capacidadMaxima: 89}, {id:88 , geocode: [-75.31915, -13.283339], popup: 'CASTROVIRREYNA', capacidadUtilizada: 0, capacidadMaxima: 72}, {id:89 , geocode: [-74.38756, -12.739259], popup: 'CHURCAMPA', capacidadUtilizada: 0, capacidadMaxima: 94}, {id:90 , geocode: [-74.9731, -12.787191], popup: 'HUANCAVELICA', capacidadUtilizada: 0, capacidadMaxima: 56}, {id:91 , geocode: [-75.35307, -13.604421], popup: 'HUAYTARA', capacidadUtilizada: 0, capacidadMaxima: 107}, {id:92 , geocode: [-74.86842, -12.398792], popup: 'TAYACAJA', capacidadUtilizada: 0, capacidadMaxima: 34}, {id:93 , geocode: [-76.20446, -10.12923], popup: 'AMBO', capacidadUtilizada: 0, capacidadMaxima: 103}, {id:94 , geocode: [-76.8013, -9.828532], popup: 'DOS DE MAYO', capacidadUtilizada: 0, capacidadMaxima: 78}, {id:95 , geocode: [-76.952614, -9.037866], popup: 'HUACAYBAMBA', capacidadUtilizada: 0, capacidadMaxima: 73}, {id:96 , geocode: [-76.815575, -9.550005], popup: 'HUAMALIES', capacidadUtilizada: 0, capacidadMaxima: 19}, {id:97 , geocode: [-76.23965, -9.929545], popup: 'HUANUCO', capacidadUtilizada: 0, capacidadMaxima: 53}, {id:98 , geocode: [-76.631615, -10.078058], popup: 'LAURICOCHA', capacidadUtilizada: 0, capacidadMaxima: 25}, {id:99 , geocode: [-76.00028, -9.298381], popup: 'LEONCIO PRADO', capacidadUtilizada: 0, capacidadMaxima: 22}, {id:100 , geocode: [-77.14935, -8.604393], popup: 'MARAÑON', capacidadUtilizada: 0, capacidadMaxima: 42}, {id:101 , geocode: [-75.99429, -9.897476], popup: 'PACHITEA', capacidadUtilizada: 0, capacidadMaxima: 47}, {id:102 , geocode: [-74.96594, -9.379358], popup: 'PUERTO INCA', capacidadUtilizada: 0, capacidadMaxima: 59}, {id:103 , geocode: [-76.6084, -9.858744], popup: 'YAROWILCA', capacidadUtilizada: 0, capacidadMaxima: 73}, {id:104 , geocode: [-76.13261, -13.417593], popup: 'CHINCHA', capacidadUtilizada: 0, capacidadMaxima: 222}, {id:105 , geocode: [-75.7292, -14.063935], popup: 'ICA', capacidadUtilizada: 0, capacidadMaxima: 19}, {id:106 , geocode: [-74.93705, -14.827559], popup: 'NASCA', capacidadUtilizada: 0, capacidadMaxima: 84}, {id:107 , geocode: [-75.185135, -14.533749], popup: 'PALPA', capacidadUtilizada: 0, capacidadMaxima: 24}, {id:108 , geocode: [-76.20321, -13.709894], popup: 'PISCO', capacidadUtilizada: 0, capacidadMaxima: 238}, {id:109 , geocode: [-75.3282, -11.055986], popup: 'CHANCHAMAYO', capacidadUtilizada: 0, capacidadMaxima: 32}, {id:110 , geocode: [-75.28762, -12.061711], popup: 'CHUPACA', capacidadUtilizada: 0, capacidadMaxima: 38}, {id:111 , geocode: [-75.312965, -11.918462], popup: 'CONCEPCION', capacidadUtilizada: 0, capacidadMaxima: 60}, {id:112 , geocode: [-75.21005, -12.067959], popup: 'HUANCAYO', capacidadUtilizada: 0, capacidadMaxima: 66}, {id:113 , geocode: [-75.50053, -11.775216], popup: 'JAUJA', capacidadUtilizada: 0, capacidadMaxima: 25}, {id:114 , geocode: [-75.99308, -11.161042], popup: 'JUNIN', capacidadUtilizada: 0, capacidadMaxima: 46}, {id:115 , geocode: [-74.637, -11.253902], popup: 'SATIPO', capacidadUtilizada: 0, capacidadMaxima: 35}, {id:116 , geocode: [-75.68777, -11.419918], popup: 'TARMA', capacidadUtilizada: 0, capacidadMaxima: 42}, {id:117 , geocode: [-75.90004, -11.516594], popup: 'YAULI', capacidadUtilizada: 0, capacidadMaxima: 62}, {id:118 , geocode: [-77.760796, -10.7540245], popup: 'BARRANCA', capacidadUtilizada: 0, capacidadMaxima: 225}, {id:119 , geocode: [-76.993004, -10.472683], popup: 'CAJATAMBO', capacidadUtilizada: 0, capacidadMaxima: 19}, {id:120 , geocode: [-76.62474, -11.46702], popup: 'CANTA', capacidadUtilizada: 0, capacidadMaxima: 94}, {id:121 , geocode: [-76.38743, -13.07775], popup: 'CAÑETE', capacidadUtilizada: 0, capacidadMaxima: 137}, {id:122 , geocode: [-77.207184, -11.495407], popup: 'HUARAL', capacidadUtilizada: 0, capacidadMaxima: 67}, {id:123 , geocode: [-76.38606, -11.844765], popup: 'HUAROCHIRI', capacidadUtilizada: 0, capacidadMaxima: 151}, {id:124 , geocode: [-77.610405, -11.108553], popup: 'HUAURA', capacidadUtilizada: 0, capacidadMaxima: 19}, {id:125 , geocode: [-76.77306, -10.668103], popup: 'OYON', capacidadUtilizada: 0, capacidadMaxima: 232}, {id:126 , geocode: [-75.918686, -12.459734], popup: 'YAUYOS', capacidadUtilizada: 0, capacidadMaxima: 222}, {id:127 , geocode: [-76.516624, -10.491333], popup: 'DANIEL ALCIDES CARRION', capacidadUtilizada: 0, capacidadMaxima: 106}, {id:128 , geocode: [-75.404625, -10.574283], popup: 'OXAPAMPA', capacidadUtilizada: 0, capacidadMaxima: 71}, {id:129 , geocode: [-76.25618, -10.683662], popup: 'PASCO', capacidadUtilizada: 0, capacidadMaxima: 104}, {id:130 , geocode: [-78.53166, -5.6390615], popup: 'BAGUA', capacidadUtilizada: 0, capacidadMaxima: 72}, {id:131 , geocode: [-77.798096, -5.904324], popup: 'BONGARA', capacidadUtilizada: 0, capacidadMaxima: 84}, {id:132 , geocode: [-77.87244, -6.2294083], popup: 'CHACHAPOYAS', capacidadUtilizada: 0, capacidadMaxima: 31}, {id:133 , geocode: [-77.86448, -4.592347], popup: 'CONDORCANQUI', capacidadUtilizada: 0, capacidadMaxima: 56}, {id:134 , geocode: [-77.95196, -6.139032], popup: 'LUYA', capacidadUtilizada: 0, capacidadMaxima: 37}, {id:135 , geocode: [-77.4822, -6.395907], popup: 'RODRIGUEZ DE MENDOZA', capacidadUtilizada: 0, capacidadMaxima: 94}, {id:136 , geocode: [-78.4422, -5.7544174], popup: 'UTCUBAMBA', capacidadUtilizada: 0, capacidadMaxima: 86}, {id:137 , geocode: [-78.046005, -7.6237435], popup: 'CAJABAMBA', capacidadUtilizada: 0, capacidadMaxima: 44}, {id:138 , geocode: [-78.517525, -7.1570687], popup: 'CAJAMARCA', capacidadUtilizada: 0, capacidadMaxima: 86}, {id:139 , geocode: [-78.14556, -6.8655324], popup: 'CELENDIN', capacidadUtilizada: 0, capacidadMaxima: 19}, {id:140 , geocode: [-78.650246, -6.5615745], popup: 'CHOTA', capacidadUtilizada: 0, capacidadMaxima: 33}, {id:141 , geocode: [-78.80463, -7.3661294], popup: 'CONTUMAZA', capacidadUtilizada: 0, capacidadMaxima: 97}, {id:142 , geocode: [-78.81831, -6.3773556], popup: 'CUTERVO', capacidadUtilizada: 0, capacidadMaxima: 31}, {id:143 , geocode: [-78.51914, -6.679542], popup: 'HUALGAYOC', capacidadUtilizada: 0, capacidadMaxima: 42}, {id:144 , geocode: [-78.80782, -5.708803], popup: 'JAEN', capacidadUtilizada: 0, capacidadMaxima: 61}, {id:145 , geocode: [-79.004974, -5.1462502], popup: 'SAN IGNACIO', capacidadUtilizada: 0, capacidadMaxima: 34}, {id:146 , geocode: [-78.17047, -7.3360686], popup: 'SAN MARCOS', capacidadUtilizada: 0, capacidadMaxima: 38}, {id:147 , geocode: [-78.85143, -7.0004487], popup: 'SAN MIGUEL', capacidadUtilizada: 0, capacidadMaxima: 49}, {id:148 , geocode: [-78.82337, -7.1183414], popup: 'SAN PABLO', capacidadUtilizada: 0, capacidadMaxima: 100}, {id:149 , geocode: [-78.94439, -6.6261396], popup: 'SANTA CRUZ', capacidadUtilizada: 0, capacidadMaxima: 77}, {id:150 , geocode: [-79.10751, -7.7137904], popup: 'ASCOPE', capacidadUtilizada: 0, capacidadMaxima: 24}, {id:151 , geocode: [-77.70264, -7.153872], popup: 'BOLIVAR', capacidadUtilizada: 0, capacidadMaxima: 132}, {id:152 , geocode: [-79.429634, -7.227289], popup: 'CHEPEN', capacidadUtilizada: 0, capacidadMaxima: 103}, {id:153 , geocode: [-78.81942, -7.479456], popup: 'GRAN CHIMU', capacidadUtilizada: 0, capacidadMaxima: 214}, {id:154 , geocode: [-78.48663, -8.042529], popup: 'JULCAN', capacidadUtilizada: 0, capacidadMaxima: 198}, {id:155 , geocode: [-78.5657, -7.902503], popup: 'OTUZCO', capacidadUtilizada: 0, capacidadMaxima: 209}, {id:156 , geocode: [-79.50428, -7.4320564], popup: 'PACASMAYO', capacidadUtilizada: 0, capacidadMaxima: 129}, {id:157 , geocode: [-77.29632, -8.275935], popup: 'PATAZ', capacidadUtilizada: 0, capacidadMaxima: 148}, {id:158 , geocode: [-78.04862, -7.815552], popup: 'SANCHEZ CARRION', capacidadUtilizada: 0, capacidadMaxima: 256}, {id:159 , geocode: [-78.17327, -8.145368], popup: 'SANTIAGO DE CHUCO', capacidadUtilizada: 0, capacidadMaxima: 147}, {id:160 , geocode: [-78.75222, -8.414277], popup: 'VIRU', capacidadUtilizada: 0, capacidadMaxima: 204}, {id:161 , geocode: [-79.83866, -6.771505], popup: 'CHICLAYO', capacidadUtilizada: 0, capacidadMaxima: 62}, {id:162 , geocode: [-79.78804, -6.639227], popup: 'FERREÑAFE', capacidadUtilizada: 0, capacidadMaxima: 40}, {id:163 , geocode: [-79.90621, -6.704108], popup: 'LAMBAYEQUE', capacidadUtilizada: 0, capacidadMaxima: 79}, {id:164 , geocode: [-76.10441, -5.895269], popup: 'ALTO AMAZONAS', capacidadUtilizada: 0, capacidadMaxima: 47}, {id:165 , geocode: [-76.55451, -4.8315687], popup: 'DATEM DEL MARAÑON', capacidadUtilizada: 0, capacidadMaxima: 28}, {id:166 , geocode: [-73.57546, -4.506616], popup: 'LORETO', capacidadUtilizada: 0, capacidadMaxima: 64}, {id:167 , geocode: [-70.51679, -3.9059913], popup: 'MARISCAL RAMON CASTILLA', capacidadUtilizada: 0, capacidadMaxima: 75}, {id:168 , geocode: [-73.24437, -3.749346], popup: 'MAYNAS', capacidadUtilizada: 0, capacidadMaxima: 25}, {id:169 , geocode: [-72.66825, -2.4471967], popup: 'PUTUMAYO', capacidadUtilizada: 0, capacidadMaxima: 66}, {id:170 , geocode: [-73.856384, -5.063693], popup: 'REQUENA', capacidadUtilizada: 0, capacidadMaxima: 16}, {id:171 , geocode: [-75.00906, -7.3505206], popup: 'UCAYALI', capacidadUtilizada: 0, capacidadMaxima: 19}, {id:172 , geocode: [-79.71523, -4.640226], popup: 'AYABACA', capacidadUtilizada: 0, capacidadMaxima: 214}, {id:173 , geocode: [-79.45062, -5.2390018], popup: 'HUANCABAMBA', capacidadUtilizada: 0, capacidadMaxima: 259}, {id:174 , geocode: [-80.16085, -5.096551], popup: 'MORROPON', capacidadUtilizada: 0, capacidadMaxima: 99}, {id:175 , geocode: [-81.11367, -5.085127], popup: 'PAITA', capacidadUtilizada: 0, capacidadMaxima: 162}, {id:176 , geocode: [-80.62655, -5.197164], popup: 'PIURA', capacidadUtilizada: 0, capacidadMaxima: 51}, {id:177 , geocode: [-80.82227, -5.557545], popup: 'SECHURA', capacidadUtilizada: 0, capacidadMaxima: 128}, {id:178 , geocode: [-80.68738, -4.8900437], popup: 'SULLANA', capacidadUtilizada: 0, capacidadMaxima: 254}, {id:179 , geocode: [-81.27182, -4.579691], popup: 'TALARA', capacidadUtilizada: 0, capacidadMaxima: 120}, {id:180 , geocode: [-76.5847, -7.066871], popup: 'BELLAVISTA', capacidadUtilizada: 0, capacidadMaxima: 17}, {id:181 , geocode: [-76.69486, -6.613914], popup: 'EL DORADO', capacidadUtilizada: 0, capacidadMaxima: 39}, {id:182 , geocode: [-76.77185, -6.9364114], popup: 'HUALLAGA', capacidadUtilizada: 0, capacidadMaxima: 67}, {id:183 , geocode: [-76.51618, -6.421838], popup: 'LAMAS', capacidadUtilizada: 0, capacidadMaxima: 89}, {id:184 , geocode: [-76.72644, -7.1804104], popup: 'MARISCAL CACERES', capacidadUtilizada: 0, capacidadMaxima: 71}, {id:185 , geocode: [-76.97467, -6.034669], popup: 'MOYOBAMBA', capacidadUtilizada: 0, capacidadMaxima: 30}, {id:186 , geocode: [-76.3303, -6.9206414], popup: 'PICOTA', capacidadUtilizada: 0, capacidadMaxima: 53}, {id:187 , geocode: [-77.16777, -6.0626082], popup: 'RIOJA', capacidadUtilizada: 0, capacidadMaxima: 75}, {id:188 , geocode: [-76.35982, -6.487717], popup: 'SAN MARTIN', capacidadUtilizada: 0, capacidadMaxima: 26}, {id:189 , geocode: [-76.510315, -8.188648], popup: 'TOCACHE', capacidadUtilizada: 0, capacidadMaxima: 41}, {id:190 , geocode: [-80.676285, -3.6806676], popup: 'CONTRALMIRANTE VILLAR', capacidadUtilizada: 0, capacidadMaxima: 231}, {id:191 , geocode: [-80.45957, -3.570834], popup: 'TUMBES', capacidadUtilizada: 0, capacidadMaxima: 135}, {id:192 , geocode: [-80.275024, -3.5006804], popup: 'ZARUMILLA', capacidadUtilizada: 0, capacidadMaxima: 100}];

      oficinas.forEach(oficina => {
        createMarker(
          oficina.geocode,
          `<h1><b>${oficina.popup}</b></h1><h2><b>${oficina.capacidadUtilizada}/${oficina.capacidadMaxima}</b></h2>`,
          oficinaIconHtml
        ); 
      });

      // Agregar marcadores de almacenes
      const almacenes = [
        { geocode: [-77.030495, -12.045919 ], popup: "LIMA" },
        { geocode: [-79.02869, -8.111764], popup: "TRUJILLO" },
        { geocode: [-71.53702, -16.398815], popup: "AREQUIPA" }
      ];

      almacenes.forEach(almacen => {
        createMarker(almacen.geocode, `<h2><b>${almacen.popup}</b></h2>`, almacenIconHtml);
      });

      // Agregar marcadores de camiones y las rutas si es necesario
      if (datos && datos.vehiculos) {
        datos.vehiculos.forEach(vehiculo => {
          createMarker(vehiculo.geocode, `<h2><b>Vehículo</b></h2>`, camionIconHtml);
          if (mostrarRutas === "1" && estadoSimulacion !== "INICIAL") {
            map.addLayer({
              id: `ruta-${vehiculo.id}`,
              type: "line",
              source: {
                type: "geojson",
                data: {
                  type: "Feature",
                  geometry: {
                    type: "LineString",
                    coordinates: [vehiculo.geocode, [-72.66825, -2.4471967]], // Coordenadas ejemplo
                  },
                },
              },
              layout: {},
              paint: {
                "line-color": "purple",
                "line-width": 3,
              },
            });
          }
        });
      }

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

"use client"
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css"
import { Icon } from "leaflet";
import { useEffect, useState } from "react";


export default function MapView() {
  
  const bounds = [[1, -81.4],[-19, -68.0]]

  
  const oficinaIcon = new Icon(
    { 
      iconUrl: `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM0ODI4ZTYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1idWlsZGluZyI+PHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjIwIiB4PSI0IiB5PSIyIiByeD0iMiIgcnk9IjIiLz48cGF0aCBkPSJNOSAyMnYtNGg2djQiLz48cGF0aCBkPSJNOCA2aC4wMSIvPjxwYXRoIGQ9Ik0xNiA2aC4wMSIvPjxwYXRoIGQ9Ik0xMiA2aC4wMSIvPjxwYXRoIGQ9Ik0xMiAxMGguMDEiLz48cGF0aCBkPSJNMTIgMTRoLjAxIi8+PHBhdGggZD0iTTE2IDEwaC4wMSIvPjxwYXRoIGQ9Ik0xNiAxNGguMDEiLz48cGF0aCBkPSJNOCAxMGguMDEiLz48cGF0aCBkPSJNOCAxNGguMDEiLz48L3N2Zz4=`,
      iconSize: [20, 20],
      //className: "bg-blue-600 text-white-100"
       //tamanho del icono
    }
  )

  const almacenIcon = new Icon(
    { 
      iconUrl: `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwODcyM2IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS13YXJlaG91c2UiPjxwYXRoIGQ9Ik0yMiA4LjM1VjIwYTIgMiAwIDAgMS0yIDJINGEyIDIgMCAwIDEtMi0yVjguMzVBMiAyIDAgMCAxIDMuMjYgNi41bDgtMy4yYTIgMiAwIDAgMSAxLjQ4IDBsOCAzLjJBMiAyIDAgMCAxIDIyIDguMzVaIi8+PHBhdGggZD0iTTYgMThoMTIiLz48cGF0aCBkPSJNNiAxNGgxMiIvPjxyZWN0IHdpZHRoPSIxMiIgaGVpZ2h0PSIxMiIgeD0iNiIgeT0iMTAiLz48L3N2Zz4=`,
      iconSize: [20, 20],
      //className: "bg-blue-600 text-white-100"
       //tamanho del icono
    }
  )

  const camionIcon = new Icon(
    { 
      iconUrl: `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNiZjA4MDgiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS10cnVjayI+PHBhdGggZD0iTTE0IDE4VjZhMiAyIDAgMCAwLTItMkg0YTIgMiAwIDAgMC0yIDJ2MTFhMSAxIDAgMCAwIDEgMWgyIi8+PHBhdGggZD0iTTE1IDE4SDkiLz48cGF0aCBkPSJNMTkgMThoMmExIDEgMCAwIDAgMS0xdi0zLjY1YTEgMSAwIDAgMC0uMjItLjYyNGwtMy40OC00LjM1QTEgMSAwIDAgMCAxNy41MiA4SDE0Ii8+PGNpcmNsZSBjeD0iMTciIGN5PSIxOCIgcj0iMiIvPjxjaXJjbGUgY3g9IjciIGN5PSIxOCIgcj0iMiIvPjwvc3ZnPg==`,
      iconSize: [20, 20],
      //className: "bg-blue-600 text-white-100"
       //tamanho del icono
    }
  )

  const camionIconSeleccionado = new Icon(
    { 
      iconUrl: `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNjMjE0NjAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS10cnVjayI+PHBhdGggZD0iTTE0IDE4VjZhMiAyIDAgMCAwLTItMkg0YTIgMiAwIDAgMC0yIDJ2MTFhMSAxIDAgMCAwIDEgMWgyIi8+PHBhdGggZD0iTTE1IDE4SDkiLz48cGF0aCBkPSJNMTkgMThoMmExIDEgMCAwIDAgMS0xdi0zLjY1YTEgMSAwIDAgMC0uMjItLjYyNGwtMy40OC00LjM1QTEgMSAwIDAgMCAxNy41MiA4SDE0Ii8+PGNpcmNsZSBjeD0iMTciIGN5PSIxOCIgcj0iMiIvPjxjaXJjbGUgY3g9IjciIGN5PSIxOCIgcj0iMiIvPjwvc3ZnPg==`,
      iconSize: [20, 20],
      //className: "bg-blue-600 text-white-100"
       //tamanho del icono
    }
  )
  
  const ejemploRuta = [
    [-13.637346, -72.878876],
    [-13.656409, -73.38991],
    [-14.364756, -72.87779],

  ]
  
  
  

  const oficinas = [{geocode: [-13.637346, -72.878876], popup: 'ABANCAY', capacidadUtilizada: 0, capacidadMaxima: 103}, {geocode: [-13.656409, -73.38991], popup: 'ANDAHUAYLAS', capacidadUtilizada: 0, capacidadMaxima: 31}, {geocode: [-14.364756, -72.87779], popup: 'ANTABAMBA', capacidadUtilizada: 0, capacidadMaxima: 30}, {geocode: [-14.294712, -73.24427], popup: 'AYMARAES', capacidadUtilizada: 0, capacidadMaxima: 15}, {geocode: [-13.518027, -73.7228], popup: 'CHINCHEROS', capacidadUtilizada: 0, capacidadMaxima: 94}, {geocode: [-13.946195, -72.174446], popup: 'COTABAMBAS', capacidadUtilizada: 0, capacidadMaxima: 76}, {geocode: [-14.10538, -72.70764], popup: 'GRAU', capacidadUtilizada: 0, capacidadMaxima: 94}, {geocode: [-16.624918, -72.71162], popup: 'CAMANA', capacidadUtilizada: 0, capacidadMaxima: 58}, {geocode: [-15.772139, -73.36541], popup: 'CARAVELI', capacidadUtilizada: 0, capacidadMaxima: 237}, {geocode: [-16.076603, -72.49209], popup: 'CASTILLA', capacidadUtilizada: 0, capacidadMaxima: 158}, {geocode: [-15.636742, -71.60198], popup: 'CAYLLOMA', capacidadUtilizada: 0, capacidadMaxima: 247}, {geocode: [-15.839238, -72.65147], popup: 'CONDESUYOS', capacidadUtilizada: 0, capacidadMaxima: 21}, {geocode: [-17.029276, -72.01544], popup: 'ISLAY', capacidadUtilizada: 0, capacidadMaxima: 139}, {geocode: [-15.212908, -72.88816], popup: 'LA UNION', capacidadUtilizada: 0, capacidadMaxima: 228}, {geocode: [-13.629325, -74.14368], popup: 'CANGALLO', capacidadUtilizada: 0, capacidadMaxima: 37}, {geocode: [-13.160271, -74.22578], popup: 'HUAMANGA', capacidadUtilizada: 0, capacidadMaxima: 66}, {geocode: [-13.919884, -74.333885], popup: 'HUANCA SANCOS', capacidadUtilizada: 0, capacidadMaxima: 20}, {geocode: [-12.939914, -74.247894], popup: 'HUANTA', capacidadUtilizada: 0, capacidadMaxima: 89}, {geocode: [-13.012666, -73.98111], popup: 'LA MAR', capacidadUtilizada: 0, capacidadMaxima: 103}, {geocode: [-14.694042, -74.1242], popup: 'LUCANAS', capacidadUtilizada: 0, capacidadMaxima: 57}, {geocode: [-15.016977, -73.78089], popup: 'PARINACOCHAS', capacidadUtilizada: 0, capacidadMaxima: 32}, {geocode: [-15.278873, -73.34436], popup: 'PAUCAR DEL SARA SARA', capacidadUtilizada: 0, capacidadMaxima: 39}, {geocode: [-14.011257, -73.838844], popup: 'SUCRE', capacidadUtilizada: 0, capacidadMaxima: 85}, {geocode: [-13.752455, -74.0663], popup: 'VICTOR FAJARDO', capacidadUtilizada: 0, capacidadMaxima: 107}, {geocode: [-13.653027, -73.953865], popup: 'VILCAS HUAMAN', capacidadUtilizada: 0, capacidadMaxima: 89}, {geocode: [-13.919203, -71.683495], popup: 'ACOMAYO', capacidadUtilizada: 0, capacidadMaxima: 103}, {geocode: [-13.471593, -72.14879], popup: 'ANTA', capacidadUtilizada: 0, capacidadMaxima: 88}, {geocode: [-13.321749, -71.95605], popup: 'CALCA', capacidadUtilizada: 0, capacidadMaxima: 93}, {geocode: [-14.216944, -71.43203], popup: 'CANAS', capacidadUtilizada: 0, capacidadMaxima: 27}, {geocode: [-14.272991, -71.2265], popup: 'CANCHIS', capacidadUtilizada: 0, capacidadMaxima: 64}, {geocode: [-14.450169, -72.082085], popup: 'CHUMBIVILCAS', capacidadUtilizada: 0, capacidadMaxima: 41}, {geocode: [-13.516702, -71.97876], popup: 'CUSCO', capacidadUtilizada: 0, capacidadMaxima: 56}, {geocode: [-14.793119, -71.41288], popup: 'ESPINAR', capacidadUtilizada: 0, capacidadMaxima: 28}, {geocode: [-12.863322, -72.69288], popup: 'LA CONVENCION', capacidadUtilizada: 0, capacidadMaxima: 107}, {geocode: [-13.761323, -71.84744], popup: 'PARURO', capacidadUtilizada: 0, capacidadMaxima: 46}, {geocode: [-13.317805, -71.596725], popup: 'PAUCARTAMBO', capacidadUtilizada: 0, capacidadMaxima: 21}, {geocode: [-13.687855, -71.62558], popup: 'QUISPICANCHI', capacidadUtilizada: 0, capacidadMaxima: 72}, {geocode: [-13.30593, -72.11599], popup: 'URUBAMBA', capacidadUtilizada: 0, capacidadMaxima: 29}, {geocode: [-12.836182, -71.3589], popup: 'MANU', capacidadUtilizada: 0, capacidadMaxima: 40}, {geocode: [-10.944943, -69.577415], popup: 'TAHUAMANU', capacidadUtilizada: 0, capacidadMaxima: 84}, {geocode: [-12.594216, -69.17625], popup: 'TAMBOPATA', capacidadUtilizada: 0, capacidadMaxima: 82}, {geocode: [-16.673923, -70.970055], popup: 'GENERAL SANCHEZ CERRO', capacidadUtilizada: 0, capacidadMaxima: 20}, {geocode: [-17.645824, -71.345314], popup: 'ILO', capacidadUtilizada: 0, capacidadMaxima: 86}, {geocode: [-17.193804, -70.9347], popup: 'MARISCAL NIETO', capacidadUtilizada: 0, capacidadMaxima: 49}, {geocode: [-14.9085245, -70.19534], popup: 'AZANGARO', capacidadUtilizada: 0, capacidadMaxima: 68}, {geocode: [-14.068453, -70.43136], popup: 'CARABAYA', capacidadUtilizada: 0, capacidadMaxima: 25}, {geocode: [-16.213324, -69.459236], popup: 'CHUCUITO', capacidadUtilizada: 0, capacidadMaxima: 41}, {geocode: [-16.086866, -69.638596], popup: 'EL COLLAO', capacidadUtilizada: 0, capacidadMaxima: 17}, {geocode: [-15.204116, -69.76144], popup: 'HUANCANE', capacidadUtilizada: 0, capacidadMaxima: 112}, {geocode: [-15.364678, -70.367546], popup: 'LAMPA', capacidadUtilizada: 0, capacidadMaxima: 49}, {geocode: [-14.881829, -70.59009], popup: 'MELGAR', capacidadUtilizada: 0, capacidadMaxima: 86}, {geocode: [-15.360712, -69.49989], popup: 'MOHO', capacidadUtilizada: 0, capacidadMaxima: 73}, {geocode: [-15.840612, -70.02801], popup: 'PUNO', capacidadUtilizada: 0, capacidadMaxima: 40}, {geocode: [-14.91416, -69.86856], popup: 'SAN ANTONIO DE PUTINA', capacidadUtilizada: 0, capacidadMaxima: 78}, {geocode: [-15.493232, -70.13554], popup: 'SAN ROMAN', capacidadUtilizada: 0, capacidadMaxima: 57}, {geocode: [-14.323019, -69.46661], popup: 'SANDIA', capacidadUtilizada: 0, capacidadMaxima: 26}, {geocode: [-16.244268, -69.09257], popup: 'YUNGUYO', capacidadUtilizada: 0, capacidadMaxima: 114}, {geocode: [-17.268188, -70.2504], popup: 'CANDARAVE', capacidadUtilizada: 0, capacidadMaxima: 145}, {geocode: [-17.613832, -70.7624], popup: 'JORGE BASADRE', capacidadUtilizada: 0, capacidadMaxima: 139}, {geocode: [-18.0137, -70.25079], popup: 'TACNA', capacidadUtilizada: 0, capacidadMaxima: 41}, {geocode: [-17.474718, -70.03211], popup: 'TARATA', capacidadUtilizada: 0, capacidadMaxima: 164}, {geocode: [-10.729728, -73.75484], popup: 'ATALAYA', capacidadUtilizada: 0, capacidadMaxima: 77}, {geocode: [-8.383243, -74.53224], popup: 'CORONEL PORTILLO', capacidadUtilizada: 0, capacidadMaxima: 57}, {geocode: [-9.036876, -75.50862], popup: 'PADRE ABAD', capacidadUtilizada: 0, capacidadMaxima: 71}, {geocode: [-9.77236, -70.71008], popup: 'PURUS', capacidadUtilizada: 0, capacidadMaxima: 28}, {geocode: [-9.780206, -77.61072], popup: 'AIJA', capacidadUtilizada: 0, capacidadMaxima: 105}, {geocode: [-9.101036, -77.01683], popup: 'ANTONIO RAYMONDI', capacidadUtilizada: 0, capacidadMaxima: 256}, {geocode: [-9.162093, -77.36604], popup: 'ASUNCION', capacidadUtilizada: 0, capacidadMaxima: 23}, {geocode: [-10.152066, -77.1568], popup: 'BOLOGNESI', capacidadUtilizada: 0, capacidadMaxima: 190}, {geocode: [-9.281765, -77.64629], popup: 'CARHUAZ', capacidadUtilizada: 0, capacidadMaxima: 242}, {geocode: [-9.0943575, -77.32913], popup: 'CARLOS FERMIN FITZCARRALD', capacidadUtilizada: 0, capacidadMaxima: 40}, {geocode: [-9.47608, -78.30544], popup: 'CASMA', capacidadUtilizada: 0, capacidadMaxima: 136}, {geocode: [-8.570422, -77.89804], popup: 'CORONGO', capacidadUtilizada: 0, capacidadMaxima: 55}, {geocode: [-9.529975, -77.52886], popup: 'HUARAZ', capacidadUtilizada: 0, capacidadMaxima: 33}, {geocode: [-9.347401, -77.17096], popup: 'HUARI', capacidadUtilizada: 0, capacidadMaxima: 96}, {geocode: [-10.0687065, -78.15227], popup: 'HUARMEY', capacidadUtilizada: 0, capacidadMaxima: 138}, {geocode: [-9.048588, -77.81007], popup: 'HUAYLAS', capacidadUtilizada: 0, capacidadMaxima: 20}, {geocode: [-8.864946, -77.35749], popup: 'MARISCAL LUZURIAGA', capacidadUtilizada: 0, capacidadMaxima: 259}, {geocode: [-10.403464, -77.39679], popup: 'OCROS', capacidadUtilizada: 0, capacidadMaxima: 157}, {geocode: [-8.392909, -78.00902], popup: 'PALLASCA', capacidadUtilizada: 0, capacidadMaxima: 18}, {geocode: [-8.820532, -77.46025], popup: 'POMABAMBA', capacidadUtilizada: 0, capacidadMaxima: 245}, {geocode: [-9.722085, -77.45615], popup: 'RECUAY', capacidadUtilizada: 0, capacidadMaxima: 207}, {geocode: [-9.074542, -78.593575], popup: 'SANTA', capacidadUtilizada: 0, capacidadMaxima: 48}, {geocode: [-8.554587, -77.63122], popup: 'SIHUAS', capacidadUtilizada: 0, capacidadMaxima: 109}, {geocode: [-9.139891, -77.7449], popup: 'YUNGAY', capacidadUtilizada: 0, capacidadMaxima: 61}, {geocode: [-12.060342, -77.14068], popup: 'CALLAO', capacidadUtilizada: 0, capacidadMaxima: 241}, {geocode: [-12.844325, -74.57118], popup: 'ACOBAMBA', capacidadUtilizada: 0, capacidadMaxima: 49}, {geocode: [-12.983049, -74.718544], popup: 'ANGARAES', capacidadUtilizada: 0, capacidadMaxima: 89}, {geocode: [-13.283339, -75.31915], popup: 'CASTROVIRREYNA', capacidadUtilizada: 0, capacidadMaxima: 72}, {geocode: [-12.739259, -74.38756], popup: 'CHURCAMPA', capacidadUtilizada: 0, capacidadMaxima: 94}, {geocode: [-12.787191, -74.9731], popup: 'HUANCAVELICA', capacidadUtilizada: 0, capacidadMaxima: 56}, {geocode: [-13.604421, -75.35307], popup: 'HUAYTARA', capacidadUtilizada: 0, capacidadMaxima: 107}, {geocode: [-12.398792, -74.86842], popup: 'TAYACAJA', capacidadUtilizada: 0, capacidadMaxima: 34}, {geocode: [-10.12923, -76.20446], popup: 'AMBO', capacidadUtilizada: 0, capacidadMaxima: 103}, {geocode: [-9.828532, -76.8013], popup: 'DOS DE MAYO', capacidadUtilizada: 0, capacidadMaxima: 78}, {geocode: [-9.037866, -76.952614], popup: 'HUACAYBAMBA', capacidadUtilizada: 0, capacidadMaxima: 73}, {geocode: [-9.550005, -76.815575], popup: 'HUAMALIES', capacidadUtilizada: 0, capacidadMaxima: 19}, {geocode: [-9.929545, -76.23965], popup: 'HUANUCO', capacidadUtilizada: 0, capacidadMaxima: 53}, {geocode: [-10.078058, -76.631615], popup: 'LAURICOCHA', capacidadUtilizada: 0, capacidadMaxima: 25}, {geocode: [-9.298381, -76.00028], popup: 'LEONCIO PRADO', capacidadUtilizada: 0, capacidadMaxima: 22}, {geocode: [-8.604393, -77.14935], popup: 'MARAÑON', capacidadUtilizada: 0, capacidadMaxima: 42}, {geocode: [-9.897476, -75.99429], popup: 'PACHITEA', capacidadUtilizada: 0, capacidadMaxima: 47}, {geocode: [-9.379358, -74.96594], popup: 'PUERTO INCA', capacidadUtilizada: 0, capacidadMaxima: 59}, {geocode: [-9.858744, -76.6084], popup: 'YAROWILCA', capacidadUtilizada: 0, capacidadMaxima: 73}, {geocode: [-13.417593, -76.13261], popup: 'CHINCHA', capacidadUtilizada: 0, capacidadMaxima: 222}, {geocode: [-14.063935, -75.7292], popup: 'ICA', capacidadUtilizada: 0, capacidadMaxima: 19}, {geocode: [-14.827559, -74.93705], popup: 'NASCA', capacidadUtilizada: 0, capacidadMaxima: 84}, {geocode: [-14.533749, -75.185135], popup: 'PALPA', capacidadUtilizada: 0, capacidadMaxima: 24}, {geocode: [-13.709894, -76.20321], popup: 'PISCO', capacidadUtilizada: 0, capacidadMaxima: 238}, {geocode: [-11.055986, -75.3282], popup: 'CHANCHAMAYO', capacidadUtilizada: 0, capacidadMaxima: 32}, {geocode: [-12.061711, -75.28762], popup: 'CHUPACA', capacidadUtilizada: 0, capacidadMaxima: 38}, {geocode: [-11.918462, -75.312965], popup: 'CONCEPCION', capacidadUtilizada: 0, capacidadMaxima: 60}, {geocode: [-12.067959, -75.21005], popup: 'HUANCAYO', capacidadUtilizada: 0, capacidadMaxima: 66}, {geocode: [-11.775216, -75.50053], popup: 'JAUJA', capacidadUtilizada: 0, capacidadMaxima: 25}, {geocode: [-11.161042, -75.99308], popup: 'JUNIN', capacidadUtilizada: 0, capacidadMaxima: 46}, {geocode: [-11.253902, -74.637], popup: 'SATIPO', capacidadUtilizada: 0, capacidadMaxima: 35}, {geocode: [-11.419918, -75.68777], popup: 'TARMA', capacidadUtilizada: 0, capacidadMaxima: 42}, {geocode: [-11.516594, -75.90004], popup: 'YAULI', capacidadUtilizada: 0, capacidadMaxima: 62}, {geocode: [-10.7540245, -77.760796], popup: 'BARRANCA', capacidadUtilizada: 0, capacidadMaxima: 225}, {geocode: [-10.472683, -76.993004], popup: 'CAJATAMBO', capacidadUtilizada: 0, capacidadMaxima: 19}, {geocode: [-11.46702, -76.62474], popup: 'CANTA', capacidadUtilizada: 0, capacidadMaxima: 94}, {geocode: [-13.07775, -76.38743], popup: 'CAÑETE', capacidadUtilizada: 0, capacidadMaxima: 137}, {geocode: [-11.495407, -77.207184], popup: 'HUARAL', capacidadUtilizada: 0, capacidadMaxima: 67}, {geocode: [-11.844765, -76.38606], popup: 'HUAROCHIRI', capacidadUtilizada: 0, capacidadMaxima: 151}, {geocode: [-11.108553, -77.610405], popup: 'HUAURA', capacidadUtilizada: 0, capacidadMaxima: 19}, {geocode: [-10.668103, -76.77306], popup: 'OYON', capacidadUtilizada: 0, capacidadMaxima: 232}, {geocode: [-12.459734, -75.918686], popup: 'YAUYOS', capacidadUtilizada: 0, capacidadMaxima: 222}, {geocode: [-10.491333, -76.516624], popup: 'DANIEL ALCIDES CARRION', capacidadUtilizada: 0, capacidadMaxima: 106}, {geocode: [-10.574283, -75.404625], popup: 'OXAPAMPA', capacidadUtilizada: 0, capacidadMaxima: 71}, {geocode: [-10.683662, -76.25618], popup: 'PASCO', capacidadUtilizada: 0, capacidadMaxima: 104}, {geocode: [-5.6390615, -78.53166], popup: 'BAGUA', capacidadUtilizada: 0, capacidadMaxima: 72}, {geocode: [-5.904324, -77.798096], popup: 'BONGARA', capacidadUtilizada: 0, capacidadMaxima: 84}, {geocode: [-6.2294083, -77.87244], popup: 'CHACHAPOYAS', capacidadUtilizada: 0, capacidadMaxima: 31}, {geocode: [-4.592347, -77.86448], popup: 'CONDORCANQUI', capacidadUtilizada: 0, capacidadMaxima: 56}, {geocode: [-6.139032, -77.95196], popup: 'LUYA', capacidadUtilizada: 0, capacidadMaxima: 37}, {geocode: [-6.395907, -77.4822], popup: 'RODRIGUEZ DE MENDOZA', capacidadUtilizada: 0, capacidadMaxima: 94}, {geocode: [-5.7544174, -78.4422], popup: 'UTCUBAMBA', capacidadUtilizada: 0, capacidadMaxima: 86}, {geocode: [-7.6237435, -78.046005], popup: 'CAJABAMBA', capacidadUtilizada: 0, capacidadMaxima: 44}, {geocode: [-7.1570687, -78.517525], popup: 'CAJAMARCA', capacidadUtilizada: 0, capacidadMaxima: 86}, {geocode: [-6.8655324, -78.14556], popup: 'CELENDIN', capacidadUtilizada: 0, capacidadMaxima: 19}, {geocode: [-6.5615745, -78.650246], popup: 'CHOTA', capacidadUtilizada: 0, capacidadMaxima: 33}, {geocode: [-7.3661294, -78.80463], popup: 'CONTUMAZA', capacidadUtilizada: 0, capacidadMaxima: 97}, {geocode: [-6.3773556, -78.81831], popup: 'CUTERVO', capacidadUtilizada: 0, capacidadMaxima: 31}, {geocode: [-6.679542, -78.51914], popup: 'HUALGAYOC', capacidadUtilizada: 0, capacidadMaxima: 42}, {geocode: [-5.708803, -78.80782], popup: 'JAEN', capacidadUtilizada: 0, capacidadMaxima: 61}, {geocode: [-5.1462502, -79.004974], popup: 'SAN IGNACIO', capacidadUtilizada: 0, capacidadMaxima: 34}, {geocode: [-7.3360686, -78.17047], popup: 'SAN MARCOS', capacidadUtilizada: 0, capacidadMaxima: 38}, {geocode: [-7.0004487, -78.85143], popup: 'SAN MIGUEL', capacidadUtilizada: 0, capacidadMaxima: 49}, {geocode: [-7.1183414, -78.82337], popup: 'SAN PABLO', capacidadUtilizada: 0, capacidadMaxima: 100}, {geocode: [-6.6261396, -78.94439], popup: 'SANTA CRUZ', capacidadUtilizada: 0, capacidadMaxima: 77}, {geocode: [-7.7137904, -79.10751], popup: 'ASCOPE', capacidadUtilizada: 0, capacidadMaxima: 24}, {geocode: [-7.153872, -77.70264], popup: 'BOLIVAR', capacidadUtilizada: 0, capacidadMaxima: 132}, {geocode: [-7.227289, -79.429634], popup: 'CHEPEN', capacidadUtilizada: 0, capacidadMaxima: 103}, {geocode: [-7.479456, -78.81942], popup: 'GRAN CHIMU', capacidadUtilizada: 0, capacidadMaxima: 214}, {geocode: [-8.042529, -78.48663], popup: 'JULCAN', capacidadUtilizada: 0, capacidadMaxima: 198}, {geocode: [-7.902503, -78.5657], popup: 'OTUZCO', capacidadUtilizada: 0, capacidadMaxima: 209}, {geocode: [-7.4320564, -79.50428], popup: 'PACASMAYO', capacidadUtilizada: 0, capacidadMaxima: 129}, {geocode: [-8.275935, -77.29632], popup: 'PATAZ', capacidadUtilizada: 0, capacidadMaxima: 148}, {geocode: [-7.815552, -78.04862], popup: 'SANCHEZ CARRION', capacidadUtilizada: 0, capacidadMaxima: 256}, {geocode: [-8.145368, -78.17327], popup: 'SANTIAGO DE CHUCO', capacidadUtilizada: 0, capacidadMaxima: 147}, {geocode: [-8.414277, -78.75222], popup: 'VIRU', capacidadUtilizada: 0, capacidadMaxima: 204}, {geocode: [-6.771505, -79.83866], popup: 'CHICLAYO', capacidadUtilizada: 0, capacidadMaxima: 62}, {geocode: [-6.639227, -79.78804], popup: 'FERREÑAFE', capacidadUtilizada: 0, capacidadMaxima: 40}, {geocode: [-6.704108, -79.90621], popup: 'LAMBAYEQUE', capacidadUtilizada: 0, capacidadMaxima: 79}, {geocode: [-5.895269, -76.10441], popup: 'ALTO AMAZONAS', capacidadUtilizada: 0, capacidadMaxima: 47}, {geocode: [-4.8315687, -76.55451], popup: 'DATEM DEL MARAÑON', capacidadUtilizada: 0, capacidadMaxima: 28}, {geocode: [-4.506616, -73.57546], popup: 'LORETO', capacidadUtilizada: 0, capacidadMaxima: 64}, {geocode: [-3.9059913, -70.51679], popup: 'MARISCAL RAMON CASTILLA', capacidadUtilizada: 0, capacidadMaxima: 75}, {geocode: [-3.749346, -73.24437], popup: 'MAYNAS', capacidadUtilizada: 0, capacidadMaxima: 25}, {geocode: [-2.4471967, -72.66825], popup: 'PUTUMAYO', capacidadUtilizada: 0, capacidadMaxima: 66}, {geocode: [-5.063693, -73.856384], popup: 'REQUENA', capacidadUtilizada: 0, capacidadMaxima: 16}, {geocode: [-7.3505206, -75.00906], popup: 'UCAYALI', capacidadUtilizada: 0, capacidadMaxima: 19}, {geocode: [-4.640226, -79.71523], popup: 'AYABACA', capacidadUtilizada: 0, capacidadMaxima: 214}, {geocode: [-5.2390018, -79.45062], popup: 'HUANCABAMBA', capacidadUtilizada: 0, capacidadMaxima: 259}, {geocode: [-5.096551, -80.16085], popup: 'MORROPON', capacidadUtilizada: 0, capacidadMaxima: 99}, {geocode: [-5.085127, -81.11367], popup: 'PAITA', capacidadUtilizada: 0, capacidadMaxima: 162}, {geocode: [-5.197164, -80.62655], popup: 'PIURA', capacidadUtilizada: 0, capacidadMaxima: 51}, {geocode: [-5.557545, -80.82227], popup: 'SECHURA', capacidadUtilizada: 0, capacidadMaxima: 128}, {geocode: [-4.8900437, -80.68738], popup: 'SULLANA', capacidadUtilizada: 0, capacidadMaxima: 254}, {geocode: [-4.579691, -81.27182], popup: 'TALARA', capacidadUtilizada: 0, capacidadMaxima: 120}, {geocode: [-7.066871, -76.5847], popup: 'BELLAVISTA', capacidadUtilizada: 0, capacidadMaxima: 17}, {geocode: [-6.613914, -76.69486], popup: 'EL DORADO', capacidadUtilizada: 0, capacidadMaxima: 39}, {geocode: [-6.9364114, -76.77185], popup: 'HUALLAGA', capacidadUtilizada: 0, capacidadMaxima: 67}, {geocode: [-6.421838, -76.51618], popup: 'LAMAS', capacidadUtilizada: 0, capacidadMaxima: 89}, {geocode: [-7.1804104, -76.72644], popup: 'MARISCAL CACERES', capacidadUtilizada: 0, capacidadMaxima: 71}, {geocode: [-6.034669, -76.97467], popup: 'MOYOBAMBA', capacidadUtilizada: 0, capacidadMaxima: 30}, {geocode: [-6.9206414, -76.3303], popup: 'PICOTA', capacidadUtilizada: 0, capacidadMaxima: 53}, {geocode: [-6.0626082, -77.16777], popup: 'RIOJA', capacidadUtilizada: 0, capacidadMaxima: 75}, {geocode: [-6.487717, -76.35982], popup: 'SAN MARTIN', capacidadUtilizada: 0, capacidadMaxima: 26}, {geocode: [-8.188648, -76.510315], popup: 'TOCACHE', capacidadUtilizada: 0, capacidadMaxima: 41}, {geocode: [-3.6806676, -80.676285], popup: 'CONTRALMIRANTE VILLAR', capacidadUtilizada: 0, capacidadMaxima: 231}, {geocode: [-3.570834, -80.45957], popup: 'TUMBES', capacidadUtilizada: 0, capacidadMaxima: 135}, {geocode: [-3.5006804, -80.275024], popup: 'ZARUMILLA', capacidadUtilizada: 0, capacidadMaxima: 100}]
  const almacenes = [{geocode: [-12.045919, -77.030495], popup: 'LIMA'}, {geocode: [-8.111764, -79.02869], popup: 'TRUJILLO'}, {geocode: [-16.398815, -71.53702], popup: 'AREQUIPA'}]
  const camiones = [{geocode: [-12.045919, -77.030495]},{geocode: [-12.045919, -77.030495]},{geocode: [-12.045919, -77.030495]},{geocode: [-12.045919, -77.030495]},{geocode: [-12.045919, -77.030495]},{geocode: [-12.045919, -77.030495]},{geocode: [-12.045919, -77.030495]},{geocode: [-12.045919, -77.030495]},{geocode: [-12.045919, -77.030495]},{geocode: [-12.045919, -77.030495]},{geocode: [-12.045919, -77.030495]},{geocode: [-12.045919, -77.030495]},{geocode: [-12.045919, -77.030495]},{geocode: [-12.045919, -77.030495]},{geocode: [-12.045919, -77.030495]},{geocode: [-12.045919, -77.030495]},{geocode: [-12.045919, -77.030495]},{geocode: [-12.045919, -77.030495]},{geocode: [-12.045919, -77.030495]},{geocode: [-12.045919, -77.030495]},{geocode: [-12.045919, -77.030495]},{geocode: [-8.111764, -79.02869]},{geocode: [-8.111764, -79.02869]},{geocode: [-8.111764, -79.02869]},{geocode: [-8.111764, -79.02869]},{geocode: [-8.111764, -79.02869]},{geocode: [-8.111764, -79.02869]},{geocode: [-8.111764, -79.02869]},{geocode: [-8.111764, -79.02869]},{geocode: [-8.111764, -79.02869]},{geocode: [-8.111764, -79.02869]},{geocode: [-16.398815, -71.53702]},{geocode: [-16.398815, -71.53702]},{geocode: [-16.398815, -71.53702]},{geocode: [-16.398815, -71.53702]},{geocode: [-16.398815, -71.53702]},{geocode: [-16.398815, -71.53702]},{geocode: [-16.398815, -71.53702]},{geocode: [-16.398815, -71.53702]},{geocode: [-16.398815, -71.53702]},{geocode: [-16.398815, -71.53702]},{geocode: [-16.398815, -71.53702]},{geocode: [-16.398815, -71.53702]},{geocode: [-16.398815, -71.53702]},{geocode: [-16.398815, -71.53702]}]

  const camionSeleccionado = {geocode: [-12.045919, -77.030495]}
  const destinoSeleccionado = {geocode: [-8.414277, -78.75222]}
  
  const [ubicacionCamionSeleccionado, setUbicacionCamionSeleccionado] = useState(camionSeleccionado.geocode)

  useEffect(()=>{
    const intervalId = setInterval(()=>{
      setUbicacionCamionSeleccionado((current)=>(current=[current[0], current[1]+0.001]))
      console.log(ubicacionCamionSeleccionado)
    }, 1)
    return () => clearInterval(intervalId)
  }, []);



  return (
  <div className="w-full h-full relative">
    <MapContainer
    center={[-20, -70]}
    zoom={7}
    scrollWheelZoom={true}
    dragging={true}
    maxBounds={bounds}
    minZoom={6}
    maxBoundsViscosity={1}
    className="z-0"
    >
    
    <TileLayer
        attribution='OPEN STREET MAP'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
    />
    {
        oficinas.map((oficina)=>
            <Marker
            position={oficina.geocode}
            icon={oficinaIcon}
            >
            <Popup>
                <h1><b>{oficina.popup}</b></h1>
                <h2><b>{oficina.capacidadUtilizada}/{oficina.capacidadMaxima}</b></h2>
                
            </Popup>
        </Marker> 
        )
    }

    {
        almacenes.map((almacen)=>
            <Marker
            position={almacen.geocode}
            icon={almacenIcon}
            >
            <Popup>
                <h2><b>{almacen.popup}</b></h2>
            </Popup>
        </Marker> 
        )
    }

    {
        camiones.map((camion)=>
            <Marker
            position={camion.geocode}
            icon={camionIcon}
            >
            <Popup>
                <h2><b>CAMION</b></h2>
            </Popup>
        </Marker> 
        )
    }
        <Marker
            position={ubicacionCamionSeleccionado}
            icon={camionIconSeleccionado}
        ></Marker>



        <Polyline pathOptions={{color:'purple'}} positions={ejemploRuta}/>
        <Polyline pathOptions={{color:'purple'}} positions={[camionSeleccionado.geocode, destinoSeleccionado.geocode]}/>

    </MapContainer>
  </div>
  );
}

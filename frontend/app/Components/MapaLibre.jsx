"use client";
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';
import { useEffect, useRef } from 'react';

export default function MapaLibre(){
  const mapContainer = useRef(null);
  const map = useRef(null);
  const lng = 139.753;
  const lat = 35.6844;
  const zoom = 14;
  const API_KEY = 'i1ya2uBOpNFu9czrsnbD';

  useEffect(() => {
    if (map.current) return;
    
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${API_KEY}`,
      center: [lng, lat],
      zoom: zoom
    });
    let marker = new Marker({
        color: "#FFFFFF",
        draggable: true
      }).setLngLat([30.5, 50.5])
      .addTo(map);
    
  }, [API_KEY, lng, lat, zoom]);

  return (
    <div className="map-wrap">
      <div ref={mapContainer} className="map" style={{ width: '100%', height: '500px' }} />
    </div>
  );
}

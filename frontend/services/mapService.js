// services/mapService.js
import maplibregl from 'maplibre-gl';
import { CenterControl } from '../app/Components/controls/CenterControl';
import 'maplibre-gl/dist/maplibre-gl.css';

export class MapService {
  constructor(container, options = {}) {
    this.map = new maplibregl.Map({
      container,
      style: 'https://api.maptiler.com/maps/openstreetmap/style.json?key=i1ya2uBOpNFu9czrsnbD',
      center: [-76.991, -12.046],
      zoom: 6,
      attributionControl: false,
      ...options
    });

    this.sources = new Map();
    this.layers = new Set();
    this.popups = new Map();
    this.imageLoadQueue = new Map();
    
    // Esperar a que el estilo esté cargado antes de configurar controles
    this.map.on('style.load', () => {
      this.setupControls();
      // Procesar cola de imágenes pendientes
      this.processImageQueue();
    });
  }

  setupControls() {
    this.map.addControl(new maplibregl.NavigationControl(), 'bottom-right');
    this.map.addControl(new CenterControl(), 'bottom-right');
  }

  async loadImage(name, url) {
    return new Promise((resolve, reject) => {
      // Si el estilo no está cargado, agregar a la cola
      if (!this.map.isStyleLoaded()) {
        this.imageLoadQueue.set(name, { url, resolve, reject });
        return;
      }

      // Proceder con la carga si el estilo está listo
      this.loadImageImmediately(name, url).then(resolve).catch(reject);
    });
  }

  async loadImageImmediately(name, url) {
    try {
      // Verificar si la imagen ya existe
      if (this.map.hasImage(name)) {
        return;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const imageBitmap = await createImageBitmap(blob);
      
      // Verificar nuevamente antes de agregar
      if (!this.map.hasImage(name)) {
        this.map.addImage(name, imageBitmap);
      }
    } catch (error) {
      console.error(`Error loading image ${name}:`, error);
      throw error;
    }
  }

  async processImageQueue() {
    for (const [name, { url, resolve, reject }] of this.imageLoadQueue) {
      try {
        await this.loadImageImmediately(name, url);
        resolve();
      } catch (error) {
        reject(error);
      }
      this.imageLoadQueue.delete(name);
    }
  }

  addSource(id, options) {
    if (!this.sources.has(id)) {
      this.map.addSource(id, options);
      this.sources.set(id, options);
    }
  }

  addLayer(layer) {
    if (!this.layers.has(layer.id)) {
      this.map.addLayer(layer);
      this.layers.add(layer.id);
    }
  }

  setSourceData(sourceId, data) {
    const source = this.map.getSource(sourceId);
    if (source) {
      source.setData(data);
    }
  }

  cleanup() {
    this.popups.forEach(popup => popup.remove());
    this.popups.clear();
    this.map.remove();
  }

  // Método para verificar si el mapa está listo
  isReady() {
    return this.map.isStyleLoaded();
  }

  // Método para esperar a que el mapa esté listo
  waitUntilReady() {
    return new Promise((resolve) => {
      if (this.isReady()) {
        resolve();
      } else {
        this.map.once('style.load', resolve);
      }
    });
  }
}
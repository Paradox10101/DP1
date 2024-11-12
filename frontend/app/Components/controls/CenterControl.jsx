export class CenterControl {
    onAdd(map) {
      this.map = map;
      this.container = document.createElement('button');
      this.container.className = 'maplibregl-ctrl-icon';
      this.container.type = 'button';
      this.container.title = 'Centrar mapa en Perú';
      this.container.style.cssText = `
        background-image: url('data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
          <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 0l3 6h6l-5 4 2 6-6-4-6 4 2-6-5-4h6z" fill="#000"/>
          </svg>
        `)}');
        background-size: 18px;
        border: none;
        cursor: pointer;
      `;
  
      this.container.onclick = () => {
        map.flyTo({ center: [-76.991, -12.046], zoom: 6 });
      };
  
      return this.container;
    }
  
    onRemove() {
      this.container.parentNode.removeChild(this.container);
      this.map = undefined;
    }
}
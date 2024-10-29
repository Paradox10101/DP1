export class WebSocketService {
    constructor(url, options = {}) {
      this.url = url;
      this.options = {
        maxReconnectAttempts: 5,
        reconnectDelay: 3000,
        ...options
      };
      this.reconnectAttempts = 0;
      this.handlers = new Map();
    }
  
    connect() {
      this.ws = new WebSocket(this.url);
      this.setupEventHandlers();
    }
  
    setupEventHandlers() {
      this.ws.onopen = () => this.handleOpen();
      this.ws.onmessage = (event) => this.handleMessage(event);
      this.ws.onclose = () => this.handleClose();
      this.ws.onerror = (error) => this.handleError(error);
    }
  
    handleOpen() {
      this.reconnectAttempts = 0;
      this.notifyHandlers('open');
    }
  
    handleMessage(event) {
      try {
        const data = JSON.parse(event.data);
        this.notifyHandlers('message', data);
      } catch (error) {
        this.notifyHandlers('error', error);
      }
    }
  
    handleClose() {
      this.notifyHandlers('close');
      this.attemptReconnect();
    }
  
    handleError(error) {
      this.notifyHandlers('error', error);
    }
  
    attemptReconnect() {
      if (this.reconnectAttempts < this.options.maxReconnectAttempts) {
        setTimeout(() => {
          this.reconnectAttempts++;
          this.connect();
        }, this.options.reconnectDelay);
      } else {
        this.notifyHandlers('maxReconnectAttemptsReached');
      }
    }
  
    addHandler(event, handler) {
      if (!this.handlers.has(event)) {
        this.handlers.set(event, new Set());
      }
      this.handlers.get(event).add(handler);
    }
  
    removeHandler(event, handler) {
      const handlers = this.handlers.get(event);
      if (handlers) {
        handlers.delete(handler);
      }
    }
  
    notifyHandlers(event, data) {
      const handlers = this.handlers.get(event);
      if (handlers) {
        handlers.forEach(handler => handler(data));
      }
    }
  
    disconnect() {
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
    }
  }
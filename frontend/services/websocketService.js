// services/websocketService.js
export class WebSocketService {
  constructor(url, options = {}) {
    this.url = url;
    this.options = {
      reconnectAttempts: 5,
      reconnectInterval: 3000,
      onOpen: () => {},
      onClose: () => {},
      onMessage: () => {},
      onError: () => {},
      ...options
    };
    this.ws = null;
    this.reconnectCount = 0;
    this.isConnecting = false;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) return;

    this.isConnecting = true;
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.isConnecting = false;
      this.reconnectCount = 0;
      this.options.onOpen();
    };

    this.ws.onclose = (event) => {
      this.isConnecting = false;
      this.options.onClose(event);
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      this.isConnecting = false;
      this.options.onError(error);
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.options.onMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  }

  attemptReconnect() {
    if (this.reconnectCount >= this.options.reconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    setTimeout(() => {
      this.reconnectCount++;
      this.connect();
    }, this.options.reconnectInterval);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
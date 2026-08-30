import { PredictionResponse } from '../types';

export class LiveStreamClient {
  private ws: WebSocket | null = null;
  private onResultCallback: ((res: PredictionResponse) => void) | null = null;
  private onErrorCallback: ((err: any) => void) | null = null;
  public isConnecting = false;
  private isClosedManually = false;

  constructor(
    onResult: (res: PredictionResponse) => void,
    onError?: (err: any) => void
  ) {
    this.onResultCallback = onResult;
    this.onErrorCallback = onError || null;
  }

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isClosedManually = false;
    this.isConnecting = true;

    let wsUrl: string;
    if (import.meta.env.VITE_WS_URL) {
      wsUrl = import.meta.env.VITE_WS_URL;
    } else if (import.meta.env.VITE_API_URL) {
      const apiUrl = new URL(import.meta.env.VITE_API_URL);
      const wsProto = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${wsProto}//${apiUrl.host}/api/ws/stream`;
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      wsUrl = `${protocol}//${host}/api/ws/stream`;
    }

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
      };

      this.ws.onmessage = (event) => {
        try {
          const data: PredictionResponse = JSON.parse(event.data);
          if (this.onResultCallback) {
            this.onResultCallback(data);
          }
        } catch (e) {
          console.error('[WebSocket] Failed to parse message:', e);
        }
      };

      this.ws.onerror = (err) => {
        if (this.onErrorCallback) {
          this.onErrorCallback(err);
        }
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        if (!this.isClosedManually) {
          // Reconnect with backoff
          setTimeout(() => {
            if (!this.isClosedManually) {
              this.connect();
            }
          }, 2000);
        }
      };
    } catch (err) {
      this.isConnecting = false;
      if (this.onErrorCallback) this.onErrorCallback(err);
    }
  }

  public sendFrame(payload: {
    image_base64: string;
    session_uuid?: string;
    smoothing?: boolean;
    return_landmarks?: boolean;
    save_record?: boolean;
  }) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }

  public disconnect() {
    this.isClosedManually = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public get isOpen(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

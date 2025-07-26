import { useEffect, useRef, useCallback, useState } from "react";

type Message =
  | { type: "ping" }
  | { type: "pong" }
  | { type: "chat"; message: string }
  | { type: "user_joined"; userId: string };

type OutgoingMessage =
  | { type: "chat"; message: string }
  | { type: "ping" };

interface UseWebSocketOptions {
  url: string;
  onMessage: (msg: Message) => void;
  heartbeatInterval?: number;
  reconnectMaxDelay?: number;
  reconnectAttempts?: number;
  authToken?: string;
}

interface UseWebSocketReturn {
  send: (msg: OutgoingMessage) => void;
  connected: boolean;
  disconnect: () => void;
}

  /**
   * Establishes a WebSocket connection to the given URL and handles
   * automatic reconnects. The connection is also kept alive by sending
   * periodic ping messages.
   *
   * @param {UseWebSocketOptions} options
   * @prop {string} options.url - The URL to connect to
   * @prop {(msg: Message) => void} options.onMessage - The callback for incoming messages
   * @prop {number} [options.heartbeatInterval=30000] - The interval at which to send ping messages
   * @prop {number} [options.reconnectMaxDelay=30000] - The maximum delay between reconnect attempts
   * @prop {number} [options.reconnectAttempts=Infinity] - The number of times to attempt reconnecting
   * @prop {string} [options.authToken] - An optional authentication token to pass as a query parameter
   *
   * @returns {UseWebSocketReturn}
   * @prop {(msg: OutgoingMessage) => void} send - A function to send messages to the server
   * @prop {boolean} connected - Whether or not the connection is currently active
   * @prop {() => void} disconnect - A function to disconnect the WebSocket and prevent reconnects
   */
export const useWebSocket = ({
  url,
  onMessage,
  heartbeatInterval = 30000,
  reconnectMaxDelay = 30000,
  reconnectAttempts = Infinity,
  authToken,
}: UseWebSocketOptions): UseWebSocketReturn => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef(0);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const [connected, setConnected] = useState(false);
  const messageQueue = useRef<OutgoingMessage[]>([]);

  const clearHeartbeat = () => {
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
  };

  const startHeartbeat = () => {
    clearHeartbeat();
    heartbeatRef.current = setInterval(() => {
      send({ type: "ping" });
    }, heartbeatInterval);
  };

  const send = useCallback((msg: OutgoingMessage) => {
    const ws = wsRef.current;
    const serialized = JSON.stringify(msg);
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(serialized);
    } else {
      messageQueue.current.push(msg);
    }
  }, []);

  const connect = useCallback(() => {
    const fullUrl = authToken ? `${url}?token=${authToken}` : url;
    const ws = new WebSocket(fullUrl);

    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      reconnectRef.current = 0;
      startHeartbeat();

      messageQueue.current.forEach((msg) => ws.send(JSON.stringify(msg)));
      messageQueue.current = [];
    };

    ws.onmessage = (event) => {
      try {
        const parsed: Message = JSON.parse(event.data);
        if (parsed.type !== 'pong') onMessage(parsed);
      } catch (err) {
        console.error("Failed to parse WebSocket message", err);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      clearHeartbeat();

      if (reconnectRef.current < reconnectAttempts) {
        const delay = Math.min(1000 * 2 ** reconnectRef.current, reconnectMaxDelay);
        reconnectRef.current++;
        setTimeout(connect, delay);
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket error", err);
      ws.close();
    };
  }, [url, authToken, onMessage, heartbeatInterval]);

  useEffect(() => {
    connect();
    return () => {
      clearHeartbeat();
      wsRef.current?.close();
    };
  }, [connect]);

  return {
    send,
    connected,
    disconnect: () => wsRef.current?.close(),
  };
}

// TODO: Sample usage
// const { send, connected, disconnect } = useWebSocket({
//   onMessage: (msg) => {},
//   authToken: "YOUR_AUTH_TOKEN",
//   url: "wss://example.com/ws/chat",
// });

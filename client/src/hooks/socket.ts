import { useEffect, useRef, useCallback, useState } from "react"

type Message =
  | { type: "ping" }
  | { type: "pong" }
  | { type: "chat"; message: string }
  | { type: "user_joined"; userId: string }
  | { type: "tts_start"; message: string }
  | { type: "tts_chunk"; message: string }
  | { type: "tts_complete"; message: string }
  | { type: "transcription"; message: string }
  | { type: "ai_response"; message: string }

type OutgoingMessage =
  | { type: "chat"; message: string }
  | { type: "ping" }
  | { type: "audio_chunk"; message: string }
  | { type: "recording_start"; message: string }
  | { type: "recording_end"; message: string }

interface UseWebSocketOptions {
  url: string
  onMessage: (msg: Message) => Promise<void>
  heartbeatInterval?: number
  reconnectMaxDelay?: number
  reconnectAttempts?: number
  authToken?: string
}

interface UseWebSocketReturn {
  send: (msg: OutgoingMessage) => void
  connected: boolean
  disconnect: () => void
}

/**
 * A React hook for creating a WebSocket connection that reconnects automatically.
 *
 * @param {UseWebSocketOptions} options - WebSocket options.
 * @param {string} options.url - URL of the WebSocket server.
 * @param {(msg: Message) => void} options.onMessage - Callback for incoming messages.
 * @param {number} [options.heartbeatInterval] - Interval in ms for sending a heartbeat.
 * @param {number} [options.reconnectMaxDelay] - Maximum delay in ms between reconnect attempts.
 * @param {number} [options.reconnectAttempts] - Maximum number of reconnect attempts.
 * @param {string} [options.authToken] - Optional authentication token to send with the WebSocket connection.
 *
 * @returns {UseWebSocketReturn}
 * @returns {() => void} send - Send a message to the WebSocket server.
 * @returns {boolean} connected - WebSocket connection status.
 * @returns {() => void} disconnect - Disconnect the WebSocket connection.
 */
export const useWebSocket = ({
  url,
  onMessage,
  heartbeatInterval = 30000,
  reconnectMaxDelay = 30000,
  reconnectAttempts = 3,
  authToken,
}: UseWebSocketOptions): UseWebSocketReturn => {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef(0)
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const messageQueue = useRef<OutgoingMessage[]>([])
  const isManuallyDisconnected = useRef(false)
  const onMessageRef = useRef<(msg: Message) => Promise<void>>(onMessage)
  const strictModeFirstRender = useRef<boolean>(true)
  const prevConnectionParams = useRef({ url, authToken })

  const [connected, setConnected] = useState(false)

  onMessageRef.current = onMessage

  const clearHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
      heartbeatRef.current = null
    }
  }, [])

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }, [])

  const startHeartbeat = useCallback(() => {
    clearHeartbeat()
    heartbeatRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping" }))
      }
    }, heartbeatInterval)
  }, [heartbeatInterval, clearHeartbeat])

  const send = useCallback((msg: OutgoingMessage) => {
    const serialized = JSON.stringify(msg)
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(serialized)
    } else {
      messageQueue.current.push(msg)
    }
  }, [])

  const connectWebSocket = useCallback(() => {
    if (isManuallyDisconnected.current) return
    
    clearReconnectTimeout()
    
    const fullUrl = authToken ? `${url}?token=${authToken}` : url
    
    try {
      const ws = new WebSocket(fullUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected')
        setConnected(true)
        reconnectRef.current = 0
        startHeartbeat()

        const queuedMessages = [...messageQueue.current]
        messageQueue.current = []
        queuedMessages.forEach((msg) => {
          ws.send(JSON.stringify(msg))
        })
      }

      ws.onmessage = async (event) => {
        try {
          const parsed: Message = JSON.parse(event.data)
          if (parsed.type !== 'pong') {
            // Use the ref to get the latest callback
            await onMessageRef.current(parsed)
          }
        } catch (err) {
          console.error("Failed to parse WebSocket message", err)
        }
      }

      ws.onclose = (event) => {
        console.log('WebSocket closed', event.code, event.reason)
        setConnected(false)
        clearHeartbeat()
        wsRef.current = null

        if (!isManuallyDisconnected.current && reconnectRef.current < reconnectAttempts) {
          reconnectRef.current++
          const delay = Math.min(1000 * 2 ** (reconnectRef.current - 1), reconnectMaxDelay)
          
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectRef.current})`)
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket()
          }, delay)
        }
      }

      ws.onerror = (err) => {
        console.error("WebSocket error", err)
      }

    } catch (err) {
      console.error("Failed to create WebSocket", err)
      if (!isManuallyDisconnected.current && reconnectRef.current < reconnectAttempts) {
        reconnectRef.current++
        const delay = Math.min(1000 * 2 ** (reconnectRef.current - 1), reconnectMaxDelay)
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay)
      }
    }
  }, [url, authToken, startHeartbeat, clearHeartbeat, clearReconnectTimeout, reconnectAttempts, reconnectMaxDelay])

  const disconnect = useCallback(() => {
    console.log('Manually disconnecting WebSocket')
    isManuallyDisconnected.current = true
    clearHeartbeat()
    clearReconnectTimeout()
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect')
      wsRef.current = null
    }
    
    setConnected(false)
    messageQueue.current = []
  }, [clearHeartbeat, clearReconnectTimeout])
  
  useEffect(() => {
    const currentParams = { url, authToken }
    const paramsChanged = 
      prevConnectionParams.current.url !== currentParams.url ||
      prevConnectionParams.current.authToken !== currentParams.authToken
    
    if (paramsChanged) {
      prevConnectionParams.current = currentParams
      isManuallyDisconnected.current = false
      
      if (wsRef.current) {
        wsRef.current.close()
      }
      
      connectWebSocket()
    }
  }, [url, authToken, connectWebSocket])
  
  useEffect(() => {
    if (strictModeFirstRender.current) {
      strictModeFirstRender.current = false
      return
    }
    
    isManuallyDisconnected.current = false
    connectWebSocket()
    
    return () => {
      isManuallyDisconnected.current = true
      clearHeartbeat()
      clearReconnectTimeout()
      if (wsRef.current) {
        wsRef.current.close()
        messageQueue.current = []
      }
    }
  }, [])

  return {
    send,
    connected,
    disconnect,
  }
}


// const MyComponent = () => {
//   const handleMessage = useCallback((msg: Message) => {
//     console.log(msg)
//   }, [])
//   
//   const { connected } = useWebSocket({
//     url: "ws://localhost:3001",
//     onMessage: handleMessage,
//   })
// }

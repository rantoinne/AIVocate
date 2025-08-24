import { useLocation } from 'react-router-dom'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import './InterviewPage.css'
import { SocketMessage, useWebSocket } from '../../hooks/socket'
import { BASE_URL } from '../../config/constants'
import IntegratedEditor from '../../components/IntegratedEditor'
import { audioProcessorCode } from '../../utils/audioProcessorWorklet'

// PCM Audio Configuration - will be dynamically determined
const PCM_CONFIG = {
  sampleRate: 22050,    // Start with common speech rate, will be adjusted
  channels: 1,          // Mono audio
  bitDepth: 16,         // 16-bit samples
  chunkSize: 8192,      // 8KB chunks from backend
  samplesPerChunk: 4096 // 8192 bytes ÷ 2 bytes per sample
}

interface PCMChunk {
  chunk: string
  isLast: boolean
  chunkIndex: number
}

const InterviewPage: React.FC = () => {
  const location = useLocation()
  const sessionId = location.state?.sessionId

  const [code, setCode] = useState<string>('')
  const [language, setLanguage] = useState<string>('javascript')
  // only as a flag to know when does AudioContext start playing the audio
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [streamStats, setStreamStats] = useState<{
    chunksReceived: number
    chunksPlayed: number
    totalDuration: number
  }>({
    chunksReceived: 0,
    chunksPlayed: 0,
    totalDuration: 0
  })
  const [transcripts, setTranscripts] = useState<{
    speaker: string
    message: string
  }[]>([])

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const timeLeft = useRef(25 * 60 + 30)

  /**
   * AudioContext refs
   */
  const audioContextRef = useRef<AudioContext | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const nextStartTimeRef = useRef(0)
  const isInitializedRef = useRef(false)
  const expectedChunkIndexRef = useRef(0)
  const currentStreamIdRef = useRef<string | null>(null)

  // Initialize Web Audio API for PCM with dynamic sample rate
  const initAudioContext = useCallback(async () => {
    // Always recreate if context is closed or sample rate changed
    if (audioContextRef.current?.state === 'closed' || 
        !audioContextRef.current || 
        audioContextRef.current.sampleRate !== PCM_CONFIG.sampleRate) {
      
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        await audioContextRef.current.close()
      }
      
      audioContextRef.current = null
      gainNodeRef.current = null
      isInitializedRef.current = false
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume()
      }
      return
    }
    
    try {
      // Create new AudioContext with specified sample rate
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: PCM_CONFIG.sampleRate
      })
      
      // Create gain node for volume control
      gainNodeRef.current = audioContextRef.current.createGain()
      gainNodeRef.current.connect(audioContextRef.current.destination)
      gainNodeRef.current.gain.value = 1.0
      
      // Resume if suspended (autoplay policy)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume()
      }
      
      nextStartTimeRef.current = audioContextRef.current.currentTime
      isInitializedRef.current = true
      
      console.log(`PCM AudioContext initialized: ${audioContextRef.current.sampleRate}Hz (requested: ${PCM_CONFIG.sampleRate}Hz), state: ${audioContextRef.current.state}`)
    } catch (error) {
      console.error('Failed to initialize AudioContext for PCM:', error)
      throw error
    }
  }, [])

  // Convert PCM bytes to Float32Array (16-bit signed PCM)
  const convertPCMToFloat32 = useCallback((pcmBytes: Uint8Array): Float32Array => {
    const samples = new Float32Array(pcmBytes.length / 2) // 16-bit = 2 bytes per sample
    
    for (let i = 0; i < samples.length; i++) {
      // Little-endian: combine two bytes into 16-bit signed integer
      const low = pcmBytes[i * 2]
      const high = pcmBytes[i * 2 + 1]
      const sample = low | (high << 8)
      
      // Convert to signed 16-bit (two's complement)
      const signed = sample > 32767 ? sample - 65536 : sample
      
      // Normalize to float range (-1.0 to 1.0)
      samples[i] = signed / 32768.0
    }
    
    // Debug: Check sample range and content
    const maxSample = Math.max(...samples)
    const minSample = Math.min(...samples)
    const avgSample = samples.reduce((sum, s) => sum + Math.abs(s), 0) / samples.length
    
    console.log(`PCM Analysis: samples=${samples.length}, range=[${minSample.toFixed(3)}, ${maxSample.toFixed(3)}], avg=${avgSample.toFixed(3)}`)
    
    return samples
  }, [])

  // Create AudioBuffer from PCM Float32Array
  const createPCMAudioBuffer = useCallback((pcmData: Float32Array): AudioBuffer => {
    if (!audioContextRef.current) {
      throw new Error('AudioContext not initialized')
    }

    const audioBuffer = audioContextRef.current.createBuffer(
      PCM_CONFIG.channels,
      pcmData.length,
      PCM_CONFIG.sampleRate
    )

    // Copy PCM data to audio buffer (mono channel)
    const channelData = audioBuffer.getChannelData(0) // similar to array index
    channelData.set(pcmData)

    return audioBuffer
  }, [])

  // Play PCM audio buffer with precise timing
  const playPCMBuffer = useCallback(async (pcmData: Float32Array): Promise<void> => {
    // Ensure AudioContext is ready before playing
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      console.log('AudioContext closed or missing, reinitializing...')
      await initAudioContext()
    }

    if (!audioContextRef.current || !gainNodeRef.current) {
      throw new Error('Failed to initialize AudioContext')
    }

    // Resume if suspended
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume()
    }

    return new Promise((resolve, reject) => {
      try {
        // Create audio buffer from PCM data
        const audioBuffer = createPCMAudioBuffer(pcmData)

        // Create buffer source
        const source = audioContextRef.current!.createBufferSource()
        source.buffer = audioBuffer
        // Connect AudioBufferSourceNode to GainNode
        source.connect(gainNodeRef.current!)
        // By this point, the chain is complete (AudioBufferSourceNode -> GainNode -> Destination(speaker))

        // Calculate precise timing for seamless playback
        const currentTime = audioContextRef.current!.currentTime
        const startTime = Math.max(currentTime, nextStartTimeRef.current)

        // Schedule playback
        source.start(startTime)
        nextStartTimeRef.current = startTime + audioBuffer.duration

        console.log(`Playing PCM chunk: ${pcmData.length} samples, duration: ${audioBuffer.duration.toFixed(3)}s, start: ${startTime.toFixed(3)}s, rate: ${PCM_CONFIG.sampleRate}Hz`)

        // Handle playback completion
        source.onended = () => {
          setStreamStats(prev => ({
            ...prev,
            chunksPlayed: prev.chunksPlayed + 1,
            totalDuration: prev.totalDuration + audioBuffer.duration
          }))
          resolve()
        }

        source.addEventListener('error', (error) => {
          console.error('AudioBufferSource error:', error)
          reject(error)
        })

      } catch (error) {
        console.error('Error creating/playing PCM buffer:', error)
        reject(error)
      }
    })
  }, [createPCMAudioBuffer, initAudioContext])

  // Process base64 PCM chunk
  const processPCMChunk = useCallback(async (chunkData: PCMChunk) => {
    const { chunk, chunkIndex, isLast } = chunkData

    try {
      // Convert base64 to Uint8Array
      const binary = atob(chunk)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }

      // Convert PCM bytes to Float32Array
      const pcmFloat32 = convertPCMToFloat32(bytes)

      console.log(`Received PCM chunk ${chunkIndex}: ${bytes.length} bytes, ${pcmFloat32.length} samples, isLast: ${isLast}`)

      // Update stats
      setStreamStats(prev => ({
        ...prev,
        chunksReceived: prev.chunksReceived + 1
      }))

      // Validate chunk order
      if (chunkIndex !== expectedChunkIndexRef.current) {
        console.warn(`Chunk order mismatch. Expected: ${expectedChunkIndexRef.current}, Got: ${chunkIndex}`)
      }
      expectedChunkIndexRef.current = chunkIndex + 1

      if (!isInitializedRef.current) {
        // Buffer chunk if autoplay not enabled
        console.log('Buffering PCM chunk until autoplay is enabled')
        return
      }

      // Play chunk immediately
      await playPCMBuffer(pcmFloat32)
      setIsPlaying(true)

      if (isLast) {
        console.log('Last chunk processed - stream complete')
        setTimeout(() => setIsPlaying(false), 500) // Brief delay before stopping
      }
    } catch (error) {
      console.error('Error processing PCM chunk:', error)
    }
  }, [convertPCMToFloat32, playPCMBuffer, initAudioContext])

  // Resets audio state for new stream
  const resetAudioState = useCallback(async () => {
    setIsPlaying(false)
    setStreamStats({ chunksReceived: 0, chunksPlayed: 0, totalDuration: 0 })
    expectedChunkIndexRef.current = 0
    
    // Ensure AudioContext is ready for new stream
    try {
      await initAudioContext()
      if (audioContextRef.current) {
        nextStartTimeRef.current = audioContextRef.current.currentTime
      }
    } catch (error) {
      console.error('Error reinitializing AudioContext:', error)
    }
    
    console.log('Audio state reset for new stream')
  }, [initAudioContext])

  const initialiseClientAudioStreaming = async (ws: WebSocket): Promise<void> => {
    const blob = new Blob([audioProcessorCode], { type: 'application/javascript' })
    const processorUrl = URL.createObjectURL(blob)

    
    const audioStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true
      }
    })
    
    // Create audio context for processing
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000
    })

    await audioContext.audioWorklet.addModule(processorUrl)
    const source = audioContext.createMediaStreamSource(audioStream)
    const processorNode = new AudioWorkletNode(audioContext, 'audio-processor')
    
    processorNode.port.onmessage = (event) => {
      ws.send(event.data)
    }

    source.connect(processorNode);
  }

  // WebSocket message handler
  const { connected } = useWebSocket({
    url: `${window.location.protocol === 'https:' ? 'wss://' : 'ws://'}${window.location.host}${BASE_URL}interview-session/${sessionId}`,
    onMessage: async (msg: SocketMessage, ws: WebSocket) => {
      console.log('WebSocket message:', { type: msg.type, timestamp: new Date().toISOString() })
      
      switch (msg.type) {
        case 'chat':
          console.log('Chat message:', msg.message)
          await initialiseClientAudioStreaming(ws)
          break
          
          case 'tts_start':
            console.log('TTS stream starting:', msg.message)
            setTranscripts(prev => [...prev, { speaker: 'ai', message: JSON.parse(msg.message).text }])
            await resetAudioState()
          currentStreamIdRef.current = Date.now().toString()
          break
        
        case 'tts_chunk': {
          try {
            const parsedMessage = JSON.parse(msg.message)
            if (parsedMessage?.chunk) {
              await processPCMChunk(parsedMessage)
            } else {
              console.error('Invalid TTS chunk format:', parsedMessage)
            }
          } catch (error) {
            console.error('Error parsing TTS chunk message:', error, msg.message)
          }
          break
        }

        case 'tts_complete':
          console.log('TTS stream completed:', msg.message)
          expectedChunkIndexRef.current = 0
          currentStreamIdRef.current = null
          
          setTimeout(() => {
            setIsPlaying(false)
          }, 1000)
          break

        case 'user_transcript':
          console.log('User transcript:', msg.message)
          setTranscripts(prev => [...prev, { speaker: 'user', message: msg.message }])
          break

        case 'ai_transcript':
          console.log('AI transcript:', msg.message)
          setTranscripts(prev => [...prev, { speaker: 'ai', message: msg.message }])
          break
          
        default:
          console.log('Unknown message type:', msg)
      }
    },
  })

  // Timer functionality
  useEffect(() => {
    function updateTimer() {
      const timerElem = document.querySelector('.timer')
      if (!timerElem) return
      
      const minutes = Math.floor(timeLeft.current / 60)
      const seconds = timeLeft.current % 60
      const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      timerElem.textContent = timeStr
      
      timeLeft.current--
      if (timeLeft.current >= 0) {
        timerRef.current = setTimeout(updateTimer, 1000)
      }
    }
    
    updateTimer()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  useEffect(() => {
    return () => {
      console.log('Component unmounting - AudioContext will be garbage collected')
    }
  }, [])

  return (
    <div id="interviewPage">
      <header className="header">
        <div className="header-content">
          <div className="logo">InterviewAI</div>
          <div className="header-controls">
            <div className="status-indicator">
              <div className={`status-dot ${connected ? 'status-connected' : 'status-disconnected'}`}></div>
              <span>{connected ? 'Connected' : 'Disconnected'}</span>
            </div>
            <button className="btn btn-secondary" onClick={() => alert('Interview paused')}>
              Pause
            </button>
            <button className="btn btn-danger" onClick={() => window.location.href = '/'}>
              End Interview
            </button>
          </div>
        </div>
      </header>

      <div className="container">
        <div className="interview-layout">
          {/* Main Coding Panel */}
          <div className="main-panel">
            <div className="panel-header">
              <div className="panel-title">Code Editor</div>
            </div>
            <div style={{height: '100%', width: '100%'}}>
              <IntegratedEditor
                code={code}
                setCode={setCode}
                language={language}
                setLanguage={setLanguage}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="sidebar">
            {/* AI Video Panel */}
            <div className="video-panel">
              <div className="panel-header">
                <div className="panel-title">AI Interviewer</div>
              </div>
              <div className="video-container">
                <div className="ai-avatar">AI</div>
              </div>
            </div>

            {/* Question Panel */}
            <div className="question-panel">
              <div className="panel-header">
                <div className="panel-title">Current Question</div>
              </div>
              <div className="question-content">
                <div className="current-question">
                  <div className="question-text">
                    Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.
                  </div>
                  <span className="question-difficulty difficulty-easy">Easy</span>
                </div>
                <div className="chat-history">
                  {transcripts.map((item, index) => (
                    <div key={index} className={`chat-message chat-${item.speaker}`}>
                      <div className="chat-sender">{item.speaker === 'user' ? 'You' : 'AI Interviewer'}</div>
                      <div>{item.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Enhanced Controls Panel */}
            <div className="controls-panel">
              <div className="timer">25:30</div>
              
              {/* Audio Status */}
              <div className="control-group">
                <label className="control-label">PCM Audio Status</label>
                <div style={{ 
                  padding: '0.5rem', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '0.25rem', 
                  fontSize: '0.875rem',
                  backgroundColor: '#f0f9ff'
                }}>
                  <div style={{ marginBottom: '0.25rem' }}>
                    <span style={{ color: '#059669' }}>✓ Audio Enabled ({PCM_CONFIG.sampleRate}Hz)</span>
                  </div>
                  
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {isPlaying && <span style={{ color: '#3b82f6' }}>🎵 Playing</span>}
                  </div>
                  
                  {/* Stream Statistics */}
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    Received: {streamStats.chunksReceived} | Played: {streamStats.chunksPlayed}
                    {streamStats.totalDuration > 0 && (
                      <div>Duration: {streamStats.totalDuration.toFixed(1)}s</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="control-group">
                <button 
                  className="btn btn-secondary" 
                  style={{ width: '100%', marginBottom: '0.5rem' }}
                >
                  🎤 Toggle Mic
                </button>
                
                <button 
                  className="btn btn-secondary" 
                  style={{ 
                    width: '100%', 
                    marginBottom: '0.5rem',
                    backgroundColor: '#10b981',
                    color: 'white'
                  }} 
                  disabled
                >
                  ✓ PCM Audio Enabled
                </button>
                
                <button 
                  className="btn btn-secondary" 
                  style={{ width: '100%' }}
                >
                  💬 Text Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InterviewPage

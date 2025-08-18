import { useLocation } from 'react-router-dom'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import './InterviewPage.css'
import { useWebSocket } from '../../hooks/socket'
import { BASE_URL } from '../../config/constants'
import IntegratedEditor from '../../components/IntegratedEditor'

// PCM Audio Configuration - will be dynamically determined
const PCM_CONFIG = {
  channels: 1,          // Mono audio
  bitDepth: 16,         // 16-bit samples
  chunkSize: 8192,      // 8KB chunks from backend
  sampleRate: 22050,    // Start with common speech rate, will be adjusted
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

  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  // only as a flag to know when does AudioContext start playing the audio
  const [isPlaying, setIsPlaying] = useState(false)
  const [streamStats, setStreamStats] = useState({
    chunksReceived: 0,
    chunksPlayed: 0,
    totalDuration: 0
  })

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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

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

        console.log(`Playing PCM chunk: ${pcmData.length} samples, duration: ${audioBuffer.duration.toFixed(3)}s, start: ${startTime.toFixed(3)}s, rate: ${PCM_CONFIG.sampleRate}Hz`

)

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

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      })

      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 16000,
      })

      mediaRecorderRef.current = mediaRecorder

      // Send audio chunks through existing WebSocket
      mediaRecorder.ondataavailable = (event) => {
        console.log('data available', event.data)
        if (event.data.size > 0) {
          // Convert blob to base64 for JSON transport
          const reader = new FileReader()
          reader.onload = () => {
            const base64Audio = (reader.result as string).split(',')[1]
            send({
              type: 'audio_chunk',
              message: JSON.stringify({
                data: base64Audio,
                timestamp: Date.now()
              })
            })
          }
          reader.readAsDataURL(event.data)
        }
      }

      mediaRecorder.start(500) // 500ms chunks
      
      // Notify backend that recording started
      send({
        type: 'recording_start',
        message: JSON.stringify({ timestamp: Date.now() })
      })

    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }, [])

  // WebSocket message handler
  const { connected, send } = useWebSocket({
    url: `${window.location.protocol === 'https:' ? 'wss://' : 'ws://'}${window.location.host}${BASE_URL}interview-session/${sessionId}`,
    onMessage: async (msg) => {
      console.log('WebSocket message:', { type: msg.type, timestamp: new Date().toISOString() })
      
      switch (msg.type) {
        case 'chat':
          console.log('Chat message:', msg.message)
          await startRecording()
          break

        case 'tts_start':
          console.log('TTS stream starting:', msg.message)
          await resetAudioState()
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
          
          setTimeout(() => {
            setIsPlaying(false)
          }, 1000)
          break
          
        case 'transcription':
          console.log('Transcription received:', msg.message)
          // Handle transcription result here
          // You can dispatch this to your state management or call a callback
          break

        case 'ai_response':
          console.log('AI response:', msg.message)
          // Handle AI text response if needed before TTS
          break
        default:
          console.log('Unknown message type:', msg)
      }
    },
  })

  // Stop audio recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    // Notify backend that recording ended
    if (connected) {
      send({
        type: 'recording_end',
        message: JSON.stringify({ timestamp: Date.now() })
      })
    }
  }, [connected, send])

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
      stopRecording()
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
                  <div className="chat-message chat-ai">
                    <div className="chat-sender">AI Interviewer</div>
                    <div>Great! Now can you explain the time complexity of your solution?</div>
                  </div>
                  <div className="chat-message chat-user">
                    <div className="chat-sender">You</div>
                    <div>The time complexity is O(n) since we iterate through the array once.</div>
                  </div>
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

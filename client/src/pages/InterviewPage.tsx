import React, { useCallback, useEffect, useRef, useState } from 'react'
import IntegratedEditor from '../components/IntegratedEditor'
import './InterviewPage.css'
import { useWebSocket } from '../hooks/socket'
import { BASE_URL } from '../config/constants'
import { useLocation } from 'react-router-dom'

const InterviewPage: React.FC = () => {
  const location = useLocation()
  const sessionId = location.state?.sessionId

  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [isPlaying, setIsPlaying] = useState(false)
  const [autoplayEnabled, setAutoplayEnabled] = useState(false)
  const [audioChunks, setAudioChunks] = useState<Uint8Array[]>([])

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const timeLeft = useRef(25 * 60 + 30)
  const audioContextRef = useRef<AudioContext | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const nextStartTimeRef = useRef(0)
  const isInitializedRef = useRef(false)

  // Initialize Web Audio API
  const initAudioContext = useCallback(async () => {
    if (audioContextRef.current) return
    
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      gainNodeRef.current = audioContextRef.current.createGain()
      gainNodeRef.current.connect(audioContextRef.current.destination)
      gainNodeRef.current.gain.value = 0.8
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume()
      }
      
      nextStartTimeRef.current = audioContextRef.current.currentTime
      isInitializedRef.current = true
      console.log('AudioContext initialized successfully')
    } catch (error) {
      console.error('Failed to initialize AudioContext:', error)
    }
  }, [])

  // Play audio buffer using Web Audio API
  const playAudioBuffer = useCallback(async (audioData: Uint8Array) => {
    if (!audioContextRef.current || !gainNodeRef.current) {
      console.warn('AudioContext not initialized')
      return
    }

    try {
      // Decode the audio data
      const audioBuffer = await audioContextRef.current.decodeAudioData(audioData.buffer as ArrayBuffer)
      
      // Create buffer source
      const source = audioContextRef.current.createBufferSource()
      source.buffer = audioBuffer
      source.connect(gainNodeRef.current)
      
      // Schedule playback
      const currentTime = audioContextRef.current.currentTime
      const startTime = Math.max(currentTime, nextStartTimeRef.current)
      
      source.start(startTime)
      nextStartTimeRef.current = startTime + audioBuffer.duration
      
      console.log(`Playing audio chunk, duration: ${audioBuffer.duration}s`)
      
      // Handle playback end
      source.onended = () => {
        console.log('Audio chunk finished playing')
      }
      
    } catch (error) {
      console.error('Error playing audio buffer:', error)
    }
  }, [])

  // Process base64 chunk and play
  const processAudioChunk = useCallback(async (base64Chunk: string) => {
    if (!autoplayEnabled || !isInitializedRef.current) {
      console.log('Autoplay not enabled or AudioContext not initialized, buffering chunk')
      // Convert base64 to Uint8Array and buffer it
      const binary = atob(base64Chunk)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      setAudioChunks(prev => [...prev, bytes])
      return
    }

    try {
      // Convert base64 to Uint8Array
      const binary = atob(base64Chunk)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      
      // Play the chunk
      await playAudioBuffer(bytes)
      setIsPlaying(true)
      
    } catch (error) {
      console.error('Error processing audio chunk:', error)
    }
  }, [autoplayEnabled, playAudioBuffer])

  // Process buffered chunks when autoplay is enabled
  const processBufferedChunks = useCallback(async () => {
    if (audioChunks.length === 0 || !autoplayEnabled || !isInitializedRef.current) return
    
    console.log(`Processing ${audioChunks.length} buffered chunks`)
    
    for (const chunk of audioChunks) {
      try {
        await playAudioBuffer(chunk)
        // Small delay between chunks to prevent overwhelming the audio context
        await new Promise(resolve => setTimeout(resolve, 10))
      } catch (error) {
        console.error('Error playing buffered chunk:', error)
      }
    }
    
    setAudioChunks([])
    setIsPlaying(true)
  }, [audioChunks, autoplayEnabled, playAudioBuffer])

  // Enable autoplay
  const enableAutoplay = useCallback(async () => {
    try {
      await initAudioContext()
      setAutoplayEnabled(true)
      console.log('Autoplay enabled!')
      
      // Process any buffered chunks
      setTimeout(() => {
        processBufferedChunks()
      }, 100)
      
    } catch (error) {
      console.error('Failed to enable autoplay:', error)
    }
  }, [initAudioContext, processBufferedChunks])

  // WebSocket message handler
  const { connected } = useWebSocket({
    url: `${window.location.protocol === 'https:' ? 'wss://' : 'ws://'}${window.location.host}${BASE_URL}interview-session/${sessionId}`,
    onMessage: (msg) => {
      console.log({ msg })
      switch (msg.type) {
        case 'chat':
          console.log({ chat: msg.message })
          break

        case 'tts_start':
          console.log({ tts_start: msg.message })
          // Reset audio state
          nextStartTimeRef.current = audioContextRef.current?.currentTime || 0
          setIsPlaying(false)
          break
        
        case 'tts_chunk': {
          console.log({ tts_chunk: msg.message })
          try {
            const parsedMessage = JSON.parse(msg.message)
            if (parsedMessage?.chunk) {
              processAudioChunk(parsedMessage.chunk)
            }
          } catch (error) {
            console.error('Error parsing TTS chunk:', error)
          }
          break
        }

        case 'tts_complete':
          console.log({ tts_complete: msg.message })
          setIsPlaying(false)
          // Reset for next audio stream
          setTimeout(() => {
            nextStartTimeRef.current = audioContextRef.current?.currentTime || 0
          }, 1000)
          break
          
        default:
          console.log({ default: msg })
      }
    },
  })

  // Timer effect
  useEffect(() => {
    function updateTimer() {
      const timerElem = document.querySelector('.timer')
      if (!timerElem) return
      const minutes = Math.floor(timeLeft.current / 60)
      const seconds = timeLeft.current % 60
      timerElem.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      timeLeft.current--
      if (timeLeft.current >= 0) {
        timerRef.current = setTimeout(updateTimer, 1000)
      }
    }
    updateTimer()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  // Auto-enable autoplay attempt
  useEffect(() => {
    const tryAutoEnable = async () => {
      try {
        await initAudioContext()
        setAutoplayEnabled(true)
        console.log('Autoplay auto-enabled!')
      } catch (error) {
        console.log('Auto-enable autoplay failed - user interaction required')
      }
    }
    
    // Try after component mount
    const timeout = setTimeout(tryAutoEnable, 1000)
    return () => clearTimeout(timeout)
  }, [initAudioContext])

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  return (
    <div id="interviewPage">
      <header className="header">
        <div className="header-content">
          <div className="logo">InterviewAI</div>
          <div className="header-controls">
            <div className="status-indicator">
              <div className="status-dot status-connected"></div>
              <span>Connected</span>
            </div>
            <button className="btn btn-secondary" onClick={() => alert('Interview paused')}>Pause</button>
            <button className="btn btn-danger" onClick={() => window.location.href = '/'}>End Interview</button>
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
            {/* Controls Panel */}
            <div className="controls-panel">
              <div className="timer">25:30</div>
              <div className="control-group">
                <label className="control-label">Audio Status</label>
                <div style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.25rem', fontSize: '0.875rem' }}>
                  {autoplayEnabled ? (
                    <span style={{ color: 'green' }}>✓ Audio Enabled</span>
                  ) : (
                    <span style={{ color: 'orange' }}>⚠ Audio Disabled</span>
                  )}
                  {isPlaying && <span style={{ color: 'blue', marginLeft: '10px' }}>🎵 Playing</span>}
                  {audioChunks.length > 0 && <span style={{ color: 'purple', marginLeft: '10px' }}>📦 {audioChunks.length} buffered</span>}
                </div>
              </div>
              <div className="control-group">
                <label className="control-label">Difficulty Level</label>
                <select style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.25rem' }}>
                  <option>Auto-Adaptive</option>
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>
              <div className="control-group">
                <button className="btn btn-secondary" style={{ width: '100%', marginBottom: '0.5rem' }}>🎤 Toggle Mic</button>
                <button 
                  className="btn btn-secondary" 
                  style={{ width: '100%', marginBottom: '0.5rem' }} 
                  onClick={enableAutoplay}
                  disabled={autoplayEnabled}
                >
                  {autoplayEnabled ? '✓ Audio Enabled' : '🔊 Enable Audio'}
                </button>
                <button className="btn btn-secondary" style={{ width: '100%' }}>💬 Text Chat</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InterviewPage

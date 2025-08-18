import { useState, useRef, useCallback } from 'react'

interface UseAudioCaptureOptions {
  /**
   * Callback function that receives audio data when speech is detected.
   * Receives an ArrayBuffer containing Float32Array audio samples at 16kHz sample rate.
   */
  onAudioData: (audioData: ArrayBuffer) => void
  
  /**
   * Threshold over which values returned by the VAD will be considered as positively indicating speech.
   * Should be between 0 and 1. Higher values make the VAD more selective.
   * @default 0.6
   */
  vadSensitivity?: number
  
  /**
   * Minimum duration of speech in milliseconds to trigger onAudioData.
   * Speech segments shorter than this will be ignored.
   * @default 300
   */
  minSpeechMs?: number
  
  /**
   * Maximum duration of silence in milliseconds to wait before ending speech detection.
   * @default 600
   */
  maxSilenceMs?: number
}

const useAudioCapture = (options: UseAudioCaptureOptions) => {
  const {
    onAudioData,
    minSpeechMs = 300,
    maxSilenceMs = 600,
    vadSensitivity = 0.6,
  } = options

  const [isRecording, setIsRecording] = useState(false)
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)
  const [isSpeechDetected, setIsSpeechDetected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const workletNodeRef = useRef<AudioWorkletNode | null>(null)
  
  // VAD state
  const vadStateRef = useRef({
    isSpeech: false,
    speechStartTime: 0,
    silenceStartTime: 0,
    audioBuffer: [] as Float32Array[],
    lastSpeechTime: 0,
    energyHistory: [] as number[] // For energy-based VAD
  })

  const getMicrophoneStream = async (): Promise<MediaStream> => {
    try {
      // console.log('🎤 Requesting microphone access...')
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      
      // console.log('✅ Got audio stream')
      return stream
    } catch (error: any) {
      console.error('❌ Microphone access denied:', error)
      throw new Error('Microphone access denied: ' + (error.message || error.name || 'Unknown error'))
    }
  }

  const calculateAudioEnergy = (audioData: Float32Array): number => {
    // Calculate RMS (Root Mean Square) for volume
    let sum = 0
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i] * audioData[i]
    }
    return Math.sqrt(sum / audioData.length)
  }

  const detectVoiceActivity = (audioData: Float32Array): boolean => {
    try {
      const energy = calculateAudioEnergy(audioData)
      
      // Update energy history (keep last 10 frames)
      const vadState = vadStateRef.current
      vadState.energyHistory.push(energy)
      if (vadState.energyHistory.length > 10) {
        vadState.energyHistory.shift()
      }
      
      // Calculate average energy over recent frames
      const avgEnergy = vadState.energyHistory.reduce((sum, e) => sum + e, 0) / vadState.energyHistory.length
      
      // Dynamic threshold based on recent history
      const energyThreshold = Math.max(0.005, avgEnergy * vadSensitivity)
      
      // Voice activity decision
      const isVoice = energy > energyThreshold
      
      // console.debug('🔍 VAD Analysis:', {
      //   energy: energy.toFixed(4),
      //   avgEnergy: avgEnergy.toFixed(4),
      //   threshold: energyThreshold.toFixed(4),
      //   isVoice
      // })
      
      return isVoice
    } catch (err) {
      console.error('Error in VAD detection:', err)
      return false
    }
  }

  const processAudioFrame = (audioData: Float32Array, timestamp: number) => {
    try {
      const isCurrentlySpeech = detectVoiceActivity(audioData)
      const vadState = vadStateRef.current
      const now = timestamp * 1000 // Convert to ms
      
      vadState.audioBuffer.push(new Float32Array(audioData))
      
      // Keep buffer reasonable size (about 2 seconds worth)
      const maxBufferSize = Math.ceil((2 * 16000) / audioData.length)
      if (vadState.audioBuffer.length > maxBufferSize) {
        vadState.audioBuffer.shift()
      }
      
      if (isCurrentlySpeech) {
        if (!vadState.isSpeech) {
          // Speech started
          vadState.speechStartTime = now
          vadState.isSpeech = true
          // console.log('🗣️ Speech detected - starting capture')
          setIsSpeechDetected(true)
        }
        vadState.lastSpeechTime = now
      } else {
        if (vadState.isSpeech) {
          // Check if we should end speech (silence duration exceeded)
          const silenceDuration = now - vadState.lastSpeechTime
          if (silenceDuration > maxSilenceMs) {
            vadState.isSpeech = false
            // console.log('🤫 Speech ended - stopping capture')
            setIsSpeechDetected(false)
            
            // Send accumulated speech data if it's long enough
            const speechDuration = now - vadState.speechStartTime
            if (speechDuration >= minSpeechMs && vadState.audioBuffer.length > 0) {
              sendAccumulatedAudio()
            } else if (vadState.audioBuffer.length > 0) {
              console.log('⚠️ Speech too short, discarding')
            }
            
            // Clear buffer after processing
            vadState.audioBuffer = []
          }
        }
      }
      
      // If we're in speech mode and have minimum duration, send audio
      if (vadState.isSpeech) {
        const speechDuration = now - vadState.speechStartTime
        if (speechDuration >= minSpeechMs) {
          sendAccumulatedAudio()
        }
      }
    } catch (err) {
      console.error('Error processing audio frame:', err)
    }
  }

  const sendAccumulatedAudio = () => {
    const vadState = vadStateRef.current
    if (vadState.audioBuffer.length === 0) return
    
    try {
      // Concatenate all buffered audio
      const totalLength = vadState.audioBuffer.reduce((sum, chunk) => sum + chunk.length, 0)
      const concatenated = new Float32Array(totalLength)
      
      let offset = 0
      for (const chunk of vadState.audioBuffer) {
        concatenated.set(chunk, offset)
        offset += chunk.length
      }
      
      // Convert to ArrayBuffer
      const arrayBuffer = new ArrayBuffer(concatenated.length * 4)
      const view = new Float32Array(arrayBuffer)
      view.set(concatenated)
      
      // console.log('🎵 Sending speech audio:', {
      //   samples: concatenated.length,
      //   bytes: arrayBuffer.byteLength,
      //   duration: (concatenated.length / 16000 * 1000).toFixed(0) + 'ms'
      // })
      console.log('arrayBuffer', arrayBuffer)
      onAudioData(arrayBuffer)
      
      // Clear buffer after sending
      vadState.audioBuffer = []
    } catch (err) {
      console.error('Error sending accumulated audio:', err)
    }
  }

  const createAudioWorklet = () => {
    const workletCode = `
      class VoiceActivityProcessor extends AudioWorkletProcessor {
        process(inputs, outputs, parameters) {
          const input = inputs[0]
          if (input.length > 0) {
            const inputData = input[0] // First channel
            
            // Send raw audio data for VAD processing
            this.port.postMessage({
              type: 'audioData',
              data: inputData,
              timestamp: currentTime
            })
          }
          return true
        }
      }
      
      registerProcessor('voice-activity-processor', VoiceActivityProcessor)
    `
    
    const blob = new Blob([workletCode], { type: 'application/javascript' })
    return URL.createObjectURL(blob)
  }

  const setupRealTimeProcessing = async (stream: MediaStream) => {
    // console.log('⚡ Setting up real-time audio processing...')
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 })
      const source = audioContext.createMediaStreamSource(stream)
      
      // Create and load AudioWorklet
      const workletUrl = createAudioWorklet()
      await audioContext.audioWorklet.addModule(workletUrl)
      
      const workletNode = new AudioWorkletNode(audioContext, 'voice-activity-processor')
      
      // Listen for audio data from worklet
      workletNode.port.onmessage = (event) => {
        const { type, data, timestamp } = event.data
        
        if (type === 'audioData') {
          // Process with VAD
          processAudioFrame(data, timestamp)
        }
      }
      
      // Connect the audio graph
      source.connect(workletNode)
      
      audioContextRef.current = audioContext
      workletNodeRef.current = workletNode
      
      // Clean up blob URL
      URL.revokeObjectURL(workletUrl)
      
      // console.log('✅ Real-time audio processing active')
    } catch (error) {
      console.error('❌ AudioWorklet setup failed:', error)
      throw error
    }
  }

  const startCapture = useCallback(async () => {
    try {
      // console.log('🎤 Starting audio capture...')
      
      // Reset state
      setError(null)
      vadStateRef.current = {
        isSpeech: false,
        speechStartTime: 0,
        silenceStartTime: 0,
        audioBuffer: [],
        lastSpeechTime: 0,
        energyHistory: []
      }
      
      // Get microphone access
      const stream = await getMicrophoneStream()
      setAudioStream(stream)
      
      // Setup real-time processing
      await setupRealTimeProcessing(stream)
      
      setIsRecording(true)
      console.log('🔴 Recording started')
    } catch (err: any) {
      console.error('❌ Failed to start capture:', err)
      setError(err.message || 'Failed to start audio capture')
      throw err
    }
  }, [vadSensitivity, minSpeechMs, maxSilenceMs])

  const stopCapture = useCallback(() => {
    // console.log('⏹️ Stopping audio capture...')
    
    // Send any remaining buffered audio
    if (vadStateRef.current.audioBuffer.length > 0) {
      sendAccumulatedAudio()
    }
    
    // Cleanup MediaRecorder
    if (mediaRecorderRef.current) {
      try {
        mediaRecorderRef.current.stop()
      } catch (err) {
        console.warn('⚠️ Error stopping MediaRecorder:', err)
      }
      mediaRecorderRef.current = null
    }
    
    // Cleanup AudioWorklet
    if (workletNodeRef.current) {
      try {
        workletNodeRef.current.disconnect()
      } catch (err) {
        console.warn('⚠️ Error disconnecting worklet:', err)
      }
      workletNodeRef.current = null
    }
    
    // Cleanup AudioContext
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close()
      } catch (err) {
        console.warn('⚠️ Error closing audio context:', err)
      }
      audioContextRef.current = null
    }
    
    // Stop all audio tracks
    if (audioStream) {
      audioStream.getTracks().forEach(track => {
        try {
          track.stop()
          console.log('🛑 Audio track stopped')
        } catch (err) {
          console.warn('⚠️ Error stopping track:', err)
        }
      })
      setAudioStream(null)
    }
    
    setIsRecording(false)
    setIsSpeechDetected(false)
    setError(null)
    console.log('✅ Audio capture stopped')
  }, [audioStream])

  return {
    /**
     * Start capturing audio with VAD
     */
    startCapture,
    
    /**
     * Stop capturing audio
     */
    stopCapture,
    
    /**
     * Whether audio capture is currently active
     */
    isRecording,
    
    /**
     * Whether speech is currently detected
     */
    isSpeechDetected,
    
    /**
     * The current audio stream (if any)
     */
    audioStream,
    
    /**
     * Any error that occurred during capture
     */
    error
  }
}

export default useAudioCapture

import React, { useEffect, useRef, useState } from 'react'
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
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const timeLeft = useRef(25 * 60 + 30)

  const { connected } = useWebSocket({
    url: `${window.location.protocol === 'https:' ? 'wss://' : 'ws://'}${window.location.host}${BASE_URL}interview-session/${sessionId}`,
    onMessage: (msg) => console.log({ msg }),
  })

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

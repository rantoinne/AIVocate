import React from 'react';
import './LandingPage.css';

const LandingPage: React.FC = () => (
  <div id="landingPage">
    <header className="header">
      <div className="header-content">
        <div className="logo">InterviewAI</div>
        <div className="header-controls">
          <button className="btn btn-secondary" onClick={() => alert('Login functionality would be implemented here')}>Login</button>
          <button className="btn btn-primary" onClick={() => window.location.href = '/interview'}>Start Interview</button>
        </div>
      </div>
    </header>
    <div className="container">
      <div className="landing-page">
        <h1 className="hero-title">AI-Powered Technical Interviews</h1>
        <p className="hero-subtitle">Practice coding interviews with an intelligent AI interviewer that adapts to your skill level</p>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3 className="feature-title">AI Interviewer</h3>
            <p className="feature-description">Natural conversation with an AI that asks relevant follow-up questions based on your responses</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💻</div>
            <h3 className="feature-title">Live Coding</h3>
            <p className="feature-description">Code in real-time with syntax highlighting and instant execution feedback</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3 className="feature-title">Adaptive Difficulty</h3>
            <p className="feature-description">Questions automatically adjust based on your performance and experience level</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎥</div>
            <h3 className="feature-title">Video Interview</h3>
            <p className="feature-description">Complete interview experience with video chat and screen sharing</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default LandingPage;

# 🤖 AIVocate Interview Platform

*An intelligent technical interview simulation platform powered by AI*

[![Development Status](https://img.shields.io/badge/Status-In%20Development-yellow)](https://github.com/rantoinne/aivocate)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-23-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue.svg)](https://reactjs.org/)

> **⚠️ This project is currently in active development. Features and documentation are subject to change.**

## 📋 Project Overview

AIVocate Platform is a web-based application that simulates real technical interviews using artificial intelligence. The platform provides candidates with an interactive coding environment where they can practice technical interviews with an AI interviewer that adapts questions based on their performance and provides real-time feedback.

### 🎯 Core Vision

Create an accessible, intelligent interview practice platform that:
- **Democratizes interview preparation** - Available 24/7 for anyone to practice
- **Adapts to skill levels** - AI adjusts difficulty based on candidate responses  
- **Provides realistic experience** - Simulates actual technical interview scenarios
- **Offers immediate feedback** - Real-time code analysis and suggestions

## ✨ Key Features

### 🎙️ AI-Powered Interviewer
- **Natural Language Processing**: Conversational AI that asks follow-up questions
- **Adaptive Questioning**: Difficulty automatically adjusts based on performance
- **Voice Interaction**: Text-to-speech and speech recognition capabilities
- **Contextual Responses**: AI understands code context and provides relevant feedback

### 💻 Real-Time Coding Environment
- **Live Code Editor**: Monaco Editor with syntax highlighting for multiple languages
- **Instant Execution**: Secure code execution using Piston API (runs in a sandboxed Docker container on a shared network)
- **Code Analysis**: Real-time feedback on code quality and performance (QwenCoder)
- **Language Support**: JavaScript, Python, Java, C++, and more

### 🎥 Interactive Interview Experience
- **Session Recording**: Save interviews for later review
- **Progress Tracking**: Monitor improvement over multiple sessions

### 📊 Smart Analytics
- **Performance Metrics**: Track coding speed, accuracy, and problem-solving approach
- **Skill Assessment**: Identify strengths and areas for improvement
- **Interview Reports**: Detailed feedback and recommendations
- **Progress Dashboard**: Visual representation of improvement over time

## 🏗️ Technical Architecture

### Frontend (React + TypeScript)
```
client/
├── components/          # Reusable UI components
├── hooks/              # Custom React hooks
├── services/           # API and external service integrations
├── context/            # React Context for state management
└── utils/              # Helper functions and constants
```

### Backend (Node.js + Express)
```
server/
├── controllers/        # Request handlers
├── services/           # Business logic and external API integrations
├── sockets/            # WebSocket handlers for real-time features
├── models/             # Database schemas
└── routes/             # API route definitions
```

### Key Technologies
- **Frontend**: React 18, TypeScript, Monaco Editor, WebRTC
- **Backend**: Node.js, Express.js, Socket.io, Postgres
- **AI Services**: QwenCoder, Piper, Vosk
- **Code Execution**: Piston API (Docker container, shared network)

## 🚀 Development Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [x] Project setup and basic architecture
- [x] UI/UX design and prototyping
- [ ] Basic React components and routing
- [ ] Node.js server with Express setup
- [ ] Database schema design
- [ ] WebSocket integration for real-time communication

## 🛠️ Getting Started

> **Note**: This section will be updated as development progresses.

### Installation
```bash
# Clone the repository
git clone https://github.com/rantoinne/aivocate.git
cd aivocate

docker compose up --build -d
# Edit .env with your API keys and configuration
```

## 🤝 Contributing

I welcome contributions! This project is in active development, and there are many opportunities to get involved.

### How to Contribute
1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add some amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Use conventional commit messages
- Update documentation for significant changes

## 📈 Current Status

### ✅ Completed
- Project architecture design
- UI/UX mockups and prototypes
- Technology stack selection
- Development roadmap planning
- Audio streaming from user and STT (Vosk)
- TTS via openai's tts-1
- Piston container


### 🚧 In Progress
- Sharing code overtime via ws
- Migrating to QwenCoder for completions

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact & Support

- **Project Maintainer**: [Your Name](mailto:raviasthana241001@gmail.com)
- **Issues**: [GitHub Issues](https://github.com/rantoinne/aivocate/issues)
- **Discussions**: [GitHub Discussions](https://github.com/rantoinne/aivocate/discussions)


## Websocket comms
Client                    Server                    AI Service
  |                        |                         |
  |-- join interview ----->|                         |
  |<-- interview started --|                         |
  |                        |-- generate question -->|
  |<-- ai question --------|<-- question response --|
  |                        |                         |
  |-- speech data -------->|-- process speech ------>|
  |                        |<-- next question -------|
  |<-- ai response --------|                         |
  |                        |                         |
  |-- code update -------->|-- evaluate code ------->|
  |<-- feedback -----------|<-- evaluation ----------|

---

<div align="center">

**⭐ Star this repository if you find it interesting!**

*Built with ❤️ for the developer community*

</div>
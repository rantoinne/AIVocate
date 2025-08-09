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
- **Code Analysis**: Real-time feedback on code quality and performance
- **Language Support**: JavaScript, Python, Java, C++, and more

### 🎥 Interactive Interview Experience
- **Video Interface**: Face-to-face interaction with AI interviewer
- **Screen Sharing**: Share coding session in real-time
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
- **Backend**: Node.js, Express.js, Socket.io, MongoDB
- **AI Services**: OpenAI API, ElevenLabs (TTS)
- **Code Execution**: Piston API (Docker container, shared network)
- **Deployment**: Vercel (Frontend), Railway (Backend)

## 🚀 Development Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [x] Project setup and basic architecture
- [x] UI/UX design and prototyping
- [ ] Basic React components and routing
- [ ] Node.js server with Express setup
- [ ] Database schema design
- [ ] WebSocket integration for real-time communication

### Phase 2: Core Features (Weeks 3-4)
- [ ] Monaco Editor integration with syntax highlighting
- [ ] OpenAI API integration for question generation
- [ ] Basic AI interview flow implementation
- [ ] Code execution service integration
- [ ] Text-to-speech and speech recognition
- [ ] User authentication and session management

### Phase 3: Advanced Features (Weeks 5-6)
- [ ] Video chat implementation using WebRTC
- [ ] Advanced AI conversation logic
- [ ] Code analysis and feedback system
- [ ] Interview recording and playback
- [ ] Performance analytics dashboard
- [ ] Mobile-responsive design optimization

### Phase 4: Polish & Launch (Weeks 7-8)
- [ ] Comprehensive testing (unit, integration, e2e)
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Documentation completion
- [ ] Deployment pipeline setup
- [ ] Beta user testing and feedback incorporation

## 🛠️ Getting Started

> **Note**: This section will be updated as development progresses.

### Prerequisites
- Node.js 18+
- MongoDB 6+
- Modern web browser with WebRTC support

### Installation
```bash
# Clone the repository
git clone https://github.com/rantoinne/aivocate.git
cd aivocate

# Install dependencies
npm install

# Install client dependencies
cd client && npm install

# Install server dependencies
cd ../server && npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys and configuration
```

### Environment Variables
```env
# OpenAI API
OPENAI_API_KEY=your_openai_api_key

# Piston API
PISTON_ENDPOINT=http://piston_api:2000

# ElevenLabs TTS
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# Database
MONGODB_URI=mongodb://localhost:27017/aivocate

# Server Configuration
PORT=3001
NODE_ENV=development
```

### Running the Application
```bash
# Start the development server (from root directory)
npm run dev

# The client will be available at http://localhost:3000
# The server will be available at http://localhost:3001
```

## 🤝 Contributing

We welcome contributions! This project is in active development, and there are many opportunities to get involved.

### How to Contribute
1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add some amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Write unit tests for new features
- Use conventional commit messages
- Update documentation for significant changes
- Ensure mobile responsiveness for UI changes

### Areas Where We Need Help
- [ ] UI/UX improvements and accessibility
- [ ] Additional programming language support
- [ ] Advanced AI conversation patterns
- [ ] Performance optimization
- [ ] Testing and quality assurance
- [ ] Documentation and tutorials

## 📈 Current Status

### ✅ Completed
- Project architecture design
- UI/UX mockups and prototypes
- Technology stack selection
- Development roadmap planning

### 🚧 In Progress
- Basic React application setup
- Node.js server implementation
- Database schema design
- Core component development

### ⏳ Planned
- AI integration and testing
- Real-time communication features
- Code execution and analysis
- Advanced interview scenarios

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for providing the GPT API that powers our AI interviewer
- **Piston** for secure code execution capabilities (https://github.com/engineer-man/piston)
- **Monaco Editor** team for the excellent code editing experience
- **React** and **Node.js** communities for amazing open-source tools

## 📞 Contact & Support

- **Project Maintainer**: [Your Name](mailto:raviasthana241001@gmail.com)
- **Issues**: [GitHub Issues](https://github.com/rantoinne/aivocate/issues)
- **Discussions**: [GitHub Discussions](https://github.com/rantoinne/aivocate/discussions)

---

<div align="center">

**⭐ Star this repository if you find it interesting!**

*Built in depression for the developer community*

</div>
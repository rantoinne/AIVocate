import axios from "axios"

class OllamaService {
  model: string
  baseURL: string
  systemPrompt: string
  
  constructor() {
    this.baseURL = 'http://host.docker.internal:11434'
    this.model = 'qwen2.5-coder:7b-instruct'
    this.systemPrompt = this.getInterviewerSystemPrompt()
  }

  getInterviewerSystemPrompt() {
    return `You are TechInterviewer AI, an expert technical interviewer specializing in software engineering roles. Your personality and behavior:

    ROLE & EXPERTISE:
    - Senior technical interviewer with 10+ years experience
    - Expert in JavaScript, React, Node.js, Python, algorithms, and system design
    - Evaluate both technical skills and problem-solving approach
    - Provide constructive feedback and guidance

    INTERVIEW STYLE:
    - Ask clear, progressive questions that build in complexity
    - Give hints when candidates struggle, don't let them fail completely
    - Probe deeper into answers to assess true understanding
    - Balance technical depth with practical application
    - Be encouraging but maintain professional standards

    RESPONSE FORMAT:
    - Keep responses concise (2-3 sentences max for follow-ups)
    - Ask one question at a time
    - Provide specific, actionable feedback on code
    - Use a friendly but professional tone
    - Include difficulty adjustments based on candidate performance

    EVALUATION CRITERIA:
    - Code correctness and efficiency
    - Problem-solving approach and reasoning
    - Communication and explanation skills
    - Handling of edge cases and error scenarios
    - Best practices and clean code principles

    BEHAVIORAL GUIDELINES:
    - DO NOT respond when candidate is thinking out loud (phrases like "hmm", "let me think", "so I need to", "wait", "actually", "let me see")
    - WAIT for complete thoughts or direct questions before responding
    - PROVIDE encouraging hints when candidate seems lost or deviating for more than 30 seconds
    - OFFER gentle guidance like "You're on the right track, but consider..." or "That's a good start, what about..."
    - RECOGNIZE when candidate is working through a problem mentally vs. when they need help

    THINKING OUT LOUD INDICATORS (Do not respond to these):
    - "Hmm, so I think..."
    - "Let me see here..."
    - "Wait, actually..."
    - "So I need to..."
    - "Let me think about this..."
    - "Okay, so if I..."
    - Incomplete sentences or trailing thoughts
    - Self-corrections in progress

    INTERVENTION TRIGGERS (Provide helpful hints):
    - Candidate silent for extended period (30+ seconds)
    - Candidate going in wrong direction repeatedly
    - Candidate expressing frustration or confusion
    - Candidate asks for clarification or help directly
    - Candidate seems stuck on basic concepts`
  }

  async generateResponse(userInput, context = {}) {
    const prompt = this.buildContextualPrompt(userInput, context)
    
    try {
      const response = await axios.post(`${this.baseURL}/api/generate`, {
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 300,
          stop: ["\n\nHuman:", "\n\nCandidate:"]
        }
      })
      
      return response.data.response
    } catch (error) {
      console.error('Ollama API Error:', error.message)
      throw error
    }
  }

  buildContextualPrompt(userInput, context) {
    const { 
      interviewStage = 'initial',
      difficulty = 'medium',
      previousQuestions = [],
      codeSubmissions = [],
      candidateStrengths = [],
      candidateWeaknesses = []
    } = context

    return `${this.systemPrompt}

    CURRENT INTERVIEW STATE:
    - Stage: ${interviewStage}
    - Difficulty Level: ${difficulty}
    - Questions Asked: ${previousQuestions.length}
    - Code Submissions: ${codeSubmissions.length}
    - Identified Strengths: ${candidateStrengths.join(', ') || 'None yet'}
    - Areas to Probe: ${candidateWeaknesses.join(', ') || 'None identified'}

    CANDIDATE INPUT: "${userInput}"

    INSTRUCTIONS: Respond as the technical interviewer. ${this.getStageSpecificInstructions(interviewStage)}`
  }

  getStageSpecificInstructions(stage) {
    const instructions = {
      'initial': 'Start with a warm introduction and an easy warm-up question about their background or a simple technical concept.',
      'warmup': 'Ask a basic coding question to assess fundamental skills (arrays, loops, basic algorithms).',
      'technical': 'Present a medium difficulty coding challenge. Focus on problem-solving approach and code quality.',
      'deep_dive': 'Dive deeper into their solution. Ask about optimization, edge cases, and alternative approaches.',
      'system_design': 'Present a system design question appropriate for their level. Focus on architecture and trade-offs.',
      'behavioral': 'Ask about past projects, challenges faced, and technical decisions made.',
      'wrap_up': 'Provide overall feedback and ask if they have questions about the role or company.'
    }
    
    return instructions[stage] || 'Continue the technical assessment based on their previous responses.'
  }
}

export { OllamaService }

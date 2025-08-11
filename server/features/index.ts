import User from './Users/User.js'
import Interview from './Interview/Interview.js'
import Question from './Questions/Question.js'
import InterviewQuestion from './InterviewQuestions/InterviewQuestion.js'
import CodeSubmission from './CodeSubmissions/CodeSubmission.js'
import AIConversation from './AIConversations/AIConversation.js'
import UserProgress from './UserProgress/UserProgress.js'

// Set up associations
Interview.belongsTo(User)
User.hasMany(Interview)

InterviewQuestion.belongsTo(Interview)
Interview.hasMany(InterviewQuestion)

InterviewQuestion.belongsTo(Question)
Question.hasMany(InterviewQuestion)

CodeSubmission.belongsTo(InterviewQuestion)
InterviewQuestion.hasMany(CodeSubmission)

AIConversation.belongsTo(Interview)
Interview.hasMany(AIConversation)

UserProgress.belongsTo(User)
User.hasMany(UserProgress)

// Export all models
export {
  User,
  Interview,
  Question,
  InterviewQuestion,
  CodeSubmission,
  AIConversation,
  UserProgress,
}

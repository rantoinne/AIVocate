# Features Directory

This directory contains all the features of the application, each with their own models, controllers, and routes.

## Structure

Each feature has its own subdirectory containing:

- `Model.ts` - Sequelize model definition
- `Controller.ts` - Business logic
- `Routes.ts` - API endpoints

## Features

1. **Users** - User authentication and profiles
2. **Interview** - Interview sessions management
3. **Questions** - Question bank
4. **InterviewQuestions** - Relationship between interviews and questions
5. **CodeSubmissions** - Code execution and submission tracking
6. **AIConversations** - AI conversation history
7. **UserProgress** - User progress and analytics

## Database Models

All models are defined using Sequelize ORM and are synchronized with the PostgreSQL database at server startup.

## Associations

The models have the following associations:

- User has many Interviews
- Interview belongs to User
- Interview has many InterviewQuestions
- InterviewQuestion belongs to Interview
- Question has many InterviewQuestions
- InterviewQuestion belongs to Question
- InterviewQuestion has many CodeSubmissions
- CodeSubmission belongs to InterviewQuestion
- Interview has many AIConversations
- AIConversation belongs to Interview
- User has many UserProgress records
- UserProgress belongs to User
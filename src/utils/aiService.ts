import { Question, QUESTION_TIME_LIMITS } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Mock AI service that simulates real AI behavior
// In a real app, this would make API calls to OpenAI, Claude, etc.

const FULLSTACK_QUESTIONS = {
  Easy: [
    "What is the difference between HTML and HTML5?",
    "Explain the difference between var, let, and const in JavaScript.",
    "What is CSS and how is it different from inline styles?",
    "What is the purpose of the package.json file in a Node.js project?",
    "What is the difference between a class and an object in programming?",
    "Explain what React is and why it's popular for building user interfaces.",
    "What is the difference between frontend and backend development?",
    "What is an API and how do you use it?",
  ],
  Medium: [
    "Explain the concept of closures in JavaScript with an example.",
    "What is the Virtual DOM in React and how does it improve performance?",
    "Describe the difference between synchronous and asynchronous programming.",
    "What are React Hooks and how do they differ from class components?",
    "Explain what RESTful APIs are and their key principles.",
    "What is the difference between SQL and NoSQL databases?",
    "Describe how you would handle state management in a large React application.",
    "What is middleware in Express.js and how is it used?",
    "Explain the concept of promises in JavaScript and how they work.",
    "What is the difference between authentication and authorization?",
  ],
  Hard: [
    "Design a scalable system for handling real-time chat messages for thousands of users.",
    "Explain how you would optimize a React application for better performance.",
    "Describe the differences between microservices and monolithic architecture.",
    "How would you implement server-side rendering (SSR) in a React application?",
    "Design a database schema for an e-commerce platform with products, users, and orders.",
    "Explain how you would handle race conditions in a Node.js application.",
    "Describe how you would implement pagination for a large dataset efficiently.",
    "What strategies would you use to secure a web application from common vulnerabilities?",
    "How would you design a caching strategy for a high-traffic web application?",
    "Explain the differences between different testing strategies (unit, integration, e2e).",
  ],
};

export function generateQuestions(): Question[] {
  const questions: Question[] = [];
  
  // Generate 2 Easy, 2 Medium, 2 Hard questions
  (['Easy', 'Medium', 'Hard'] as const).forEach(difficulty => {
    const questionPool = FULLSTACK_QUESTIONS[difficulty];
    const selectedQuestions = getRandomQuestions(questionPool, 2);
    
    selectedQuestions.forEach(questionText => {
      questions.push({
        id: uuidv4(),
        text: questionText,
        difficulty,
        timeLimit: QUESTION_TIME_LIMITS[difficulty],
        startedAt: 0,
        timeRemaining: QUESTION_TIME_LIMITS[difficulty],
      });
    });
  });

  // Shuffle questions to mix difficulties
  return shuffleArray(questions);
}

function getRandomQuestions(pool: string[], count: number): string[] {
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function scoreAnswer(question: Question, answer: string): { score: number; feedback: string } {
  if (!answer || answer.trim().length === 0) {
    return {
      score: 0,
      feedback: "No answer provided."
    };
  }

  const answerLength = answer.trim().length;
  const words = answer.trim().split(/\s+/).length;
  
  // Basic scoring algorithm (in real app, this would use AI)
  let score = 0;
  let feedback = "";

  // Base score on answer length and complexity
  if (question.difficulty === 'Easy') {
    if (answerLength < 50) {
      score = Math.min(3, Math.max(1, words / 5));
      feedback = "Answer is quite brief. Consider providing more detail.";
    } else if (answerLength < 200) {
      score = Math.min(8, Math.max(4, words / 10));
      feedback = "Good answer with adequate detail.";
    } else {
      score = Math.min(10, Math.max(6, words / 15));
      feedback = "Comprehensive answer with good detail.";
    }
  } else if (question.difficulty === 'Medium') {
    if (answerLength < 100) {
      score = Math.min(4, Math.max(1, words / 8));
      feedback = "Answer needs more depth for a medium-level question.";
    } else if (answerLength < 300) {
      score = Math.min(7, Math.max(3, words / 12));
      feedback = "Decent answer, but could use more technical detail.";
    } else {
      score = Math.min(10, Math.max(5, words / 18));
      feedback = "Well-detailed answer showing good understanding.";
    }
  } else { // Hard
    if (answerLength < 150) {
      score = Math.min(3, Math.max(1, words / 10));
      feedback = "Hard questions require more comprehensive answers.";
    } else if (answerLength < 400) {
      score = Math.min(6, Math.max(2, words / 15));
      feedback = "Good start, but hard questions need more architectural thinking.";
    } else {
      score = Math.min(10, Math.max(4, words / 20));
      feedback = "Excellent comprehensive answer with good technical depth.";
    }
  }

  // Add bonus for technical keywords (simple keyword matching)
  const technicalKeywords = [
    'react', 'javascript', 'node', 'api', 'database', 'server', 'client',
    'async', 'await', 'promise', 'callback', 'event', 'component', 'state',
    'props', 'hook', 'middleware', 'express', 'mongodb', 'sql', 'rest',
    'http', 'authentication', 'authorization', 'security', 'performance',
    'optimization', 'scalability', 'architecture', 'microservice', 'monolith'
  ];

  const keywordCount = technicalKeywords.filter(keyword =>
    answer.toLowerCase().includes(keyword)
  ).length;

  if (keywordCount > 0) {
    score += Math.min(2, keywordCount * 0.5);
    if (keywordCount >= 3) {
      feedback += " Great use of technical terminology.";
    }
  }

  return {
    score: Math.min(10, Math.round(score * 10) / 10),
    feedback: feedback.trim()
  };
}

export function generateFinalSummary(questions: Question[], totalScore: number, candidateName: string): string {
  const completedQuestions = questions.filter(q => q.answer && q.score !== undefined);
  const avgScore = completedQuestions.length > 0 
    ? completedQuestions.reduce((sum, q) => sum + (q.score || 0), 0) / completedQuestions.length 
    : 0;

  const easyQuestions = completedQuestions.filter(q => q.difficulty === 'Easy');
  const mediumQuestions = completedQuestions.filter(q => q.difficulty === 'Medium');
  const hardQuestions = completedQuestions.filter(q => q.difficulty === 'Hard');

  const easyAvg = easyQuestions.length > 0 
    ? easyQuestions.reduce((sum, q) => sum + (q.score || 0), 0) / easyQuestions.length 
    : 0;
  const mediumAvg = mediumQuestions.length > 0 
    ? mediumQuestions.reduce((sum, q) => sum + (q.score || 0), 0) / mediumQuestions.length 
    : 0;
  const hardAvg = hardQuestions.length > 0 
    ? hardQuestions.reduce((sum, q) => sum + (q.score || 0), 0) / hardQuestions.length 
    : 0;

  let performance = "";
  if (avgScore >= 8) {
    performance = "Excellent";
  } else if (avgScore >= 6) {
    performance = "Good";
  } else if (avgScore >= 4) {
    performance = "Fair";
  } else {
    performance = "Needs Improvement";
  }

  let strengths = [];
  let improvements = [];

  if (easyAvg >= 7) strengths.push("strong fundamentals");
  else if (easyAvg < 5) improvements.push("basic concepts");

  if (mediumAvg >= 7) strengths.push("good intermediate knowledge");
  else if (mediumAvg < 5) improvements.push("intermediate technical skills");

  if (hardAvg >= 6) strengths.push("excellent problem-solving abilities");
  else if (hardAvg < 4) improvements.push("complex system design thinking");

  const summary = `${candidateName} completed the Full-Stack Developer interview with a ${performance} performance (${avgScore.toFixed(1)}/10 average).

Scores by Difficulty:
• Easy Questions: ${easyAvg.toFixed(1)}/10 (${easyQuestions.length} questions)
• Medium Questions: ${mediumAvg.toFixed(1)}/10 (${mediumQuestions.length} questions)  
• Hard Questions: ${hardAvg.toFixed(1)}/10 (${hardQuestions.length} questions)

${strengths.length > 0 ? `Strengths: ${strengths.join(', ')}.` : ''}
${improvements.length > 0 ? `Areas for improvement: ${improvements.join(', ')}.` : ''}

Overall, ${candidateName} ${avgScore >= 6 ? 'shows solid potential for a full-stack role' : 'may benefit from additional preparation before taking on a full-stack position'}.`;

  return summary;
}
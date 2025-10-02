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

  // Generate exactly 2 Easy, then 2 Medium, then 2 Hard (strict order)
  (['Easy', 'Medium', 'Hard'] as const).forEach((difficulty) => {
    const questionPool = FULLSTACK_QUESTIONS[difficulty];
    const selectedQuestions = getRandomQuestions(questionPool, 2);

    selectedQuestions.forEach((questionText) => {
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

  // IMPORTANT: Do NOT shuffle. Preserve Easy → Medium → Hard order.
  return questions;
}

function getRandomQuestions(pool: string[], count: number): string[] {
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Note: shuffleArray kept for potential future use but not used in flow ordering.
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function scoreAnswer(question: Question, answer: string): { score: number; feedback: string } {
  const raw = (answer || '').trim();
  const words = raw.length ? raw.split(/\s+/).length : 0;

  // Never give 0 — even empty gets a minimal score so results look friendly
  const MIN_SCORE = 3.0; // make baseline a bit higher
  const clamp = (n: number) => Math.max(MIN_SCORE, Math.min(10, n));

  if (!raw) {
    return {
      score: MIN_SCORE,
      feedback: 'No answer provided. Minimal score awarded to keep results friendly.'
    };
  }

  // Baseline scoring is more lenient: short but valid answers can still score well
  let score = 0;
  let feedback = '';

  const addFeedback = (txt: string) => {
    if (!feedback) feedback = txt; else feedback += ' ' + txt;
  };

  const easyBands = () => {
    if (words < 6) { score = 6.8; addFeedback('Concise but valid answer for an easy question.'); }
    else if (words < 18) { score = 8.2; addFeedback('Good concise explanation.'); }
    else { score = 9.5; addFeedback('Detailed and clear.'); }
  };
  const mediumBands = () => {
    if (words < 10) { score = 6.2; addFeedback('Brief for medium difficulty; still reasonable.'); }
    else if (words < 30) { score = 7.8; addFeedback('Solid explanation for a medium question.'); }
    else { score = 9.0; addFeedback('Thorough and clear.'); }
  };
  const hardBands = () => {
    if (words < 15) { score = 6.0; addFeedback('Compact for a hard question; consider adding more design detail.'); }
    else if (words < 45) { score = 8.0; addFeedback('Good coverage; shows understanding.'); }
    else { score = 9.2; addFeedback('Comprehensive and well-structured.'); }
  };

  if (question.difficulty === 'Easy') easyBands();
  else if (question.difficulty === 'Medium') mediumBands();
  else hardBands();

  // Keyword bonus — small, to help short but correct answers look good
  const technicalKeywords = [
    'react','javascript','node','api','database','server','client','async','await','promise','callback','event',
    'component','state','props','hook','express','middleware','mongodb','postgres','sql','rest','http','jwt',
    'authentication','authorization','security','performance','cache','optimization','scalability','architecture',
    'microservice','monolith','queue','redis','kafka','docker'
  ];
  const lower = raw.toLowerCase();
  const keywordCount = technicalKeywords.filter(k => lower.includes(k)).length;
  if (keywordCount > 0) {
    const cap = question.difficulty === 'Hard' ? 2.5 : question.difficulty === 'Medium' ? 2.2 : 1.8;
    score += Math.min(cap, 0.5 * keywordCount);
    if (keywordCount >= 2) addFeedback('Good use of technical terms.');
  }

  // Small structure bonus for punctuation/newlines indicating organization
  if (/[\n,.;-]/.test(raw)) score += 0.5;

  // Finalize
  score = Math.round(clamp(score) * 10) / 10;
  return { score, feedback: feedback.trim() };
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
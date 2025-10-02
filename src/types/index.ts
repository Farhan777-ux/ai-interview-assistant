export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  resumeText?: string;
  resumeFileName?: string;
  createdAt: number;
  updatedAt: number;
  interview?: Interview;
  finalScore?: number;
  finalSummary?: string;
  status: 'incomplete' | 'in-progress' | 'completed';
}

export interface Interview {
  id: string;
  candidateId: string;
  questions: Question[];
  currentQuestionIndex: number;
  startedAt: number;
  completedAt?: number;
  isPaused: boolean;
  totalScore: number;
}

export interface Question {
  id: string;
  text: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeLimit: number; // in seconds
  answer?: string;
  score?: number;
  feedback?: string;
  answeredAt?: number;
  startedAt: number;
  timeRemaining: number;
}

export interface ChatMessage {
  id: string;
  type: 'system' | 'user' | 'question' | 'timer' | 'score';
  content: string;
  timestamp: number;
  questionId?: string;
  metadata?: any;
}

export interface AppState {
  currentView: 'interviewee' | 'interviewer';
  currentCandidate?: string;
  showWelcomeBack: boolean;
  isInterviewActive: boolean;
  showEndModal?: boolean;
  endModalMessage?: string;
}

export const QUESTION_TIME_LIMITS = {
  Easy: 20,
  Medium: 60,
  Hard: 120
} as const;

export const QUESTIONS_PER_DIFFICULTY = 2;
export const TOTAL_QUESTIONS = 6;
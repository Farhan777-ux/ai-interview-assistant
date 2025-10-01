import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Candidate, Interview, Question, ChatMessage } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface CandidatesState {
  candidates: Candidate[];
  chatMessages: { [candidateId: string]: ChatMessage[] };
}

const initialState: CandidatesState = {
  candidates: [],
  chatMessages: {},
};

const candidatesSlice = createSlice({
  name: 'candidates',
  initialState,
  reducers: {
    addCandidate: (state, action: PayloadAction<Omit<Candidate, 'id' | 'createdAt' | 'updatedAt' | 'status'>>) => {
      const newCandidate: Candidate = {
        ...action.payload,
        id: uuidv4(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: 'incomplete',
      };
      state.candidates.push(newCandidate);
      state.chatMessages[newCandidate.id] = [];
    },
    
    updateCandidate: (state, action: PayloadAction<{ id: string; updates: Partial<Candidate> }>) => {
      const { id, updates } = action.payload;
      const candidateIndex = state.candidates.findIndex(c => c.id === id);
      if (candidateIndex !== -1) {
        state.candidates[candidateIndex] = {
          ...state.candidates[candidateIndex],
          ...updates,
          updatedAt: Date.now(),
        };
      }
    },

    startInterview: (state, action: PayloadAction<{ candidateId: string; questions: Question[] }>) => {
      const { candidateId, questions } = action.payload;
      const candidate = state.candidates.find(c => c.id === candidateId);
      if (candidate) {
        const interview: Interview = {
          id: uuidv4(),
          candidateId,
          questions,
          currentQuestionIndex: 0,
          startedAt: Date.now(),
          isPaused: false,
          totalScore: 0,
        };
        candidate.interview = interview;
        candidate.status = 'in-progress';
        candidate.updatedAt = Date.now();
      }
    },

    updateQuestion: (state, action: PayloadAction<{ candidateId: string; questionIndex: number; updates: Partial<Question> }>) => {
      const { candidateId, questionIndex, updates } = action.payload;
      const candidate = state.candidates.find(c => c.id === candidateId);
      if (candidate?.interview) {
        candidate.interview.questions[questionIndex] = {
          ...candidate.interview.questions[questionIndex],
          ...updates,
        };
        candidate.updatedAt = Date.now();
      }
    },

    moveToNextQuestion: (state, action: PayloadAction<string>) => {
      const candidateId = action.payload;
      const candidate = state.candidates.find(c => c.id === candidateId);
      if (candidate?.interview) {
        candidate.interview.currentQuestionIndex += 1;
        candidate.updatedAt = Date.now();
      }
    },

    completeInterview: (state, action: PayloadAction<{ candidateId: string; finalScore: number; summary: string }>) => {
      const { candidateId, finalScore, summary } = action.payload;
      const candidate = state.candidates.find(c => c.id === candidateId);
      if (candidate?.interview) {
        candidate.interview.completedAt = Date.now();
        candidate.interview.totalScore = finalScore;
        candidate.finalScore = finalScore;
        candidate.finalSummary = summary;
        candidate.status = 'completed';
        candidate.updatedAt = Date.now();
      }
    },

    pauseInterview: (state, action: PayloadAction<string>) => {
      const candidateId = action.payload;
      const candidate = state.candidates.find(c => c.id === candidateId);
      if (candidate?.interview) {
        candidate.interview.isPaused = true;
        candidate.updatedAt = Date.now();
      }
    },

    resumeInterview: (state, action: PayloadAction<string>) => {
      const candidateId = action.payload;
      const candidate = state.candidates.find(c => c.id === candidateId);
      if (candidate?.interview) {
        candidate.interview.isPaused = false;
        candidate.updatedAt = Date.now();
      }
    },

    addChatMessage: (state, action: PayloadAction<{ candidateId: string; message: Omit<ChatMessage, 'id' | 'timestamp'> }>) => {
      const { candidateId, message } = action.payload;
      const newMessage: ChatMessage = {
        ...message,
        id: uuidv4(),
        timestamp: Date.now(),
      };
      
      if (!state.chatMessages[candidateId]) {
        state.chatMessages[candidateId] = [];
      }
      state.chatMessages[candidateId].push(newMessage);
    },

    deleteCandidate: (state, action: PayloadAction<string>) => {
      const candidateId = action.payload;
      state.candidates = state.candidates.filter(c => c.id !== candidateId);
      delete state.chatMessages[candidateId];
    },
  },
});

export const {
  addCandidate,
  updateCandidate,
  startInterview,
  updateQuestion,
  moveToNextQuestion,
  completeInterview,
  pauseInterview,
  resumeInterview,
  addChatMessage,
  deleteCandidate,
} = candidatesSlice.actions;

export default candidatesSlice.reducer;
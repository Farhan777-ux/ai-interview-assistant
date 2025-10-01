import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppState } from '../types';

const initialState: AppState = {
  currentView: 'interviewee',
  showWelcomeBack: false,
  isInterviewActive: false,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setCurrentView: (state, action: PayloadAction<'interviewee' | 'interviewer'>) => {
      state.currentView = action.payload;
    },
    
    setCurrentCandidate: (state, action: PayloadAction<string | undefined>) => {
      state.currentCandidate = action.payload;
    },
    
    setShowWelcomeBack: (state, action: PayloadAction<boolean>) => {
      state.showWelcomeBack = action.payload;
    },
    
    setIsInterviewActive: (state, action: PayloadAction<boolean>) => {
      state.isInterviewActive = action.payload;
    },
    
    resetApp: () => initialState,
  },
});

export const {
  setCurrentView,
  setCurrentCandidate,
  setShowWelcomeBack,
  setIsInterviewActive,
  resetApp,
} = appSlice.actions;

export default appSlice.reducer;
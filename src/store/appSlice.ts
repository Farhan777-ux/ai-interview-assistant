import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppState } from '../types';

const initialState: AppState = {
  currentView: 'interviewee',
  showWelcomeBack: false,
  isInterviewActive: false,
  showEndModal: false,
  endModalMessage: undefined,
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

    setEndModal: (state, action: PayloadAction<{ visible: boolean; message?: string }>) => {
      state.showEndModal = action.payload.visible;
      state.endModalMessage = action.payload.message;
    },
    
    resetApp: () => initialState,
  },
});

export const {
  setCurrentView,
  setCurrentCandidate,
  setShowWelcomeBack,
  setIsInterviewActive,
  setEndModal,
  resetApp,
} = appSlice.actions;

export default appSlice.reducer;
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import candidatesReducer from './candidatesSlice';
import appReducer from './appSlice';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['candidates'], // Only persist candidates data
};

const rootReducer = combineReducers({
  candidates: candidatesReducer,
  app: appReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

// Make store available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).store = store;
}

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
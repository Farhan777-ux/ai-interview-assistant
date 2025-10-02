# AI Interview Assistant (React + Redux)

An AI-powered interview practice and evaluation app with two synced tabs:
- Interviewee (chat) — resume upload, missing field collection, 6 timed questions (2 easy, 2 medium, 2 hard), auto-submit on timeout
- Interviewer (dashboard) — list of candidates with score/summary, search/sort, per-candidate detail view

Data is persisted locally so users can close/reopen and continue. Includes a Welcome Back modal for resuming sessions.

## Recent customizations (requested)

- Interviewee footer added and styled for dark theme
- Removed “Start Test Interview (Skip Upload)” option
- Missing-details gate: if Name/Email/Phone are absent after resume parsing, a focused form appears and blocks interview start until completed
- Phone numbers standardized to India format: always displayed as (+91) XXXXXXXXXX, inputs require 10 digits, and storage is normalized to the last 10 digits
- Applied cohesive dark theme with blue accents and clear sans-serif fonts; centered and enhanced header title
- Increased header height to ensure the title is fully visible; adjusted content layout accordingly
- Improved readability of answers in Interviewer > View details modal (high-contrast panel, preserved line breaks, scroll for long answers)

## Live Dev

- Start: `npm start`
- URL: http://localhost:3000

## Core Features

- Resume Upload (PDF/DOCX)
  - Extract Name, Email, Phone
  - Missing fields are collected before interview starts
- Interview Flow
  - 6 questions total: 2 Easy (20s), 2 Medium (60s), 2 Hard (120s)
  - One question at a time, per-question timer, auto-submit on timeout
  - Local mock AI for question generation, answer scoring, and final summary
- Interviewer Dashboard
  - Candidate list with final score and summary
  - Search and sort
  - View details: questions, answers, per-question scores
  - Delete sessions (works in Dashboard and Welcome Back modal)
- Persistence
  - Redux Toolkit + redux-persist (localStorage)
  - Restores interview state, timers, and chat history
  - Welcome Back modal for unfinished sessions

## Tech Stack

- React (CRA)
- Redux Toolkit + redux-persist
- Ant Design UI
- pdfjs-dist (PDF text extraction)
- mammoth (DOCX text extraction)

## PDF.js Worker Setup

To avoid cross-origin and ESM worker issues under CRA, the PDF.js worker is served locally from `public`:

- Worker file: `public/pdf.worker.min.mjs`
- Config: `src/utils/resumeProcessor.ts` sets
  ```js
  GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.mjs`;
  ```

This repo includes the worker file under `public/` so dev and production builds work without downloading from a CDN.

## Project Structure (key files)

- `src/components/ResumeUpload.tsx` — Upload + parsing + missing-details gate (no test mode)
- `src/components/InterviewCoordinator.tsx` — Missing field collection + start flow
- `src/components/ChatInterface.tsx` — Chat, timers, scoring and progression
- `src/components/CandidateList.tsx` — Dashboard with search/sort, view, delete
- `src/components/WelcomeBackModal.tsx` — Resume/Delete unfinished sessions
- `src/utils/resumeProcessor.ts` — PDF/DOCX parsing and field extraction (stores last 10 phone digits)
- `src/utils/phone.ts` — Phone helpers: normalizeTo10Digits, formatPhoneIndia ((+91) XXXXXXXXXX)
- `src/utils/aiService.ts` — Mock AI for questions and scoring
- `src/store/*` — Redux slices and persisted store config
- `public/pdf.worker.min.mjs` — Local PDF.js worker

## Styling & Theme

- Ant Design dark algorithm enabled, with primary blue accent (#3fa9ff)
- Header title centered and emphasized; global sans-serif font stack (no cursive)
- Cards, modals, and tabs tuned for dark backgrounds

## Phone Number Handling

- Display: always formatted as (+91) XXXXXXXXXX across the app
- Input: requires exactly 10 digits; UI shows (+91) prefix in forms
- Storage: only the last 10 digits are stored; extraction normalized from resume text

## Deployment

1) Build: `npm run build`
2) Deploy the `build/` directory to your host (Vercel/Netlify compatible)

Netlify
- Set build command: `npm run build`
- Publish directory: `build`

Vercel
- Create new project from this repo, framework: React (Create React App)

## Paths

- Project root: `C:\\Users\\User\\ai-interview-assistant`
- Production build: `C:\\Users\\User\\ai-interview-assistant\\build`

## Notes

- The app stores data locally (browser). Clearing site data resets candidates and progress.
- No external LLM API keys are required; question generation and scoring are local mocks.

## Demo Video 
 Video link: https://drive.google.com/file/d/157ioVMclgvcBRB0eydHYJKAwwnDfM8wc/view?usp=drive_link



https://github.com/user-attachments/assets/2254befe-fffe-4511-b40f-d1b5fee4b1c7



 


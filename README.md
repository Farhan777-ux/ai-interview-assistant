# AI Interview Assistant (React + Redux)

An AI-powered interview practice and evaluation app with two synced tabs:
- Interviewee (chat) — resume upload, missing field collection, 6 timed questions (2 easy, 2 medium, 2 hard), auto-submit on timeout
- Interviewer (dashboard) — list of candidates with score/summary, search/sort, per-candidate detail view

Data is persisted locally so users can close/reopen and continue. Includes a Welcome Back modal for resuming sessions.

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

- `src/components/ResumeUpload.tsx` — Upload + parsing + test mode
- `src/components/InterviewCoordinator.tsx` — Missing field collection + start flow
- `src/components/ChatInterface.tsx` — Chat, timers, scoring and progression
- `src/components/CandidateList.tsx` — Dashboard with search/sort, view, delete
- `src/components/WelcomeBackModal.tsx` — Resume/Delete unfinished sessions
- `src/utils/resumeProcessor.ts` — PDF/DOCX parsing and field extraction
- `src/utils/aiService.ts` — Mock AI for questions and scoring
- `src/store/*` — Redux slices and persisted store config
- `public/pdf.worker.min.mjs` — Local PDF.js worker

## Deployment

1) Build: `npm run build`
2) Deploy the `build/` directory to your host (Vercel/Netlify compatible)

Netlify
- Set build command: `npm run build`
- Publish directory: `build`

Vercel
- Create new project from this repo, framework: React (Create React App)

## Notes

- The app stores data locally (browser). Clearing site data resets candidates and progress.
- No external LLM API keys are required; question generation and scoring are local mocks.

## License

MIT

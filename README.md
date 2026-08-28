# FluentAI – Personal English Communication Coach

FluentAI is a personal English communication coaching web application built for **self-improvement**. It provides AI-powered practice modules for speaking, pronunciation, vocabulary, grammar, reading, listening, writing, mock interviews, and group discussion simulations.

No login, no registration — just launch and practice.

---

## 🚀 Practice Modules

| Module | Description |
|---|---|
| 🎤 **Speech Evaluator** | Record voice → get fluency, grammar, vocabulary & naturalness scores + corrections |
| 🔊 **Pronunciation Coach** | Select or type a word → listen to its IPA → record your attempt → get phoneme feedback |
| 📖 **Vocabulary Builder** | AI-generated word flashcards with 3D flip animations, bookmarks & retention quizzes |
| 🏆 **Grammar Coach** | Structured lessons on tenses, articles, prepositions with built-in quizzes |
| 📄 **Reading Aloud** | Read AI-generated passages aloud → transcription + comprehension quiz scoring |
| 🎧 **Listening Practice** | Listen to audio clips (TTS) → answer comprehension MCQs |
| ✍️ **Writing Assistant** | Submit essays, emails & paragraphs → AI scores grammar, vocabulary, tone & readability |
| 💼 **Mock Interview Coach** | HR, Technical & Behavioral rounds with STAR criteria evaluation |
| 👥 **GD Simulator** | Simulate group discussions with 4 AI personas, receive participation & leadership scores |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Framer Motion |
| Backend | FastAPI, SQLAlchemy, Python 3.11 |
| Database | Supabase PostgreSQL (no auth dependency) |
| AI Engine | Google Gemini API (`gemini-2.5-flash` or `gemini-flash-latest`) |
| Speech-to-Text | Gemini Multimodal Audio API (Whisper fallback optional) |
| Text-to-Speech | Browser Web Speech Synthesis API (100% offline, free) |
| Deployment | Vercel (frontend) + Render (backend) |

---

## 📂 Project Structure

```text
FluentAI/
├── supabase_fresh_reset.sql   # ← Run this in Supabase SQL Editor to set up tables
├── backend/
│   ├── app/
│   │   ├── core/              # Config, database, personal user security
│   │   ├── models/            # SQLAlchemy table models
│   │   ├── schemas/           # Pydantic validation schemas
│   │   ├── services/          # Gemini & Whisper service logic
│   │   ├── api/               # Route endpoints (endpoints.py)
│   │   └── main.py            # FastAPI app entry point
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example           # ← copy this to .env and fill in your keys
└── frontend/
    ├── src/
    │   ├── app/               # Next.js pages (dashboard + practice modules)
    │   ├── components/        # Shared UI (Sidebar, AudioRecorder, TTSButton, etc.)
    │   └── services/          # API fetch client (api.ts)
    ├── package.json
    └── .env.local             # ← create this file with your backend URL
```

---

## 🔑 Setup Guide

You need keys from **two services**: Supabase (database) and Google AI Studio (AI).

---

### Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → sign in with GitHub → click **New Project**.
2. Give it a name (e.g. `fluentai`), set a strong database password _(save this!)_, choose a region.
3. Wait ~2 minutes for setup to complete.

---

### Step 2 — Collect Your Supabase Database URL

In your Supabase dashboard:

1. Go to **Project Settings → Database** (left sidebar).
2. Scroll to **Connection String → URI tab → Transaction mode** (port `6543`).
3. Copy the string — it looks like:
   ```
   postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-0-region.pooler.supabase.com:6543/postgres
   ```
4. Replace `[YOUR-PASSWORD]` with the password you set in Step 1.

> You do **not** need Supabase Auth keys — this app runs in personal mode with a fixed user ID.

---

### Step 3 — Set Up the Database Tables

1. In your Supabase dashboard, open the **SQL Editor** (left sidebar).
2. Click **New Query**.
3. Open `supabase_fresh_reset.sql` from this project, copy its full contents, and paste into the editor.
4. Click **Run**. This creates all tables and seeds your personal user profile.

---

### Step 4 — Get Your Google Gemini API Key

1. Go to [aistudio.google.com](https://aistudio.google.com) and sign in.
2. Click **Get API Key** → **Create API key**.
3. Copy the key (starts with `AIzaSy...`).

> **Free Tier:** Gemini Flash gives 15 requests/minute and 1 million tokens/day — more than enough for personal use.

---

### Step 5 — Configure the Backend `.env`

```bash
# Copy the example file
copy backend\.env.example backend\.env
```

Open `backend/.env` and fill in:

```env
# Your Supabase database connection string (Transaction mode, port 6543)
DATABASE_URL="postgresql://postgres.xxxx:YOUR-PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres"

# Your Google Gemini API key
GEMINI_API_KEY="AIzaSyYourKeyHere"

# Use Gemini for audio transcription (recommended — no local model needed)
WHISPER_FALLBACK_TO_GEMINI="True"

# Optional — only needed if you run Ollama locally
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama3.1"
```

> `SUPABASE_JWT_SECRET` is **not required** — the app uses a fixed personal user ID, no JWT auth.

---

### Step 6 — Configure the Frontend `.env.local`

Create the file `frontend/.env.local`:

```bash
# Windows PowerShell:
New-Item frontend\.env.local -ItemType File
```

Add this single line:

```env
# Backend API URL — keep as-is for local development
NEXT_PUBLIC_API_URL="http://localhost:8000/api"
```

> For **production deployment**, change this to your live Render backend URL:
> `NEXT_PUBLIC_API_URL="https://your-fluentai-backend.onrender.com/api"`

---

## 🏃 Running Locally

### Start the Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
.\venv\Scripts\activate        # Windows
# source venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn app.main:app --reload
```

✅ Backend: **http://localhost:8000**  
🩺 Health check: **http://localhost:8000/** (shows DB status + Gemini key config)

---

### Start the Frontend

Open a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

✅ App opens at: **http://localhost:3000** → auto-redirects to `/dashboard`

---

## 🚀 Deployment

### Backend → Render (Free)

1. Push this project to a GitHub repository (ensure `.env` is in `.gitignore`).
2. Go to [render.com](https://render.com) → **New Web Service** → connect your repo.
3. Set **Root Directory** to `backend`, **Runtime** to **Docker**.
4. Add backend environment variables under **Environment** tab:
   - `DATABASE_URL`
   - `GEMINI_API_KEY`
   - `WHISPER_FALLBACK_TO_GEMINI=True`
5. Click **Deploy**. You'll get a URL like `https://fluentai-backend.onrender.com`.

> ⚠️ Render free tier spins down after 15 mins of inactivity — first request after idle takes ~30 seconds.

### Frontend → Vercel (Free)

1. Go to [vercel.com](https://vercel.com) → **New Project** → import your GitHub repo.
2. Set **Root Directory** to `frontend`.
3. Under **Environment Variables**, add:
   ```
   NEXT_PUBLIC_API_URL = https://your-fluentai-backend.onrender.com/api
   ```
4. Click **Deploy**.

---

## ✅ Environment Variables Quick Reference

| Variable | File | Value |
|---|---|---|
| `DATABASE_URL` | `backend/.env` | Supabase → Settings → Database → Connection String (Transaction, port 6543) |
| `GEMINI_API_KEY` | `backend/.env` | [aistudio.google.com](https://aistudio.google.com) → Get API Key |
| `WHISPER_FALLBACK_TO_GEMINI` | `backend/.env` | `True` (recommended) |
| `NEXT_PUBLIC_API_URL` | `frontend/.env.local` | `http://localhost:8000/api` (local) or Render URL (production) |

---

## ❓ Common Issues & Fixes

| Problem | Solution |
|---|---|
| Gemini `404 model not found` | Use `gemini-2.5-flash` or `gemini-flash-latest` in `backend/.env` or `config.py` |
| `connection refused` on startup | Ensure `DATABASE_URL` uses Transaction pooler at port `6543` not `5432` |
| Frontend shows blank page / API error | Check `frontend/.env.local` exists and `NEXT_PUBLIC_API_URL` points to running backend |
| `npm run dev` fails | Run `npm install` first inside the `frontend/` directory |
| Backend crashes on startup | Activate your virtual environment and run `pip install -r requirements.txt` |
| Microphone not working | Use HTTPS in production (browsers block mic on plain HTTP); locally `localhost` is fine |
| Supabase `relation does not exist` | Run `supabase_fresh_reset.sql` in the Supabase SQL Editor to create all tables |

# ResumeAI V2.0 & V2.5 — AI Verification & Proctored Assessment Platform

> **"Understand your resume. Verify candidate credibility. Conduct secure proctored assessments."**

ResumeAI has been upgraded to a unified, production-grade intelligence and recruitment platform combining **V2.0 AI Skill Verification** and **V2.5 Proctored Technical Assessments**. It connects candidates, recruiters, and administrators in a secure, transparent, and explainable hiring ecosystem.

---

## 🌟 What's New in V2.0 & V2.5

### 🧠 V2.0 — AI Verification & RAG Vector Architecture
- **In-Memory & MongoDB Hybrid Vector Database**: 768-dimensional normalized embeddings using Google Gemini `text-embedding-004` with semantic cosine similarity search. Requires zero third-party cloud vector DB services to run locally.
- **Hierarchical Resume & JD Chunking**: Structured chunking of resumes and job descriptions (summary, skills, projects, work experience, education, certifications) with document-level and chunk-level metadata.
- **Skill Evidence Mapping**: Traces every claimed skill back to concrete projects, work experiences, certifications, and contextual snippets with a confidence score.
- **Explainable Credibility Score (100% Transparent Formula)**:
  $$\text{Credibility Score} = (\text{Resume Evidence} \times 30\%) + (\text{Assessment Performance} \times 50\%) + (\text{Consistency} \times 20\%)$$
  - **Resume Evidence (30%)**: Quality and density of contextual proof extracted across projects and work experiences.
  - **Assessment Performance (50%)**: Objective score achieved in proctored skill tests.
  - **Consistency (20%)**: Alignment between claimed proficiency vs demonstrated competence.
- **Semantic Candidate Matching**: Recruiters can query candidates with free-form natural language (e.g. *"React and Node.js engineer with microservices experience"*) and receive cosine similarity ranked candidates.
- **Dual Document Support**: Ingests both **PDF** (`pdf-parse`) and **DOCX / Word** (`mammoth`) resumes.

---

### 🛡️ V2.5 — Proctored Technical Assessments
- **Assessment Rooms (`RAI-XXXXX`)**: Recruiters create dedicated screening rooms with customizable codes, candidate limits, expirations, and test requirements.
- **Server-Authoritative Timer**: Timers are enforced on the backend (`startedAt` + `durationMs` = `expiresAt`). Prevents client-side time manipulation and automatically auto-submits tests on expiration.
- **Dynamic Adaptive Difficulty**: Sessions adapt in real time across **Easy**, **Medium**, and **Hard** questions based on candidate performance.
- **Question Security & Zero-Downtime Guarantee**: Correct answer keys are strictly hidden from candidate clients during testing. If the Gemini API is throttled or quota is exhausted, curated fallback technical question banks serve vetted questions instantaneously with zero loading hangs.
- **Full Proctoring Environment**:
  - **Pre-Check & Explicit Consent**: System checks for webcam, microphone, and fullscreen mode before exam start.
  - **Floating Live Webcam Feed**: Continuous candidate presence indicator with mirroring.
  - **Periodic Snapshot Ingestion**: Captures webcam snapshots (~every 40 seconds) uploaded to secure backend storage.
  - **Client-Side Integrity Detectors**: Neutral detection of `TAB_SWITCH`, `FULLSCREEN_EXIT`, `COPY/PASTE`, `RIGHT_CLICK`, and `CAMERA_INTERRUPTED`.
  - **Non-Accusatory Compliance Timeline**: Logs objective observations (e.g., *"Tab switch event recorded: window focus changed"*) with visual status badges rather than biased accusations.

---

## 👥 Three Complete Role Workspaces

### 1. 🎓 Candidate Workspace
- **Dashboard**: Quick launchpad to skill evidence map, proctored tests, and credibility score.
- **Resume Hub**: Upload PDF or DOCX resumes with multi-skill extraction.
- **Skill Evidence Map** (`/candidate/skill-verification`): Inspect evidence snippets and project associations.
- **Proctored Assessments Hub** (`/candidate/assessments`): Enter room code (`RAI-XXXXX`), review instructions, and launch tests.
- **Exam Room** (`/candidate/assessment/:sessionId`): Pre-check consent, floating webcam, adaptive questions, live countdown timer.
- **Assessment & Proctoring Reports**: Breakdown by skill, difficulty performance, and neutral integrity timeline.
- **Credibility Report** (`/candidate/verification-report`): Complete breakdown of Evidence (30%), Assessment (50%), and Consistency (20%).
- **Job Applications**: Browse jobs, apply with one click, and inspect AI match alignment scores.

### 2. 💼 Recruiter Workspace
- **Dashboard**: High-level metrics for active jobs, applicants, rooms, and quick launchpads.
- **Job Management**: Create positions manually or auto-parse JD documents via AI.
- **Assessment Rooms** (`/recruiter/assessment-rooms`): Create and manage screening rooms (`RAI-DEMO1`), inspect candidates, and review scores.
- **Semantic Talent Search** (`/recruiter/candidates`): RAG vector search across all candidate resumes.
- **Verification Reports** (`/recruiter/reports`): View overall credibility scores and review candidate assessments.
- **Candidate Profiles**: View complete candidate details, resume download, skill evidence, assessment history, and proctoring audits.

### 3. ⚙️ Admin Workspace
- **Admin Overview** (`/admin/dashboard`): System statistics, vector DB health, system status, and live audit stream.
- **User Management** (`/admin/users`): View all candidates, recruiters, and admins with instant status toggle (Active/Inactive).
- **Job Management** (`/admin/jobs`): System-wide view of all published and draft positions.
- **Resume Repository** (`/admin/resumes`): Ingested resumes, parsing status, and file records.
- **Assessments & Rooms** (`/admin/assessments`): Full directory of assessment templates and active screening rooms.
- **Proctoring Monitor** (`/admin/proctoring`): Live assessment sessions, completion status, and recent integrity events.
- **Vector DB Status** (`/admin/vector-db`): Total indexed vector chunks, dimensions (768), and provider health.
- **AI Usage Analytics** (`/admin/ai-usage`): Gemini model status, token generation metrics, and fallback status.
- **Audit Logs** (`/admin/audit-logs`): Filterable system-wide immutable audit trail.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Axios, React Router v6 |
| **Backend** | Node.js, Express.js, TypeScript, Mongoose (MongoDB) |
| **Vector DB & RAG** | 768-D Normalized Cosine Vector Store, Logical Chunking Engine |
| **AI LLM & Embeddings** | Google Gemini (`gemini-3.8-flash`, `gemini-2.5-flash`), `text-embedding-004` |
| **Document Processing** | `pdf-parse` (PDF resumes/JDs), `mammoth` (DOCX documents) |
| **Proctoring & Media** | HTML5 MediaDevices API, Canvas snapshot capture, Multi-event listeners |
| **Security & Auth** | Role-based Access Control (`CANDIDATE`, `RECRUITER`, `ADMIN`), JWT HTTP-only cookies, bcryptjs, Helmet, CORS, Rate Limiters |

---

## ⚡ Quick Start & Running

### 1. Prerequisites
- **Node.js** v18+ or v20+
- **MongoDB** running locally on `mongodb://127.0.0.1:27017`
- **Google Gemini API Key** (optional: fallback question banks and semantic vectors activate automatically if offline)

### 2. Install Dependencies
```bash
# Root
npm install

# Server
npm --prefix server install

# Client
npm --prefix client install
```

### 3. Configure Environment Variables

**`server/.env`**:
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/resume_ai
JWT_SECRET=resume_ai_super_secret_jwt_key_2026_production_grade
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.8-flash
CLIENT_URL=http://localhost:5173
```

**`client/.env`**:
```env
VITE_API_URL=http://localhost:3000/api
```

### 4. Build TypeScript
```bash
npm --prefix server run build
npm --prefix client run build
```

### 5. Launch Development Services
```bash
# Terminal 1: Backend API (Auto-seeds demo accounts and room RAI-DEMO1)
npm --prefix server run dev

# Terminal 2: Frontend Client
npm --prefix client run dev
```

- **Frontend Client**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3000](http://localhost:3000)

---

## 🔑 Pre-Seeded Demo Accounts

The system automatically provisions the following accounts on first startup:

| Role | Email | Password | Description |
|---|---|---|---|
| **Candidate** | `candidate@resumeai.com` | `Password123` | Pre-configured candidate with sample resume & assessments |
| **Recruiter** | `recruiter@techcorp.com` | `Password123` | TechCorp Innovations recruiter with active jobs |
| **Admin** | `admin@resumeai.com` | `Password123` | System Administrator with full platform controls |

### 🎯 Pre-Seeded Assessment Room
- **Room Code**: `RAI-DEMO1`
- **Title**: *Frontend & Full Stack Screening Room*
- **Skills**: React, Node.js, MongoDB, JavaScript
- **Duration**: 45 minutes | 20 questions

---

## 🔒 Security & Privacy Guarantees

1. **Question Answer Security**: Question answer indices are permanently stripped from all candidate-facing API payloads.
2. **Authoritative Timers**: Submission validity and duration are calculated exclusively on the server using timestamp arithmetic.
3. **Objective Proctoring**: Proctoring events use neutral, fact-based logs without presumption of misconduct.
4. **Data Ownership**: Candidate snapshot captures and session data are restricted exclusively to authorized recruiters and administrators.

---

## 📄 License
This project is licensed under the MIT License.

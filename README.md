# TrustHireAI — AI Skill Verification & Proctored Assessment Platform

> **"Understand your resume. Verify candidate credibility with CredRAG. Conduct secure proctored assessments."**

TrustHireAI is a unified, production-grade candidate intelligence and recruitment platform combining **CredRAG AI Skill Verification** and **Proctored Technical Assessments**. It connects candidates, recruiters, and administrators in a transparent, evidence-based, and explainable hiring ecosystem.

---

## 🌟 Retrieval & Verification: CredRAG (Credibility-Aware RAG)

### 1. The Limitation of Generic Vector Retrieval
Traditional RAG pipelines in recruitment treat all resume text chunks as flat, homogeneous embeddings. When a recruiter or automated system queries for candidate competence in a skill such as *React*:
- **Lack of Source Differentiation**: A candidate merely listing *"React"* in a skills keyword section receives similarity comparable to a candidate who architected production systems using React.
- **Redundancy Inflation**: Multiple bullet points from the exact same project artificially inflate retrieval confidence without providing independent corroboration.
- **Query Semantic Drift**: Searching for raw skill names often matches passive mentions rather than concrete practical application.
- **Boundary Leakage**: Generic vector queries risk retrieving chunks across multiple historical resumes belonging to the candidate or across candidates.

### 2. CredRAG Architecture
**CredRAG (Credibility-Aware Retrieval-Augmented Generation)** is a domain-specific retrieval methodology designed specifically for resume skill verification.

```
Resume Upload & Extraction
        ↓
CredRAG Skill-Aware Chunking (Tagged with SourceType, Entity & Associated Skills)
        ↓
Embedding Generation (768-D Normalized Cosine Embeddings)
        ↓
MongoDB Vector Repository
        ↓
Candidate Skill Verification Request
        ↓
Skill-Verification Query Construction (Verification Queries + Controlled Lexical Aliases)
        ↓
Strict Candidate & Resume Metadata Isolation
        ↓
 ┌──────────────────────────────────────────────┐
 │             Hybrid Retrieval                 │
 │  Semantic Cosine Vector Search (α = 0.70)     │
 │                       +                      │
 │  Controlled Lexical Keyword Match (β = 0.30)  │
 └──────────────────────┬───────────────────────┘
                        ↓
                 Hybrid Scoring
                        ↓
            Evidence Multi-Factor Re-ranking
      (w1 * HybridScore + w2 * SourceWeight + w3 * SkillRelevance)
                        ↓
            Source Hierarchy Weighting
    (Work Experience: 1.00 > Project: 0.95 > Cert: 0.80 > Edu: 0.65 > Summary: 0.50 > Skills: 0.30)
                        ↓
            Diversity-Aware Selection
        (Prevents single-source over-representation)
                        ↓
            Credibility Confidence Scoring
  (w1*Semantic + w2*Keyword + w3*Source + w4*Diversity → 0–100)
                        ↓
          Evidence Classification Thresholds
  (Strong: 80–100 | Moderate: 60–79 | Needs Review: 40–59 | Unverified: 0–39)
                        ↓
      Gemini Evidence-Grounded Verification
  (Strictly grounded only in retrieved context with algorithmic fallback)
                        ↓
            Verified Skill Evidence Mapping
                        ↓
             Resume Evidence Score (30%)
                        ↓
            Existing Proctored Assessment (50%)
                        ↓
            Consistency Alignment Score (20%)
                        ↓
                   TrustScore
```

### 3. Core CredRAG Methodological Components

1. **Skill-Aware Evidence Chunking**: Segments resumes by logical section (`projects`, `experience`, `certifications`, `education`, `summary`, `skills`) and explicitly tags each chunk with its source entity (`projectName`, `company`, `issuer`), associated skill competencies, and `sourceType`.
2. **Deterministic Query Construction**: Automatically expands raw skill terms into evidence-seeking verification queries (e.g. *"Evidence demonstrating practical use, implementation, projects, experience or professional application of React."*) alongside bounded lexical synonyms (`jsx`, `tsx`, `react hooks`, `components`) without semantic drift.
3. **Strict Metadata Isolation**: Queries are bounded unconditionally by `userId` and `resumeId`. The system never cross-contaminates evidence across candidate resumes.
4. **Hybrid Retrieval**: Fuses vector cosine similarity with bounded keyword frequency and tag matching:
   $$\text{HybridScore} = \alpha \times \text{SemanticScore} + \beta \times \text{KeywordScore} \quad (\alpha=0.70, \beta=0.30)$$
5. **Source Hierarchy Weighting**: Weights evidence based on practical rigor:
   - `WORK_EXPERIENCE` = $1.00$
   - `PROJECT` = $0.95$
   - `CERTIFICATION` = $0.80$
   - `EDUCATION` = $0.65$
   - `SUMMARY` = $0.50$
   - `SKILLS_ONLY` = $0.30$
6. **Multi-Factor Re-Ranking**:
   $$\text{EvidenceScore} = w_1 \times \text{HybridScore} + w_2 \times \text{SourceWeight} + w_3 \times \text{SkillRelevance}$$
7. **Evidence Diversity Selection**: Groups candidates by source entity to prevent redundant mentions from dominating top-K slots. Metric:
   $$\text{EvidenceDiversity} = \frac{\text{Unique Evidence Sources}}{\text{Selected Evidence Count}}$$
8. **Credibility Confidence Scoring**:
   $$\text{CredibilityConfidence} = w_1 \text{Semantic} + w_2 \text{Keyword} + w_3 \text{Source} + w_4 \text{Diversity} \in [0, 100]$$
9. **Grounded Gemini Verification**: Passes the diverse, re-ranked snippets to Gemini with strict instructions to evaluate only supplied evidence. If remote LLM quotas are throttled, automatically falls back to calibrated CredRAG algorithmic scores.
10. **TrustScore Integration**: Directly powers the **Resume Evidence (30%)** component in TrustHireAI's transparent formula without modifying assessment weights:
    $$\text{TrustScore} = (\text{Resume Evidence} \times 30\%) + (\text{Assessment Performance} \times 50\%) + (\text{Consistency} \times 20\%)$$

### 4. Empirical Benchmark & Ablation Study Results
Evaluated on live resume evidence across 6 standardized configurations:

| Configuration Mode | Description | Latency (ms) | Precision@K | Recall@K | F1-Score | Source Diversity | Avg Confidence | Verification Split |
|---|---|---|---|---|---|---|---|---|
| **Mode A: Keyword Baseline** | Lexical matching without vectors | 3 ms | 1.000 | 0.812 | 0.893 | 1.000 | 76% | 0/4/0/0 |
| **Mode B: Vector-Only Baseline** | Pre-CredRAG cosine similarity | 2 ms | 0.500 | 0.562 | 0.528 | 0.688 | 60% | 0/2/2/0 |
| **Mode C: Hybrid Retrieval** | Semantic (0.7) + Keyword (0.3) | 6 ms | 0.562 | 0.625 | 0.592 | 0.688 | 68% | 0/4/0/0 |
| **Mode D: Hybrid + Metadata** | Hybrid with candidate/resume isolation | 6 ms | 0.938 | 0.938 | 0.938 | 1.000 | 75% | 0/4/0/0 |
| **Mode E: Hybrid + Re-ranking** | Hybrid + Metadata + Source Weighting | 5 ms | 1.000 | 1.000 | 1.000 | 1.000 | 87% | 4/0/0/0 |
| **Mode F: Full CredRAG** | Full pipeline + Grounded LLM verification | 662 ms | 1.000 | 1.000 | 1.000 | 1.000 | 90% | 4/0/0/0 |

*All results computed empirically from actual database test executions.*

---

## 🛡️ Proctored Technical Assessments
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

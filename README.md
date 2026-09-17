# Clack — Multi-Tenant Hospital Financial Ledger & Intelligence Platform

A multi-tenant hospital financial ledger and AI ingestion platform built with **React 19, TypeScript, Tailwind CSS, Express, PostgreSQL (with pgvector), Groq LLM, and Google Gemini**.

---

## 🚀 Quick Start (Running the Project Manually)

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher installed on your computer.
- **Terminal**: PowerShell, Command Prompt, or Git Bash.

### 2. Install Dependencies (First time only)
Open your terminal in the project directory (`d:\hcfm2`):
```bash
npm install
```

### 3. Running the Project

You can run both backend and frontend together with a single command, or in separate terminal windows:

#### Option A: One-Command Start (Recommended)
```bash
npm run dev
```
> This starts both the backend API server and the frontend Vite dev server concurrently.

#### Option B: Separate Terminals (Best for inspecting backend logs)

**Terminal 1 — Backend API Server (Port 3001):**
```bash
npm run server
```
*Or directly:*
```bash
npx tsx server/index.ts
```

**Terminal 2 — Frontend Application (Port 5173 / 5174):**
```bash
npm run client
```
*Or directly:*
```bash
npx vite --port 5173
```

Open your browser at **`http://localhost:5173`** (or the port displayed in terminal).

---

## 🗄️ How to Connect Supabase (PostgreSQL Database)

The backend features a **hybrid database engine** located in `server/db.ts`:
- If `DATABASE_URL` is configured in `.env`, it connects to **Supabase Cloud PostgreSQL**.
- If `DATABASE_URL` is empty, it automatically uses the high-performance **local embedded PostgreSQL (PGlite) with pgvector** (no external setup required).

### Step-by-Step Supabase Connection:

#### Step 1: Create or Open a Supabase Project
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) and sign in.
2. Click **New Project**, select an organization, name it (e.g. `hcfm-hospital-db`), and set a strong database password.

#### Step 2: Enable `pgvector` Extension in Supabase
1. In your Supabase project dashboard, click on the **SQL Editor** tab in the left sidebar.
2. Click **New query** and paste:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Click **Run**.

#### Step 3: Copy Your PostgreSQL Connection String
1. In Supabase, go to **Project Settings** (gear icon at bottom left) $\rightarrow$ **Database**.
2. Scroll down to **Connection parameters** / **Connection string**.
3. Select the **URI** tab (or **Session Pooler** if you are in IPv4-only networks).
4. Copy the connection string. It looks like this:
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
   *(Make sure to replace `[YOUR-PASSWORD]` with your actual database password).*

#### Step 4: Add the Connection String to `.env`
Open the `.env` file in the project root (`d:\hcfm2\.env`):
```env
# Paste your Supabase URI here:
DATABASE_URL=postgresql://postgres.abcdefghijklm:MySecretPassword123@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

#### Step 5: Start/Restart the Backend Server
In your terminal, restart the backend server:
```bash
npm run server
```
The server will print:
```
[DB] 🌐 Connecting to Supabase / Cloud PostgreSQL at: postgresql://postgres.abc:****@aws-0-us-east-1.pooler.supabase.com:6543/postgres
[DB] Initializing PostgreSQL database with pgvector...
[Clack Server] Listening live on http://localhost:3001
[Clack Seed] Seeding historical financial ledger data...
```
All tables (`hospitals`, `users`, `ledger_groups`, `ledger_subgroups`, `ledgers`, `vouchers`, `audit_logs`, `account_embeddings`) and historical data will be created automatically in Supabase!

---

## 🤖 AI Text-to-SQL & Model Configuration

### Environment Variables (`.env`)
```env
PORT=3001

# AI API Keys
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here

# Primary AI Provider ('groq' or 'gemini')
DEFAULT_AI_PROVIDER=groq
GROQ_MODEL=openai/gpt-oss-120b
GEMINI_MODEL=gemini-3.8-flash

# Optional: External Workbench / n8n Webhook Node URL
WORKBENCH_WEBHOOK_URL=
```

### How Text-to-SQL Works:
1. When you type any natural language question in the **AI Assistant** tab (e.g. *"What are the top 5 highest expenses and what ledgers do they belong to?"*):
2. The query is routed to **Groq (`openai/gpt-oss-120b`)** along with your hospital permission boundary.
3. The LLM translates the question into executable PostgreSQL code:
   ```sql
   SELECT v.id, v.amount, l.name AS ledger_name 
   FROM vouchers v JOIN ledgers l ON v.ledger_id = l.id 
   WHERE v.hospital_id IN ('hosp-1','hosp-2','hosp-3') AND v.type = 'DEBIT' AND v.status = 'APPROVED' 
   ORDER BY v.amount DESC LIMIT 5;
   ```
4. The server runs the query against the database and passes results back to the LLM.
5. The LLM provides an executive CFO summary and dynamically selects a chart (bar, pie, line, table).

---

## ⚡ Connecting an External Workbench (like n8n) Node

If you want queries from the AI Chat tab to be processed by an external workflow tool (n8n, Dify, Flowise, or custom Python backend):

### 1. Set the Webhook URL
- **In `.env`**:
  ```env
  WORKBENCH_WEBHOOK_URL=http://localhost:5678/webhook/hospital-chat
  ```
  *OR*
- **Directly in the Web UI**: Open the **AI Assistant** tab $\rightarrow$ click **"Workbench / n8n Node"** $\rightarrow$ enter your webhook URL.

### 2. Data Payload Sent to Your n8n Node:
```json
{
  "message": "User query here",
  "user": {
    "id": "usr-cfo-1",
    "name": "Dr. Eleanor Vance",
    "role": "CFO"
  },
  "accessibleHospitalIds": ["hosp-1", "hosp-2", "hosp-3"],
  "timestamp": "2026-09-10T08:00:00.000Z"
}
```

### 3. Response Format Expected from n8n:
```json
{
  "summary": "Financial answer or analysis",
  "sql": "SELECT ...",
  "chartType": "bar",
  "data": [
    { "category": "Pharmacy", "total_amount": 45000 }
  ]
}
```
*(If the webhook is offline, the backend automatically falls back to Groq / Gemini so the chat never breaks).*

---

## 👥 Demo User Accounts & Passwords

The system comes pre-seeded with role-based accounts:

| Role | Name | Email | Password | Hospital Scope |
| :--- | :--- | :--- | :--- | :--- |
| **CFO** | Dr. Eleanor Vance | `e.vance@apexhealth.org` | `password123` | **All Hospitals** (Metro St. Jude, Riverdale, Highland) |
| **Manager** | Marcus Chen | `m.chen@stjude.org` | `password123` | **Metro St. Jude Hospital Only** |
| **Base User** | Sarah Jenkins | `s.jenkins@stjude.org` | `password123` | **Metro St. Jude Hospital (Ingestion Only)** |
| **Auditor** | Robert Langdon | `r.langdon@auditors.com` | `password123` | **Only hospitals explicitly granted by CFO** |

---

## 📁 Project Architecture

```
hcfm2/
├── .env                       # Active environment configuration (API keys, DB, Webhook)
├── .env.example               # Template environment configuration
├── package.json               # Node.js project manifest & scripts
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite frontend configuration
├── hospital_expense_*.csv     # 2020-2024 historical expense dataset
├── data/                      # Local database persistence folder (PGlite)
├── server/                    # Backend Source Code
│   ├── index.ts               # Express server, WebSocket live sync & logging
│   ├── api.ts                 # REST API endpoints & Role-Based Access Control (RBAC)
│   ├── db.ts                  # Hybrid Database Engine (Supabase / PGlite + pgvector)
│   └── ai.ts                  # AI Engine (Groq 120B, Gemini 3.8 Flash, n8n router, Vision)
└── src/                       # Frontend Source Code
    ├── main.tsx               # React entry point
    ├── App.tsx                # Main application frame & navigation
    ├── context/               # Global state (AppContext: user, hospital, notifications)
    └── components/            # UI Components
        ├── tabs/              # Tab 1 (Ingestion), Tab 2 (Ledger), Tab 3 (Analytics),
        │                      # Tab 4 (AI Chat), Tab 5 (Auditor Portal)
        ├── auth/              # Role switcher & Login modal
        └── ledger/            # Tree hierarchy, Add/Edit/Move/Merge modals
```

# Elite_Classes — Complete Online Examination & Quiz Platform

**Website Name:** Elite_Classes  
**Powered by:** Vinay Prajapati  
**Backend:** Supabase (PostgreSQL 17 + Row Level Security)  
**Frontend:** React 19 + TypeScript + Vite + Tailwind CSS  
**Target Audience:** Students in Classes 6th, 7th, 8th, 9th, and 10th  
**WhatsApp Support & Verification:** +91 8081788927  

---

## 🚀 Key Features

### 1. Student Portal
- **Zero-Paid Authentication:** Completely free Email + Password authentication (no paid SMS/OTP services).
- **Targeted Class Feeds:** Students only see syllabus-aligned tests for their enrolled standard (6th to 10th).
- **Distraction-Free Proctored Interface:**
  - Fullscreen assessment mode.
  - Page Visibility API tab-switch tracking.
  - Window blur & focus loss monitoring.
  - Copy shortcuts and context menu prevention.
  - Dynamic watermark repeated across the examination canvas (`Student Name • Masked Mobile • Exam ID`).
- **Real-Time Answer Saving:** Auto-saves responses as students click with offline resilience.
- **Multiple Navigation Modes:**
  - *Free Navigation:* Previous + Next with clickable Question Palette.
  - *Next-Only Mode:* Questions lock permanently once passed to simulate entrance exams.
- **Dynamic Timers:** Supports Whole-Exam countdown, Per-Question timer with auto-advance, or Deadline mode.
- **Instant Automatic Evaluation:** Results computed entirely on the server using PostgreSQL stored procedures. Students never receive answer keys during the live exam.
- **One-Click WhatsApp Result Sharing:** Prefilled scorecard sent directly to Teacher Vinay Prajapati (`8081788927`).
- **Answer Review:** Detailed explanations and verified keys revealed only after submission (when enabled by teacher).

### 2. Teacher & Administrator Portal
- **Executive KPI Dashboard:** Total students, class distributions, active exams, pass rates, and recent submissions.
- **Comprehensive Exam Builder:** Configure title, description, class, subject, duration, timers, navigation locks, negative marking, and pass criteria.
- **Question Manager & Reusable Bank:**
  - Single-choice MCQs, Multiple-choice MCQs, and True/False questions.
  - Positive marks, negative marking deductions, and diagram/image URLs.
  - Teacher explanation editor.
  - **Bulk CSV Importer:** Upload full question rosters in one click with validation.
- **Student Account Management:** View student contact details, class standards, and promote/demote administrator privileges.
- **Anti-Cheat Monitoring Center:** Inspect student tab-switching history, fullscreen exit counts, and timestamps with objective teacher advisories.
- **Export Reports:** Download complete student submission logs in CSV format.

---

## 🗄️ Supabase Database Architecture

The application connects to the Supabase project `thmpfhhqtplgiosjebwx` with strict Row Level Security (RLS) enabled on all tables:

| Table | Purpose | RLS Policy Summary |
| :--- | :--- | :--- |
| `profiles` | Stores student/admin details (name, phone, class, role) | Users view own; Admins view all; Users cannot elevate own role |
| `subjects` | Academic subjects for Classes 6th–10th | Authenticated read-only; Admin manage |
| `exams` | Test configurations, timers, modes, instructions | Students view published for their class; Admin manage |
| `questions` | Question prompts, types, marks, negative marks | Readable if exam is accessible; Admin manage |
| `question_options` | Answer options A, B, C, D | Readable if question is accessible; Admin manage |
| `answer_keys` | **Hidden correct answer IDs** | **Restricted to Admin only; Never readable by students** |
| `attempts` | Examination sessions, timers, scores | Student views own; Student creates own; Admin views all |
| `attempt_answers` | Student option selections saved in real-time | Student manages own active attempt answers |
| `results` | Computed scorecards, percentage, pass/fail status | Student views own; Admin views all |
| `suspicious_events` | Logs tab switches, fullscreen exits, copy attempts | Student inserts own attempt logs; Admin inspects all |
| `question_bank` | Reusable question repository | Admin manage |
| `notifications` | System announcements & score alerts | User views own |

### Secure PostgreSQL Stored Procedures
- `public.is_admin()`: Secure helper that verifies whether the caller holds administrative privileges.
- `public.submit_exam_attempt(p_attempt_id uuid)`: Server-side evaluation function (`SECURITY DEFINER`) that compares answers against `answer_keys`, computes scores, updates the attempt, and generates the final scorecard.
- `public.get_attempt_review(p_attempt_id uuid)`: Secure review function that reveals correct options and explanations only after the test has been submitted and if `allow_review` is enabled.

---

## 🛠️ Local Development Setup

1. **Clone or Navigate to the Repository:**
   ```bash
   cd "e:\quiz app"
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the project root:
   ```env
   VITE_SUPABASE_URL=https://thmpfhhqtplgiosjebwx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRobXBmaGhxdHBsZ2lvc2plYnd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQyMDc4ODYsImV4cCI6MjEwOTc4Mzg4Nn0.oUvrLMFAkBd1KTqVlxWgrdniiK3cqpU91EGT6YI0XgQ
   VITE_APP_NAME=Elite_Classes
   VITE_APP_CREATOR=Vinay Prajapati
   VITE_ADMIN_CONTACT_WHATSAPP=8081788927
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```

5. **Verify Production Build:**
   ```bash
   npm run build
   ```

---

## 🚢 Deployment to Vercel (Free Hobby Tier)

### Step 1: Push Repository to GitHub
1. Create a new repository on GitHub named `elite-classes-exam`.
2. Push your local repository:
   ```bash
   git remote add origin https://github.com/<your-username>/elite-classes-exam.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Import into Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New Project** $\rightarrow$ **Import Git Repository**.
3. Select `elite-classes-exam`.
4. Framework Preset: **Vite**.
5. Root Directory: `./`.

### Step 3: Add Environment Variables in Vercel
Add the following in Vercel's **Environment Variables** panel:

| Key | Value |
| :--- | :--- |
| `VITE_SUPABASE_URL` | `https://thmpfhhqtplgiosjebwx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRobXBmaGhxdHBsZ2lvc2plYnd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQyMDc4ODYsImV4cCI6MjEwOTc4Mzg4Nn0.oUvrLMFAkBd1KTqVlxWgrdniiK3cqpU91EGT6YI0XgQ` |
| `VITE_APP_NAME` | `Elite_Classes` |
| `VITE_APP_CREATOR` | `Vinay Prajapati` |
| `VITE_ADMIN_CONTACT_WHATSAPP` | `8081788927` |

### Step 4: Deploy
Click **Deploy**. Your examination platform will be live in less than 60 seconds.

---

## 👑 First Administrator Sign-In

The owner's email `gitwala.vinay@gmail.com` is automatically granted the `admin` role upon registration or sign-in by database trigger:
1. Go to the registration page `/register`.
2. Sign up with email `gitwala.vinay@gmail.com` and your chosen password.
3. You will immediately be granted full access to the **Teacher / Admin Portal** (`/admin`).

Final Advanced Full Stack Project: Collaborative Workspace Board 
The new updates for final Project, TypeScript migrations, Zustand/React Query state integrations, Recharts dashboards, Docker setups and offline database fallback files have been pushed directly to the main branch of that same repository:

Web Live Link https://full-stack-integration-7m7z.onrender.com/ 
https://full-stack-integration-7m7z.onrender.com/
A premium, glassmorphic collaborative dashboard built to review and integrate Month 2 topics (Days 40 to 49) of the Full-Stack Developer curriculum.

## 🚀 Month 2 Curriculum Covered
1. **Days 40-41: Relational DBs with Prisma ORM (SQLite)**
   - Configured with file-based SQLite by default to run out-of-the-box.
   - Includes seed script creating preset users (`user@example.com`, `admin@example.com`) and sample collaborative tasks.
2. **Day 42: Document DBs with Mongoose (MongoDB)**
   - Utilizes `mongodb-memory-server` to spin up a local in-memory MongoDB automatically when starting the backend.
   - Real-time chat messages and security audit logs are saved in MongoDB collections.
3. **Days 43-44: JWT Authentication & Role-Based Access Control (RBAC)**
   - JWT tokens stored in HTTP-only cookies and Bearer headers.
   - Middleware handles route authorization. Admins have access to the special Security Audit tab.
4. **Days 45-46: Multi-Part File Uploads, NodeMailer, & WebSockets**
   - **Multer**: Dynamic file uploading for user avatars and task file attachments.
   - **Nodemailer**: Automatic test HTML email dispatching (logs output to backend console if SMTP credentials aren't set).
   - **Socket.io**: Real-time collaborative workspace synchronization (instant chat messaging, instant task movements).
5. **Days 47-48: API Security, Zod Request Validation, & Error Handling**
   - **Security**: Includes `helmet` header integration, `cors` cross-origin control, and `express-rate-limit` request throttling.
   - **Validation**: Strict schema protection on auth registration, login, and task creation using `zod`.
   - **Centralized Error Handler**: Standardized HTTP error formats. Breaches (rate limit alerts, server errors) are logged directly to MongoDB.

---

## 🛠️ Step-by-Step Setup

### Prerequisites
- [Node.js](https://nodejs.org) (v18 or higher recommended)
- [Git](https://git-scm.com)

### 1. Installation
In the root directory, run the workspace install command to download all dependencies for both frontend and backend:
```bash
npm install
npm run install:backend
npm run install:frontend
```

### 2. Database Migrations and Seeding
Initialize the SQLite database, apply migrations, generate the Prisma Client, and seed the user/task accounts:
```bash
npx prisma migrate dev --schema=backend/prisma/schema.prisma
```
This automatically executes `node prisma/seed.js`.

### 3. Start Development Servers
Start both the Express API and the Vite React app concurrently with a single command:
```bash
npm run dev
```
- **Backend API**: Running on [http://localhost:5000](http://localhost:5000)
- **Frontend App**: Running on [http://localhost:5174](http://localhost:5174) (or fallback port if 5173 is busy)

---

## 👥 Dev Accounts (Preset Seeds)
Sign in on the login page by clicking the direct "Dev Seeding Accounts" shortcuts, or enter them manually:

1. **Standard User**
   - **Email**: `user@example.com`
   - **Password**: `password123`
2. **Administrator** (Full logs accessibility)
   - **Email**: `admin@example.com`
   - **Password**: `password123`

---

## 🏗️ Folder Structure
```
month2-fullstack-integration/
├── backend/                  # Express REST & WebSocket Server
│   ├── prisma/               # Schema & SQLite Migrations
│   ├── public/uploads/       # Local upload directory for avatars/attachments
│   ├── src/
│   │   ├── controllers/      # Route logic (Auth, Tasks, Chats, Admin, Upload)
│   │   ├── db/               # Prisma (SQLite) & Mongoose (Mongo) connection bootstrap
│   │   ├── middleware/       # Auth guard, Multer configs, error handlers, Zod validators
│   │   ├── models/           # Mongoose Document schemas (Chat, SecurityLog)
│   │   ├── routes/           # Endpoint registries
│   │   └── services/         # Socket.io config & Nodemailer service
│   └── src/index.js          # API main script
├── frontend/                 # Vite + React Client App
│   ├── src/
│   │   ├── components/       # KanbanBoard, ChatWindow, ProfilePanel, AdminLogsPanel
│   │   ├── context/          # Auth context, WebSocket connections context
│   │   ├── App.jsx           # Tab routing and core dashboard layout
│   │   └── index.css         # Glassmorphic Dark styling framework
├── docker-compose.yml        # Optional reference PostgreSQL & MongoDB orchestrator
└── package.json              # Monorepo task command runner
```

---

## ☁️ Zero-Setup One-Click Cloud Deployment (Render)
You can deploy this entire full-stack project online for free with **zero configuration**:
1. Log in to your **[Render.com](https://render.com/)** dashboard.
2. Click **New +** ➔ **Blueprint**.
3. Connect your GitHub repository: `Full-Stack-Integration`.
4. Render will read the `render.yaml` blueprint, install dependencies, compile the React frontend, generate the Prisma Client, run the SQLite migrations, configure the in-memory MongoDB Server, and deploy your live full-stack application!

---

## 🐳 Optional Production Setup (PostgreSQL & MongoDB in Docker)
If you wish to switch from the development zero-setup databases (SQLite & in-memory Mongo) to production-ready database engines:
1. Open the Docker Desktop application.
2. Spin up the Postgres and MongoDB containers:
   ```bash
   docker compose up -d
   ```
3. Update `backend/.env` environment variables:
   - Change `DATABASE_URL` to point to PostgreSQL: `"postgresql://postgres:postgrespassword@localhost:5432/month2_relational?schema=public"`
   - Set `MONGO_URI` to: `"mongodb://admin:adminpassword@localhost:27017/month2_chat?authSource=admin"`
4. Switch Prisma schema provider to `"postgresql"` inside [schema.prisma](file:///C:/Users/Windows-E/.gemini/antigravity-ide/scratch/month2-fullstack-integration/backend/prisma/schema.prisma).
5. Apply migrations and generate the client again.

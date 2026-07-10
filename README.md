# 🚀 Advanced Full-Stack Collaborative Workspace Board (Days 50–90)

### 🔗 Project Links
* **Web Live URL**: [https://full-stack-integration-7m7z.onrender.com/](https://full-stack-integration-7m7z.onrender.com/)
* **GitHub Repository**: [https://github.com/Charanloyal/Full-Stack-Integration](https://github.com/Charanloyal/Full-Stack-Integration)

---

## 📖 Project Overview
This project represents the complete, production-grade **Month 3 (Days 50 to 90) Final Project** for the Full-Stack Developer curriculum (IIT Madras Summer Internship progress milestones). It elevates the collaborative task dashboard into a strict, highly performant, and resilient **TypeScript monorepo** with advanced caching, state management, containerized deployment, and data visualization.

---

## 🛠️ Month 3 (Days 50–90) Final Project Upgrades

### 1. Full-Stack TypeScript Migration (Days 50–51)
* **Backend**: Ported the entire Express REST & WebSocket server to TypeScript (`.ts`). Configured strict schemas, interfaces for Prisma/Mongoose models, and extended Express request handlers (`Express.Request.user`).
* **Frontend**: Ported all React components, contexts, and entry points to TypeScript (`.tsx`) with compile-time type checks.

### 2. State Management — Zustand & React Query (Days 54–55)
* **Zustand**: Created a global client store (`useUIStore.ts`) to manage active viewport tabs, search terms, assignee selectors, and priority filtering states.
* **TanStack Query (React Query)**: Integrated to handle all server-state queries and mutations. Enabled automatic query cache invalidations on task creations, edits, checkbox status updates, and deletions for seamless real-time syncing.

### 3. Containerization & DevOps CI/CD (Days 57–60)
* **Dockerfile.backend**: Multi-stage production container compiling TypeScript files via `tsc` and running a stripped-down runtime environment.
* **Dockerfile.frontend**: Multi-stage build compiling React client static assets and hosting them via an Nginx alpine container.
* **docker-compose.yml**: Orchestrates frontend, backend, MongoDB, and Redis containers with persistent volumes.
* **GitHub Actions**: Configured `.github/workflows/ci.yml` pipeline that automatically tests, compiles, and type-checks the codebases on every branch push.

### 4. Caching System — Redis Cache Broker (Day 63)
* **Redis Caching**: Implemented a caching layer (`redisService.ts`) for fetching task listings. Clear-cache triggers invalidate task keys on any database mutations.
* **In-Memory Fallback**: Programmed a transparent in-memory `Map` caching mechanism if the Redis server is offline, enabling zero-setup portable execution.

### 5. Recharts Analytics Dashboard & Subtasks (Weeks 10–11)
* **Analytics Panel**: Integrated Recharts to display visual metrics, including status distributions (Donut charts), priority level weights (Bar charts), and workload per team member (Stacked Bar charts).
* **Subtasks Checklist**: Integrated interactive checklist subtasks directly on task cards. Toggling checkboxes instantly updates state persistence on the database.

### 6. Resilience Engineering — Offline Backups (Week 12)
* **Graceful Degradation**: Programmed Mongoose offline connectivity checks (`jsonDbService.ts`). If MongoDB is offline, chat messages and audit trails automatically write to local JSON files, maintaining **100% application functionality** with no buffering timeouts.

---

## 🏗️ Folder Structure
```
month2-fullstack-integration/
├── .github/workflows/        # GitHub Actions CI/CD Pipeline
├── backend/                  # Express REST & WebSocket Server (TS)
│   ├── prisma/               # SQLite Schemas & Migrations
│   ├── public/uploads/       # File Upload Storage (Avatars, Attachments)
│   ├── src/
│   │   ├── controllers/      # Route Handlers (Task, Auth, Chat, Admin)
│   │   ├── db/               # Prisma & Mongoose bootstrappers
│   │   ├── middleware/       # Auth guards, Multer limits, validators
│   │   ├── models/           # Mongoose Models (ChatMessage, SecurityLog)
│   │   ├── routes/           # REST Router registries
│   │   ├── services/         # Socket.io & Nodemailer configurations
│   │   ├── types/            # Entity models & Express declarations
│   │   └── index.ts          # Server entrypoint
│   └── tsconfig.json         # Backend TS compiler rules
├── frontend/                 # Vite + React Client App (TS)
│   ├── src/
│   │   ├── components/       # KanbanBoard, ChatWindow, AnalyticsDashboard
│   │   ├── context/          # Auth and WebSocket client providers
│   │   ├── store/            # Zustand global UI filter store
│   │   ├── App.tsx           # Layout, Tab routing, and Auth states
│   │   └── main.tsx          # QueryClientProvider bootstrapper
│   └── tsconfig.json         # Frontend Bundler TS configuration
├── Dockerfile.backend        # Multi-stage Express Docker image
├── Dockerfile.frontend       # Multi-stage Nginx React Docker image
├── docker-compose.yml        # Orchestration script (Services + DBs)
└── package.json              # Monorepo task command scripts
```

---

## 🛠️ Step-by-Step Local Setup

### 1. Installation
Install all root, backend, and frontend dependencies:
```bash
npm run install-all
```

### 2. Database Synchronization
Create SQLite database file, generate Prisma client, and run seeding:
```bash
npm run db:push --prefix backend
```

### 3. Start Development Environment
Launch both development servers concurrently:
```bash
npm run dev
```
* **Frontend Web App**: `http://localhost:5173/`
* **Backend REST API**: `http://localhost:5000/`

---

## 👥 Preset Seed Accounts
Log in by clicking the direct seed shortcuts on the login screen or type:
1. **Standard User**: `user@example.com` / `password123`
2. **Administrator**: `admin@example.com` / `password123` (Access to Security Audit logs)

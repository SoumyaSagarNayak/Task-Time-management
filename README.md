# ✈️ Flow Pilot

**Flow Pilot** is a modern, premium, and fully client-side **Time Entry & Task Tracking Dashboard** application. Originally a full-stack app, it has been re-architected into a **pure frontend-only** project that runs completely in the browser, persists data via `localStorage`, and integrates with **Clerk** for secure user authentication. 

It is designed to be lightweight, zero-maintenance, and deployable on **Vercel** in a single click with zero database configuration.

---

## ✨ Key Features

*   **📋 Kanban Board**: Manage your workflow with smooth drag-and-drop task card placement. Transition tasks between `Open`, `To Do`, `In Progress`, `In Review`, `Done`, and `Closed` statuses.
*   **⏱️ Time Tracker**: Log your hours manually or run a live timer on individual tasks to measure exactly how long they take.
*   **📊 Reports Dashboard**: Gain insights with visual metrics of total logged hours, user productivity breakdowns, task-specific logging, and billable vs. non-billable breakdowns.
*   **💬 Comments & Collaboration**: Discuss work directly inside task detail views.
*   **🔗 Task Dependencies**: Establish parent-child task linkages (`blocked by` and `blocks` relations) to manage blockers.
*   **🔔 Notifications Panel**: Get notified when you are assigned a task, when comments are added, or when task status is updated.
*   **🔍 Global Search**: Find tasks, comments, and time entries instantly using query matching, type selectors, and date-range filters.
*   **📑 Data Exporting**: Export your time logs or activity audits directly into CSV or PDF formats from the dashboard.
*   **🌙 Sleek UI/UX**: Crafted with beautiful Tailwind CSS, fluid animations, Outfit/Inter typography, and fully responsive layouts.

---

## 🛠️ Tech Stack

*   **Framework**: Next.js 16 (App Router)
*   **Runtime**: React 19 & TypeScript 5
*   **Styling**: Tailwind CSS & Radix UI primitives
*   **State & Queries**: TanStack React Query v5 & Zustand
*   **Authentication**: Clerk
*   **Storage & Simulation**: `localStorage` backed Mock DB with Axios interceptors
*   **Package Manager**: pnpm

---

## 💾 Client-Side Architecture

To remove backend dependencies while preserving all real-time capabilities, Flow Pilot uses a custom client-side database simulation:

1.  **LocalStorage Database (`lib/mock-db.ts`)**: Acts as our database manager. If no data exists, it automatically seeds the browser with rich initial mock data (multiple users/employees, dummy tasks, linked time logs, comments, and activities) so your graphs and boards look alive on first load.
2.  **API Client Interceptors (`lib/api.ts`)**: We replaced the Axios network client with a mock proxy. When components perform standard HTTP requests (e.g. `api.get('/tasks')` or `api.post('/time-entries')`), the client intercepts them locally, executes query/mutation logic on your local storage collections, and returns standard mock responses. 
3.  **Clerk Syncing (`app/(dashboard)/layout.tsx`)**: When a user logs in via Clerk, their name, email, and avatar are synced directly into the local storage mock database as the active user.

---

## 🚀 Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/SoumyaSagarNayak/Task-Time-management.git
cd flow-pilot
```

### 2. Install Dependencies
Make sure you have **Node.js v18+** and **pnpm** installed:
```bash
pnpm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root folder and add your Clerk credentials (you can register a free account at [clerk.com](https://clerk.com)):
```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
CLERK_SECRET_KEY="your_clerk_secret_key"
```
*(Note: A test publishable and secret key are already pre-filled in `.env` for quick local evaluations).*

### 4. Start the Dev Server
```bash
pnpm dev
```
Open **`http://localhost:3000`** in your browser to view the application.

---

## ⚡ Deployment to Vercel

Since this is now a frontend-only Next.js app, you can deploy it to **Vercel** with zero backend infrastructure:

1.  Push your code to your GitHub repository.
2.  Import the repository into your **[Vercel Dashboard](https://vercel.com/new)**.
3.  Add the **Environment Variables** in the Vercel project settings:
    *   `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (from your `.env` file)
    *   `CLERK_SECRET_KEY` (from your `.env` file)
4.  Click **Deploy**!

---

## 📂 Project Structure

```
flow-pilot/
├── app/                  # Next.js App Router (Dashboard Pages, Auth Routing)
│   ├── (dashboard)/      # Protected dashboard views (Tasks, Entries, Reports, Activity)
│   ├── providers/        # Client theme and configuration providers
│   └── page.tsx          # Router landing page
├── components/           # Reusable UI widgets & layout wrappers (Sidebar, Header, KanbanBoard)
├── context/              # Toast notification context
├── hooks/                # Custom React hooks (Shortcuts, Timer, MobileMenu)
├── lib/                  # Data layer (Mock database & API client proxy)
│   ├── api.ts            # Mock Axios client intercepting endpoints
│   ├── mock-db.ts        # localStorage DB interface and seed logic
│   └── types.ts          # TypeScript interfaces & enums
├── public/               # Public assets and SVG icons
└── store/                # Zustand global state (Timer store)
```

---

## 📝 License
This project is open-source and available under the MIT License.

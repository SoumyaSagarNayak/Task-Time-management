# Contributing Guide

Welcome to the Flow Pilot codebase 👋  
This document explains how we work with branches, environments, and docs so that everyone stays in sync.

---

## Repo Structure

At the top level, the repo is organized as:

- `backend/` – Backend API (NestJS, auth, business logic, DB access)
- `my-app/` – Frontend (Next.js 16, React 19, Tailwind v4 web app)
- `docs/` – Architecture, design, and requirements documentation
- `infra/` – Infrastructure scripts (AWS deployment scripts)

Please keep this structure clean and consistent.

---

## Branches Overview

We use a **trunk + promotion** model with a few long-lived branches:

- `main` – **Production** branch  
- `test` – **Staging / Pre-prod** branch  
- `dev` – **Integration / Dev** branch  
- `wi/*` – Short-lived work-item branches

### Branch → Environment → Database

| Branch          | Environment URL               | Database           | Purpose                             |
|-----------------|-------------------------------|--------------------|-------------------------------------|
| `main`          | Production (AWS)              | Production DB      | Live production                     |
| `test`          | Test (AWS)                    | Test DB            | Staging / QA                        |
| `dev`           | Dev (AWS)                     | Dev DB             | Integrated development              |
| `wi/*`          | Local only                    | Local or dev DB    | Individual work-item development     |

> Only `dev`, `test`, and `main` are tied to deployments via CI/CD.

---

## Prerequisites

Before you start contributing, make sure you have:

- **Node.js** >= 20.x
- **pnpm** >= 8.x (we use pnpm as our package manager)
- **PostgreSQL** >= 14.x (or use Neon.com for serverless PostgreSQL)
- **Clerk Account** – Sign up at [clerk.com](https://clerk.com) for authentication
- **Docker & Docker Compose** (optional, for running PostgreSQL locally)

### Installing pnpm

```bash
# Using npm
npm install -g pnpm

# Using Homebrew (macOS)
brew install pnpm

# Using standalone script
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

---

## Local Development Setup

### Initial Setup

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository-url>
   cd flow-pilot
   ```

2. **Set up Backend**:
   ```bash
   cd backend
   pnpm install
   cp .env.example .env  # Edit .env with your local config
   pnpm prisma:generate
   pnpm prisma:migrate
   pnpm prisma:seed  # Optional: seed with test data
   ```

3. **Set up Frontend**:
   ```bash
   cd ../my-app
   pnpm install
   cp .env.local.example .env.local  # Edit .env.local with your config
   ```

4. **Start development servers**:
   ```bash
   # Terminal 1: Backend
   cd backend
   pnpm start:dev

   # Terminal 2: Frontend
   cd my-app
   pnpm dev
   ```

### Common Development Commands

**Backend:**
- `pnpm start:dev` – Start backend in watch mode
- `pnpm test` – Run unit tests
- `pnpm test:e2e` – Run end-to-end tests
- `pnpm lint` – Lint code
- `pnpm format` – Format code with Prettier
- `pnpm prisma:studio` – Open Prisma Studio (DB GUI)
- `pnpm prisma:migrate` – Create and apply migrations
- `pnpm prisma:generate` – Generate Prisma Client

**Frontend:**
- `pnpm dev` – Start Next.js dev server
- `pnpm build` – Build for production
- `pnpm lint` – Lint code
- `pnpm test:e2e` – Run Playwright E2E tests
- `pnpm test:e2e:ui` – Run Playwright tests with UI

---

## How to Work on a Work Item

### 1. Sync `dev` and create a work-item branch

```bash
git checkout dev
git pull origin dev

git checkout -b wi/<work-item-number>
# e.g. wi/123
```

You always branch off `dev` for new work.

---

### 2. Develop locally

* Use your local `.env` files (see env section below).
* Use either:

  * a **local DB** for safe experiments, or
  * the shared `flow_pilot_dev` DB when you want integrated test data.

**Before committing, ensure:**
* Code builds successfully (`pnpm build` in backend/my-app)
* Tests pass (if applicable)

Commit often with clear messages using conventional commits:

```bash
git add .
git commit -m "feat: implement time entry tracking UI" -m "Describe the changes in detail"
```

Push your branch:

```bash
git push -u origin wi/<work-item-number>
```

---

### 3. Open PR to `dev`

Create a PR:

> **from**: `wi/<work-item-number>`
> **to**: `dev`

**PR Size Guidelines:**
* **Ideal range**: 10-100 lines of code changes
* **Acceptable**: Up to ~500 lines for complex features
* **⚠️ Danger zone**: 1000+ lines — break it down into smaller PRs!

Large PRs are harder to review, increase risk, and slow down the team. If your PR exceeds 500 lines, please consider:
* Splitting into multiple smaller PRs
* Creating a feature flag and merging incrementally
* Breaking down into logical sub-features

**PR Quality Guidelines:**
* **Self-review**: Always review your own code in the web UI before submitting. This instantly highlights left-over `console.log` statements and weird formatting issues.
* **Add context**: Leave comments on your own PR to explain weird diffs or non-obvious necessary changes. Save the reviewer from asking, "Why is this here?"

**PR Description Requirements:**

Your PR must include:

1. **Title**: Clear, concise, and descriptive (e.g., `feat: add time entry tracking UI with calendar integration`)

2. **Description** with:
   * **TL;DR**: Brief summary of what this PR does (1-2 sentences)
   * **Links**: Reference to work items, related issues, or parent PRs
   * **Visuals**: Attach screenshots, GIFs, or videos showing the changes (especially for UI changes)
   * **Reproduction steps**: Exact steps for reviewers to test locally:
     ```markdown
     ## How to Test
     1. Checkout this branch: `git checkout wi/123`
     2. Install dependencies: `pnpm install` (in both backend and my-app)
     3. Set up environment variables:
        - Backend: Copy `.env.example` to `.env` and set:
          - `DATABASE_URL=postgresql://...`
          - `CLERK_SECRET_KEY=sk_test_...`
        - Frontend: Copy `.env.local.example` to `.env.local` and set:
          - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...`
          - `CLERK_SECRET_KEY=sk_test_...`
          - `NEXT_PUBLIC_API_URL=http://localhost:3001`
     4. Run migrations: `cd backend && pnpm prisma:migrate`
     5. Start backend: `pnpm start:dev`
     6. Start frontend: `cd ../my-app && pnpm dev`
     7. Navigate to `/dashboard` and test the time entry flow
     ```
   * **Required setup**: List any required API keys, environment variables, or external services needed for testing

Checklist before opening the PR:

* [ ] PR has a clear, concise, and descriptive title.
* [ ] PR description includes TL;DR, links to work items, screenshots/GIFs (if UI changes), and exact reproduction steps with required environment variables/API keys.
* [ ] The app builds and runs locally (`pnpm build` in both backend and my-app).
* [ ] PR size is reasonable (ideally 10-100 lines, avoid 1000+ lines).
* [ ] Self-reviewed the PR in the web UI (check for console.logs, formatting issues).
* [ ] Added comments explaining any non-obvious changes or weird diffs.
* [ ] No secrets or hard-coded tokens are committed.
* [ ] If you changed API/DB/contracts, related docs in `docs/` are updated.
* [ ] Database migrations (if any) are included and tested.
* [ ] Environment variable changes are documented in `.env.example` files.

Once approved and merged:

* CI/CD deploys `dev` to **Dev environment** using **Dev database**.

Use this environment to test integrated features.

---

## PR Review Guidelines

When reviewing PRs, follow these principles to make the review process constructive and efficient:

### Practice Radical Clarity

**Over-communicate your intent** so the author never has to guess if a comment is blocking approval. Use clear prefixes to categorize your comments:

* **[Nit]**: A minor syntax or style suggestion. Not critical for meeting standards. Example: `[Nit] Consider using a more descriptive variable name here.`
* **[Sanity check/Non-Actionable]**: Is this what you meant to do? Just asking for clarity, no change required. Example: `[Sanity check] Did you intend to use `===` instead of `==` here?`
* **[Explicit Deferral]**: Use your judgement, I don't feel strongly about this. Example: `[Explicit Deferral] I'm not sure about this approach, but if you think it's best, go ahead.`
* **[Blocking]**: Must be addressed before approval. Example: `[Blocking] This will cause a security issue in production.`
* **[Suggestion]**: Would improve the code but not required. Example: `[Suggestion] Consider extracting this into a helper function for reusability.`
* **[Question]**: Need clarification to understand the change. Example: `[Question] Why did we choose this approach over the alternative?`

**Always state whether a comment is blocking or not.** If you don't specify, the author may assume it's blocking and delay the PR unnecessarily.

### Generosity and Praise

* **Acknowledge good work**: When you see well-written code, thoughtful solutions, or good practices, say so! Positive feedback encourages the team and reinforces good patterns.
* **Be kind**: Remember that code reviews are about improving code, not criticizing people. Frame feedback constructively.
* **Recognize effort**: If someone tackled a difficult problem or went the extra mile, acknowledge it.

### Progress Over Perfection

* **Bring it up a letter grade, not to A+**: Focus on making the PR better, not perfect. If the code is functional, readable, and follows standards, it's often better to merge and iterate than to hold it up for minor improvements.
* **Prioritize impact**: Spend more time on high-impact feedback (bugs, security, architecture) than on style preferences.
* **Ship and iterate**: It's better to ship good code and improve it later than to delay for perfection. Trust that the team will continue to improve the codebase over time.

### Review Checklist

When reviewing a PR, consider:

* [ ] Does the code solve the problem described in the PR?
* [ ] Are there any obvious bugs or security issues?
* [ ] Is the code readable and maintainable?
* [ ] Are tests included (if applicable)?
* [ ] Is documentation updated (if needed)?
* [ ] Are my comments clear about whether they're blocking or not?

---

### 4. Promote `dev` → `test`

When `dev` is stable and a set of features is ready:

1. Create PR: **`dev` → `test`**
2. CI runs again (tests, build, etc.).
3. On merge:

   * Code is deployed to **Test environment** using **Test database**.

Staging/testing environment is used for:

* QA / manual test passes
* Checking migrations and integrations
* Testing with more realistic (anonymized) data

---

### 5. Promote `test` → `main`

When staging looks good:

1. Create PR: **`test` → `main`**
2. CI runs full pipeline.
3. On merge:

   * Code is deployed to **Production** with **Production database**.

This is the only way changes should reach production.

---

## Environment Configuration

Each dev is responsible for managing their local environment files. A typical setup:

### Backend

* `backend/.env` – local dev config
* Required variables:
  * `DATABASE_URL` – PostgreSQL connection string
  * `CLERK_SECRET_KEY` – Clerk secret key for authentication
  * `PORT` – Backend server port (default: 3001)
  * `FRONTEND_URLS` – Comma-separated list of allowed frontend URLs (default: `http://localhost:3000`)

### Frontend (`my-app`)

* `my-app/.env.local` – local dev
* Required variables:
  * `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` – Clerk publishable key
  * `CLERK_SECRET_KEY` – Clerk secret key
  * `NEXT_PUBLIC_API_URL` – Backend API URL (default: `http://localhost:3001`)

Never commit `.env` files with secrets. Use env injection in your CI/CD.

---

## Branch Protection Rules (Recommended)

To keep things safe:

### `main`

* Protected
* No direct pushes
* PR required
* CI must pass
* 1–2 approvals required
* No force pushes

### `test`

* Protected
* No direct pushes
* PRs from `dev` or hotfix branches
* CI must pass
* At least 1 approval

### `dev`

* Protected (soft)
* Prefer PRs from `wi/*` branches
* CI must pass

---

## Documentation Expectations

We keep design and architecture docs under `docs/`:

* `docs/01-hld/` – High Level Design, system-wide requirements and architecture
* `docs/02-backend/` – Backend LLD, API & DB docs
* `docs/03-frontend/` – Frontend LLD, routes, components, UI/UX flows
* `docs/04-sequences/` – Sequence diagrams for end-to-end flows
* `docs/05-deployment/` – Deployment and infrastructure documentation

If your work changes APIs, DB schema, or important flows, **update the corresponding docs** in the same PR.

---

## Coding & Commit Style

* Write clear commit messages using conventional commits:

  * `feat: add time entry tracking API`
  * `fix: handle null task in time entry list`
  * `docs: update ERD for new time entry table`
  * `refactor: simplify dashboard service logic`
  * `test: add unit tests for time entries service`
  * `chore: update dependencies`

* Keep PRs focused: one feature / bugfix per PR.
* Add comments or small docs when behavior is non-obvious.
* Follow TypeScript best practices and existing code style.
* Use `pnpm` for all package management (never commit `package-lock.json` or `yarn.lock`).

---

## Testing Guidelines

* Write tests for new features when possible.
* Backend: Use Jest for unit tests, located in `*.spec.ts` files.
* Backend E2E: Use Jest for E2E tests, located in `test/` directory.
* Frontend E2E: Use Playwright for E2E tests, covering critical user flows.
* Run tests locally before pushing:

```bash
# Backend
cd backend
pnpm test
pnpm test:e2e

# Frontend
cd my-app
pnpm lint
pnpm test:e2e
```

---

## Key Application Flows & Patterns

### User Signup & Provisioning
We use a streamlined, frictionless signup flow. New users are **automatically provisioned** with safe default settings (such as a personal workspace) and immediately directed to the dashboard. **Do not introduce mandatory onboarding wizards** or blocking steps during signup. Profile enrichment should be deferred to optional settings pages.

### Dashboard & Mock Data
For local development, the frontend relies on structured mock data for the dashboard and time entry UI to quickly test UI states. Ensure that when adding new dashboard components, you also provide mock data implementations if backend endpoints aren't fully ready.

---

## Troubleshooting

### Common Issues

**pnpm install fails:**
- Ensure you're using pnpm >= 8.x
- Try deleting `node_modules` and `pnpm-lock.yaml`, then reinstall

**Database connection errors:**
- Verify PostgreSQL is running (or Neon.com project is active)
- Check `.env` file has correct `DATABASE_URL`
- For Neon.com: Ensure connection string includes `?sslmode=require`
- Run `pnpm prisma:generate` to regenerate Prisma client

**Port already in use:**
- Backend defaults to port 3001, frontend to 3000
- Change ports in `.env` files if needed

**Clerk Authentication Issues:**
- Verify Clerk keys are correct (check for typos)
- Ensure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` starts with `pk_test_` or `pk_live_`
- Ensure `CLERK_SECRET_KEY` starts with `sk_test_` or `sk_live_`
- Check Clerk dashboard for allowed origins (should include `http://localhost:3000`)

**Prisma Migration Issues:**
- Reset database (⚠️ **WARNING**: This will delete all data):
  ```bash
  cd backend
  pnpm prisma migrate reset
  ```

**CORS Errors:**
- Ensure `FRONTEND_URLS` in backend `.env` includes `http://localhost:3000`
- Verify `NEXT_PUBLIC_API_URL` in frontend `.env.local` matches backend URL

---

Thanks for contributing 🙏

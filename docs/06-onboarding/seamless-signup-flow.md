# Seamless Signup Flow Guide

> **Issue**: After sign-up, users should land in the app immediately with a usable account.  
> **Goal**: Implement a frictionless sign-up flow with safe defaultsâ€”no dedicated automatic setup or multi-step setup.

---

## Overview

This guide explains how to implement a **seamless, frictionless signup experience** where users:

1. Complete authentication once (via Clerk)
2. Land immediately in the authenticated app (`/dashboard`)
3. Have a fully usable account with sensible defaults (org, role, demo data)
4. Can optionally refine their profile later from **Settings â†’ Profile**

**Key Principle**: *Defaults over gates.* Never block core app flows by forcing setup steps. Instead, apply smart defaults at account creation and let users refine later.

---

## Problem Statement

**Before this guide:**
- New users signed up but landed on a multi-step automatic setup
- Users had to answer: "What's your org name?", "Pick a role", "Invite team members", etc.
- The app blocked navigation until setup was "complete"
- Many users abandoned during onboarding

**After this guide:**
- New users sign up â†’ land in dashboard immediately
- Sensible defaults are applied automatically:
  - Organization created with auto-generated name
  - User assigned default role (MEMBER)
  - Display name populated from IdP (Clerk)
  - Demo data (tasks, time entries) pre-populated so dashboard isn't empty
- Users can update org name, preferences, etc. anytime from Settings (non-blocking)

---

## Architecture & Flow

### End-to-End Signup Flow

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ 1. User visits app                                              â”‚
â”‚    (Frontend: my-app/app/(dashboard)/layout.tsx)                â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                       â”‚
                       â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ 2. Check Clerk auth status                                      â”‚
â”‚    (Clerk provides user session: id, email, firstName, etc.)    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                       â”‚
                       â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ 3. Call /auth/ensure-user (POST)                                â”‚
â”‚    - Backend creates user record if it doesn't exist            â”‚
â”‚    - Syncs Clerk data (email, firstName, lastName)              â”‚
â”‚    - Creates default organization + membership                  â”‚
â”‚    - Auto-generates demo data (tasks, time entries)             â”‚
â”‚    - Returns user with organizations array                      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                       â”‚
                       â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ 4. Frontend OrgContext loads /users/me                          â”‚
â”‚    - Fetches user with organizations                            â”‚
â”‚    - Sets selectedOrgId to first org                            â”‚
â”‚    - Marks loading complete                                     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                       â”‚
                       â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ 5. Dashboard renders with data                                  â”‚
â”‚    - No skeleton loaders (data exists)                          â”‚
â”‚    - Shows time summary, recent entries, tasks                  â”‚
â”‚    - User immediately productive                                â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Key Components

| Component | Purpose | Owner |
|-----------|---------|-------|
| **Clerk Auth** | OAuth provider, session mgmt | Frontend (my-app) |
| **OrgContext** | Global org/user state | Frontend (my-app) |
| **/auth/ensure-user** | Create user + org + demo data on signup | Backend (NestJS) |
| **OnboardingService** | Business logic for user creation and defaults | Backend (NestJS) |
| **Dashboard** | First page user sees; displays demo data | Frontend (my-app) |

---

## Implementation Requirements

### Backend Requirements

**Endpoint**: `POST /auth/ensure-user`

**Behavior**:
- Accepts Clerk user ID + token
- Creates new user record (if not exists)
- Creates default organization with auto-generated name
- Creates user-org membership with default role (MEMBER)
- Auto-generates demo data:
  - 5 sample tasks with varied statuses and priorities
  - 5 time entries (1â€“4 hours each) linked to tasks
  - Some marked billable, some non-billable
- Returns full user object with `organizations` array

**Key Code Changes**:
- `backend/src/auth/auth.controller.ts` â€“ `/auth/ensure-user` POST handler
- `backend/src/users/onboarding.service.ts` â€“ `ensureUserExists()` method + `createDemoDataForOrganization()` helper
- `backend/src/users/users.service.ts` â€“ `getCurrentUser()` returns user with organizations

**Sample Defaults**:
```typescript
// Org naming: "firstName lastName's Workspace" or "Organization-XXXX"
// User role: MEMBER (not admin from the start)
// Demo tasks: "Set up project board", "Design homepage layout", etc.
// Demo time entries: realistic hour distributions (2h, 3.5h, 1h, 4h, 1.5h)
```

### Frontend Requirements

**Entry Point**: `my-app/app/(dashboard)/layout.tsx`

**Behavior**:
- On app load, check Clerk auth status
- If authenticated, call POST `/auth/ensure-user` once
- OrgContext fetches `/users/me` and waits for organizations to load
- Redirect to `/dashboard` once org data is available
- Dashboard shows demo data immediately (no skeletons)

**Key Code Changes**:
- `my-app/app/(dashboard)/layout.tsx` â€“ Call `ensureUserExists()` on mount
- `my-app/contexts/org-context.tsx` â€“ Wait for org data before rendering
- `my-app/app/(dashboard)/dashboard/page.tsx` â€“ Query enabled only when `selectedOrgId` is set

### Database Schema

**Existing Tables (Prisma)**:
- `User` â€“ Clerk user + backend metadata
- `Organization` â€“ Org record
- `OrganizationMember` â€“ User-org relationship + role
- `Task` â€“ Task record with status/priority
- `TimeEntry` â€“ Time entry with linked task

**No new migrations needed** for this flowâ€”all tables already exist.

---

## Step-by-Step Implementation

### Step 1: Verify Backend Routes

Ensure these endpoints exist and work:

```bash
# Backend must have these:
POST   /auth/ensure-user          # Sync Clerk user + create org + demo data
GET    /users/me                  # Returns user with organizations array
PATCH  /users/me/profile          # Update user profile later
```

**Check**:
```bash
cd backend
pnpm start:dev

# In another terminal, test:
curl -X POST http://localhost:3001/auth/ensure-user \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json"
```

### Step 2: Ensure Backend Demo Data Generation

**File**: `backend/src/users/onboarding.service.ts`

Verify this method exists and generates sample data:

```typescript
private async createDemoDataForOrganization(
  organizationId: string,
  userId: string,
): Promise<void> {
  // 1. Create 5 sample tasks
  // 2. Create 5 time entries linked to those tasks
  // 3. Mark some as billable
}
```

**Verify**:
```bash
cd backend
pnpm exec tsc --noEmit  # Check for type errors
```

### Step 3: Configure Frontend OrgContext

**File**: `my-app/contexts/org-context.tsx`

Verify the context:
1. Waits for Clerk user to load (`userLoaded`)
2. Fetches `/users/me` and extracts `organizations`
3. Sets `selectedOrgId` to first org
4. Marks `isLoading: false` once data arrives

**Verify**:
```typescript
// OrgContext should have:
const { data: currentUser, isLoading } = useQuery({
  queryKey: ['current-user'],
  queryFn: async () => api.get('/users/me', ...),
  enabled: userLoaded && !!user,
});

// And isLoading should be true until both conditions met:
isLoading: !userLoaded || isLoading
```

### Step 4: Update Dashboard Layout

**File**: `my-app/app/(dashboard)/layout.tsx`

Add this effect to sync new users:

```typescript
useEffect(() => {
  if (user && !user.unsafeMetadata?.onboarded) {
    // Call /auth/ensure-user once per user
    api.post('/auth/ensure-user', {
      clerkId: user.id,
    }).then(() => {
      // Refresh org context
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    });
  }
}, [user]);
```

### Step 5: Verify Dashboard Renders Without Skeletons

**File**: `my-app/app/(dashboard)/dashboard/page.tsx`

Ensure dashboard waits for org loading:

```typescript
// Query should only enable when org is selected and org loading is complete
const { data: timeSummary, isLoading: loadingSummary } = useQuery({
  enabled: !!selectedOrgId && !orgLoading,
  ...
});

// Render skeletons only while loading
{(isLoading || loadingSummary || loadingEntries) ? <Skeleton /> : <Content />}
```

### Step 6: Test End-to-End

Follow the **Testing Checklist** below.

---

## Testing Checklist

### Local Testing

**Prerequisites**:
- Backend running: `cd backend && pnpm start:dev`
- Frontend running: `cd my-app && pnpm dev`
- Database seeded or empty
- Clerk development keys configured

**Test Steps**:

1. **Fresh Signup**:
   - [ ] Navigate to `http://localhost:3000`
   - [ ] Click "Sign Up"
   - [ ] Create new Clerk account (test email, password)
   - [ ] Verify redirect to `/dashboard`
   - [ ] **Dashboard should show data immediately** (not skeletons)
   - [ ] Check time summary stats display (e.g., "24h worked this week")
   - [ ] Verify recent time entries are visible

2. **Verify Demo Data**:
   - [ ] Dashboard shows 5 sample tasks
   - [ ] Time entries list shows entries with 1â€“4 hour durations
   - [ ] Navigate to **Tasks** page â†’ see generated tasks
   - [ ] Navigate to **Time Entries** page â†’ see generated entries
   - [ ] Click on a time entry â†’ verify it's linked to a task

3. **Profile Page** (Optional Refinement):
   - [ ] Navigate to **Settings â†’ Profile**
   - [ ] Verify user name populated from Clerk (first + last name)
   - [ ] Update organization name â†’ changes persisted
   - [ ] Update first/last name â†’ changes persisted
   - [ ] Navigate back to dashboard â†’ data still visible

4. **Logout & Returning Session**:
   - [ ] Click **Sign Out** â†’ redirect to `/sign-in`
   - [ ] Sign back in with same account
   - [ ] Verify dashboard loads data (no re-onboarding)
   - [ ] Verify existing tasks + time entries are still there

5. **Backend Verification**:
   - [ ] Check backend console for any errors during user creation
   - [ ] Query Prisma Studio: `pnpm prisma:studio`
     - [ ] User record created with Clerk ID
     - [ ] Organization record created with default name
     - [ ] OrganizationMember record has role: MEMBER
     - [ ] 5 Task records created
     - [ ] 5 TimeEntry records created
     - [ ] TimeEntry records linked to Task records

### Reproduction Steps for PR

When opening a PR with this work, include these exact steps:

```markdown
## How to Test

1. Checkout this branch:
   ```bash
   git checkout wi/<work-item-number>
   ```

2. Install dependencies:
   ```bash
   pnpm install
   cd backend && pnpm install
   cd ../my-app && pnpm install
   ```

3. Set up environment:
   - Backend: Copy `.env.example` to `.env`
     ```
     DATABASE_URL=postgresql://user:pass@localhost:5432/flow_pilot_dev
     CLERK_SECRET_KEY=sk_test_...
     PORT=3001
     FRONTEND_URLS=http://localhost:3000
     ```
   - Frontend: Copy `.env.local.example` to `.env.local`
     ```
     NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
     CLERK_SECRET_KEY=sk_test_...
     NEXT_PUBLIC_API_URL=http://localhost:3001
     ```

4. Start backend and frontend:
   ```bash
   # Terminal 1
   cd backend && pnpm start:dev

   # Terminal 2
   cd my-app && pnpm dev
   ```

5. Test signup:
   - Open http://localhost:3000
   - Click "Sign Up"
   - Create a new account with test email
   - **Verify**: Dashboard loads with data (5 tasks, 5 time entries)
   - **Verify**: No skeleton loaders appear
   - **Verify**: Time summary shows stats

6. Test profile updates:
   - Click **Settings â†’ Profile**
   - Update org name
   - Verify changes persist
   - Return to dashboard â†’ data intact

7. Test logout/return:
   - Click **Sign Out**
   - Sign back in
   - **Verify**: Same account data persists
```

---

## Common Pitfalls & Troubleshooting

### Issue: Dashboard Shows Skeletons Forever

**Cause**: `orgLoading` never becomes false.

**Debug**:
1. Check browser console for API errors
2. Verify `/users/me` endpoint returns `organizations` array
3. Check backend logs during `ensureUserExists()` call
4. Ensure `createDemoDataForOrganization()` completes without errors

**Fix**:
- If `/users/me` returns empty organizations, check OrganizationMember creation
- If demo data generation fails (DB errors), check Prisma migration status

### Issue: New User Doesn't Get Demo Data

**Cause**: `createDemoDataForOrganization()` not called or fails silently.

**Debug**:
1. Add console logs in `ensureUserExists()`:
   ```typescript
   console.log('Creating org...');
   console.log('Creating membership...');
   console.log('Generating demo data...');
   ```
2. Check backend logs for Prisma errors
3. Verify Task and TimeEntry Prisma models exist

**Fix**:
- Ensure `createDemoDataForOrganization()` is called when `!existingUser`
- Verify Prisma migration includes Task and TimeEntry tables

### Issue: CORS Errors on `/auth/ensure-user`

**Cause**: Frontend URL not in `FRONTEND_URLS` env var.

**Fix**:
```bash
# backend/.env
FRONTEND_URLS=http://localhost:3000,http://localhost:3000
# (or just use http://localhost:3000 for local dev)
```

### Issue: Hydration Mismatch Errors

**Cause**: Client and server rendering different content.

**Fix**:
- Use dynamic imports for client-only components:
  ```typescript
  const NotificationBell = dynamic(() => import('./NotificationBell'), { ssr: false });
  ```
- Ensure OrgContext loads on client-side only

---

## Success Criteria

âœ… User signs up â†’ lands in `/dashboard` immediately  
âœ… Dashboard displays demo data (5 tasks, 5 time entries)  
âœ… No skeleton loaders freeze the UI  
âœ… Profile page shows user details from Clerk  
âœ… Logout works and redirects to `/sign-in`  
âœ… Returning user sees existing data (not re-onboarded)  
âœ… Backend logs show no errors during user creation  
âœ… PR includes test steps and screenshots

---

## Files Modified

- `backend/src/auth/auth.controller.ts` â€“ `/auth/ensure-user` endpoint
- `backend/src/users/onboarding.service.ts` â€“ User creation + demo data generation
- `backend/src/users/users.service.ts` â€“ `getCurrentUser()` returns organizations
- `my-app/app/(dashboard)/layout.tsx` â€“ Call `ensureUserExists()` on mount
- `my-app/contexts/org-context.tsx` â€“ Wait for org data before rendering
- `my-app/app/(dashboard)/dashboard/page.tsx` â€“ Query enabled when org ready
- `docs/06-onboarding/seamless-signup-flow.md` â€“ **This guide** (new file)

---

## Next Steps After Merge

Once this PR is merged to `dev`:

1. **QA Testing** on dev environment (AWS)
2. **Monitor** backend logs for errors during user creation
3. **Gather Feedback** from team on onboarding experience
4. **Consider Future Enhancements**:
   - Allow user to customize org name during signup (optional)
   - Show tutorial onboarding (non-blocking) after first login
   - Suggest inviting team members (optional)

---

## References

- **Clerk Docs**: [User Sessions](https://clerk.com/docs/references/nextjs/use-auth)
- **NestJS Docs**: [Controllers](https://docs.nestjs.com/controllers)
- **Prisma Docs**: [Relations](https://www.prisma.io/docs/concepts/components/prisma-schema/relations)
- **Contributing Guide**: [Flow Pilot Contributing Guide](../CONTRIBUTING.md)

---

**Questions?** Ask on Slack or open a Notion discussion. We're here to help! ðŸ™Œ

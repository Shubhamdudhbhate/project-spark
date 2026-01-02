# NyaySutra - Technology Stack & Detailed Workflow Documentation

## 📋 Table of Contents
1. [Technology Stack Overview](#technology-stack-overview)
2. [Technology Details & Responsibilities](#technology-details--responsibilities)
3. [Detailed Workflows](#detailed-workflows)
4. [Data Flow Diagrams](#data-flow-diagrams)
5. [System Architecture](#system-architecture)

---

## 🛠️ Technology Stack Overview

### Frontend Technologies
- **React 18.3.1** - UI framework
- **TypeScript 5.8.3** - Type safety
- **Vite 5.4.19** - Build tool & dev server
- **React Router DOM 6.30.1** - Client-side routing
- **Tailwind CSS 3.4.17** - Utility-first CSS
- **shadcn/ui** - Component library (Radix UI based)
- **Framer Motion 12.23.26** - Animations
- **TanStack React Query 5.83.0** - Server state management
- **React Hook Form 7.61.1** - Form management
- **Zod 3.25.76** - Schema validation
- **Sonner 1.7.4** - Toast notifications

### Backend & Database
- **Supabase** - Backend-as-a-Service
  - PostgreSQL Database
  - Authentication
  - Storage (File uploads)
  - Realtime subscriptions
  - Row Level Security (RLS)

### Development Tools
- **ESLint** - Code linting
- **TypeScript ESLint** - TypeScript linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

---

## 🔧 Technology Details & Responsibilities

### 1. **React 18.3.1**
**What it does:**
- Provides component-based UI architecture
- Manages component lifecycle and state
- Handles virtual DOM rendering
- Enables reusable UI components

**How it's used:**
- All pages are React components (`Index.tsx`, `Courts.tsx`, `CaseDetails.tsx`)
- Context providers for global state (`AuthContext`, `RoleContext`)
- Custom hooks for business logic (`useCourtSession`)
- Component composition for complex UIs

**Key Files:**
- `src/App.tsx` - Root component with routing
- `src/main.tsx` - Application entry point
- All components in `src/components/` and `src/pages/`

---

### 2. **TypeScript 5.8.3**
**What it does:**
- Adds static type checking to JavaScript
- Provides IntelliSense and autocomplete
- Catches errors at compile time
- Documents code with type annotations

**How it's used:**
- Type definitions for all components, props, and data structures
- Database types generated from Supabase schema (`src/integrations/supabase/types.ts`)
- Type-safe API calls and data transformations
- Interface definitions for case, evidence, and user data

**Key Files:**
- `src/types/case.ts` - Case and evidence type definitions
- `src/integrations/supabase/types.ts` - Database schema types
- All `.tsx` files use TypeScript

---

### 3. **Vite 5.4.19**
**What it does:**
- Fast development server with HMR (Hot Module Replacement)
- Optimized production builds
- Module bundling
- Path aliases (`@/` for `src/`)

**How it's used:**
- Development: `npm run dev` starts server on port 8080
- Build: `npm run build` creates optimized production bundle
- Config: `vite.config.ts` sets up React plugin, path aliases, and dev server

**Configuration:**
```typescript
// vite.config.ts
- Server: Port 8080, Host "::" (all interfaces)
- Path alias: "@" → "./src"
- React plugin with SWC for fast compilation
```

---

### 4. **React Router DOM 6.30.1**
**What it does:**
- Client-side routing (no page reloads)
- URL-based navigation
- Route protection (public/private routes)
- Nested routing support

**How it's used:**
- Hierarchical route structure:
  - `/` - Landing page
  - `/auth` - Authentication
  - `/courts` - Court list
  - `/courts/:courtId/sections` - Sections
  - `/sections/:sectionId/blocks` - Case blocks
  - `/cases/:id` - Case details

**Route Protection:**
- `ProtectedRoute` - Requires authentication
- `PublicRoute` - Redirects authenticated users
- Route guards check auth state before rendering

**Key Files:**
- `src/App.tsx` - Route definitions
- `src/components/ProtectedRoute.tsx` - Route protection logic

---

### 5. **Supabase (Backend-as-a-Service)**
**What it does:**
- PostgreSQL database with REST API
- User authentication (email/password)
- File storage (evidence files)
- Real-time subscriptions (live updates)
- Row Level Security (data access control)

**How it's used:**

#### **Database:**
- Tables: `courts`, `sections`, `cases`, `evidence`, `profiles`, `chain_of_custody`, `session_logs`, `permission_requests`, `case_diary`
- Relationships: Foreign keys maintain data integrity
- RLS Policies: Control who can read/write data

#### **Authentication:**
- User sign up/in/out
- Session management
- Profile creation on signup
- JWT tokens for API access

#### **Storage:**
- Evidence files stored in `evidence` bucket
- Private bucket with signed URLs
- File metadata in database

#### **Realtime:**
- Live session updates
- Permission request notifications
- Evidence status changes

**Key Files:**
- `src/integrations/supabase/client.ts` - Supabase client initialization
- `src/integrations/supabase/types.ts` - Generated database types
- All components use `supabase` client for data operations

---

### 6. **TanStack React Query 5.83.0**
**What it does:**
- Server state management
- Automatic caching
- Background refetching
- Loading/error states

**How it's used:**
- Wraps entire app in `QueryClientProvider`
- Could be used for data fetching (currently using direct Supabase calls)
- Provides caching layer for API responses

**Key Files:**
- `src/App.tsx` - QueryClient setup

---

### 7. **React Hook Form 7.61.1 + Zod 3.25.76**
**What it does:**
- Form state management
- Form validation
- Schema-based validation
- Performance optimization (uncontrolled components)

**How it's used:**
- Case creation forms
- Evidence upload forms
- Authentication forms
- Validation schemas defined with Zod

**Example:**
```typescript
// src/components/cases/CreateCaseDialog.tsx
const form = useForm<CaseFormValues>({
  resolver: zodResolver(caseFormSchema),
  defaultValues: { ... }
});
```

---

### 8. **Framer Motion 12.23.26**
**What it does:**
- Animation library for React
- Page transitions
- Component animations
- Gesture handling

**How it's used:**
- Page entrance animations
- Component hover effects
- Modal transitions
- List item animations

**Example:**
```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.1 }}
>
```

---

### 9. **Tailwind CSS 3.4.17**
**What it does:**
- Utility-first CSS framework
- Responsive design utilities
- Dark mode support
- Custom theme configuration

**How it's used:**
- All styling done with utility classes
- Custom glass-card effects
- Responsive breakpoints (sm, md, lg)
- Color theming for roles

**Key Files:**
- `tailwind.config.ts` - Theme configuration
- `src/index.css` - Global styles and custom utilities

---

### 10. **shadcn/ui (Radix UI Components)**
**What it does:**
- Accessible UI components
- Unstyled, customizable components
- Built on Radix UI primitives

**Components Used:**
- Button, Card, Dialog, Input, Select, Tabs, Badge, Toast, etc.
- All in `src/components/ui/`

---

## 🔄 Detailed Workflows

### Workflow 1: User Authentication & Onboarding

#### **Step-by-Step Process:**

1. **Landing Page (`/`)**
   - User sees 3 role blocks: Judiciary, Legal Practitioner, Public/Party
   - Each block shows role description and features
   - User clicks on their role block

2. **Role Selection**
   - URL updates: `/auth?role=judiciary` (or `legal_practitioner` or `public_party`)
   - Navigates to Auth page with role context

3. **Court Selection (Auth Page - Step 1)**
   - Fetches all courts from Supabase `courts` table
   - Displays court dropdown
   - User can create new court (if no courts exist)
   - User selects a court
   - Clicks "Continue to Sign In"

4. **Authentication (Auth Page - Step 2)**
   - Toggle between Sign In / Sign Up
   - **Sign Up:**
     - Form fields: Full Name, Email, Password, Confirm Password
     - Validation with Zod schema
     - On submit:
       - Calls `supabase.auth.signUp()` with email, password
       - Includes role_category in user metadata
       - Creates profile record in `profiles` table
       - Shows success toast
       - Redirects to `/courts`
   - **Sign In:**
     - Form fields: Email, Password
     - Validation with Zod schema
     - On submit:
       - Calls `supabase.auth.signInWithPassword()`
       - Supabase validates credentials
       - Creates session, stores in localStorage
       - Fetches user profile from `profiles` table
       - Shows success toast
       - Redirects to `/courts`

5. **Post-Authentication**
   - `AuthContext` detects session change
   - Fetches user profile from `profiles` table
   - Sets user, session, and profile in context
   - `RoleContext` maps role_category to court role
   - User is now authenticated and can access protected routes

**Technologies Involved:**
- React Router (navigation)
- Supabase Auth (authentication)
- React Context (state management)
- Zod (validation)
- React Hook Form (form handling)

---

### Workflow 2: Court & Section Management

#### **Creating a Court:**

1. **User Action:**
   - Navigates to `/courts`
   - Clicks "Add Court" button (visible to Judiciary/Legal Practitioners)

2. **Dialog Opens:**
   - Form fields: Court Name (required), Description, Address
   - User fills form

3. **Submission:**
   - Generates court code: `COURT-NAME-TIMESTAMP`
   - Calls `supabase.from('courts').insert()`
   - Creates record in database:
     ```typescript
     {
       name: string,
       code: string,
       address: string | null,
       type: string | null,
       city: string | null,
       state: string | null
     }
     ```
   - Shows success toast
   - Refetches court list
   - Dialog closes

4. **Display:**
   - Court appears in grid
   - User can click to navigate to sections

**Technologies:**
- Supabase (database insert)
- React state (form data)
- Toast notifications (feedback)

#### **Creating a Section:**

1. **User Action:**
   - Navigates to `/courts/:courtId/sections`
   - Clicks "New Section" button

2. **Dialog Opens:**
   - Form fields: Section Name (required), Description
   - User fills form

3. **Submission:**
   - Generates section code
   - Calls `supabase.from('sections').insert()`
   - Links to court via `court_id` foreign key
   - Creates record:
     ```typescript
     {
       name: string,
       code: string,
       description: string | null,
       court_id: string
     }
     ```
   - Shows success toast
   - Refetches sections list

4. **Display:**
   - Section appears in grid
   - User can click to navigate to case blocks

---

### Workflow 3: Case Creation

#### **Step-by-Step Process:**

1. **User Action:**
   - Navigates to `/sections/:sectionId/blocks`
   - Clicks "New Case" button

2. **Dialog Opens (`CreateCaseDialog`):**
   - Form fields:
     - Case Title (required)
     - Description (optional)
     - Judge (dropdown - filters profiles with `role_category = 'judiciary'`)
     - Clerk (dropdown - filters profiles with `role_category = 'legal_practitioner'`)
     - Plaintiff Name (required - can be manual entry or profile)
     - Defendant Name (required - can be manual entry or profile)

3. **Data Fetching:**
   - Fetches all profiles from `profiles` table
   - Filters judges and clerks for dropdowns
   - Generates case number: `CASE/2024/SECT/1234`

4. **Form Validation:**
   - Zod schema validates all fields
   - Real-time validation feedback
   - Submit button disabled until valid

5. **Submission:**
   - Handles plaintiff/defendant:
     - If profile selected: uses profile ID
     - If manual entry: stores as `manual:Name`
   - Calls `supabase.from('cases').insert()`
   - Creates case record:
     ```typescript
     {
       case_number: string,
       title: string,
       description: string | null,
       section_id: string,
       judge_id: string,
       clerk_id: string | null,
       plaintiff_id: string, // profile ID or "manual:Name"
       defendant_id: string, // profile ID or "manual:Name"
       status: 'pending',
       filing_date: new Date().toISOString(),
       priority: null
     }
     ```
   - Shows success toast
   - Refetches cases list
   - Dialog closes

6. **Display:**
   - Case appears in grid with status badge
   - User can click to navigate to case details

**Technologies:**
- React Hook Form (form state)
- Zod (validation)
- Supabase (database insert)
- React state (profile fetching)

---

### Workflow 4: Evidence Upload

#### **Step-by-Step Process:**

1. **User Navigates to Case:**
   - Opens `/cases/:id`
   - Clicks "Upload Workspace" tab

2. **Permission Check:**
   - **If Judge:** Can upload immediately
   - **If Legal Practitioner/Observer:**
     - Checks for active court session
     - If no session: Shows "No active session" message
     - If session exists: Checks for permission
     - If no permission: Shows permission banner with "Request Permission" button

3. **Permission Request (Non-Judge):**
   - User clicks "Request Permission"
   - `useCourtSession` hook:
     - Checks for existing pending/granted request
     - If exists: Shows info message
     - If not: Creates record in `permission_requests` table:
       ```typescript
       {
         session_id: string,
         case_id: string,
         requester_id: string,
         status: 'pending',
         requested_at: timestamp
       }
       ```
   - Real-time notification sent to judge
   - Judge sees request in "Judge Control Panel"

4. **Judge Grants Permission:**
   - Judge sees permission request
   - Clicks "Grant" or "Deny"
   - Updates `permission_requests` table:
     ```typescript
     {
       status: 'granted' | 'denied',
       responded_at: timestamp,
       responded_by: judge_id
     }
     ```
   - Real-time notification sent to requester
   - Requester's UI updates automatically

5. **Upload Workspace Access:**
   - If permission granted or is judge:
     - Upload workspace becomes visible
     - User can drag & drop files or click to select

6. **File Selection:**
   - User selects files (multiple allowed)
   - Files appear in preview list
   - User can remove files before upload
   - User selects evidence category (document, video, audio, image, forensic, other)
   - User can add batch title (optional)

7. **Upload Process:**
   - For each file:
     a. **Generate unique filename:**
        - Format: `{caseId}/{timestamp}-{random}.{ext}`
     b. **Upload to Supabase Storage:**
        - Bucket: `evidence`
        - Private bucket (requires authentication)
        - `supabase.storage.from('evidence').upload(fileName, file)`
     c. **Generate signed URL:**
        - Valid for 1 year
        - `supabase.storage.from('evidence').createSignedUrl(fileName, 31536000)`
     d. **Create evidence record:**
        - Insert into `evidence` table:
          ```typescript
          {
            case_id: string,
            title: string,
            description: string | null,
            file_name: string,
            file_url: string, // signed URL
            file_size: number,
            mime_type: string,
            category: string,
            uploaded_by: string,
            is_sealed: false,
            created_at: timestamp
          }
          ```
     e. **Create chain of custody entry:**
        - Insert into `chain_of_custody` table:
          ```typescript
          {
            evidence_id: string,
            action: 'UPLOADED',
            performed_by: string,
            details: { file_name, file_size, mime_type },
            created_at: timestamp
          }
          ```
     f. **Update progress:**
        - Progress bar updates: `(uploadedCount / totalFiles) * 100`
     g. **On completion:**
        - Shows success toast
        - Refetches evidence list
        - Clears file list

8. **Evidence Display:**
   - Evidence appears in "Evidence Vault" tab
   - Status: "Pending Review" (not sealed yet)
   - Shows file icon, name, size, uploader, date

**Technologies:**
- Supabase Storage (file upload)
- Supabase Database (evidence records)
- React state (upload progress)
- Real-time subscriptions (permission updates)
- Drag & drop API (file selection)

---

### Workflow 5: Court Session Management

#### **Starting a Session (Judge Only):**

1. **Judge Action:**
   - Opens case details page
   - Clicks "Start Session" in Judge Control Panel

2. **Validation:**
   - Checks if session already active
   - If active: Shows error toast
   - If not: Proceeds

3. **Session Creation:**
   - `useCourtSession.startSession()`:
     - Inserts into `session_logs` table:
       ```typescript
       {
         case_id: string,
         judge_id: string,
         status: 'active',
         started_at: timestamp,
         notes: null
       }
       ```
   - Creates case diary entry:
     - Insert into `case_diary`:
       ```typescript
       {
         case_id: string,
         action: 'SESSION_START',
         actor_id: judge_id,
         details: { session_id: string }
       }
       ```
   - Shows success toast
   - Real-time notification to all case participants

4. **UI Updates:**
   - Judge Control Panel shows active session
   - Session timer starts
   - Permission request section becomes active
   - Upload workspace becomes accessible to non-judges (with permission)

#### **Requesting Permission (Legal Practitioner/Observer):**

1. **User Action:**
   - Sees "Request Permission" button in permission banner
   - Clicks button

2. **Permission Request:**
   - `useCourtSession.requestPermission()`:
     - Checks for existing request
     - If exists: Shows info message
     - If not: Creates `permission_requests` record:
       ```typescript
       {
         session_id: string,
         case_id: string,
         requester_id: string,
         status: 'pending',
         requested_at: timestamp
       }
       ```
   - Real-time notification to judge
   - Shows success toast

3. **Judge Notification:**
   - Judge sees request in control panel
   - Shows requester name, timestamp
   - Can grant or deny

#### **Granting/Denying Permission (Judge):**

1. **Judge Action:**
   - Sees permission request
   - Clicks "Grant" or "Deny"

2. **Update Permission:**
   - `useCourtSession.respondToPermission()`:
     - Updates `permission_requests`:
       ```typescript
       {
         status: 'granted' | 'denied',
         responded_at: timestamp,
         responded_by: judge_id
       }
       ```
   - Real-time notification to requester
   - Shows success toast

3. **Requester Notification:**
   - Receives real-time update
   - If granted: Upload workspace becomes accessible
   - If denied: Shows error message
   - Permission banner updates

#### **Ending a Session (Judge):**

1. **Judge Action:**
   - Clicks "End Session" in control panel
   - Optionally adds notes in Judicial Notepad

2. **Session Termination:**
   - `useCourtSession.endSession()`:
     - Updates `session_logs`:
       ```typescript
       {
         status: 'ended',
         ended_at: timestamp,
         notes: string | null
       }
       ```
   - Expires all pending permissions:
     - Updates `permission_requests` with `status = 'expired'`
   - Creates case diary entry:
     ```typescript
     {
       case_id: string,
       action: 'SESSION_END',
       actor_id: judge_id,
       details: {
         session_id: string,
         duration_minutes: number,
         notes_summary: string | null
       }
     }
     ```
   - Shows success toast
   - Real-time notification to all participants

3. **UI Updates:**
   - Session status changes to "Ended"
   - Permission requests cleared
   - Upload workspace becomes inaccessible to non-judges

**Technologies:**
- Supabase Database (session logs, permissions)
- Supabase Realtime (live updates)
- React hooks (session management)
- React state (session state)

---

### Workflow 6: Evidence Sealing (Digital Signature)

#### **Step-by-Step Process:**

1. **Judge Views Evidence:**
   - Opens case details
   - Navigates to "Evidence Vault" tab
   - Sees list of evidence (pending and sealed)
   - Pending evidence shows "Seal" button

2. **Judge Clicks "Seal":**
   - Opens `SignatureModal`
   - Shows evidence details (file name, type, size)

3. **Signature Process:**
   - **Step 1: Confirm**
     - Shows evidence summary
     - Warning about immutability
     - "Sign Evidence" button
   
   - **Step 2: Signing**
     - Shows loading animation
     - Simulates wallet connection
     - Simulates private key signing
     - Progress indicator
   
   - **Step 3: Hashing**
     - Generates cryptographic hash
     - Format: `0x{64 character hex string}`
     - This represents the digital signature
   
   - **Step 4: Success**
     - Shows success animation
     - Confirms evidence is sealed

4. **Database Update:**
   - `handleSignComplete()`:
     - Updates `evidence` table:
       ```typescript
       {
         is_sealed: true,
         sealed_by: judge_id,
         sealed_at: timestamp
       }
       ```
     - Creates chain of custody entry:
       ```typescript
       {
         evidence_id: string,
         action: 'SEALED',
         performed_by: judge_id,
         details: { signature_hash: string }
       }
       ```
   - Refetches evidence list
   - Shows success toast

5. **Evidence Status Change:**
   - Evidence status changes from "Pending Review" to "Sealed"
   - Badge changes to green "Sealed" with lock icon
   - "Seal" button disappears
   - Evidence becomes immutable (cannot be modified)
   - Can now be used in Presentation Mode

**Technologies:**
- React state (modal state, signing steps)
- Supabase Database (evidence update, chain of custody)
- Cryptographic hashing (signature generation)
- Framer Motion (animations)

---

### Workflow 7: Presentation Mode

#### **Step-by-Step Process:**

1. **User Action:**
   - Opens case details
   - Clicks "Present Case" button (only visible if sealed evidence exists)
   - Or clicks "Present" on individual sealed evidence

2. **Presentation Mode Opens:**
   - Fullscreen modal
   - Shows only sealed evidence
   - Starts at selected evidence or first evidence

3. **Evidence Display:**
   - Fullscreen view of evidence
   - File type detection:
     - PDF/Documents: Embedded viewer
     - Images: Full-size display
     - Videos: Video player
     - Audio: Audio player
   - Case number displayed at top
   - Evidence counter (e.g., "1 of 5")

4. **Navigation:**
   - Previous/Next buttons
   - Keyboard shortcuts (arrow keys)
   - Swipe gestures (mobile)
   - Close button

5. **Evidence Information:**
   - Shows evidence metadata:
     - Title
     - Uploaded by
     - Sealed by (judge name)
     - Sealed date
     - File type and size

6. **Exit:**
   - User clicks close or presses Escape
   - Returns to case details page
   - Maintains scroll position

**Technologies:**
- React state (presentation state, current index)
- Framer Motion (fullscreen transitions)
- File type detection (MIME types)
- Keyboard event handling

---

### Workflow 8: Chain of Custody Tracking

#### **How It Works:**

1. **Automatic Logging:**
   - Every evidence action creates a chain of custody entry
   - Actions tracked:
     - `UPLOADED` - When evidence is uploaded
     - `SEALED` - When judge seals evidence
     - `VIEWED` - When evidence is viewed
     - `DOWNLOADED` - When evidence is downloaded
     - `MODIFIED` - When metadata is modified

2. **Entry Creation:**
   - Insert into `chain_of_custody` table:
     ```typescript
     {
       evidence_id: string,
       action: string,
       performed_by: string, // user ID
       details: JSONB, // additional metadata
       created_at: timestamp
     }
     ```

3. **Viewing Chain of Custody:**
   - User clicks "History" button on evidence card
   - Opens `ChainOfCustodyModal`
   - Fetches all entries for that evidence:
     - `supabase.from('chain_of_custody').select('*').eq('evidence_id', id)`
   - Fetches user names for `performed_by` IDs
   - Displays chronological list:
     - Action type
     - Performed by (user name)
     - Timestamp
     - Details (if any)

4. **Display Format:**
   - Timeline view
   - Most recent first
   - Color-coded by action type
   - Shows user avatars
   - Formatted timestamps

**Technologies:**
- Supabase Database (chain_of_custody table)
- React components (modal, timeline)
- Date formatting (date-fns)

---

### Workflow 9: Case Diary (Activity Log)

#### **How It Works:**

1. **Automatic Logging:**
   - Case-level actions are logged to `case_diary`
   - Actions tracked:
     - `SESSION_START` - When judge starts session
     - `SESSION_END` - When judge ends session
     - `JUDGE_TRANSFER` - When case is transferred
     - `STATUS_CHANGE` - When case status changes
     - `EVIDENCE_ADDED` - When evidence is added
     - `EVIDENCE_SEALED` - When evidence is sealed

2. **Entry Creation:**
   - Insert into `case_diary` table:
     ```typescript
     {
       case_id: string,
       action: string,
       actor_id: string, // user ID
       details: JSONB, // additional metadata
       ip_address: string | null,
       user_agent: string | null,
       created_at: timestamp
     }
     ```

3. **Viewing Case Diary:**
   - Component: `CaseDiary`
   - Fetches entries:
     - `supabase.from('case_diary').select('*').eq('case_id', id)`
   - Fetches actor names from profiles
   - Displays chronological list
   - Shows action, actor, timestamp, details

**Technologies:**
- Supabase Database (case_diary table)
- React components (diary display)
- Date formatting

---

## 📊 Data Flow Diagrams

### Authentication Flow
```
User → Landing Page → Role Selection → Auth Page
  ↓
Court Selection → Authentication Form
  ↓
Supabase Auth API → Create Session
  ↓
Fetch Profile → AuthContext → RoleContext
  ↓
Redirect to /courts
```

### Case Creation Flow
```
User → Sections Page → Case Blocks → Create Case Dialog
  ↓
Form Validation (Zod) → Submit
  ↓
Supabase Insert (cases table)
  ↓
Success → Refresh Cases List → Display New Case
```

### Evidence Upload Flow
```
User → Case Details → Upload Workspace Tab
  ↓
Permission Check → Request Permission (if needed)
  ↓
Judge Grants Permission → Upload Workspace Accessible
  ↓
File Selection → Upload to Supabase Storage
  ↓
Generate Signed URL → Create Evidence Record
  ↓
Create Chain of Custody Entry → Refresh Evidence List
```

### Evidence Sealing Flow
```
Judge → Evidence Vault → Click "Seal"
  ↓
Signature Modal → Confirm → Sign → Generate Hash
  ↓
Update Evidence (is_sealed = true)
  ↓
Create Chain of Custody Entry (SEALED)
  ↓
Refresh Evidence List → Status: "Sealed"
```

### Session Management Flow
```
Judge → Start Session → Create session_logs record
  ↓
Real-time Notification → All Participants Notified
  ↓
Legal Practitioner → Request Permission
  ↓
Judge → Grant/Deny → Update permission_requests
  ↓
Real-time Update → Requester Notified
  ↓
Judge → End Session → Update session_logs
  ↓
Expire Permissions → Create case_diary entry
```

---

## 🏗️ System Architecture

### Frontend Architecture
```
src/
├── main.tsx (Entry Point)
├── App.tsx (Root Component + Routing)
├── pages/ (Route Components)
│   ├── Index.tsx (Landing)
│   ├── Auth.tsx (Authentication)
│   ├── Courts.tsx (Court List)
│   ├── Sections.tsx (Section List)
│   ├── CaseBlocks.tsx (Case List)
│   └── CaseDetails.tsx (Case Workspace)
├── components/
│   ├── cases/ (Case-related Components)
│   ├── dashboard/ (Dashboard Components)
│   └── ui/ (Reusable UI Components)
├── contexts/ (Global State)
│   ├── AuthContext.tsx
│   └── RoleContext.tsx
├── hooks/ (Custom Hooks)
│   └── useCourtSession.ts
├── services/ (Business Logic)
│   └── caseService.ts
├── integrations/ (External Services)
│   └── supabase/
│       ├── client.ts
│       └── types.ts
└── types/ (Type Definitions)
    └── case.ts
```

### Backend Architecture (Supabase)
```
Supabase Project
├── Database (PostgreSQL)
│   ├── Tables
│   │   ├── profiles
│   │   ├── courts
│   │   ├── sections
│   │   ├── cases
│   │   ├── evidence
│   │   ├── chain_of_custody
│   │   ├── session_logs
│   │   ├── permission_requests
│   │   └── case_diary
│   ├── RLS Policies (Row Level Security)
│   └── Foreign Key Relationships
├── Authentication
│   ├── Email/Password Auth
│   ├── Session Management
│   └── JWT Tokens
├── Storage
│   └── evidence bucket (Private)
└── Realtime
    └── Subscriptions (session_logs, permission_requests)
```

### Data Flow Architecture
```
React Components
    ↓
Supabase Client
    ↓
Supabase API (REST)
    ↓
PostgreSQL Database
    ↓
RLS Policies (Security)
    ↓
Data Returned to Components
```

### Real-time Architecture
```
Supabase Realtime
    ↓
PostgreSQL Changes
    ↓
WebSocket Connection
    ↓
React Components (Subscriptions)
    ↓
UI Updates Automatically
```

---

## 🔐 Security Features

### 1. **Row Level Security (RLS)**
- Every table has RLS policies
- Users can only access data they're authorized to see
- Policies check `auth.uid()` for user identity

### 2. **Authentication**
- JWT tokens for API access
- Session stored securely in localStorage
- Automatic token refresh

### 3. **File Storage**
- Private bucket (requires authentication)
- Signed URLs with expiration
- Access controlled by RLS policies

### 4. **Role-Based Access Control**
- Three role categories
- Permission checks at component level
- Database-level restrictions via RLS

### 5. **Evidence Immutability**
- Once sealed, evidence cannot be modified
- Chain of custody tracks all changes
- Digital signatures prevent tampering

---

## 📱 Responsive Design

### Breakpoints
- **Mobile:** < 640px (sm)
- **Tablet:** 640px - 1024px (md)
- **Desktop:** > 1024px (lg)

### Adaptive Features
- Mobile: Stacked layouts, hamburger menus
- Tablet: 2-column grids
- Desktop: 3-column grids, sidebars

---

## 🚀 Performance Optimizations

1. **Code Splitting**
   - Route-based code splitting
   - Lazy loading for heavy components

2. **Caching**
   - React Query for API response caching
   - Supabase client-side caching

3. **Optimistic Updates**
   - UI updates before server confirmation
   - Rollback on error

4. **Image Optimization**
   - Thumbnails for evidence previews
   - Lazy loading images

5. **Bundle Size**
   - Tree shaking
   - Vite production optimizations

---

## 📝 Summary

This document provides a comprehensive overview of:
- All technologies used and their specific roles
- Detailed step-by-step workflows for every major feature
- Data flow diagrams
- System architecture
- Security features
- Performance considerations

The NyaySutra system is a modern, secure, and scalable digital court management platform built with React, TypeScript, and Supabase, providing role-based access control, evidence management, and real-time collaboration features.


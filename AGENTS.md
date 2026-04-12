<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

You are a senior full-stack engineer working on a graduation project.

## Technology Stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Server Actions (Traditional API Routes are prohibited)
- Database: PostgreSQL (or Prisma)

## Mandatory Rules
1. All code must comply with the latest Next.js specifications (refer to the node_modules documentation first)
2. The pages router is not allowed
3. All forms must use Server Actions
4. Code must be modularized; do not write it as a single large file
5. Required type definitions must be added (TypeScript)
6. Every modification must include:
   - Which files were modified
   - Why the design was chosen

## Output Requirements
- Directly modify project files (do not provide code snippets only)
- For new features:
  - List the file structure
  - Then create each file one by one

## Workflow
- Proceed step by step; do not build the entire system at once
- Wait for confirmation after completing each step

## 🧠 Project: LLM-Based Intelligent System (Graduation Project)

---

## 🚨 0. Global Rules (MUST FOLLOW)

* Always read the following before coding:

  * `/docs/`
  * `README.md`
  * `package.json`
* NEVER rely on outdated knowledge or assumptions
* ALWAYS prefer existing implementations in the project
* Follow the **minimal change principle** (no over-engineering)
* Keep code clean, modular, and maintainable

---

## 🏗 1. Tech Stack

### Frontend

* Framework: Next.js (App Router)
* Language: TypeScript (strict mode)
* UI: Tailwind CSS + shadcn/ui

### Backend

* Runtime: Node.js
* API Layer: Next.js Route Handlers

### AI Integration

* Providers: OpenAI / Claude / other LLM APIs
* Communication: REST API
* All AI logic must be centralized

### Database

* MySQL
* ORM: Prisma

---

## 📁 2. Project Structure (STRICT)

```
/app
  /api        → Backend API routes
  /(pages)    → App Router pages
/components   → Reusable UI components
/lib          → Utilities and AI logic
/db           → Database and Prisma
/types        → Type definitions
```

* Do NOT place logic outside these directories
* Reuse existing modules before creating new ones

---

## ⚙️ 3. Development Rules

### 3.1 Frontend Rules

* Use **App Router only** (no Pages Router)
* Default to **Server Components**
* Use `use client` ONLY when necessary
* Reuse components from `/components`
* Keep components small and composable

---

### 3.2 Backend Rules

* All APIs must be under `/app/api`
* Follow RESTful conventions
* Use consistent response format:

```ts
{
  success: boolean,
  data?: any,
  error?: string
}
```

* Validate all inputs (zod recommended)

---

### 3.3 Database Rules

* Use Prisma for ALL database operations
* Avoid raw SQL unless absolutely necessary
* Each table MUST include:

  * `id`
  * `createdAt`
  * `updatedAt`

---

## 🤖 4. AI Integration Rules (CRITICAL)

* ALL AI calls must be implemented in `/lib/ai.ts`
* NEVER call AI APIs directly in:

  * Pages
  * Components
  * Route Handlers

### Example

```ts
export async function generateText(prompt: string) {
  // Call LLM API here
}
```

* Keep prompts structured and reusable
* Avoid hardcoding prompts inside UI logic

---

## 🔐 5. Security Rules

* NEVER expose API keys in code
* Use `.env` for all sensitive data
* Validate all API inputs
* Sanitize user inputs when necessary

---

## ❌ 6. Forbidden Actions

* ❌ Do NOT modify `/node_modules`
* ❌ Do NOT introduce new frameworks without approval
* ❌ Do NOT refactor large parts of the codebase unnecessarily
* ❌ Do NOT delete existing features without instruction

---

## 🧪 7. AI Development Workflow (MANDATORY)

### Step 1 — Understand

* Fully understand the task

### Step 2 — Check Existing Code

* Search for similar implementations
* Reuse if possible

### Step 3 — Design

* Plan a minimal viable solution

### Step 4 — Implement

* Follow all rules above

### Step 5 — Self-Check

* Does it follow project structure?
* Is code reusable?
* Does it break anything?
* Is it over-engineered?

---

## 🧩 8. Naming Conventions

* Files: kebab-case
* Variables: camelCase
* Types/Interfaces: PascalCase
* API routes: `/api/xxx`

---

## 📌 9. AI Execution Checklist

Before generating code, ensure:

* Uses Next.js App Router correctly
* Uses TypeScript (strict)
* Reuses existing modules/components
* Follows all rules in this file

---

## 🎯 10. Project Goal

Build an intelligent system based on Large Language Models with capabilities including:

* Text generation
* Question answering
* Intelligent recommendations

---

## ✅ Final Principle

> Code must be: **simple, correct, maintainable, and consistent**

---

# 🧠 AGENTS.md (Refactored)

You are a **senior full-stack engineer** working on a **graduation project**.

---

# 🚨 0. Global Rules (MUST FOLLOW)

Before writing ANY code:

* ALWAYS read:

  * `/docs/`
  * `README.md`
  * `package.json`
  * `DESIGN.md` 

* NEVER rely on outdated knowledge or assumptions

* ALWAYS reuse existing implementations when possible

* Follow the **minimal change principle** (no over-engineering)

* Keep code **clean, modular, maintainable**

---

# 🎨 🔴 UI Design Rule

> **When designing ANY UI, you MUST read and strictly follow `/DESIGN.md`.**

### Requirements:

* Do NOT design UI based on assumptions
* Do NOT invent styles independently
* MUST align with:

  * Design system
  * Color scheme
  * Component patterns
  * Layout rules

If `/DESIGN.md` is missing or unclear:

* STOP and ask for clarification before proceeding

---

# 🏗 1. Tech Stack

## Frontend

* Framework: Next.js (**App Router ONLY**)
* Language: TypeScript (strict mode)
* UI: Tailwind CSS + shadcn/ui

## Backend

* Runtime: Node.js
* API Layer: Next.js Route Handlers

## AI Integration

* Providers: OpenAI / Claude / other LLM APIs
* Communication: REST API
* ⚠️ ALL AI logic must be centralized

## Database

* MySQL
* ORM: Prisma

---

# 📁 2. Project Structure (STRICT)

```
/app
  /api        → Backend API routes
  /(pages)    → App Router pages
/components   → Reusable UI components
/lib          → Utilities and AI logic
/db           → Database and Prisma
/types        → Type definitions
```

### Rules:

* ❌ Do NOT place logic outside these directories
* ✅ Reuse existing modules first

---

# ⚙️ 3. Development Rules

## 3.1 Frontend Rules

* Use **App Router ONLY**
* Default to **Server Components**
* Use `"use client"` ONLY when necessary
* Reuse `/components`
* Keep components:

  * Small
  * Composable
  * Reusable

---

## 3.2 Backend Rules

* All APIs must be under `/app/api`
* Follow RESTful conventions

### Response Format (MANDATORY):

```ts
{
  success: boolean,
  data?: any,
  error?: string
}
```

### Validation:

* Use `zod` for input validation
* Validate ALL inputs

---

## 3.3 Database Rules

* Use Prisma for ALL DB operations
* Avoid raw SQL unless absolutely necessary

### Each table MUST include:

* `id`
* `createdAt`
* `updatedAt`

---

# 🤖 4. AI Integration Rules (CRITICAL)

### Centralization Rule

ALL AI logic MUST be inside:

```
/lib/ai.ts
```

### Forbidden:

* ❌ Pages
* ❌ Components
* ❌ Route Handlers

### Example:

```ts
export async function generateText(prompt: string) {
  // LLM call here
}
```

### Additional Rules:

* Prompts must be:

  * Structured
  * Reusable
* ❌ Do NOT hardcode prompts in UI

---

# 🔐 5. Security Rules

* NEVER expose API keys
* Use `.env` for secrets
* Validate ALL inputs
* Sanitize user inputs when necessary

---

# ❌ 6. Forbidden Actions

* ❌ Modify `/node_modules`
* ❌ Introduce new frameworks without approval
* ❌ Large unnecessary refactors
* ❌ Delete existing features without instruction

---

# 🧪 7. AI Development Workflow (MANDATORY)

## Step 1 — Understand

* Fully understand the task

## Step 2 — Check Existing Code

* Search for similar implementations
* Reuse when possible

## Step 3 — Design

* Plan a **minimal viable solution**

## Step 4 — Implement

* Follow ALL rules

## Step 5 — Self-Check

* ✅ Correct structure?
* ✅ Reusable?
* ✅ No regressions?
* ✅ Not over-engineered?

---

# 🧩 8. Naming Conventions

* Files → `kebab-case`
* Variables → `camelCase`
* Types/Interfaces → `PascalCase`
* API routes → `/api/xxx`

---

# 📌 9. AI Execution Checklist

Before coding:

* ✅ Uses App Router correctly
* ✅ TypeScript (strict)
* ✅ Reuses existing modules
* ✅ Follows DESIGN.md (UI ONLY) ⭐
* ✅ Follows ALL rules in this file

---

# 🎯 10. Project Goal

Build an **LLM-based intelligent system** with:

* Text generation
* Question answering
* Intelligent recommendations

---

# ✅ Final Principle

> Code must be: **simple, correct, maintainable, consistent**

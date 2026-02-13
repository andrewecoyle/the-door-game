# Dev Team Agents

This template includes 8 specialized agents that work together to autonomously ship features.

## Research Phase (4 Agents - Run in Parallel)

### 1. Best Practices Researcher
**Purpose:** Finds industry best practices and proven patterns
**Searches:** Current standards (2024-2025), design patterns, common pitfalls
**Output:** Recommended approach with rationale

### 2. Codebase Analyst
**Purpose:** Maps feature to existing code structure
**Analyzes:** File structure, existing patterns, where code should live
**Output:** Files to modify/create, patterns to follow

### 3. Framework/Docs Researcher
**Purpose:** Reads official documentation for frameworks/libraries
**Searches:** Official docs, API references, version-specific guidance
**Output:** Recommended APIs, code examples from docs

### 4. Git History Analyzer
**Purpose:** Learns from past implementations in the project
**Analyzes:** Commit history, what worked, what didn't
**Output:** Successful patterns, mistakes to avoid

---

## Review Phase (4 Agents - Run in Parallel)

### 5. Andrew Style Reviewer
**Purpose:** Ensures code matches your coding style and preferences
**Checks:** Naming conventions, comment style, consistency with codebase
**Reads:** `shared-memory/ceo-preferences.md`
**Output:** Style issues (must fix / should fix / nice to have)

### 6. Security Sentinel
**Purpose:** Identifies security vulnerabilities
**Checks:** OWASP Top 10, injection, XSS, authentication issues
**Output:** Critical vulnerabilities with fixes

### 7. Performance Oracle
**Purpose:** Identifies performance bottlenecks and inefficiencies
**Checks:** N+1 queries, algorithmic complexity, memory leaks
**Output:** Performance issues with impact analysis

### 8. UX Reviewer ⭐ NEW
**Purpose:** Ensures usability and accessibility standards
**Checks:**
- WCAG 2.1 AA compliance
- Mobile UX patterns (iOS HIG, Material Design)
- Design system consistency
- Loading/error/empty states
- Touch target sizes (44x44px minimum)
- Color contrast ratios
**Output:** UX/accessibility issues with user impact

---

## How They Work Together

### Phase 1: Planning
```
You: /ship-feature "Add user profile page"

┌─────────────────────────────────────────┐
│   4 Researchers Work in Parallel       │
├─────────────────────────────────────────┤
│ Best Practices → "Profile page patterns"│
│ Codebase       → "Where it fits"        │
│ Docs           → "Framework APIs"       │
│ Git History    → "Past profile pages"   │
└─────────────────────────────────────────┘
            ↓
    Synthesized Plan
            ↓
    You Approve
```

### Phase 2: Implementation
```
Code gets written following the plan
```

### Phase 3: Review
```
┌──────────────────────────────────────────┐
│    4 Reviewers Work in Parallel         │
├──────────────────────────────────────────┤
│ Style       → "Matches your preferences?"│
│ Security    → "Any vulnerabilities?"     │
│ Performance → "Any bottlenecks?"         │
│ UX          → "Accessible? Usable?"      │
└──────────────────────────────────────────┘
            ↓
    Issues Found & Auto-Fixed
            ↓
    Summary Presented to You
```

### Phase 4: Ship
```
Tests → Commit → Deploy
```

---

## Learning Over Time

Each agent learns and improves:

**Researchers learn:**
- What patterns you prefer
- What libraries you use
- How you structure features

**Reviewers learn:**
- Your coding style preferences
- Security patterns you follow
- Performance standards you maintain
- UX patterns you prefer

After 20 features: **70% preference accuracy**
After 50 features: **Strong institutional knowledge**

---

## Why 8 Agents?

**Parallel execution** = Faster
- 4 researchers work simultaneously
- 4 reviewers work simultaneously

**Specialized expertise** = Better quality
- Each agent is a domain expert
- Focused, thorough reviews

**Compounding knowledge** = Smarter over time
- Each feature improves the team
- Patterns emerge and get codified

---

For full documentation on each agent, see their individual files in `.claude/agents/`

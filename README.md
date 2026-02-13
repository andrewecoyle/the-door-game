# The Door - Retro NES Browser Game

A minimal template that gives any project an autonomous development team - no executives, just the feature-shipping workflow.

## What This Is

Drop an 8-agent development team into any codebase:
- 4 Research agents (best practices, codebase, docs, git history)
- 4 Review agents (style, security, performance, UX/accessibility)
- `/ship-feature` autonomous workflow
- Learning system for your coding preferences

**No executives. No business strategy. Just shipping code.**

## When to Use This Template

### ✅ Use Dev Team Template for:
- Internal tools (CMS, admin panels, scripts)
- Side projects where you just want to ship features
- Client projects (dev work only, no business strategy)
- Technical components (APIs, libraries, utilities)
- Projects where coding > business decisions

### ❌ Use Full CEO Console Template for:
- Products with business strategy (SaaS, apps with users)
- Projects needing growth/marketing planning
- Projects with financial tracking (Stripe, revenue, etc.)
- Your main business ventures

## Quick Start

```bash
cd ~/code/dev-team-template
./init-dev-team.sh ~/path/to/your/project
```

## What Gets Installed

```
your-project/
├── .claude/
│   ├── agents/                    # 8 specialized agents
│   │   ├── best-practices-researcher.md
│   │   ├── codebase-analyst.md
│   │   ├── framework-docs-researcher.md
│   │   ├── git-history-analyzer.md
│   │   ├── andrew-style-reviewer.md
│   │   ├── security-sentinel.md
│   │   ├── performance-oracle.md
│   │   └── ux-reviewer.md         # NEW: UX/accessibility review
│   └── commands/
│       ├── ship-feature.md        # Autonomous feature delivery
│       └── escalate.md            # When you need to decide something
└── shared-memory/
    └── ceo-preferences.md         # Your coding style/preferences only
```

**That's it!** No executive team, no business strategy files, just the dev workflow.

## Usage

### Ship a Feature
```
/ship-feature "Add user authentication"
```

**What happens:**
1. 4 researchers work in parallel (best practices, codebase, docs, git history)
2. Present you a plan
3. You approve
4. Implementation
5. 4 reviewers check in parallel (style, security, performance, UX/accessibility)
6. Auto-fix issues
7. Tests
8. Commit
9. Ship

### The Team Learns
Every code review and feature teaches the team:
- Your coding style preferences
- Framework/library patterns you prefer
- How you structure code
- What "good" looks like for this project

After 20 features: 70% preference accuracy

## What's Different from Full CEO Console?

| Feature | Dev Team Template | Full CEO Console |
|---------|-------------------|------------------|
| `/ship-feature` | ✅ | ✅ |
| 8 Dev Agents | ✅ | ✅ (7 + optional UX) |
| Fidelity 1/2/3 | ✅ | ✅ |
| UX/Accessibility Review | ✅ | Optional |
| Product Lead | ❌ | ✅ |
| Growth Lead | ❌ | ✅ |
| Finance Advisor | ❌ | ✅ |
| Business Strategy | ❌ | ✅ |
| `/daily-standup` | ❌ | ✅ |
| `/exec-checkin` | ❌ | ✅ |
| Coding Preferences | ✅ | ✅ |

## File Structure

```
dev-team-template/
├── README.md                # This file
├── init-dev-team.sh         # Initialization script
├── .claude/
│   ├── agents/              # 8 specialized agents
│   └── commands/            # ship-feature, escalate
└── shared-memory/
    └── ceo-preferences.md   # Coding style only (template)
```

## Example: CMS Project

```bash
# You're building a CMS for content creation
cd ~/projects/curious-goat-cms
~/code/dev-team-template/init-dev-team.sh .

# Ship features
/ship-feature "Add markdown editor with preview"
/ship-feature "Add image upload with resizing"
/ship-feature "Add draft/publish workflow"

# Team learns:
# - You prefer React Server Components
# - Security is critical (content validation)
# - Performance matters (image optimization)
```

After 10 features, the team knows how YOU build CMS tools.

## Upgrading to Full CEO Console

If your project grows and needs executives:

```bash
# Backup your learnings
cp shared-memory/ceo-preferences.md shared-memory/ceo-preferences.backup.md

# Initialize full CEO Console
~/code/ceo-console-template/init-ceo-console.sh .

# Merge coding preferences back
# (The full template includes business strategy too)
```

## Requirements

- Claude Code (VSCode extension)
- Git (optional but recommended)

## Philosophy

**Keep it simple.** Not every project needs a full executive team. Sometimes you just need autonomous feature delivery with a team that learns your coding style.

**Focus on shipping.** Less overhead, more building.

---

**Created by:** Andrew Coyle
**Part of:** CEO Console family
**Version:** 1.0 (Lightweight)

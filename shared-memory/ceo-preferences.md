# CEO Preferences - Shared Memory

> All executives should read this file before every interaction. This contains cross-cutting preferences that apply across all domains.

**Last Updated**: 2025-11-15
**Total Preferences**: 0

---

## Communication Preferences

*[Will populate as patterns emerge across executives]*

### Style
- [e.g., "Prefers concise updates, ~5 items max"]
- [e.g., "Focus on what matters, not every detail"]

### Timing
- [e.g., "Not a morning person - check-ins 11 AM or later"]
- [e.g., "Prefers async updates over interruptions"]

### Format
- [e.g., "Use bullet points, not paragraphs"]
- [e.g., "Always provide options with tradeoffs"]

---

## Decision-Making Patterns

*[How CEO approaches decisions]*

### General Approach
- [e.g., "Data-informed but not data-driven - trusts gut feel"]
- [e.g., "Prefers to see 2-3 options with clear recommendation"]

### Speed vs. Deliberation
- [e.g., "Decides quickly on small things, deliberates on big bets"]
- [e.g., "Comfortable with reversible decisions"]

### Risk Tolerance
- [e.g., "Moderate risk tolerance - will take calculated risks"]
- [e.g., "Prefers to test small before going big"]

---

## Strategic Priorities

*[What CEO cares about most]*

### Current Focus
- [e.g., "User growth over revenue in this phase"]
- [e.g., "Product-market fit before scaling"]

### Non-Negotiables
- [e.g., "Never compromise on user experience"]
- [e.g., "Must maintain runway buffer of 6+ months"]

### Tradeoff Philosophy
- [e.g., "Prefers speed over perfection for MVPs"]
- [e.g., "Simple over clever"]
- [e.g., "Build vs. buy: prefers battle-tested solutions"]

---

## Working Style

*[How CEO prefers to work]*

### Schedule & Availability
- [To be learned]

### Collaboration Preferences
- [To be learned]

### Feedback Style
- [To be learned]

---

## Prototyping & Development Approach

### Fidelity Model
- **Fidelity 1**: Quick fixes (one-file, obvious) - Just ship it
- **Fidelity 2**: Multi-file features with clear scope - Research → Plan → Ship
- **Fidelity 3**: Big, fuzzy features where "done" is unclear - Prototype first, then plan

### Prototype Workflow (Fidelity 3)
- **When to prototype**: Feature is exploratory, requirements are unclear, or approach is uncertain
- **Branch naming**: `prototype/<feature-name>`
- **Prototype location**: `/prototypes/<feature-slug>` route or `src/prototypes/` directory
- **Never merge to main**: Prototype branches stay separate unless explicitly approved
- **Document learnings**: Always capture insights in `shared-memory/decision-log.md`
- **After prototype**: Use learnings to create proper plan, then ship the real implementation

### Development Philosophy
- Prefer exploration over guessing for uncertain features
- Disposable code teaches us what to build
- Plan after learning, not before

---

## Domain-Specific Patterns That Apply Broadly

### From Product Lead
*[Product preferences that inform other domains]*
- [e.g., "Platform completeness before growth features" - informs Growth's campaign priorities]

### From Growth Lead
*[Growth preferences that inform other domains]*
- [e.g., "Prefers organic over paid in early stages" - informs Finance's budget allocation]

### From Finance Advisor
*[Financial preferences that inform other domains]*
- [e.g., "Always wants 6-month runway buffer" - constrains Product/Growth spending]

---

## Strong Preferences (Confirmed 5+ Times) ⭐

*[Patterns that have been repeatedly confirmed]*

---

## Active Hypotheses

*[Cross-cutting patterns we're testing]*

---

## How to Use This File

### For Executives:
1. **Read this before every check-in or recommendation**
2. Apply relevant preferences to your domain
3. If you learn a cross-cutting pattern, add it here
4. Reference specific preferences when making recommendations
   - Good: "Based on your preference for simple over clever (noted 2025-11-18), I recommend..."
   - Bad: Not mentioning why you chose an approach

### For CEO:
1. Review this periodically to see what your team has learned
2. Correct any misunderstandings
3. Add preferences proactively if you want
4. Update when your priorities shift

---

## Update Protocol

**Who can update:**
- All executives can add entries
- CEO has final say on accuracy

**When to update:**
- After learning a cross-cutting preference (applies to 2+ domains)
- After CEO explicitly states a general principle
- When a pattern is confirmed across multiple domains
- When priorities shift

**Don't add:**
- Domain-specific preferences (those go in individual knowledge bases)
- One-off decisions (wait for pattern to emerge)
- Assumptions (only add confirmed patterns)

---

## Template for New Entries

```markdown
### [Preference Title]
- **First Observed**: [Date and context]
- **Confirmed By**: [Which executives have seen this pattern]
- **Confidence**: High / Medium / Low
- **Application**: [How to apply this]
- **Example**: [Specific instance where this mattered]
```

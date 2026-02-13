# Product Dev Team - Autonomous Agents

This directory contains specialized agents that work together to autonomously ship features.

## Team Structure

```
/ship-feature (Orchestrator)
    │
    ├─ Phase 1: PLANNING
    │   ├─ @best-practices-researcher
    │   ├─ @codebase-analyst
    │   ├─ @framework-docs-researcher
    │   └─ @git-history-analyzer
    │
    ├─ Phase 2: IMPLEMENTATION
    │   └─ Implementation Agent (orchestrator in implementation mode)
    │
    ├─ Phase 3: REVIEW
    │   ├─ @andrew-style-reviewer
    │   ├─ @security-sentinel
    │   └─ @performance-oracle
    │
    ├─ Phase 4: TESTING
    │   └─ Test Agent (orchestrator in test mode)
    │
    └─ Phase 5: DEPLOYMENT & LEARNING
        └─ Deployment Agent (orchestrator in deploy mode)
```

## How It Works

### 1. CEO Invokes: `/ship-feature "Add dark mode toggle"`

### 2. Planning Phase
The orchestrator calls 4 specialized researchers **in parallel**:

- **Best Practices Researcher**: "What are best practices for dark mode?"
  - Searches web for current patterns
  - Returns recommended approaches

- **Codebase Analyst**: "Where does this fit in our code?"
  - Explores existing structure
  - Identifies files to modify/create
  - Finds patterns to follow

- **Framework Docs Researcher**: "What do React docs say about Context?"
  - Reads official documentation
  - Extracts relevant APIs
  - Provides code examples

- **Git History Analyzer**: "How have we added settings before?"
  - Analyzes commit history
  - Identifies successful patterns
  - Flags past mistakes to avoid

The orchestrator **synthesizes** all research into a **unified plan** and presents it to the CEO.

### 3. Implementation Phase
After CEO approval, the orchestrator:
- Creates/modifies files following the plan
- Applies patterns from research
- Writes clean, well-commented code

### 4. Review Phase
The orchestrator calls 3 specialized reviewers **in parallel**:

- **Andrew Style Reviewer**: "Does this match Andrew's preferences?"
  - Reads `shared-memory/ceo-preferences.md`
  - Checks consistency with existing code
  - Flags style issues

- **Security Sentinel**: "Are there vulnerabilities?"
  - OWASP Top 10 check
  - Injection, XSS, auth issues
  - Returns critical/warning/best-practice feedback

- **Performance Oracle**: "Are there performance issues?"
  - Checks for N+1 queries, re-render issues
  - Flags algorithmic complexity problems
  - Suggests optimizations

The orchestrator **synthesizes** feedback, **auto-fixes** critical issues, and re-reviews until clean.

### 5. Testing Phase
The orchestrator:
- Runs existing tests
- Writes new tests if needed
- Reports results to CEO

### 6. Deployment & Learning
The orchestrator:
- Creates git commit
- Asks CEO about deployment
- Updates knowledge bases
- Logs lessons learned

## Agent Invocation (For Developers)

Each agent has a markdown file in this directory that serves as its "system prompt."

To invoke an agent programmatically:

```typescript
// Example: Invoke the codebase analyst
const result = await Task({
  subagent_type: "general-purpose",
  description: "Analyze codebase for feature",
  prompt: `
    Read and follow the instructions in .claude/agents/codebase-analyst.md

    Question: Where should we add a dark mode toggle in our React app?
  `
});
```

The `/ship-feature` command handles all orchestration automatically.

## Adding New Agents

To add a new specialized agent:

1. Create a markdown file: `new-agent.md`
2. Define its role, inputs, outputs, and process
3. Update `/ship-feature` to call it in the appropriate phase
4. Document it in this README

## Fidelity Levels

- **Level 1** (Not built): CEO provides all research, agents execute
- **Level 2** (Not built): Agents research when asked, CEO approves at each step
- **Level 3** (Current): Fully autonomous - agents research, implement, review, test, deploy

The current implementation is **Level 3** - fully autonomous with CEO approval only at the beginning (plan) and end (deployment).

## Philosophy

**Specialized agents** are better than monolithic ones:
- Each agent is an expert in one domain
- Parallel execution is faster
- Easier to improve individual agents
- Clear separation of concerns

**Orchestration** synthesizes specialist knowledge:
- Planning agent combines 4 research perspectives
- Review coordinator combines 3 review perspectives
- CEO gets actionable, unified output

**Learning** over time:
- Agents read from shared memory
- Agents write to knowledge bases
- Patterns compound
- Quality improves

## Future Enhancements

Potential additions:
- **Accessibility Reviewer**: WCAG compliance, screen reader testing
- **Documentation Agent**: Auto-generate docs from code
- **Cost Analyzer**: Estimate infrastructure costs for features
- **User Impact Predictor**: Estimate user value based on past features
- **Migration Planner**: For breaking changes or refactors

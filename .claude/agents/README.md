# Claude Code Agents

This directory contains specialized AI agents for the coaching platform. Each agent is a markdown file with YAML frontmatter that defines its name, tools, and model. The prompt body gives the agent domain-specific expertise.

## Agent Inventory

### Development Agents (Pre-existing)

| Agent | File | Purpose | Can Write? |
|-------|------|---------|------------|
| **backend-developer** | `backend-developer.md` | NestJS microservices development | Yes |
| **frontend-developer** | `frontend-developer.md` | React/TypeScript frontend development | Yes |

### QA Agents — Tier 1: Code-Level Quality (Static Analysis)

| Agent | File | Purpose | Can Write? |
|-------|------|---------|------------|
| **code-quality-reviewer** | `code-quality-reviewer.md` | Code standards, conventions, patterns, smells | No (read-only) |
| **translation-auditor** | `translation-auditor.md` | i18n completeness, hardcoded strings, terminology | No (read-only) |
| **security-reviewer** | `security-reviewer.md` | OWASP Top 10, auth, injection, secrets | No (read-only) |
| **api-contract-validator** | `api-contract-validator.md` | DTO integrity, gateway alignment, auth guards | Read + Bash |

### QA Agents — Tier 2: Test Generation

| Agent | File | Purpose | Can Write? |
|-------|------|---------|------------|
| **unit-test-generator** | `unit-test-generator.md` | Generate Jest tests for uncovered code | Yes |
| **e2e-scenario-builder** | `e2e-scenario-builder.md` | Create Playwright E2E tests for all roles | Yes |
| **e2e-tester** | `e2e-tester.md` | Run and maintain Playwright E2E tests | Yes |

### QA Agents — Tier 3: Live System QA (Browser-Based)

| Agent | File | Purpose | Can Write? |
|-------|------|---------|------------|
| **visual-qa-inspector** | `visual-qa-inspector.md` | Page-by-page UI verification via browser | No (read-only) |
| **accessibility-auditor** | `accessibility-auditor.md` | WCAG 2.1 AA compliance, keyboard nav, contrast | No (read-only) |

### QA Agents — Tier 4: User Journey Simulation

| Agent | File | Purpose | Can Write? |
|-------|------|---------|------------|
| **persona-coach-simulator** | `persona-coach-simulator.md` | Coach's full daily workflow (22 steps) | No (read-only) |
| **persona-client-simulator** | `persona-client-simulator.md` | Client's full experience (24 steps) | No (read-only) |
| **persona-admin-simulator** | `persona-admin-simulator.md` | Admin operations workflow (21 steps) | No (read-only) |

### QA Agents — Tier 5: Orchestration

| Agent | File | Purpose | Can Write? |
|-------|------|---------|------------|
| **qa-orchestrator** | `qa-orchestrator.md` | Coordinates all QA agents, produces release report | Yes |

## How to Use

### Running a Single Agent

Use the Claude Code Task tool to spawn any agent:

```
Task tool → subagent_type: "<agent-name>"
```

For example, to run the translation auditor:
```
Task tool:
  subagent_type: "translation-auditor"
  prompt: "Audit all frontend pages for hardcoded strings and missing translations"
```

### Running the Full QA Pipeline

Spawn the orchestrator to run the complete pipeline:
```
Task tool:
  subagent_type: "qa-orchestrator"
  prompt: "Run the full QA pipeline and produce a release readiness report"
```

The orchestrator will spawn sub-agents in the correct order and produce a consolidated report.

### Running Agents in Parallel

Independent agents can be spawned simultaneously for faster results:

```
# Parallel: Static analysis (no dependencies between these)
Task tool: subagent_type: "code-quality-reviewer"
Task tool: subagent_type: "translation-auditor"
Task tool: subagent_type: "security-reviewer"
```

### Running Persona Simulations

Persona agents use the chrome-devtools MCP to automate a browser. Prerequisites:
1. All Docker services running: `docker compose up -d`
2. Chrome browser connected via chrome-devtools MCP
3. Test accounts seeded in the database

```
# Run all three persona simulations in parallel
Task tool: subagent_type: "persona-coach-simulator"
Task tool: subagent_type: "persona-client-simulator"
Task tool: subagent_type: "persona-admin-simulator"
```

## QA Pipeline Order

```
Phase 1 (Parallel)     Phase 2          Phase 3          Phase 4
┌─────────────────┐   ┌──────────┐   ┌──────────────┐   ┌──────────┐
│ code-quality     │   │ api-     │   │ unit-test-   │   │ Docker   │
│ translation      │──>│ contract │──>│ generator    │──>│ Build    │
│ security         │   │ validator│   │              │   │          │
└─────────────────┘   └──────────┘   └──────────────┘   └──────────┘
                                                              │
                          ┌───────────────────────────────────┘
                          v
Phase 5 (Parallel)     Phase 6 (Parallel)          Phase 7
┌─────────────────┐   ┌──────────────────────┐   ┌──────────────┐
│ visual-qa        │   │ persona-coach         │   │ e2e-scenario │
│ accessibility    │   │ persona-client        │   │ builder      │
│                  │   │ persona-admin         │   │              │
└─────────────────┘   └──────────────────────┘   └──────────────┘
                                                        │
                                                        v
                                                 ┌──────────────┐
                                                 │ Consolidated │
                                                 │ QA Report    │
                                                 └──────────────┘
```

## Agent Design Principles

1. **Read-only by default**: Agents that audit or review have NO write access. Only agents that generate tests or fix code get write permissions.

2. **Domain expertise**: Each agent is a specialist — the translation auditor knows about the `t()` function bug, the code quality reviewer knows about NestJS route ordering, etc.

3. **Structured output**: Every agent produces a structured report with tables, severity levels, and an actionable summary.

4. **Platform-aware**: All agents know about the coaching platform's terminology rules, architecture, key file paths, and common gotchas.

5. **Persona-driven testing**: User journey agents simulate real people with names, behaviors, and technical comfort levels — not just page visits.

## Prerequisites

| Agent Type | Requires |
|-----------|----------|
| Static analysis (Tier 1-2) | Source code only |
| Browser-based (Tier 3-4) | Docker services + chrome-devtools MCP |
| E2E tests (Tier 2) | Docker services + Playwright installed |
| Orchestrator (Tier 5) | Everything above |

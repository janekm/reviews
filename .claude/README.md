# Claude Code Configuration

This directory contains Claude Code configuration for the Spitalfields Reviews project.

## Structure

```
.claude/
├── settings.json         # Shared team settings (hooks, env)
├── settings.local.json   # Personal settings (gitignored)
├── agents/               # Specialized AI assistants
│   └── code-reviewer.md  # Code review with project checklist
├── hooks/                # Automation scripts
│   └── typecheck.sh      # Post-edit TypeScript checking
├── skills/               # Domain knowledge documents
│   ├── convex-development/
│   │   └── SKILL.md      # Convex patterns and conventions
│   └── react-patterns/
│       └── SKILL.md      # React component patterns
└── testing/              # Before/after analysis (documentation)
```

## Skills

Skills teach Claude project-specific patterns. They activate automatically based on semantic matching.

### convex-development
Use when: Writing Convex queries, mutations, actions, or schema changes.

Key patterns:
- New function syntax with `handler`
- Return validators (always required)
- `withIndex()` over `.filter()`
- Auth checks with `getCurrentUser` and `hasMinRole`
- Activity tracking

### react-patterns
Use when: Creating React components, pages, or UI features.

Key patterns:
- Loading states with skeleton UI
- Empty states with helpful messages
- Convex hooks with "skip" pattern
- Design system classes (Golden Hour)
- Auth integration

## Agents

### code-reviewer
Invoke for structured code reviews with:
- Project-specific checklist
- Severity levels (Critical/Warning/Suggestion)
- Consistent output format

## Hooks

### typecheck.sh (PostToolUse)
Runs TypeScript checking after Edit/Write operations on `.ts`/`.tsx` files.
- Non-blocking feedback
- Shows error count immediately

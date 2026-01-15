# AFTER: Code Review Agent Test

## Test Prompt (Same as BEFORE)
"Review the recent changes to venues.ts for code quality issues"

## New State
- Code review agent at `.claude/agents/code-reviewer.md`
- Comprehensive checklist for Convex and React
- Severity classification: Critical, Warning, Suggestion
- Consistent output format

## Expected Behavior With Agent

### Structured Process
1. Agent identifies files to review
2. Applies project-specific checklist
3. Classifies issues by severity
4. Outputs in consistent format

### Output Quality

```markdown
## Code Review: convex/venues.ts

### Summary
Review of recent changes to venue CRUD operations. Code follows most patterns but has a few areas for improvement.

### Critical Issues
None found.

### Warnings
- **venues.ts:89**: Query doesn't use index for type filtering
  - Fix: Create and use `by_type` index

### Suggestions
- **venues.ts:145**: Consider extracting permission check to reusable function
- **venues.ts:167**: Activity metadata could include more context

### What's Good
- Proper auth checks in all mutations
- Clear error messages for users
- Consistent use of `returns` validators
- Activity tracking on all user actions
```

## Improved Metrics

| Metric | Before | After |
|--------|--------|-------|
| Review consistency | Low | High (templated) |
| Pattern coverage | Medium | High (checklist) |
| Severity classification | None | 3 levels |
| Actionable feedback | Variable | Consistent |
| Project-specific checks | Low | High |

## Key Benefits

1. **Consistent Format**: Same structure every review
2. **Severity Levels**: Critical vs Warning vs Suggestion
3. **Project-Specific**: Checks Convex patterns, not generic
4. **Positive Feedback**: Acknowledges good code
5. **Actionable**: Includes specific fixes
6. **Line Numbers**: Easy to locate issues

## Checklist Coverage

### Convex (Backend)
- Function syntax
- Return validators
- Index usage (critical!)
- Auth checks
- Type safety
- Activity tracking

### React (Frontend)
- Loading states
- Empty states
- Error handling
- Design system
- Auth integration

## Notes
This documents the expected state AFTER implementing the code review agent.
The agent provides structured, consistent, project-aware reviews.

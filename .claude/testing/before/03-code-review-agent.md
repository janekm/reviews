# BEFORE: Code Review Agent Test

## Test Prompt
"Review the recent changes to venues.ts for code quality issues"

## Current State
- No code review agent exists
- Reviews must be done manually by asking Claude
- No standardized checklist
- No automated severity classification

## Expected Behavior Without Agent

### Manual Process
1. User asks for code review
2. Claude reads the file(s)
3. Claude applies general programming knowledge
4. Review may miss project-specific patterns

### Potential Issues
1. **No project context** - Generic review not tailored to our patterns
2. **No severity levels** - All issues treated equally
3. **Inconsistent format** - Different review styles each time
4. **May miss Convex patterns** - .filter() vs .withIndex()
5. **May miss auth patterns** - Role checks, permission validators
6. **No checklist** - Important items may be forgotten

## Current Review Quality

When manually asking for review, Claude typically:
- Focuses on general TypeScript best practices
- May miss Convex-specific anti-patterns
- Does not follow consistent severity format
- May overlook our role-based access patterns
- Does not reference our design system for frontend code

## What a Good Review Should Check

### Convex Backend
- [ ] Uses `withIndex()` instead of `filter()`
- [ ] Has explicit `returns` validator
- [ ] Uses new function syntax with `handler`
- [ ] Includes auth checks for mutations
- [ ] Uses proper `Id<"table">` types
- [ ] Creates activity entries for user actions
- [ ] Follows index naming convention

### React Frontend
- [ ] Has loading skeleton state
- [ ] Has empty state handling
- [ ] Uses proper auth hooks
- [ ] Follows design system classes
- [ ] Has error handling with user feedback
- [ ] Uses proper Convex hook patterns

### General
- [ ] No `any` types
- [ ] Meaningful error messages
- [ ] No console.log in production code
- [ ] Consistent naming conventions

## Baseline Metrics

| Metric | Assessment |
|--------|------------|
| Review consistency | Low - varies by session |
| Pattern coverage | Medium - general only |
| Severity classification | None |
| Actionable feedback | Variable |
| Project-specific checks | Low |

## Notes
This documents the state BEFORE implementing the code review agent.

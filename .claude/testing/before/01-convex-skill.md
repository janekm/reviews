# BEFORE: Convex Development Skill Test

## Test Prompt
"Add a new Convex query to get all reviews for a specific user, ordered by most recent first, including venue name and average rating for each venue"

## Current State
- No Convex-specific skill file exists
- `convex_rules.txt` exists (665 lines) but is not in skill format
- `CLAUDE.md` mentions Convex but doesn't detail patterns
- Rules file must be manually consulted or is loaded as general context

## Expected Behavior Without Skill

### Information Discovery
1. Would need to read `convex_rules.txt` to understand patterns
2. Would need to read existing `reviews.ts` to see current patterns
3. Would need to read `schema.ts` to understand data model
4. Multiple file reads required to gather context

### Potential Issues
1. **May miss index requirement**: Query needs `by_user` index (exists)
2. **May use deprecated patterns**: e.g., `.filter()` instead of `.withIndex()`
3. **May forget return validator**: All Convex functions need explicit returns
4. **May use wrong function syntax**: Old syntax vs new `handler` syntax
5. **May not compute avgRating correctly**: Need to aggregate reviews per venue

## Simulated Response Analysis

Based on current state, Claude would likely:

### Tool Usage (Estimated)
- 1x Glob to find Convex files
- 1x Read `schema.ts` to see reviews/venues tables
- 1x Read `reviews.ts` to see existing patterns
- 1x Read `convex_rules.txt` for patterns (or might skip this)
- 1x Edit to add the new query

### Code Quality Concerns
Without the skill automatically activating, Claude might:
- Produce working code but miss project conventions
- Use correct Convex syntax but not match existing style
- Forget to add computed fields like `avgRating`
- Not follow the `reviewWithAuthorValidator` pattern

## Baseline Metrics

| Metric | Assessment |
|--------|------------|
| Files read before writing | 3-4 (schema, reviews, maybe rules) |
| Pattern adherence | Medium - may miss subtle patterns |
| Automatic activation | No - must be manually triggered |
| Context overhead | High - full rules file if loaded |
| Consistency with codebase | Variable |

## Notes
This documents the state BEFORE implementing the Convex skill.
The skill should reduce context gathering and improve pattern adherence.

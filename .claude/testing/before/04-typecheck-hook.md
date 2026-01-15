# BEFORE: Type Checking Hook Test

## Test Prompt
"Add a new optional phone field to the venues table and update the create mutation to accept it"

## Current State
- No PostToolUse hooks configured
- Type checking must be run manually
- Errors discovered late in development cycle
- No automatic validation after edits

## Expected Behavior Without Hook

### Manual Process
1. Developer makes schema change
2. Developer updates mutation
3. Developer remembers to run `bun x tsc`
4. Errors discovered, fix applied
5. Repeat until clean

### Potential Issues
1. **Forgot to run tsc** - Type errors not caught
2. **Schema/function mismatch** - Validator doesn't match schema
3. **Late discovery** - Errors found after multiple changes
4. **Context switching** - Must remember to check types

## Common Type Errors in Convex

1. **Schema vs Validator mismatch**
```typescript
// Schema
phone: v.optional(v.string()),

// Mutation - WRONG (missing optional)
args: { phone: v.string() }

// Mutation - CORRECT
args: { phone: v.optional(v.string()) }
```

2. **Return type mismatch**
```typescript
// Returns nullable but validator says required
returns: v.id("venues"),
// Should be:
returns: v.union(v.id("venues"), v.null()),
```

3. **Forgotten validator update**
```typescript
// Schema has new field, handler uses it, but validator missing
```

## Current Workflow Pain Points

| Issue | Impact |
|-------|--------|
| Manual type checking | Often forgotten |
| Late error discovery | More context to remember |
| Schema/validator sync | Easy to miss |
| Convex strict typing | Many places to update |

## Baseline Metrics

| Metric | Assessment |
|--------|------------|
| Errors caught immediately | No - manual only |
| Feedback timing | Late - when remembered |
| Development flow | Interrupted by separate check |
| Confidence in changes | Lower |

## Notes
This documents the state BEFORE implementing the type check hook.

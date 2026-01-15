# AFTER: Type Checking Hook Test

## Test Prompt (Same as BEFORE)
"Add a new optional phone field to the venues table and update the create mutation to accept it"

## New State
- PostToolUse hook configured in `.claude/settings.json`
- Type check script at `.claude/hooks/typecheck.sh`
- Runs automatically after Edit/Write operations
- Non-blocking feedback on type errors

## Expected Behavior With Hook

### Automated Process
1. Developer edits schema
   - Hook runs → "✓ Type check passed" (or errors)
2. Developer edits mutation
   - Hook runs → "⚠ Found 2 type error(s)"
3. Developer fixes errors
   - Hook runs → "✓ Type check passed"

### Immediate Feedback Loop
```
Edit: convex/schema.ts
Hook: ✓ Type check passed

Edit: convex/venues.ts (missing optional wrapper)
Hook: ⚠ Found 2 type error(s). Run 'bun x tsc' to see details.

Edit: convex/venues.ts (fixed)
Hook: ✓ Type check passed
```

## Improved Metrics

| Metric | Before | After |
|--------|--------|-------|
| Errors caught immediately | No | Yes |
| Feedback timing | Late | Instant |
| Development flow | Interrupted | Integrated |
| Confidence in changes | Lower | Higher |

## Hook Configuration

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/typecheck.sh",
            "timeout": 30000
          }
        ]
      }
    ]
  }
}
```

## Key Benefits

1. **Immediate Feedback**: Errors shown right after edit
2. **Non-Blocking**: Doesn't prevent further work
3. **Focused**: Only runs on TypeScript files
4. **Consistent**: Always happens, not forgotten
5. **Error Count**: Quick summary of issues

## Hook Behavior

| Scenario | Exit Code | Feedback |
|----------|-----------|----------|
| No TS errors | 0 | "✓ Type check passed" |
| TS errors found | 1 | "⚠ Found N type error(s)" |
| Non-TS file | 0 | (no output, skipped) |

## Convex-Specific Benefits

Convex requires strict type alignment between:
- Schema definitions
- Function argument validators
- Return type validators
- TypeScript types

The hook catches:
- Missing optional wrappers
- Schema/validator mismatches
- Return type errors
- Missing required fields

## Notes
This documents the expected state AFTER implementing the type check hook.
Immediate feedback significantly improves development flow for type-heavy Convex code.

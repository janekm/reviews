#!/bin/bash
# Type checking hook - runs after TypeScript file edits

# Get the file path from the hook event
FILE_PATH="$CLAUDE_FILE_PATH"

# Only check TypeScript files
if [[ ! "$FILE_PATH" =~ \.(ts|tsx)$ ]]; then
    exit 0
fi

# Run TypeScript compiler in check mode
OUTPUT=$(bun x tsc --noEmit 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    # Success - no type errors
    echo '{"feedback": "✓ Type check passed"}'
    exit 0
else
    # Type errors found - show them but don't block
    ERROR_COUNT=$(echo "$OUTPUT" | grep -c "error TS")
    echo "{\"feedback\": \"⚠ Found $ERROR_COUNT type error(s). Run 'bun x tsc' to see details.\"}"
    exit 1
fi

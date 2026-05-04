# context-iso skill

Runs the context-iso sandboxed agent: the model can only answer from files in the specified resource.

## How to invoke

The user will write something like:
```
/context-iso <question> --resource <path-or-url>
```

## What to do

1. Parse the question and `--resource` values from the user's input
2. Run the CLI from the project directory:

```bash
cd C:/Users/satch/Projects/contextIso && npm run ask -- "<question>" --resource <resource>
```

3. Stream the output back to the user as-is — do not summarize or reinterpret it.
   The whole point is that the answer is grounded in the files; paraphrasing it defeats that.

## Rules

- Always `cd` to the project directory before running
- Quote the question to handle spaces and special characters
- If multiple `--resource` flags are provided, pass them all
- If `--clear-cache` is the only argument, run: `npm run ask -- --clear-cache`
- If the user hasn't run `npm install` yet, do that first and tell them

## Examples

User: `/context-iso How does auth work? --resource ./my-project`
Run: `cd C:/Users/satch/Projects/contextIso && npm run ask -- "How does auth work?" --resource "C:/Users/satch/my-project"`

User: `/context-iso What is the API schema? --resource https://github.com/user/repo`
Run: `cd C:/Users/satch/Projects/contextIso && npm run ask -- "What is the API schema?" --resource https://github.com/user/repo`

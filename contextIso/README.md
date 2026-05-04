# context-iso

Sandboxed AI Q&A — the model can **only** answer from files you provide. It physically cannot retrieve information from outside the resource boundary.

## How it works

1. You point it at a local directory or git URL
2. The agent gets four tools (`read`, `grep`, `glob`, `list`) scoped to that path server-side
3. Every tool call resolves through a `basePath` guard — path traversal returns an error
4. The model must cite file path + line number for every claim
5. If the answer isn't in the files, it says so

This is the same architecture as [better-context](https://github.com/davis7dotsh/better-context) — minus the cloud VFS and multi-tenant features.

---

## Prerequisites

**Node 18+** is required. Check with `node --version`.

If you're on an older version, upgrade via:
- **Windows**: Download from [nodejs.org](https://nodejs.org) or use `nvm-windows`
- **Mac/Linux**: `nvm install 22 && nvm use 22`

**Anthropic API key** — set in your environment:
```bash
export ANTHROPIC_API_KEY=sk-ant-...
```
If you use Claude Code, this is already available in your shell.

---

## Setup

```bash
cd Projects/contextIso
npm install
```

---

## Usage

### Ask a question against a local directory
```bash
npm run ask -- "How does authentication work?" --resource ./path/to/repo
```

### Ask against a GitHub repo (cloned and cached automatically)
```bash
npm run ask -- "What does the config schema look like?" --resource https://github.com/user/repo
```

### Ask across multiple resources
```bash
npm run ask -- "How do errors propagate?" --resource ./backend --resource ./shared
```

### Clear the clone cache
```bash
npm run ask -- --clear-cache
```

---

## Sandbox guarantee

The `safePath` function in `src/tools.ts` is the enforcement layer:

```ts
const safePath = (userPath: string): string | null => {
  const resolved = path.resolve(resolvedBase, userPath);
  return resolved.startsWith(resolvedBase) ? resolved : null;
};
```

If the resolved path doesn't start with `basePath`, the tool returns an error instead of reading the file. The model never sees outside the sandbox regardless of what it asks for.

---

## Differences from better-context

| Feature | context-iso | better-context |
|---|---|---|
| Sandbox type | Real FS + path guard | In-memory VFS |
| Git clone | Automatic + cached | Automatic |
| Multi-resource | Yes (sequential) | Yes (parallel) |
| Cloud hosting | No | Yes |
| Cost | Your API key only | Subscription + API key |
| Symlink escape risk | Possible (local FS) | None (VFS) |

For personal/trusted use the path guard is sufficient. The in-memory VFS matters for multi-tenant hosted environments where a malicious repo could contain symlinks pointing outside the collection.

---

## Invoke via Claude Code skill

If you've set up the `/context-iso` skill, Claude Code will handle quoting and flags for you:

```
/context-iso How does auth work? --resource https://github.com/user/repo
```

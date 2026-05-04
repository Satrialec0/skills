import { loadResource, clearCache } from './resources.js';
import { runAgent } from './agent.js';

const USAGE = `
context-iso — sandboxed AI Q&A scoped to a single codebase or document set

Usage:
  npm run ask -- "<question>" --resource <path-or-git-url>
  npm run ask -- --clear-cache

Options:
  --resource   Local directory path or HTTPS git URL to query
  --clear-cache  Delete all cached git clones

Examples:
  npm run ask -- "How does authentication work?" --resource ./my-repo
  npm run ask -- "What does the config schema look like?" --resource https://github.com/user/repo
  npm run ask -- "How are errors handled?" --resource https://github.com/user/repo --resource ./local-docs
`.trim();

const args = process.argv.slice(2);

if (args.includes('--help') || args.length === 0) {
  console.log(USAGE);
  process.exit(0);
}

if (args.includes('--clear-cache')) {
  await clearCache();
  process.exit(0);
}

// Collect all --resource values
const resources: string[] = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--resource' && args[i + 1]) {
    resources.push(args[i + 1]);
    i++;
  }
}

if (resources.length === 0) {
  console.error('Error: --resource is required\n');
  console.log(USAGE);
  process.exit(1);
}

// Everything that isn't a flag is the question
const question = args
  .filter((a, i) => a !== '--resource' && args[i - 1] !== '--resource')
  .join(' ')
  .trim();

if (!question) {
  console.error('Error: question is required\n');
  console.log(USAGE);
  process.exit(1);
}

for (const ref of resources) {
  const { basePath, name } = await loadResource(ref);
  console.log(`\nResource: ${name}`);
  console.log(`Sandbox:  ${basePath}\n${'─'.repeat(60)}\n`);
  await runAgent(question, basePath);
}

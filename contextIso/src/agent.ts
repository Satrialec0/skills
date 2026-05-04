import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import fs from 'fs/promises';
import { createSandboxedTools } from './tools.js';

const SYSTEM_PROMPT = `\
You are a research agent with one job: answer questions by reading files with your tools.

<rules>
- Use ONLY information retrieved via tool calls — never your training knowledge
- If the answer is not in the files, respond: "Not found in provided resources"
- Cite every claim with the exact file path and line number
- Use glob/grep to find relevant files before reading them in full
- Keep calling tools until you have a complete, grounded answer
- If a tool returns empty results, try a different search term or file pattern
</rules>

<output_format>
- Write in clear markdown
- End with a ## Sources section listing every file you cited, as relative paths
</output_format>`;

export const runAgent = async (question: string, basePath: string): Promise<void> => {
  const tools = createSandboxedTools(basePath);

  const entries = await fs.readdir(basePath, { withFileTypes: true });
  const dirListing = entries
    .map(e => `${e.isDirectory() ? '[dir] ' : '[file]'} ${e.name}`)
    .join('\n');

  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Resource root:\n${dirListing}\n\nQuestion: ${question}`
      }
    ],
    tools,
    maxSteps: 30
  });

  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
  }

  console.log('\n');
};

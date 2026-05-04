import { tool } from 'ai';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

const IGNORED = ['**/.git/**', '**/node_modules/**', '**/.next/**', '**/dist/**'];

export const createSandboxedTools = (basePath: string) => {
  const resolvedBase = path.resolve(basePath);

  // Prevents path traversal — model cannot escape the sandbox
  const safePath = (userPath: string): string | null => {
    const resolved = path.resolve(resolvedBase, userPath);
    return resolved.startsWith(resolvedBase) ? resolved : null;
  };

  return {
    read: tool({
      description: 'Read a file. Returns contents with line numbers.',
      parameters: z.object({
        path: z.string().describe('File path relative to the resource root')
      }),
      execute: async ({ path: filePath }) => {
        const safe = safePath(filePath);
        if (!safe) return 'Error: path traversal not allowed';
        try {
          const content = await fs.readFile(safe, 'utf-8');
          return content
            .split('\n')
            .map((line, i) => `${String(i + 1).padStart(4)}: ${line}`)
            .join('\n');
        } catch {
          return `File not found: ${filePath}`;
        }
      }
    }),

    grep: tool({
      description: 'Search for a pattern across files. Returns matching lines with file:line.',
      parameters: z.object({
        pattern: z.string().describe('String or regex to search for'),
        fileGlob: z.string().optional().describe('Glob to filter files, e.g. "**/*.ts". Defaults to all files.')
      }),
      execute: async ({ pattern, fileGlob = '**/*' }) => {
        const files = await glob(fileGlob, { cwd: resolvedBase, nodir: true, ignore: IGNORED });
        let regex: RegExp;
        try {
          regex = new RegExp(pattern, 'i');
        } catch {
          regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        }

        const results: string[] = [];
        for (const file of files) {
          if (results.length >= 300) break;
          const safe = safePath(file);
          if (!safe) continue;
          const content = await fs.readFile(safe, 'utf-8').catch(() => '');
          content.split('\n').forEach((line, i) => {
            if (regex.test(line)) results.push(`${file}:${i + 1}: ${line.trim()}`);
          });
        }
        return results.length ? results.join('\n') : 'No matches found';
      }
    }),

    glob: tool({
      description: 'Find files matching a glob pattern. Returns a list of paths.',
      parameters: z.object({
        pattern: z.string().describe('Glob pattern, e.g. "**/*.ts", "src/**/*.json"')
      }),
      execute: async ({ pattern }) => {
        const files = await glob(pattern, { cwd: resolvedBase, nodir: true, ignore: IGNORED });
        return files.length ? files.join('\n') : 'No files matched';
      }
    }),

    list: tool({
      description: 'List directory contents.',
      parameters: z.object({
        path: z.string().optional().describe('Directory relative to resource root. Defaults to root.')
      }),
      execute: async ({ path: dirPath = '.' }) => {
        const safe = safePath(dirPath);
        if (!safe) return 'Error: path traversal not allowed';
        try {
          const entries = await fs.readdir(safe, { withFileTypes: true });
          return entries
            .map(e => `${e.isDirectory() ? '[dir] ' : '[file]'} ${e.name}`)
            .join('\n');
        } catch {
          return `Directory not found: ${dirPath}`;
        }
      }
    })
  };
};

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, '..', '.context-iso-cache');

export type Resource = {
  basePath: string;
  name: string;
};

const isGitUrl = (ref: string) =>
  ref.startsWith('http://') || ref.startsWith('https://') || ref.startsWith('git@');

const slugify = (url: string) =>
  url
    .replace(/^https?:\/\//, '')
    .replace(/\.git$/, '')
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);

export const loadResource = async (reference: string): Promise<Resource> => {
  if (!isGitUrl(reference)) {
    const resolved = path.resolve(reference);
    try {
      const stat = await fs.stat(resolved);
      if (!stat.isDirectory()) throw new Error(`Not a directory: ${reference}`);
    } catch {
      throw new Error(`Local path not found: ${reference}`);
    }
    return { basePath: resolved, name: path.basename(resolved) };
  }

  await fs.mkdir(CACHE_DIR, { recursive: true });

  const slug = slugify(reference);
  const destPath = path.join(CACHE_DIR, slug);

  try {
    await fs.access(destPath);
    console.log(`Using cached clone: ${slug}`);
  } catch {
    console.log(`Cloning ${reference} ...`);
    execSync(`git clone --depth 1 "${reference}" "${destPath}"`, { stdio: 'inherit' });
    console.log('Clone complete.\n');
  }

  return { basePath: destPath, name: slug };
};

export const clearCache = async () => {
  await fs.rm(CACHE_DIR, { recursive: true, force: true });
  console.log('Cache cleared.');
};

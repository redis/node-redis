import { promises as fs } from 'node:fs';
import path from 'node:path';

const REGISTRY_FILES = [
  'packages/client/lib/commands/index.ts',
  'packages/json/lib/commands/index.ts',
  'packages/search/lib/commands/index.ts',
  'packages/time-series/lib/commands/index.ts',
  'packages/bloom/lib/commands/bloom/index.ts',
  'packages/bloom/lib/commands/count-min-sketch/index.ts',
  'packages/bloom/lib/commands/cuckoo/index.ts',
  'packages/bloom/lib/commands/t-digest/index.ts',
  'packages/bloom/lib/commands/top-k/index.ts'
] as const;

const SHORTHAND_PROPERTY = /^[A-Za-z_$][A-Za-z0-9_$]*(?:,\s*)?$/;
const ALIAS_PROPERTY = /^[A-Za-z_$][A-Za-z0-9_$]*\s*:\s*[A-Za-z_$][A-Za-z0-9_$]*(?:,\s*)?$/;
const CLOSING_EXPORT_OBJECT = /^}\s*(?:as const\b.*)?;?\s*$/;

type Issue = {
  file: string;
  line: number;
  entry: string;
};

function isCommandEntryLine(trimmed: string): boolean {
  return SHORTHAND_PROPERTY.test(trimmed) || ALIAS_PROPERTY.test(trimmed);
}

async function checkRegistry(filePath: string): Promise<Issue[]> {
  const text = await fs.readFile(filePath, 'utf8');
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const issues: Issue[] = [];

  let inExportObject = false;
  let inJsDoc = false;
  let pendingJsDocEndLine: number | null = null;

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!inExportObject) {
      if (trimmed.includes('export default {')) {
        inExportObject = true;
        pendingJsDocEndLine = null;
      }
      continue;
    }

    if (inJsDoc) {
      if (trimmed.includes('*/')) {
        inJsDoc = false;
        pendingJsDocEndLine = index;
      }
      continue;
    }

    if (trimmed.startsWith('/**')) {
      if (trimmed.includes('*/')) {
        pendingJsDocEndLine = index;
      } else {
        inJsDoc = true;
      }
      continue;
    }

    if (CLOSING_EXPORT_OBJECT.test(trimmed)) {
      break;
    }

    if (
      trimmed === '' ||
      trimmed.startsWith('//') ||
      trimmed.startsWith('/*') ||
      trimmed.startsWith('*') ||
      trimmed.startsWith('...')
    ) {
      continue;
    }

    if (!isCommandEntryLine(trimmed)) {
      continue;
    }

    const hasAttachedJsDoc = pendingJsDocEndLine !== null &&
      lines.slice(pendingJsDocEndLine + 1, index).every(between => between.trim() === '');

    if (!hasAttachedJsDoc) {
      issues.push({
        file: filePath,
        line: index + 1,
        entry: trimmed
      });
    }

    pendingJsDocEndLine = null;
  }

  return issues;
}

async function main(): Promise<void> {
  const cwd = process.cwd();
  const allIssues: Issue[] = [];

  for (const relativePath of REGISTRY_FILES) {
    const absolutePath = path.join(cwd, relativePath);
    const issues = await checkRegistry(absolutePath);
    allIssues.push(...issues.map(issue => ({
      ...issue,
      file: relativePath
    })));
  }

  if (allIssues.length === 0) {
    console.log('Command registry JSDoc check passed.');
    return;
  }

  console.error('Missing JSDoc for command registry entries:');
  for (const issue of allIssues) {
    console.error(`- ${issue.file}:${issue.line} -> ${issue.entry}`);
  }

  process.exitCode = 1;
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

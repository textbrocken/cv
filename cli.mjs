#!/usr/bin/env node

import meow from 'meow';
import JSON5 from 'json5';
import fs from 'fs';
import path from 'path';
import { inspect } from 'util';
import open from 'open';
import { parseMarkdownCV } from './lib/parse.js';
import { render } from './lib/render.js';

async function getStdin() {
  if (process.stdin.isTTY) return '';
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

const BANNER = `
_____ ____ _  _ ___ ___  ____ ____ ____ _  _ ____ _  _   / ____ _  _ 
   |  |___  \\/   |  |__] |__/ |  | |    |_/  |___ |\\ |  /  |    |  | 
@  |  |___ _/\\_  |  |__] |  \\ |__| |___ | \\_ |___ | \\| /   |___  \\/
`.trim();

const DONE = `
___  ____ _  _ ____ 
|  \\ |  | |\\ | |___ 
|__/ |__| | \\| |___
`.trim();

const trim = (s, len = 16) => s?.length > len ? s.slice(0, len) + '…' : s;

function summarize(data) {
  return {
    header: trim(data.header),
    basics: data.basics?.length + ' lines',
    body: data.body?.map(s => ({
      header: trim(s.header),
      sections: s.sections?.map(item => trim(item.prefix))
    })),
    salutation: trim(data.salutation)
  };
}

/**
 * Parse input content based on format detection.
 * Supports: Markdown (with YAML frontmatter), JSON5/JSON
 */
function parseInput(content, filename = '') {
  const ext = filename ? path.extname(filename).toLowerCase() : '';
  
  // Detect markdown by extension or frontmatter
  if (ext === '.md' || ext === '.markdown' || content.trimStart().startsWith('---\n')) {
    return parseMarkdownCV(content);
  }
  
  // JSON5 (superset of JSON)
  try {
    return JSON5.parse(content);
  } catch (e) {
    console.error('❌ Failed to parse input as JSON5');
    console.error('   ' + e.message);
    process.exit(1);
  }
}

const cli = meow(`
  Usage
    $ npx @textbrocken/cv -i <input file name> -o <output file name>

  Options
    -i, --input,      Input file: Markdown (.md) or JSON5 (.json5)
    -o, --output      Output PDF file (defaults to input file name with .pdf extension)
    -v, --verbose     Log verbosely (default false)
    -q, --quiet       Log nothing (default false)
    -a, --auto-open   Open PDF file in PDF viewer (default true)

  Examples
    $ npx @textbrocken/cv -i cv.md -o cv.pdf
    $ npx @textbrocken/cv -i cv.json5
`, {
  importMeta: import.meta,
  flags: {
    input: {
        type: 'string',
        shortFlag: 'i'
    },
    output: {
      type: 'string',
      shortFlag: 'o'
    },
    verbose: {
      shortFlag: 'v',
      type: 'boolean',
      default: false
    },
    quiet: {
      shortFlag: 'q',
      type: 'boolean',
      default: false
    },
    'autoOpen': {
      shortFlag: 'a',
      type: 'boolean',
      default: true
    },
    help: {
      shortFlag: 'h',
      type: 'boolean'
    }
}
});

global.logVerbose = cli.flags.verbose;
global.logNothing = cli.flags.quiet;

global.logNothing || console.log(BANNER + '\n');

const stdin = await getStdin();
const inputFile = cli.flags.input;

// Validate file extension before reading
if (inputFile) {
  const ext = path.extname(inputFile).toLowerCase();
  const validExtensions = ['.md', '.markdown', '.json5', '.json'];
  if (ext && !validExtensions.includes(ext)) {
    console.error(`❌ Unsupported file format "${ext}"`);
    console.error(`   Supported: ${validExtensions.join(', ')}`);
    process.exit(1);
  }
}

const inputContent = stdin || (inputFile && fs.readFileSync(inputFile, 'utf8'));

if (!inputContent) {
  console.log('❌ No input found, call with --help to learn more');
  process.exit(1);
}

global.logVerbose && console.log('⚙️  flags:', {
  input: cli.flags.input,
  output: cli.flags.output || '(auto)',
  autoOpen: cli.flags.autoOpen
});

const inputData = parseInput(inputContent, inputFile || '');
global.logVerbose && console.log('📄 parsed:', inspect(summarize(inputData), { depth: 4, colors: true }));

const outFile = path.resolve(
  cli.flags.output ||
  (inputFile
    ? path.parse(inputFile).name + '.pdf'
    : `letter-${Date.now().toString()}.pdf`)
);

global.logVerbose && console.log('📁 output:', outFile);

await render(inputData, outFile);
cli.flags.autoOpen && await open(outFile, {wait: false});
global.logNothing || console.log(DONE);

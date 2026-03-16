# Copilot Instructions

This is a CLI tool that generates PDF documents (CVs/letters) from Markdown or JSON5 configuration files, following the German DIN 5008 standard.

## Commands

```bash
# Run the CLI with a Markdown file (recommended)
npx @textbrocken/cv -i examples/text.md

# Also supports JSON5
npx @textbrocken/cv -i examples/text.json5

# Pipe input via stdin
cat examples/text.md | npx @textbrocken/cv

# CLI options
-i, --input     Input file (.md or .json5)
-o, --output    Output PDF file (defaults to input name + .pdf)
-q, --quiet     Suppress output
-a, --auto-open Open PDF after generation (default: true)
```

There are no test or lint commands configured.

## Architecture

Pure ESM module (`"type": "module"` in package.json). Requires Node.js >= 22.

**Pipeline flow:** `cli.mjs` → `lib/parse.js` → `lib/render.js`

1. **cli.mjs** - Entry point. Parses CLI args (meow), detects input format, orchestrates the pipeline
2. **lib/parse.js** - Parses Markdown with YAML frontmatter into the internal data structure
3. **lib/hyphenate.js** - German hyphenation using the `hyphen` library
4. **lib/typeset.js** - Typography fixes (German quotes, dashes, ellipses)
5. **lib/render.js** - Renders PDF using @react-pdf/renderer:
   - Applies typeset fixes then German hyphenation
   - Parses inline Markdown (bold, italic, bullet lists)
   - Uses Cinzel (headers) and KpRoman (body) fonts from `fonts/`
   - Supports multi-page documents with orphan protection for section headers

## Input Format (Markdown)

The preferred input format is Markdown with YAML frontmatter:

```markdown
---
meta:
  hyphenate: true       # German hyphenation (default: true)
  fixTypesetting: true  # Typography fixes (default: true)
  date: "1. März 2026"  # Custom date (default: today)
header: Lebenslauf
salutation: Name
---

**Name**                          # basics (one per line)
Address line

## Section Header                 # body section

### Date/Prefix                   # item with prefix
Elaboration with *markdown*...
- Bullet points work
```

## Conventions

- Text fields support Markdown syntax (bold, italic, bullet lists)
- German typography: `"quotes"` → „quotes", `--` → –, `...` → … (disable with `meta.fixTypesetting: false`)
- German hyphenation enabled by default (disable with `meta.hyphenate: false`)
- OpenType features (`onum`, `liga`) for oldstyle numerals and ligatures
- Logging globals: `global.logVerbose` and `global.logNothing`

## Dependencies

Key dependencies (~30MB node_modules, no browser/Chrome):
- `@react-pdf/renderer` + `react` - PDF generation
- `hyphen` - German hyphenation patterns
- `meow` - CLI argument parsing
- `json5` - Input parsing

## Patches

The `scripts/patch-react-pdf.cjs` postinstall script patches @react-pdf to support OpenType font features via `style.features`. It runs automatically on `npm install`.

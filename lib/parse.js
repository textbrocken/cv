import yaml from 'js-yaml';

/**
 * Parse markdown with YAML frontmatter into the CV data structure.
 * 
 * Format:
 * ---
 * meta: { ... }
 * header: "Title"
 * salutation: "Name"
 * ---
 * 
 * Intro lines (become `basics`)
 * 
 * ## Section Header
 * 
 * ### Prefix (e.g., date range)
 * Elaboration content with markdown...
 */
export function parseMarkdownCV(content) {
  // Extract frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!frontmatterMatch) {
    throw new Error('Invalid format: missing YAML frontmatter (---\\n...\\n---)');
  }

  const frontmatter = yaml.load(frontmatterMatch[1]);
  const markdown = frontmatterMatch[2].trim();

  // Split into sections by ## headers
  const sectionRegex = /^## (.+)$/gm;
  const sections = [];
  let basicsContent = '';
  let match;

  // Find all ## headers
  const matches = [];
  while ((match = sectionRegex.exec(markdown)) !== null) {
    matches.push({ header: match[1], index: match.index, end: match.index + match[0].length });
  }

  if (matches.length === 0) {
    // No sections, everything is basics
    basicsContent = markdown;
  } else {
    // Content before first ## is basics
    basicsContent = markdown.slice(0, matches[0].index).trim();

    // Extract each section
    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].end;
      const end = i + 1 < matches.length ? matches[i + 1].index : markdown.length;
      const sectionContent = markdown.slice(start, end).trim();

      sections.push({
        header: matches[i].header,
        sections: parseItems(sectionContent),
      });
    }
  }

  // Parse basics: each non-empty line becomes an item
  const basics = basicsContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  return {
    meta: frontmatter.meta || {},
    header: frontmatter.header || 'CV',
    basics,
    body: sections,
    salutation: frontmatter.salutation || '',
  };
}

/**
 * Parse section content into items (prefix/elaboration pairs).
 * Each ### header starts a new item with the header as prefix.
 */
function parseItems(content) {
  const itemRegex = /^### (.+)$/gm;
  const items = [];
  let match;

  // Find all ### headers
  const matches = [];
  while ((match = itemRegex.exec(content)) !== null) {
    matches.push({ prefix: match[1], index: match.index, end: match.index + match[0].length });
  }

  if (matches.length === 0) {
    // No items with prefix, treat entire content as single item without prefix
    if (content.trim()) {
      items.push({ prefix: '', elaboration: content.trim() });
    }
    return items;
  }

  // Content before first ### (if any) becomes item without prefix
  const preamble = content.slice(0, matches[0].index).trim();
  if (preamble) {
    items.push({ prefix: '', elaboration: preamble });
  }

  // Extract each item
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].end;
    const end = i + 1 < matches.length ? matches[i + 1].index : content.length;
    const elaboration = content.slice(start, end).trim();

    items.push({
      prefix: matches[i].prefix,
      elaboration,
    });
  }

  return items;
}

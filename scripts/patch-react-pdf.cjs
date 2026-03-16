#!/usr/bin/env node

/**
 * Patches @react-pdf to support OpenType font features (e.g., 'onum' for oldstyle numerals).
 * 
 * React-pdf's textkit supports features internally but doesn't expose them through styles.
 * This script patches the layout and textkit modules to wire features through.
 * 
 * Run automatically via npm postinstall, or manually: node scripts/patch-react-pdf.js
 */

const fs = require('fs');
const path = require('path');

const LAYOUT_PATH = path.join(__dirname, '../node_modules/@react-pdf/layout/lib/index.js');
const TEXTKIT_PATH = path.join(__dirname, '../node_modules/@react-pdf/textkit/lib/textkit.js');

function patchFile(filePath, patches) {
  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  Skipping ${path.basename(filePath)} (not found)`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let patched = false;

  for (const { find, replace, description } of patches) {
    if (content.includes(replace)) {
      console.log(`✓  ${description} (already applied)`);
      continue;
    }
    if (!content.includes(find)) {
      console.log(`⚠️  ${description} (pattern not found - react-pdf may have updated)`);
      continue;
    }
    content = content.replace(find, replace);
    patched = true;
    console.log(`✓  ${description}`);
  }

  if (patched) {
    fs.writeFileSync(filePath, content);
  }
  return patched;
}

console.log('Patching @react-pdf for OpenType features support...\n');

// Patch 1: @react-pdf/layout - add features to style destructuring and attributes (two locations)
patchFile(LAYOUT_PATH, [
  {
    find: "const { fill = 'black', fontFamily = 'Helvetica', fontWeight, fontStyle, fontSize = 18, textDecorationColor, textDecorationStyle, textTransform, opacity, } = instance.props;",
    replace: "const { fill = 'black', fontFamily = 'Helvetica', fontWeight, fontStyle, fontSize = 18, textDecorationColor, textDecorationStyle, textTransform, opacity, features, } = instance.props;",
    description: 'layout/index.js: Add features to props destructuring (SVG text)',
  },
  {
    find: 'strikeColor: textDecorationColor || fill,\n    };',
    replace: 'strikeColor: textDecorationColor || fill,\n        features: features || [],\n    };',
    description: 'layout/index.js: Add features to attributes object (SVG text)',
  },
  {
    find: "const { color = 'black', direction = 'ltr', fontFamily = 'Helvetica', fontWeight, fontStyle, fontSize = 18, textAlign, lineHeight, textDecoration, textDecorationColor, textDecorationStyle, textTransform, letterSpacing, textIndent, opacity, verticalAlign, } = instance.style;",
    replace: "const { color = 'black', direction = 'ltr', fontFamily = 'Helvetica', fontWeight, fontStyle, fontSize = 18, textAlign, lineHeight, textDecoration, textDecorationColor, textDecorationStyle, textTransform, letterSpacing, textIndent, opacity, verticalAlign, features, } = instance.style;",
    description: 'layout/index.js: Add features to style destructuring (Text)',
  },
  {
    find: "align: textAlign || (direction === 'rtl' ? 'right' : 'left'),\n    };",
    replace: "align: textAlign || (direction === 'rtl' ? 'right' : 'left'),\n        features: features || [],\n    };",
    description: 'layout/index.js: Add features to attributes object (Text)',
  },
]);

// Patch 2: @react-pdf/textkit - pass features to fontkit layout
patchFile(TEXTKIT_PATH, [
  {
    find: "const glyphRun = font[0].layout(runString, undefined, undefined, undefined, 'ltr');",
    replace: "const glyphRun = font[0].layout(runString, attributes.features, undefined, undefined, 'ltr');",
    description: 'textkit/textkit.js: Pass features to fontkit layout',
  },
]);

console.log('\nDone!');

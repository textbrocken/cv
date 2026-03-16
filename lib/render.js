import React from 'react';
import path from 'path';
import { fileURLToPath } from 'url';
import { Document, Page, Text, View, Font, StyleSheet, renderToFile } from '@react-pdf/renderer';
import { hyphenate } from './hyphenate.js';
import { typeset } from './typeset.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

Font.register({
  family: 'Cinzel',
  src: path.join(__dirname, '../fonts/Cinzel/Cinzel-VariableFont_wght.ttf'),
});

Font.register({
  family: 'KpRoman',
  fonts: [
    { src: path.join(__dirname, '../fonts/Kp-fonts/KpRoman-Regular.otf'), fontWeight: 'normal' },
    { src: path.join(__dirname, '../fonts/Kp-fonts/KpRoman-Semibold.otf'), fontWeight: 'semibold' },
    { src: path.join(__dirname, '../fonts/Kp-fonts/KpRoman-Italic.otf'), fontWeight: 'normal', fontStyle: 'italic' },
  ],
});

Font.registerHyphenationCallback(word => [word]);

const mm = (val) => val * 2.83465;

const onum = { onum: true, liga: true };

const styles = StyleSheet.create({
  page: { 
    paddingTop: mm(20), paddingBottom: mm(25), paddingRight: mm(20), paddingLeft: mm(25),
    fontFamily: 'KpRoman', fontSize: 11, lineHeight: 1.4,
  },
  headerBox: { height: mm(25) },
  headerText: { fontFamily: 'Cinzel', fontSize: 14, features: onum },
  basics: { marginBottom: mm(8) },
  basicsItem: { marginBottom: 1, features: onum },
  sectionHeader: { fontFamily: 'Cinzel', fontSize: 12, marginTop: mm(6), marginBottom: mm(3), features: onum },
  item: { flexDirection: 'row', marginBottom: mm(2) },
  prefix: { width: '25%', paddingRight: mm(4), features: onum },
  elab: { flex: 1 },
  elabText: { features: onum },
  bulletList: { marginLeft: mm(3), marginTop: mm(1) },
  bulletItem: { flexDirection: 'row', marginBottom: mm(0.5) },
  bullet: { width: mm(4) },
  bulletText: { flex: 1, features: onum },
  bold: { fontWeight: 'semibold', features: onum },
  italic: { fontStyle: 'italic', features: onum },
  salutation: { marginTop: mm(10), features: onum },
});

function parseInline(text) {
  if (!text || typeof text !== 'string') return text;
  
  const parts = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let lastIndex = 0;
  let match;
  let key = 0;
  
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      parts.push(React.createElement(Text, { key: key++, style: styles.bold }, match[2]));
    } else if (match[3]) {
      parts.push(React.createElement(Text, { key: key++, style: styles.italic }, match[3]));
    }
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  
  return parts.length > 0 ? parts : text;
}

function parseElaboration(text, shouldHyphenate, shouldTypeset) {
  if (!text) return null;
  if (shouldTypeset) text = typeset(text);
  if (shouldHyphenate) text = hyphenate(text);
  
  const lines = text.split('\n');
  const elements = [];
  let bullets = [];
  let key = 0;
  
  const flushBullets = () => {
    if (bullets.length > 0) {
      elements.push(
        React.createElement(View, { key: 'bl' + key++, style: styles.bulletList },
          bullets.map((b, i) => 
            React.createElement(View, { key: i, style: styles.bulletItem },
              React.createElement(Text, { style: styles.bullet }, '•'),
              React.createElement(Text, { style: styles.bulletText }, parseInline(b))
            )
          )
        )
      );
      bullets = [];
    }
  };
  
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith('- ')) {
      bullets.push(t.slice(2));
    } else if (t) {
      flushBullets();
      elements.push(React.createElement(Text, { key: 'p' + key++, style: styles.elabText }, parseInline(t)));
    }
  }
  flushBullets();
  
  return elements;
}

export async function render(data, outFile) {
  const { header, basics, body, salutation, meta } = data;
  const shouldHyphenate = meta?.hyphenate !== false;
  const shouldTypeset = meta?.fixTypesetting !== false;
  
  const process = (text) => {
    if (shouldTypeset) text = typeset(text);
    if (shouldHyphenate) text = hyphenate(text);
    return text;
  };
  
  const currentDate = meta?.date || new Date().toLocaleDateString('de-DE', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const content = [];
  
  // Header
  content.push(
    React.createElement(View, { key: 'h', style: styles.headerBox },
      React.createElement(Text, { style: styles.headerText }, header || 'CV')
    )
  );
  
  // Basics
  content.push(
    React.createElement(View, { key: 'basics', style: styles.basics },
      (basics || []).map((b, i) => 
        React.createElement(Text, { key: i, style: styles.basicsItem }, parseInline(process(b)))
      )
    )
  );
  
  // Body
  (body || []).forEach((section, si) => {
    const h = process(section.header);
    const sectionContent = [];
    sectionContent.push(React.createElement(Text, { key: 'sh', style: styles.sectionHeader }, h));
    
    (section.sections || []).forEach((item, ii) => {
      sectionContent.push(
        React.createElement(View, { key: 'it'+ii, style: styles.item, wrap: false },
          React.createElement(Text, { style: styles.prefix }, item.prefix || ''),
          React.createElement(View, { style: styles.elab },
            parseElaboration(item.elaboration, shouldHyphenate, shouldTypeset)
          )
        )
      );
    });
    
    content.push(
      React.createElement(View, { key: 'sec'+si, wrap: false, minPresenceAhead: 50 },
        sectionContent[0],
        sectionContent[1]
      )
    );
    for (let i = 2; i < sectionContent.length; i++) {
      content.push(React.createElement(View, { key: 'sec'+si+'-'+i }, sectionContent[i]));
    }
  });
  
  // Salutation
  content.push(
    React.createElement(Text, { key: 'sal', style: styles.salutation }, 
      `${salutation}, ${currentDate}`)
  );

  const doc = React.createElement(Document, null,
    React.createElement(Page, { size: 'A4', style: styles.page }, content)
  );

  await renderToFile(doc, outFile);
  global.logNothing || console.log('✅ Written to ' + outFile);
}

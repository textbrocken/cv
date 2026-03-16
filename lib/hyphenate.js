import pkg from 'hyphen/de/index.js';
const { hyphenateSync } = pkg;

export function hyphenate(text) {
  return hyphenateSync(text);
}

// Typography fixes for German text
// Based on https://www.npmjs.com/package/typeset

function fixQuotes(text) {
  text = text
    .replace(/(\W|^)"([^\s!?:;.,‽»])/g, '$1\u201e$2') // beginning "
    .replace(/(\u201c[^"]*)"([^"]*$|[^\u201c"]*\u201c)/g, '$1\u201c$2') // ending "
    .replace(/([^0-9])"/g, '$1\u201c') // remaining " at end of word
    .replace(/(\W|^)'(\S)/g, '$1\u201a$2') // beginning '
    .replace(/([a-z])'([a-z])/gi, '$1\u2019$2') // conjunction's possession
    .replace(/((\u2018[^']*)|[a-z])'([^0-9]|$)/gi, '$1\u2018$3') // ending '
    .replace(
      /(\u2018)([0-9]{2}[^\u2019]*)(\u2018([^0-9]|$)|$|\u2019[a-z])/gi,
      '\u2019$2$3'
    ) // abbrev. years like '93
    .replace(
      /(\B|^)\u2018(?=([^\u2019]*\u2019\b)*([^\u2019\u2018]*\W[\u2019\u2018]\b|[^\u2019\u2018]*$))/gi,
      '$1\u2019'
    ) // backwards apostrophe
    .replace(/'''/g, '\u2034') // triple prime
    .replace(/("|'')/g, '\u2033') // double prime
    .replace(/'/g, '\u2032');

  // Allow escaped quotes
  text = text.replace(/\\"/g, '"');
  text = text.replace(/\\'/g, "'");

  return text;
}

function fixPunctuation(text) {
  // Dashes
  text = text.replace(/--/g, '–');
  text = text.replace(/ – /g, '\u2009—\u2009'); // thin space + em dash
  text = text.replace(/ - /g, ' – ');

  // Ellipses
  text = text.replace(/\.\.\./g, '…');

  // Nbsp for punctuation with spaces
  const NBSP = '\u00A0';
  text = text.replace(/([«¿¡]) /g, '$1' + NBSP);
  text = text.replace(/ ([!?:;.,‽»])/g, NBSP + '$1');

  return text;
}

export function typeset(text) {
  return fixPunctuation(fixQuotes(text));
}

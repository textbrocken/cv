# Professioneller Lebenslauf per Markdown

Erzeugt PDF-Dateien aus Markdown oder JSON5. Zum Beispiel aus [dieser Markdown-Datei](./examples/text.md).

Verwendet professionelle Schriften (Cinzel, KpRoman) mit Mediävalziffern und Ligaturen.

## Voraussetzungen

- Node.js >= 22

## Ausführen

```bash
# Mit Markdown-Datei (empfohlen)
npx @textbrocken/cv -i lebenslauf.md

# Mit JSON5
npx @textbrocken/cv -i lebenslauf.json5

# Via stdin
cat lebenslauf.md | npx @textbrocken/cv
```

## Markdown-Format

```markdown
---
meta:
  hyphenate: true
header: Lebenslauf
salutation: Max Mustermann
---

**Max Mustermann**
Musterstraße 1, 12345 Musterstadt
max@example.com

## Berufserfahrung

### 2020–2024
**Senior Developer** bei Beispiel GmbH
- Entwicklung von Webanwendungen
- Teamleitung

### 2018–2020
**Junior Developer** bei Startup AG

## Ausbildung

### 2014–2018
Studium der Informatik, TU Musterstadt
```

## Datenstruktur

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `header` | String | Überschrift des Dokuments |
| `salutation` | String | Name für die Unterschrift |
| `basics` | Array | Persönliche Daten (vor dem ersten `##`) |
| `body` | Array | Sektionen mit `header` und `sections` |
| `body[].header` | String | Sektionsüberschrift (`## ...`) |
| `body[].sections` | Array | Items mit `prefix` und `elaboration` |

## Meta-Optionen

| Feld | Typ | Beschreibung | Default |
|------|-----|--------------|---------|
| `meta.date` | String | Datum für Unterschrift (z.B. `"1. März 2026"`) | Heute |
| `meta.hyphenate` | Boolean | Deutsche Silbentrennung | `true` |
| `meta.fixTypesetting` | Boolean | Typographische Korrekturen (Anführungszeichen, Bindestriche, Ellipsen) | `true` |

## CLI-Optionen

| Option | Beschreibung |
|--------|--------------|
| `-i, --input` | Eingabedatei (Markdown oder JSON5) |
| `-o, --output` | Ausgabe-PDF (Standard: Eingabename + `.pdf`) |
| `-v, --verbose` | Ausführliche Ausgabe |
| `-q, --quiet` | Keine Ausgabe |
| `-a, --auto-open` | PDF nach Erstellung öffnen (Standard: `true`) |

## Features

- **Deutsche Typographie**: Automatische Umwandlung von `"Anführungszeichen"` → „Anführungszeichen", `--` → –, `...` → …
- **Silbentrennung**: Deutsche Silbentrennung für sauberen Blocksatz
- **Mediävalziffern**: Zahlen im klassischen Stil (3, 4, 5, 7, 9 mit Unterlängen)
- **Markdown**: Fett, kursiv und Aufzählungen im Text
- **Mehrseitige Dokumente**: Automatische Seitenumbrüche mit Schutz vor verwaisten Überschriften

# Deadline Tracker: Anleitung für Claude

Diese Datei liest Claude (Claude Code, Cowork oder Chat) zuerst, wenn er in diesem Ordner arbeitet. Sie gilt auf jedem Rechner, auf dem das Repo geklont wird.

## Was das Projekt ist

Ein persönlicher Planer von Fritz. Er zeigt Events und Termine, zu jedem Event gibt es Unteraufgaben mit Deadline und Stundenaufwand. Die Seite rechnet daraus live aus:

- wie viele Tage es noch bis zum Event sind (Countdown, Events lassen sich anpinnen),
- wie viel Arbeit noch offen ist,
- bis wann welche Aufgabe erledigt sein sollte (Planvorschlag),
- welche Aufgaben die Deadline nicht mehr schaffen ("zu eng").

Ansichten: Tag (Zeitleiste), Woche, Monat, Board. Das Design ist dem Tagesplaner Structured nachempfunden.

Technisch ist es bewusst einfach: reines HTML, CSS und JavaScript. Kein Build, kein npm, keine Abhängigkeiten.

## Dateien

| Datei | Zweck |
|---|---|
| `data.json` | Die Daten. Das ist die einzige Wahrheit für Events und Aufgaben. |
| `index.html` | Seitengerüst und Dialoge |
| `styles.css` | Das komplette Design |
| `app.js` | Logik, Planung, Rendering, Laden und Speichern |
| `tools/check.py` | Prüft `data.json` und simuliert den Plan wie `app.js` |
| `docs/design-system.md` | Verbindliche Design-Regeln (Farben, Radien, Schrift) |
| `docs/bar.md` | Warum das Design so ist (Analyse der Vorlage Structured) |

## Starten

Im Projektordner:

```bash
python3 -m http.server 8000
```

Dann `http://localhost:8000` öffnen. Ein Doppelklick auf `index.html` reicht nicht, weil der Browser dann `data.json` nicht laden darf. Die Seite zeigt in dem Fall einen Hinweis.

## Datenmodell (`data.json`)

```json
{
  "settings": { "hoursPerDay": 4, "bufferDays": 2, "weekends": false },
  "events": [
    {
      "id": "ev1",
      "title": "Kurs-Launch",
      "date": "2026-11-20",
      "time": "14:00",
      "pinned": true,
      "color": "#5B7FA6",
      "tasks": [
        {
          "id": "t1",
          "title": "Landingpage fertigstellen",
          "hours": 3,
          "due": "2026-11-06",
          "day": "2026-10-26",
          "status": "doing",
          "notes": "Texte aus dem Entwurf übernehmen, Bilder komprimieren"
        }
      ]
    }
  ]
}
```

Regeln:

- Datumsformat immer `YYYY-MM-DD`, Uhrzeit `HH:MM`. `time` ist optional (ohne Uhrzeit ist das Event ganztägig).
- `id` muss eindeutig sein. Events: `ev1`, `ev2` ... Aufgaben: `t1`, `t2` ... **über alle Events hinweg** eindeutig. Neue IDs bekommen die nächste freie Nummer.
- `status` ist `open`, `doing` oder `done`.
- `hours` ist der geschätzte Aufwand in Stunden (Dezimalzahl, z.B. 0.5).
- `due` ist die Deadline der Aufgabe. Fehlt sie, gilt Event-Datum minus `bufferDays`.
- `day` ist optional und bedeutet: Fritz hat die Aufgabe fest auf diesen Tag gelegt. Ohne `day` plant die Seite selbst.
- `notes` ist optional und beschreibt, was genau zu tun ist.
- `color` ist ein Hex-Wert aus der Palette in `docs/design-system.md` (gedämpfte Kategoriefarben, nie Koralle).
- `settings.weekends: true` heißt, am Wochenende wird auch gearbeitet.

## So plant die Seite (und `tools/check.py`)

1. Aufgaben mit `day` kommen zuerst, ab diesem Tag, solange Tageskapazität (`hoursPerDay`) frei ist. Was nicht passt, läuft auf die nächsten Arbeitstage über.
2. Alle anderen offenen Aufgaben werden nach frühester Deadline einsortiert (bei gleicher Deadline zuerst `doing`, dann Event-Reihenfolge). Gerechnet wird vorwärts ab heute.
3. Endet der Plan einer Aufgabe nach ihrer Deadline, gilt sie als "zu eng".

Wenn du die Logik in `app.js` (`plan()`) änderst, ändere `tools/check.py` mit.

## Arbeitsablauf bei neuen To-dos

So gehst du vor, wenn Fritz sagt "ich habe ein neues Event / eine neue Aufgabe":

1. **Lies `data.json`** und starte `python3 tools/check.py`, damit du den aktuellen Stand und die Auslastung kennst.
2. **Frage nach, was fehlt**, aber knapp (höchstens 3 Fragen auf einmal): Was ist das Ziel? Bis wann? Gibt es eine Uhrzeit? Was ist schon fertig? Fritz arbeitet am liebsten im Gespräch, also lieber kurz nachfragen als raten.
3. **Zerlege die Arbeit in Unteraufgaben.** Jede Aufgabe hat ein konkretes Verb und dauert 0,5 bis 4 Stunden. Größere Brocken weiter aufteilen.
4. **Schätze den Aufwand** ehrlich und runde auf 0,5 Stunden. Sag Fritz die Annahmen, damit er korrigieren kann.
5. **Setze die Deadlines rückwärts** vom Event-Datum, mindestens `bufferDays` Puffer. Abhängige Aufgaben bekommen aufeinanderfolgende Deadlines.
6. **Trage alles in `data.json` ein**: Status `open`, `day` nur, wenn Fritz einen festen Tag nennt, in `notes` kurz, was genau zu tun ist.
7. **Prüfe**: `python3 tools/check.py`. Bei Fehlern korrigieren. Bei "ZU ENG" Fritz die Optionen nennen (Deadline verschieben, Stunden pro Tag erhöhen, Aufgabe kürzen oder streichen), nicht stillschweigend ändern.
8. **Fasse zusammen**: Was ist neu, wann wird es nach Plan voraussichtlich fertig, was ist als Nächstes dran.

Grundregeln:

- **Nie ohne Rückfrage** Aufgaben löschen, Events löschen oder auf `done` setzen.
- Bestehende Titel, Deadlines und Notizen nicht umformulieren, wenn Fritz es nicht verlangt.
- Das Format von `data.json` beibehalten: 2 Leerzeichen Einrückung, UTF-8, Zeilenumbruch am Ende. Keine Kommentare (JSON erlaubt keine).
- Hat Fritz in der Seite Änderungen gemacht, liegen sie als Entwurf im Browser. Sie sind erst in `data.json`, wenn er auf "In data.json speichern" geklickt hat. Frag im Zweifel, ob er das getan hat, bevor du die Datei änderst.
- Ändert sich `data.json` auf der Platte, verwirft die Seite beim nächsten Laden einen älteren Entwurf (mit Backup im Browser). Das ist gewollt.

## Wenn Fritz in einem Chat ohne Dateizugriff arbeitet

1. Fritz kopiert den Inhalt von `data.json` (oder über das Zahnrad in der Seite) in den Chat.
2. Du ergänzt oder änderst das JSON nach dem Ablauf oben und gibst es **vollständig** zurück, in einem Codeblock.
3. Fritz fügt es im Zahnrad-Dialog unter "Übernehmen" ein und klickt "In data.json speichern". Oder er ersetzt `data.json` direkt.

## Design-Regeln

Lies vor jeder Änderung an `styles.css` oder dem Aussehen `docs/design-system.md`. Die wichtigsten Punkte:

- Graue Seite, genau eine weiße Hauptfläche mit großem Radius oben, keine Trennlinien darin.
- Koralle ist die einzige Akzentfarbe und nur für Auswahl und Aktion da (gewählter Tag, Plus-Button, Inbox-Pille, aktive Ansicht).
- Kategoriefarben sind gedämpft und erscheinen nur an Icons, Punkten, Plus-Zeichen und Abhak-Kreisen.
- Schrift: Inter, nur 400, 600 und 700. Keine Versalien.
- Neue Elemente müssen auf Handy (390 px) und Desktop (1360 px) funktionieren.

## Konventionen

- Sprache der Oberfläche und aller Texte: Deutsch.
- **Keine Gedankenstriche** (kein langer oder mittellanger Strich) in Texten, Oberfläche, Commit-Nachrichten und Doku. Kommas, Punkte oder Doppelpunkte verwenden. Das ist ein ausdrücklicher Wunsch von Fritz.
- Keine neuen Abhängigkeiten und kein Build-Schritt, ohne vorher mit Fritz zu sprechen.
- Kein `localStorage` für Daten außer dem Entwurf (`deadline-tracker-draft-v1`).
- Dynamische Texte nie per `innerHTML` einfügen (nur über die Hilfsfunktion `h()`), damit Titel mit Sonderzeichen nichts kaputt machen.

## Prüfen vor dem Commit

```bash
node --check app.js          # JavaScript-Syntax
python3 tools/check.py       # Daten gültig, Plan stimmig
python3 -m http.server 8000  # im Browser: Tag, Woche, Monat, Board, Detailfenster ansehen
```

Commit-Nachrichten kurz und auf Englisch, z.B. `Add tasks for course launch`.

## Datenschutz

`data.json` enthält persönliche Pläne. Das Repo sollte **privat** bleiben. Wird die Seite über GitHub Pages veröffentlicht, ist `data.json` öffentlich lesbar.

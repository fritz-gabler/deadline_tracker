# Deadline Tracker

Ein Planer für Events, Unteraufgaben und Deadlines. Er zeigt, wie viele Tage noch bleiben, wie viel Arbeit offen ist und bis wann welche Aufgabe erledigt sein sollte.

Ansichten: Tag (Zeitleiste), Woche, Monat und Board. Links stehen die angepinnten Events mit Countdown und die Inbox mit den offenen Aufgaben.

## Schnellstart

```bash
git clone https://github.com/fritz-gabler/deadline_tracker.git
cd deadline_tracker
python3 -m http.server 8000
```

Dann `http://localhost:8000` im Browser öffnen. Das war alles: kein `npm install`, kein Build.

Ein Doppelklick auf `index.html` funktioniert nicht, weil der Browser dann `data.json` nicht laden darf. Die Seite zeigt in dem Fall einen Hinweis.

## Auf einem neuen Rechner

1. Repo klonen (siehe oben). Die Daten kommen mit, weil sie in `data.json` liegen.
2. Server starten und `http://localhost:8000` öffnen.
3. Optional Claude Code im Ordner starten. Claude liest `CLAUDE.md` und weiß dann, wie das Projekt aufgebaut ist und wie neue To-dos eingetragen werden.

Voraussetzung ist nur Python 3 (für den kleinen Server und `tools/check.py`) und ein aktueller Browser.

## Daten und Speichern

Die Wahrheit liegt in `data.json`. Änderungen, die du in der Seite machst (Aufgabe abhaken, einplanen, neues Event), bleiben zuerst ein **Entwurf im Browser**. Oben erscheint dann eine Leiste:

- **In data.json speichern:** schreibt den Stand in eine Datei. Bei Chrome oder Edge wählst du einmal `data.json` im Projektordner aus. In anderen Browsern wird die Datei heruntergeladen, dann ersetzt du `data.json` selbst.
- **Verwerfen:** wirft den Entwurf weg und lädt wieder `data.json`.

Danach `git add data.json`, `git commit`, `git push`. So hast du auf jedem Rechner denselben Stand.

Wird `data.json` auf der Platte geändert (z.B. von Claude), verwirft die Seite beim nächsten Laden einen älteren Entwurf. Ein Backup davon bleibt im Browser.

## Neue To-dos mit Claude

Am besten mit Claude Code im Projektordner, dann bearbeitet Claude `data.json` direkt:

> Neues Event: Kurs-Launch am 20. November. Zerleg das in Aufgaben und trag sie ein.

Claude fragt kurz nach (Ziel, Datum, was schon fertig ist), zerlegt in Unteraufgaben mit Aufwand und Deadline, trägt sie ein und prüft mit `python3 tools/check.py`, ob alles vor die Deadlines passt. Danach laufen Seite neu laden und Speichern wie oben.

Ohne Dateizugriff (normaler Chat): Inhalt von `data.json` in den Chat kopieren, Claude gibt das geänderte JSON zurück, im Zahnrad-Dialog der Seite unter "Übernehmen" einfügen.

## Aufbau

| Datei | Zweck |
|---|---|
| `index.html` | Seitengerüst und Dialoge |
| `styles.css` | Design |
| `app.js` | Logik und Darstellung |
| `data.json` | Deine Events und Aufgaben |
| `tools/check.py` | Prüft `data.json` und zeigt den Planvorschlag |
| `docs/` | Design-Regeln |
| `CLAUDE.md` | Anleitung für Claude |

## Einstellungen

Über das Zahnrad: Stunden pro Tag, Puffer vor dem Event in Tagen und ob am Wochenende gearbeitet wird. Sie liegen ebenfalls in `data.json` unter `settings`.

## Datenschutz

`data.json` enthält persönliche Pläne. Lass das Repo **privat**. Mit GitHub Pages wäre die Datei öffentlich lesbar.

# bar.md: Was Structured gut macht

Referenz: die App-Oberfläche, die auf structured.app im iPad-Mockup (Tagesansicht) zu sehen ist. Beobachtet am 24.10.2026. Nicht beobachtet: Animationen, Dunkelmodus, die echte Web-App (Login nötig).

Jede Zeile ist etwas, das ein Kritiker mit bloßem Auge prüfen kann.

## Mechanismen

1. **Zwei Flächen, sonst nichts.** Die Seite ist hellgrau (ca. #F2F2F5) und trägt Kopfzeile, Wochenleiste und Inbox. Der Hauptinhalt liegt auf genau einer weißen Fläche mit sehr großem Radius oben (mindestens 32 px), ohne Rahmen. Innerhalb dieser Fläche gibt es keine Kartenraster und keine Trennlinien.

2. **Datum als Überschrift.** "7. October" steht fett und schwarz (ca. 28 px) in einer Zeile, die Jahreszahl daneben in der Akzentfarbe, dahinter ein kleines Chevron. Sekundäre Bedienelemente (AI, Einstellungen) sind runde, helle Pillen mit weichem Schatten, nie eckige Buttons.

3. **Wochenleiste statt Kalendergitter.** Sieben Spalten: Wochentag klein und grau, Datum fett darunter. Der gewählte Tag ist ein gefüllter Akzentkreis mit weißer Zahl. Unter jedem Tag sitzen winzige, überlappende Farbpunkte als Kurzvorschau, was an dem Tag ansteht. Kein Text in der Leiste.

4. **Zeitleiste mit einer gestrichelten Linie.** Eine einzige dünne vertikale Linie. Jeder Eintrag ist ein graues Icon-Rund (ca. 40 px) auf der Linie. Die Höhe des Rundes wächst mit der Dauer (aus 40 px wird eine hohe Kapsel). Links stehen winzige graue Uhrzeiten, rechts eine kleine graue Metazeile (Zeit und Dauer) über dem fetten Titel (ca. 15 px). Am rechten Rand sitzt ein leerer Kreis als Abhak-Feld in der Farbe der Kategorie.

5. **Genau eine Akzentfarbe, nur für Handlung.** Koralle (ca. #FF9E96) steht ausschließlich für Auswahl und Aktion: gewählter Tag, Inbox-Pille, Plus-Button unten rechts, Jahreszahl, hervorgehobene Dauer. Kategorien sind gedämpft (Staubblau, Weichgrün) und erscheinen nur an Icons, Plus-Zeichen und Abhak-Kreisen. Alles andere ist Grau, Weiß, Schwarz.

6. **Inbox als weiße Kärtchen links.** Nicht eingeplante Aufgaben stehen als weiße Karten (Radius ca. 14 px, ohne Rahmen, kaum Schatten) auf dem grauen Grund. Oben eine kleine graue Dauer, darunter der fette Titel, rechts ein Plus in der Kategoriefarbe, das die Aufgabe auf den Tag zieht.

7. **Leerer Raum bekommt einen Vorschlag.** Zwischen zwei Einträgen steht eine Geisterzeile in kleiner grauer Schrift ("Want to read a book for 30min?") mit einer Akzentfarbe nur auf der Dauer. Freie Zeit wird nicht mit Kästen oder Hintergrundfarben gefüllt.

## Typografie (Begleitregel)

Eine einzige geometrische Grotesk (Inter oder ähnlich), nur Regular und Bold bzw. Semibold. Keine Versalien, keine Serifen, keine Monospace-Labels.

## Was daraus für uns folgt (Vorschlag, noch nicht gebaut)

| Structured | Unsere Idee |
|---|---|
| Tagesansicht mit Zeitleiste | Fokus: Was ist heute geplant, aus unserem Planer-Vorschlag, Kapsel-Höhe = Stunden |
| Wochenleiste mit Punkten | Wochenleiste mit Farbpunkten pro Event, dazu eine Mini-Auslastung |
| Inbox links | Offene Aufgaben aller Events, mit Plus zum Einplanen |
| Geisterzeile in Lücken | "Noch 2 h frei, passt: Zahlungsflow testen" |
| Icon-Rund auf der Linie | Event-Countdown als Rund mit Tagen ("12") statt Icon |

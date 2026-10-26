#!/usr/bin/env python3
"""Prüft data.json und simuliert die Planung genauso wie app.js.

Aufruf (im Projektordner):
    python3 tools/check.py                 # Prüfung mit heutigem Datum
    python3 tools/check.py --today 2026-10-26

Exit-Code 1 bei Fehlern (kaputtes JSON, doppelte IDs, falsche Datumsformate ...).
Warnungen (zu eng, überfällig) ändern den Exit-Code nicht.
"""
import datetime as dt
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
TIME_RE = re.compile(r"^\d{2}:\d{2}$")
STATUS = {"open", "doing", "done"}


def d(s):
    return dt.date.fromisoformat(s)


def main():
    today = dt.date.today()
    if "--today" in sys.argv:
        today = d(sys.argv[sys.argv.index("--today") + 1])

    errors, warnings = [], []
    try:
        data = json.loads((ROOT / "data.json").read_text(encoding="utf-8"))
    except Exception as e:  # noqa: BLE001
        print(f"FEHLER: data.json ist kein gültiges JSON: {e}")
        return 1

    s = {"hoursPerDay": 4, "bufferDays": 2, "weekends": False}
    s.update(data.get("settings") or {})
    if not isinstance(s["hoursPerDay"], (int, float)) or s["hoursPerDay"] <= 0:
        errors.append("settings.hoursPerDay muss eine Zahl größer 0 sein")
    if not isinstance(s["bufferDays"], (int, float)) or s["bufferDays"] < 0:
        errors.append("settings.bufferDays muss eine Zahl ab 0 sein")
    if errors:
        print("\n".join("FEHLER: " + e for e in errors))
        return 1

    events = data.get("events")
    if not isinstance(events, list):
        print('FEHLER: "events" muss eine Liste sein')
        return 1

    ev_ids, task_ids, items = set(), set(), []
    for i, ev in enumerate(events):
        name = f'Event {i + 1} "{ev.get("title", "?")}"'
        if not ev.get("id"):
            errors.append(f"{name}: id fehlt")
        elif ev["id"] in ev_ids:
            errors.append(f'{name}: id "{ev["id"]}" doppelt')
        ev_ids.add(ev.get("id"))
        if not ev.get("title"):
            errors.append(f"{name}: title fehlt")
        if not DATE_RE.match(ev.get("date", "")):
            errors.append(f"{name}: date muss YYYY-MM-DD sein")
            continue
        if ev.get("time") and not TIME_RE.match(ev["time"]):
            errors.append(f"{name}: time muss HH:MM sein")
        for t in ev.get("tasks", []):
            tn = f'{name} / Aufgabe "{t.get("title", "?")}"'
            if not t.get("id"):
                errors.append(f"{tn}: id fehlt")
            elif t["id"] in task_ids:
                errors.append(f'{tn}: id "{t["id"]}" doppelt (IDs müssen über alle Events eindeutig sein)')
            task_ids.add(t.get("id"))
            if not t.get("title"):
                errors.append(f"{tn}: title fehlt")
            if not isinstance(t.get("hours"), (int, float)) or t["hours"] < 0:
                errors.append(f"{tn}: hours muss eine Zahl ab 0 sein")
            if t.get("status") not in STATUS:
                errors.append(f"{tn}: status muss open, doing oder done sein")
            for key in ("due", "day"):
                if t.get(key) and not DATE_RE.match(t[key]):
                    errors.append(f"{tn}: {key} muss YYYY-MM-DD sein (oder leer)")
            if errors and any(tn in e for e in errors):
                continue
            deadline = t.get("due") or (d(ev["date"]) - dt.timedelta(days=int(s["bufferDays"]))).isoformat()
            if t.get("due") and t["due"] > ev["date"]:
                warnings.append(f"{tn}: due liegt nach dem Event ({ev['date']})")
            if t.get("day") and t.get("due") and t["day"] > t["due"]:
                warnings.append(f"{tn}: day liegt nach due")
            items.append({"ev": ev, "t": t, "order": i, "deadline": deadline})

    if errors:
        print("\n".join("FEHLER: " + e for e in errors))
        return 1

    # ---- Planung wie in app.js: feste Tage zuerst, Rest nach frühester Deadline ----
    def is_work(day):
        return s.get("weekends") or day.weekday() < 5

    open_items = [x for x in items if x["t"]["status"] != "done"]
    fixed = sorted([x for x in open_items if x["t"].get("day")], key=lambda x: (x["t"]["day"], x["deadline"]))
    rest = sorted(
        [x for x in open_items if not x["t"].get("day")],
        key=lambda x: (x["deadline"], x["t"]["status"] != "doing", x["order"]),
    )
    used, plan = {}, []

    def alloc(x, start):
        rem = float(x["t"]["hours"])
        day = max(d(start), today)
        first = last = None
        guard = 0
        while rem > 1e-6 and guard < 730:
            guard += 1
            if is_work(day):
                free = s["hoursPerDay"] - used.get(day, 0)
                if free > 1e-6:
                    take = min(free, rem)
                    used[day] = used.get(day, 0) + take
                    rem -= take
                    first = first or day
                    last = day
            day += dt.timedelta(days=1)
        first, last = first or today, last or today
        late = x["deadline"] < today.isoformat() or last.isoformat() > x["deadline"]
        plan.append((x, first, last, late))

    for x in fixed:
        alloc(x, x["t"]["day"])
    for x in rest:
        alloc(x, today.isoformat())

    print(f"data.json ist gültig ({len(events)} Events, {len(items)} Aufgaben). Stand: {today.isoformat()}")
    print()
    for x, first, last, late in plan:
        mark = "  <-- ZU ENG" if late else ""
        win = first.isoformat() if first == last else f"{first.isoformat()} bis {last.isoformat()}"
        print(f'  {x["t"]["id"]:>5}  {win:<24} fällig {x["deadline"]}  {x["t"]["hours"]:>4} Std.  {x["t"]["title"]}{mark}')
    late_n = sum(1 for p in plan if p[3])
    print()
    if late_n:
        print(f"WARNUNG: {late_n} Aufgabe(n) schaffen die Deadline nicht. Deadlines verschieben, Stunden pro Tag erhöhen oder Aufgaben kürzen.")
    else:
        print("Alles passt vor die Deadlines.")
    for w in warnings:
        print("WARNUNG: " + w)
    return 0


if __name__ == "__main__":
    sys.exit(main())

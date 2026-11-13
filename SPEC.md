# SPEC: Urlaubsplaner 2027

## 1. Zweck

Ein Team plant seinen Urlaub für das Jahr 2027.
Jede Person trägt ihre Urlaubswünsche ein.
Die App zeigt in einer Übersicht, wer wann weg ist.
Sie rechnet aus, wie viele Urlaubstage jede Person noch hat.
Sie warnt, wenn zu viele Personen gleichzeitig weg sind.

## 2. Nutzer

- Ein kleines Team mit **bis zu 10 Personen**.
- Alle benutzen **denselben Computer** und denselben Browser.
- Es gibt **keine Anmeldung** und keine Rollen. Jeder darf alles sehen und ändern.

## 3. Funktionen

### 3.1 Muss

| Nr. | Funktion | Beschreibung |
|---|---|---|
| M1 | Personen verwalten | Bis zu 10 Personen anlegen, umbenennen und löschen. Bei der 11. Person zeigt die App einen Hinweis. |
| M2 | Urlaub per Formular eintragen | Person wählen, Startdatum und Enddatum eingeben. Nur Tage im Jahr 2027 sind erlaubt. |
| M3 | Urlaub per Klick eintragen | Ein Klick auf eine Zelle in der Übersicht schaltet den Urlaub für diesen Tag an oder aus. |
| M4 | Urlaub löschen | Eingetragene Tage kann man wieder entfernen, per Klick oder über die Liste der Einträge einer Person. |
| M5 | Urlaubskonto | Jede Person hat **30 Urlaubstage**. Die App zeigt für jede Person: genommen / Rest. |
| M6 | Richtig zählen | Samstage, Sonntage und bayerische Feiertage kosten **keinen** Urlaubstag. Schulferien kosten Urlaub wie normale Arbeitstage. |
| M7 | Nicht über 30 Tage | Würde eine Eingabe das Konto über 30 Tage bringen, speichert die App sie **nicht** und zeigt: „Nicht genug Resturlaub.“ |
| M8 | Nur ganze Tage | Halbe Tage gibt es nicht. |
| M9 | Monatsübersicht | 12 Tabellen, eine pro Monat. Zeilen = Personen, Spalten = Tage. Urlaub ist farbig, also auf einen Blick zu sehen. |
| M10 | Kalender markieren | In der Übersicht sind Wochenenden, Feiertage und Schulferien unterschiedlich markiert. |
| M11 | Speichern | Alle Daten bleiben im Browser gespeichert und sind auch nach dem Neuladen noch da. |

### 3.2 Soll

| Nr. | Funktion | Beschreibung |
|---|---|---|
| S1 | Kritische Tage | Sind an einem Arbeitstag **3 oder mehr Personen** im Urlaub, wird dieser Tag deutlich **rot** als „kritisch“ markiert. Eintragen bleibt trotzdem erlaubt. |
| S2 | Liste kritischer Tage | Die App zeigt eine kurze Liste aller kritischen Tage und nennt dazu die Personen. |
| S3 | Legende | Eine Erklärung der Farben (Urlaub, Wochenende, Feiertag, Schulferien, kritisch). |

### 3.3 Bewusst nicht

- Kein Server, keine Datenbank, keine Anmeldung, kein Passwort.
- Kein gemeinsames Arbeiten von verschiedenen Geräten aus.
- Keine halben Urlaubstage.
- Keine anderen Jahre als 2027 und kein Übertrag von Resturlaub.
- Kein Genehmigungsablauf (beantragt / genehmigt / abgelehnt).
- Keine anderen Abwesenheiten wie Krankheit oder Fortbildung.
- Keine unterschiedlichen Urlaubsansprüche (alle haben 30 Tage).
- Kein Export und Import von Dateien.

## 4. Daten

### 4.1 Gespeicherte Daten (im Browser, `localStorage`)

- **Person:** eindeutige ID, Name (Pflichtfeld, höchstens 30 Zeichen)
- **Urlaubstage:** pro Person eine Liste von Daten (Format `JJJJ-MM-TT`)

Es werden nur Urlaubstage gespeichert, die Urlaub **kosten**, also nur Arbeitstage.
Wird ein Zeitraum über ein Wochenende eingetragen, werden Wochenende und Feiertage nicht mitgespeichert.

Wird eine Person gelöscht, werden auch ihre Urlaubstage gelöscht. Vorher fragt die App nach.

### 4.2 Feste Daten (im Programm)

**Gesetzliche Feiertage Bayern 2027:**

| Datum | Feiertag | Wochentag |
|---|---|---|
| 01.01. | Neujahr | Fr |
| 06.01. | Heilige Drei Könige | Mi |
| 26.03. | Karfreitag | Fr |
| 29.03. | Ostermontag | Mo |
| 01.05. | Tag der Arbeit | Sa |
| 06.05. | Christi Himmelfahrt | Do |
| 17.05. | Pfingstmontag | Mo |
| 27.05. | Fronleichnam | Do |
| 15.08. | Mariä Himmelfahrt | So |
| 03.10. | Tag der Deutschen Einheit | So |
| 01.11. | Allerheiligen | Mo |
| 25.12. | 1. Weihnachtstag | Sa |
| 26.12. | 2. Weihnachtstag | So |

Hinweis: Mariä Himmelfahrt gilt nicht in allen Gemeinden. Das Augsburger Friedensfest (08.08.) gilt nur in Augsburg.
Beide fallen 2027 auf einen Sonntag. Für die Rechnung macht das also keinen Unterschied.

**Schulferien Bayern 2027** (werden nur angezeigt):

| Ferien | Zeitraum |
|---|---|
| Weihnachten (Rest) | 01.01. – 08.01. |
| Winter | 08.02. – 12.02. |
| Ostern | 22.03. – 02.04. |
| Pfingsten | 18.05. – 28.05. |
| Sommer | 02.08. – 13.09. |
| Herbst | 02.11. – 05.11. |
| Buß- und Bettag | 17.11. |
| Weihnachten | 24.12. – 31.12. |

> **Wichtig:** Diese Termine müssen **vor dem Programmieren** mit der offiziellen Liste
> des Bayerischen Kultusministeriums (km.bayern.de) verglichen werden.

## 5. Oberfläche

Eine einzige Seite mit diesen Bereichen von oben nach unten:

1. **Kopf:** Titel „Urlaubsplaner 2027“
2. **Personen:** Liste mit Name, genommen, Rest (zum Beispiel „12 / 30, Rest 18“). Dazu Knöpfe für Anlegen, Umbenennen und Löschen.
3. **Urlaub eintragen:** Formular mit Person, Von, Bis und dem Knopf „Eintragen“. Vor dem Speichern zeigt es an, wie viele Urlaubstage das kostet und welche Feiertage im Zeitraum liegen.
   - Datum eintippen (TT.MM.JJJJ) oder über eine eigene Kalenderauswahl wählen.
   - In der Kalenderauswahl sind Feiertage (gelb, „F“), Wochenenden (grau) und Schulferien (grün) farbig markiert. Unter dem Monat stehen die Namen der Feiertage.
4. **Kritische Tage:** Liste (nur sichtbar, wenn es welche gibt)
5. **Legende:** Farben erklärt
6. **Übersicht:** 12 Monatstabellen untereinander
   - Zeilen = Personen, Spalten = Tage 1 bis 28/29/30/31
   - Kopfzeile mit Tag und Wochentag (zum Beispiel „1 Fr“)
   - Zelle mit Urlaub: kräftige Farbe
   - Wochenende: grau, Feiertag: eigene Farbe, Schulferien: leichte Hintergrundfarbe
   - Kritischer Tag: Spalte rot markiert
   - Unter jeder Monatstabelle: Liste der Feiertage dieses Monats mit Namen
   - Zelle anklicken schaltet Urlaub an oder aus (nicht an Wochenenden und Feiertagen)

Allgemein:
- Alle Texte auf Deutsch, in einfacher Sprache.
- Fehler und Hinweise erscheinen gut sichtbar neben der Eingabe.
- Gut zu bedienen am Computer-Bildschirm. Am Handy dürfen die Tabellen seitlich scrollen.
- Farben nicht als einziges Zeichen: Urlaub und kritische Tage bekommen zusätzlich ein Zeichen (zum Beispiel „U“ und „!“).

## 6. Technik und Grenzen

- Nur **HTML, CSS und JavaScript**. Keine Bibliotheken und nichts aus dem Internet.
- Läuft durch einen Doppelklick auf `index.html` im Browser. Ein Server ist nicht nötig.
- Speichern mit `localStorage` des Browsers.
- Keine Passwörter oder Schlüssel in Dateien.

**Grenzen (bitte beachten):**
- Die Daten liegen **nur in diesem Browser auf diesem Computer**.
  Ein anderer Browser oder ein anderer Computer sieht sie nicht.
- Wer den Browserverlauf beziehungsweise die Website-Daten löscht, löscht **auch alle Urlaubsdaten**.
- Es gibt keinen Schutz: Jeder am Computer kann alle Einträge ändern.
- Die App funktioniert nur für 2027. Für ein anderes Jahr müssen Feiertage und Ferien im Code geändert werden.

## 7. Abnahme (so prüfen wir, ob alles stimmt)

| Nr. | Test | Erwartetes Ergebnis |
|---|---|---|
| A1 | 10 Personen anlegen, dann eine 11. | Die 11. wird nicht angelegt. Es erscheint ein Hinweis. |
| A2 | Person „Anna“: Urlaub Mo 15.03. – Fr 19.03. | Kostet 5 Tage, Rest 25. |
| A3 | Anna: Urlaub Mo 22.03. – Fr 02.04. (Ostern) | Kostet 8 Tage, weil Karfreitag und Ostermontag frei sind. Rest 17. |
| A4 | Anna: Urlaub Sa 01.05. – So 02.05. | Kostet 0 Tage. Rest bleibt gleich. |
| A5 | Anna: Urlaub Mo 03.05. – Fr 07.05. | Kostet 4 Tage (Christi Himmelfahrt am 06.05. ist frei). |
| A6 | Person „Ben“: 31 Arbeitstage am Stück eintragen | Wird nicht gespeichert. Hinweis „Nicht genug Resturlaub.“ |
| A7 | Ben hat genau 30 Tage, klickt einen weiteren Tag an | Wird nicht eingetragen, Hinweis erscheint. |
| A8 | 2 Personen am Mi 10.03. im Urlaub | Tag ist **nicht** kritisch. |
| A9 | 3 Personen am Mi 10.03. im Urlaub | Tag ist rot markiert und steht in der Liste „Kritische Tage“ mit den 3 Namen. |
| A10 | Klick auf einen Urlaubstag in der Übersicht | Urlaub wird entfernt, der Rest steigt um 1. |
| A11 | Klick auf einen Samstag oder Feiertag | Nichts passiert. |
| A12 | Seite neu laden | Alle Personen und Urlaubstage sind noch da. |
| A13 | Person löschen | Rückfrage erscheint. Nach „Ja“ sind Person und Urlaub weg, kritische Tage werden neu berechnet. |
| A14 | Übersicht ansehen | 12 Monate. Wochenenden, Feiertage und Schulferien sind unterschiedlich markiert. Die Legende passt dazu. |
| A15 | Dateien ansehen | Keine externen Links zu Bibliotheken, keine Passwörter oder Schlüssel. |

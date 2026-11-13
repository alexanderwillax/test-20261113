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
- Es gibt **keine Anmeldung** und kein Passwort.
- Es gibt zwei Rollen. Die Rolle wird beim Anlegen der Person festgelegt (Häkchen „Ist Admin“):
  - **Teammitglied:** trägt Urlaubswünsche ein.
  - **Admin:** genehmigt oder lehnt Wünsche im Admin-Bereich ab.
- Die Rollen sind **kein Schutz**. Jeder am Computer kann mit dem Knopf in den Admin-Bereich wechseln.

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
| M12 | Vergangene Tage gesperrt | Tage vor heute kann man weder neu eintragen noch löschen: nicht im Formular, nicht in der Kalenderauswahl, nicht in der Übersicht. Ausnahme: Eine Person wird ganz gelöscht. |
| M13 | Admin beim Anlegen | Beim Anlegen einer Person gibt es das Häkchen „Ist Admin“. Mehrere Admins sind möglich. |
| M14 | Admins verwalten | Im Admin-Bereich kann man Personen zum Admin machen oder die Admin-Rechte entfernen. Beim letzten Admin fragt die App vorher nach. |
| M15 | Admin-Bereich | Oben auf der Seite wechselt ein Knopf zwischen „Planung“ und „Admin-Bereich“. Der Knopf ist nur da, wenn es mindestens einen Admin gibt. Der Admin-Bereich zeigt alle offenen und alle genehmigten Urlaubswünsche. |
| M16 | Genehmigen / Ablehnen | Der Admin genehmigt einen offenen Wunsch, oder er lehnt ihn ab. Beim Ablehnen werden die Tage gelöscht und gehen zurück aufs Urlaubskonto. |
| M17 | Status sichtbar | Jeder neue Urlaubstag ist zuerst **offen**: gestreift mit „?“. Genehmigt: kräftig türkis mit „✓“. Der Status steht auch in der Personenliste („offen“ / „genehmigt“). |
| M18 | Smartphone-Ansicht | Die App erkennt selbst, ob sie auf einem Smartphone läuft, und zeigt dann eine eigene Ansicht (siehe 5.1). Die Ansicht am Computer bleibt gleich. |

### 3.2 Soll

| Nr. | Funktion | Beschreibung |
|---|---|---|
| S1 | Kritische Tage | Sind an einem Arbeitstag **3 oder mehr Personen** im Urlaub, wird dieser Tag deutlich **rot** als „kritisch“ markiert. Eintragen bleibt trotzdem erlaubt. |
| S2 | Liste kritischer Tage | Die App zeigt eine kurze Liste aller kritischen Tage und nennt dazu die Personen. |
| S3 | Legende | Eine Erklärung der Farben (Urlaub offen, Urlaub genehmigt, vergangen, Wochenende, Feiertag, Schulferien, kritisch). |

Hinweis: Offene **und** genehmigte Tage zählen beide für das Urlaubskonto und für kritische Tage.

### 3.3 Bewusst nicht

- Kein Server, keine Datenbank, keine echte Anmeldung, kein Passwort.
- Kein gemeinsames Arbeiten von verschiedenen Geräten aus.
- Keine halben Urlaubstage.
- Keine anderen Jahre als 2027 und kein Übertrag von Resturlaub.
- Kein Status „abgelehnt“: Abgelehnte Wünsche werden gelöscht.
- Keine Benachrichtigung (zum Beispiel per E-Mail) bei Genehmigung oder Ablehnung.
- Keine anderen Abwesenheiten wie Krankheit oder Fortbildung.
- Keine unterschiedlichen Urlaubsansprüche (alle haben 30 Tage).
- Kein Export und Import von Dateien.

## 4. Daten

### 4.1 Gespeicherte Daten (im Browser, `localStorage`)

- **Person:** eindeutige ID, Name (Pflichtfeld, höchstens 30 Zeichen), Admin (ja/nein)
- **Urlaubstage:** pro Person eine Liste von Daten (Format `JJJJ-MM-TT`)
- **Genehmigte Tage:** pro Person eine Liste der Tage, die genehmigt sind. Alle anderen Urlaubstage sind „offen“.

Ein **Urlaubswunsch** ist ein Block aus Urlaubstagen mit gleichem Status, zwischen denen nur Wochenenden oder Feiertage liegen.

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

1. **Kopf:** Titel „Urlaubsplaner 2027“ mit Urlaubsbild (Sonne, Berge, Meer, Strand)
2. **Ansicht:** zeigt „Planung“ oder „Admin-Bereich“ und den Knopf zum Wechseln. Im Admin-Bereich sind „Personen“ und „Urlaub eintragen“ ausgeblendet.
3. **Personen:** Formular mit Name und Häkchen „Ist Admin“. Liste mit Name, Abzeichen „Admin“, genommen, davon genehmigt, Rest (zum Beispiel „12 von 30 (8 genehmigt) · Rest 18“). Dazu Knöpfe für Umbenennen und Löschen.
4. **Urlaub eintragen:** Formular mit Person, Von, Bis und dem Knopf „Eintragen“. Vor dem Speichern zeigt es an, wie viele Urlaubstage das kostet und welche Feiertage im Zeitraum liegen.
   - Datum eintippen (TT.MM.JJJJ) oder über eine eigene Kalenderauswahl wählen.
   - In der Kalenderauswahl sind Feiertage (gelb, „F“), Wochenenden (grau) und Schulferien (grün) farbig markiert. Unter dem Monat stehen die Namen der Feiertage.
5. **Kritische Tage:** Liste (nur sichtbar, wenn es welche gibt)
6. **Admin-Bereich:** nur in der Ansicht „Admin-Bereich“. Liste „Offene Urlaubswünsche“ mit den Knöpfen Genehmigen und Ablehnen, darunter „Genehmigte Urlaubswünsche“ und „Admins verwalten“.
7. **Legende:** Farben erklärt
8. **Übersicht:** 12 Monatstabellen untereinander
   - Zeilen = Personen, Spalten = Tage 1 bis 28/29/30/31
   - Kopfzeile mit Tag und Wochentag (zum Beispiel „1 Fr“)
   - Zelle mit Urlaub: offen = gestreift mit „?“, genehmigt = kräftig mit „✓“
   - Vergangene Tage: blass und nicht anklickbar
   - Wochenende: grau, Feiertag: eigene Farbe, Schulferien: leichte Hintergrundfarbe
   - Kritischer Tag: Spalte rot markiert
   - Unter jeder Monatstabelle: Liste der Feiertage dieses Monats mit Namen
   - Zelle anklicken schaltet Urlaub an oder aus (nicht an Wochenenden und Feiertagen)

Allgemein:
- Alle Texte auf Deutsch, in einfacher Sprache.
- Fehler und Hinweise erscheinen gut sichtbar neben der Eingabe.
- Gut zu bedienen am Computer-Bildschirm und auf dem Smartphone (siehe 5.1).
- Farben nicht als einziges Zeichen: Urlaub und kritische Tage bekommen zusätzlich ein Zeichen („?“, „✓“ und „!“).

### 5.1 Smartphone

**Erkennung:** Die App prüft die Größe des Bildschirms, nicht den Namen des Browsers. Das ist zuverlässiger, weil es bei Chrome, Safari, Firefox, Edge und Samsung Internet gleich funktioniert.
- Smartphone = Bildschirm höchstens 760 Pixel breit, **oder** ein Touch-Gerät mit höchstens 500 Pixel Höhe (Handy im Querformat).
- Dreht man das Handy oder ändert man die Fenstergröße, wechselt die Ansicht sofort.

**So sieht es auf dem Smartphone aus:**
- Kleineres Kopfbild.
- Unten eine feste Leiste mit den Bereichen **Kalender**, **Eintragen**, **Personen** und **Admin**. „Admin“ gibt es nur, wenn es einen Admin gibt. Eine Zahl zeigt die offenen Wünsche. Es ist immer nur ein Bereich zu sehen.
- Der Knopf „Zum Admin-Bereich“ oben fällt weg. Dafür gibt es den Bereich „Admin“ in der Leiste.
- **Kalender:** immer nur ein Monat. Gewechselt wird mit ‹ › oder über eine Auswahl. Er startet beim aktuellen Monat und scrollt zum heutigen Tag. Heute ist rot unterstrichen. Die Felder sind größer (mindestens 38 × 44 Pixel). Die Tabelle lässt sich seitlich wischen, die Namen bleiben links stehen.
- **Kalenderauswahl** öffnet sich als Fenster von unten mit großen Tagen.
- Alle Knöpfe und Eingabefelder sind groß genug für den Finger (etwa 44 Pixel hoch). Die Schrift in Eingabefeldern ist 16 Pixel groß, damit das iPhone nicht hineinzoomt.
- Das Datum kann man auch ohne Punkte eintippen: „15032027“ oder „15,03,2027“.

## 6. Technik und Grenzen

- Nur **HTML, CSS und JavaScript**. Keine Bibliotheken und nichts aus dem Internet.
- Läuft durch einen Doppelklick auf `index.html` im Browser. Ein Server ist nicht nötig.
- Speichern mit `localStorage` des Browsers.
- Keine Passwörter oder Schlüssel in Dateien.

**Grenzen (bitte beachten):**
- Die Daten liegen **nur in diesem Browser auf diesem Computer**.
  Ein anderer Browser oder ein anderer Computer sieht sie nicht.
- Wer den Browserverlauf beziehungsweise die Website-Daten löscht, löscht **auch alle Urlaubsdaten**.
- Es gibt keinen Schutz: Jeder am Computer kann alle Einträge ändern und in den Admin-Bereich wechseln.
- „Heute“ kommt von der Uhr des Computers. Ist sie falsch eingestellt, sind die falschen Tage gesperrt.
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
| A10 | Klick auf einen (offenen) Urlaubstag in der Übersicht | Urlaub wird entfernt, der Rest steigt um 1. |
| A11 | Klick auf einen Samstag oder Feiertag | Nichts passiert. |
| A12 | Seite neu laden | Alle Personen und Urlaubstage sind noch da. |
| A13 | Person löschen | Rückfrage erscheint. Nach „Ja“ sind Person und Urlaub weg, kritische Tage werden neu berechnet. |
| A14 | Übersicht ansehen | 12 Monate. Wochenenden, Feiertage und Schulferien sind unterschiedlich markiert. Die Legende passt dazu. |
| A15 | Dateien ansehen | Keine externen Links zu Bibliotheken, keine Passwörter oder Schlüssel. |
| A16 | Neuen Urlaub eintragen | Er erscheint als „offen“ (gestreift, „?“). |
| A17 | Noch kein Admin: Personen ohne Häkchen anlegen | Kein Knopf „Zum Admin-Bereich“. Ein Hinweis erklärt, wie man einen Admin anlegt. |
| A18 | Person „Chef“ mit Häkchen „Ist Admin“ anlegen | Chef hat das Abzeichen „Admin“. Der Knopf „Zum Admin-Bereich“ erscheint. |
| A19 | Knopf „Zum Admin-Bereich“ klicken | Admin-Bereich mit allen offenen Wünschen erscheint. „Personen“ und „Urlaub eintragen“ sind ausgeblendet. Der Knopf heißt jetzt „Zurück zur Planung“. |
| A20 | Chef klickt „Genehmigen“ bei Anna | Annas Tage sind „genehmigt“ (türkis, „✓“) und stehen unter „Genehmigte Urlaubswünsche“. |
| A21 | Chef klickt „Ablehnen“ bei Ben | Rückfrage. Danach sind Bens Tage gelöscht, sein Rest steigt wieder. |
| A22 | Heute ist der 17.03.: Urlaub ab 16.03. eintragen | Nicht erlaubt. Hinweis „Vergangene Tage können nicht mehr gewählt werden“. |
| A23 | Heute ist der 17.03.: Übersicht und Kalenderauswahl ansehen | Tage vor dem 17.03. sind blass und lassen sich nicht anklicken. |
| A24 | Urlaub, der teils in der Vergangenheit liegt, löschen | Nur die Tage ab heute werden gelöscht. Vergangene Tage bleiben stehen. |
| A25 | Im Admin-Bereich dem letzten Admin die Rechte entfernen | Rückfrage. Danach geht die App zurück zur Planung, der Knopf zum Admin-Bereich verschwindet. |
| A26 | App auf dem Smartphone öffnen (oder Fenster schmaler als 760 px) | Leiste unten erscheint, nur ein Bereich ist sichtbar, keine seitliche Scrollleiste der Seite. |
| A27 | Smartphone: Bereich „Kalender“ | Ein Monat, ‹ › wechseln den Monat. Ein Tipp auf ein Feld trägt Urlaub ein oder aus, die Tabelle springt dabei nicht zurück. |
| A28 | Smartphone: Kalender-Symbol bei „Von“ | Kalenderauswahl öffnet sich von unten. |
| A29 | Smartphone: Datum „15032027“ eintippen | Wird als 15.03.2027 erkannt. |
| A30 | Gleiche App am Computer (breites Fenster) | Ansicht wie vorher: alle 12 Monate, keine Leiste unten. |

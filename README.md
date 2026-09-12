# Leistungsbestätigung Mäharbeiten

Statische, datensparsame Webanwendung zur gemeinsamen Dokumentation und Sichtabnahme von Mäharbeiten durch Maschinenring und viadonau.

## Funktionen

- ohne Anmeldung nutzbar
- bis zu 200 Streckenabschnitte pro Lieferschein
- abschnittsweise Kennzeichnung „i. O.“ oder „Nacharbeit“
- Kürzel beider Kontrollierenden je Abschnitt
- Unterschriften mit Maus, Stift oder Touchscreen
- druckoptimierte A4-Querformat-Ausgabe über „PDF erstellen / drucken“
- Entwurf als JSON-Datei speichern und an einem anderen Gerät wieder öffnen
- Eingaben und Unterschriften vollständig in der Entwurfsdatei
- erneute Unterschrift nach Änderungen an bestätigten Angaben
- keine Übertragung von Formulardaten an einen Server

## Lokal öffnen

`index.html` direkt im Browser öffnen. Es sind keine Installation und kein Build-Schritt erforderlich.

## GitHub Pages

Das enthaltene Workflow-File veröffentlicht den Inhalt automatisch über GitHub Pages, sobald auf den Branch `main` gepusht wird. Im Repository muss unter **Settings → Pages → Source** einmalig **GitHub Actions** ausgewählt werden.

## Datenschutz

Alle Formulardaten bleiben im Browser, bis der Benutzer eine Entwurfsdatei oder ein PDF lokal speichert. Die Entwurfsdatei enthält Namen und Unterschriften. Sie wird bewusst per E-Mail oder Teams weitergegeben, nicht automatisch synchronisiert. Vor dem Schließen muss die aktuelle Fassung erneut gespeichert werden. Die gezeichneten Unterschriften sind keine Identitätsprüfung; JSON-Dateien sind nicht manipulationssicher.

## Übergabe zwischen zwei Bearbeitern

1. Maschinenring erfasst Auftrag, Bereiche und Ausführung und unterschreibt.
2. „Entwurf speichern / weitergeben“ lädt eine JSON-Datei herunter. Offene Kontrollfelder verhindern das Speichern nicht.
3. Datei und Formularlink an den Gewässermeister weitergeben.
4. Gewässermeister nutzt „Entwurf öffnen“, ergänzt Kontrollfelder und unterschreibt.
5. Aktualisierten Entwurf speichern und PDF über den Browser drucken.

Änderungen an gemeinsamen Leistungsangaben löschen beide Unterschriften. Änderungen an Kontrollfeldern löschen nur die viadonau-Unterschrift. Die Bestätigung ist anschließend zu erneuern. Das PDF erfordert vollständige Pflichtfelder und beide Unterschriften. Ein Vorgang mit Nacharbeiten bleibt im PDF entsprechend gekennzeichnet.

Die Importprüfung erfolgt vor dem Ersetzen vorhandener Eingaben. Unterstützt werden Formatversion 1, maximal 200 Bereiche und 6 MB je Datei. Daten werden ausschließlich als Feldwerte eingesetzt, nicht als HTML ausgeführt.

# Leistungsbestätigung Mäharbeiten

Statische, datensparsame Webanwendung zur gemeinsamen Dokumentation und Sichtabnahme von Mäharbeiten durch Maschinenring und viadonau.

## Funktionen

- ohne Anmeldung nutzbar
- beliebig viele Streckenabschnitte
- abschnittsweise Kennzeichnung „i. O.“ oder „Nacharbeit“
- Kürzel beider Kontrollierenden je Abschnitt
- Unterschriften mit Maus, Stift oder Touchscreen
- druckoptimierte A4-Querformat-Ausgabe über „PDF erstellen / drucken“
- keine Übertragung oder dauerhafte Speicherung von Eingaben

## Lokal öffnen

`index.html` direkt im Browser öffnen. Es sind keine Installation und kein Build-Schritt erforderlich.

## GitHub Pages

Das enthaltene Workflow-File veröffentlicht den Inhalt automatisch über GitHub Pages, sobald auf den Branch `main` gepusht wird. Im Repository muss unter **Settings → Pages → Source** einmalig **GitHub Actions** ausgewählt werden.

## Datenschutz

Alle Formulardaten bleiben im Browser. Beim Neuladen oder Schließen der Seite werden sie verworfen. Das PDF wird über die Druckfunktion des Browsers lokal erzeugt.

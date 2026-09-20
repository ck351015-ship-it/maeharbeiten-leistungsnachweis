# Leistungsbestätigung Mäharbeiten

Statische, datensparsame Webanwendung zur gemeinsamen Dokumentation und Sichtabnahme von Mäharbeiten durch Maschinenring und viadonau.

## Funktionen

- ohne Anmeldung nutzbar
- bis zu 200 Streckenabschnitte pro Lieferschein
- gemeinsamer viadonau-Kommentar für Kontrolle und Nacharbeiten
- Unterschriften mit Maus, Stift oder Touchscreen
- druckoptimierte A4-Hochformat-Ausgabe über „PDF erstellen / drucken“
- Entwurf als JSON-Datei speichern und an einem anderen Gerät wieder öffnen
- Eingaben, Unterschriften und Fotos vollständig in der Entwurfsdatei
- erneute Unterschrift nach Änderungen an bestätigten Angaben
- keine Übertragung von Formulardaten an einen Server

## Lokal öffnen

`index.html` direkt im Browser öffnen. Es sind keine Installation und kein Build-Schritt erforderlich.

## GitHub Pages

Das enthaltene Workflow-File veröffentlicht den Inhalt automatisch über GitHub Pages, sobald auf den Branch `main` gepusht wird. Im Repository muss unter **Settings → Pages → Source** einmalig **GitHub Actions** ausgewählt werden.

## Datenschutz

Alle Formulardaten bleiben im Browser, bis der Benutzer eine Entwurfsdatei oder ein PDF lokal speichert. Die Entwurfsdatei enthält Namen, Unterschriften und Fotos. Sie wird bewusst per E-Mail oder Teams weitergegeben, nicht automatisch synchronisiert. Vor dem Schließen muss die aktuelle Fassung erneut gespeichert werden. Die gezeichneten Unterschriften sind keine Identitätsprüfung; JSON-Dateien sind nicht manipulationssicher.

## Übergabe zwischen zwei Bearbeitern

1. Maschinenring erfasst Auftrag, Bereiche und Ausführung und unterschreibt.
2. „Entwurf speichern / weitergeben“ lädt eine JSON-Datei herunter. Offene Kontrollfelder verhindern das Speichern nicht.
3. Datei und Formularlink an den Gewässermeister weitergeben.
4. Gewässermeister nutzt „Entwurf öffnen“, ergänzt Kontrollfelder und unterschreibt.
5. Aktualisierten Entwurf speichern und PDF über den Browser drucken.

Änderungen an gemeinsamen Leistungsangaben löschen beide Unterschriften. Auch Änderungen an Kontrollfeldern löschen beide Unterschriften; die korrigierte Fassung muss erneut zur Freigabe übermittelt werden. Die Bestätigung ist anschließend zu erneuern. Entwürfe und PDFs können auch ohne digitale Unterschriften gespeichert werden. Vermerkte Nacharbeiten werden im Kommentar ausgegeben.

Die Importprüfung erfolgt vor dem Ersetzen vorhandener Eingaben. Unterstützt werden Formatversionen 1–8, maximal 200 Bereiche und 20 MB je Datei. Daten werden ausschließlich als Feldwerte eingesetzt, nicht als HTML ausgeführt.

## Fotos zur Dokumentation

- Vor den Unterschriften können bis zu 12 Fotos gemeinsam über „Fotos auswählen“ hinzugefügt werden.
- Bilder werden lokal auf maximal 1600 Pixel Kantenlänge verkleinert und als JPEG gespeichert (unter 1 MB Daten-URL pro Bild). Es werden keine Fotos hochgeladen. Nicht unterstützte Formate werden mit einem Hinweis abgewiesen.
- Zu jedem Foto ist eine Beschreibung mit maximal 500 Zeichen möglich. Fotos lassen sich einzeln entfernen.
- „Entwurf speichern / weitergeben“ enthält Fotos und Beschreibungen vollständig; ohne erneutes Speichern gehen Änderungen beim Schließen verloren.
- Entwurfsformat 6 unterstützt Fotos; frühere Versionen 1–5 bleiben lesbar. Die Dateigrenze beträgt nun 20 MB.
- Der optionale Fotoanhang wird nach dem Hauptformular als A4-Hochformat mit zwei Bildern je Seite gedruckt. Bildproportionen bleiben erhalten. Standort, Leistungsabruf, Jahr und Dokument-ID stellen die Zuordnung sicher.
- Änderungen an Fotos, Bildbeschreibungen oder ihrer Aufnahme ins PDF löschen vorhandene Unterschriften wie andere Änderungen an gemeinsamen Angaben.

## Mehrfachauswahl und Bestätigungstext

Direkt im Leistungs-Dropdown jeder Zeile können mehrere Arbeitsschritte per Checkbox ausgewählt werden. Sie teilen sich Bereich und Abschlussdatum. Für jede ausgewählte Aufmaßposition erscheint ein eigenes Mengenfeld. Entwurfsformat 8 speichert die Auswahl und die zugehörigen Mengen; ältere Einzelpositionen bleiben lesbar.

Entwurfsformat 7 verwendet den aktualisierten Bestätigungstext. Bei älteren Entwürfen werden Unterschriften entfernt und eine erneute Bestätigung verlangt; Angaben und Fotos bleiben erhalten. Frühere Maschinenring-Namen werden in importierten Entwürfen als historische Einträge angezeigt und nicht stillschweigend umbenannt.

Der untere Seitenrand ist im Drucklayout auf 0 gesetzt, um die automatisch ergänzte Browser-Fußzeile zu unterdrücken. Eigene Druckeinstellungen können dies übersteuern. Der bisherige Druckhinweis ist entfernt.

## Entwurf teilen

„Entwurf per E-Mail teilen“ erzeugt lokal eine EML-Datei mit dem vorgegebenen Nachrichtentext als HTML (mit Nur-Text-Alternative) und der vollständigen JSON-Entwurfsdatei als MIME-Anhang (einschließlich Fotos). Die EML-Datei wird im Mailprogramm geöffnet. Empfänger und Versand erfolgen durch den Benutzer. X-Unsent kennzeichnet die Nachricht als Entwurf; Programme ohne Unterstützung können sie stattdessen weiterleiten. Die direkte Gerätefreigabe und WhatsApp wurden entfernt. Kein Upload, kein automatischer Versand und keine automatische Steuerung des Mailprogramms.

Der aktuelle Standortname lautet Maschinenring Schärding; historische Entwürfe behalten ihre bisherigen Namen.

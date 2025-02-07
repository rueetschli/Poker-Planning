<img width="295" alt="image" src="https://github.com/user-attachments/assets/3c6f6f75-7982-4ea3-aa99-8d6df309e035" />


# Poker Planning Tool

Ein einfaches Online-Poker-Planning-Tool, welches ohne Installation von Datenbanken oder zusätzlicher Software auf einfachem Webhosting läuft. 

## Was ist Poker Planning?
Ich habe darüber einen Blogpost erfasst: [Erfahre alles über Poker Planning - Den Sinn, die Herausforderungen und den Ablauf]([https://pp.rueetschli.dev/](https://www.rueetschli.net/p/planning-poker-aufwandsschaetzung)

Oder teste Poker-Planning gleich hier auf meiner Dev-Umgebung: https://pp.rueetschli.dev/

## Features

- **Raum erstellen:**  
  Legen Sie einen Raumnamen und eine Schätz-Art (Fibonacci, T-Shirt-Grössen, T-Shirt mit Kaffee, Spielkarten) fest.

- **Raum betreten:**  
  Geben Sie Ihren Namen ein oder lassen Sie ihn sich aus einem vorherigen Besuch merken (über Cookie und LocalStorage).

- **Teilnehmerdarstellung:**  
  Alle Teilnehmenden werden als Liste mit Avataren (Initiale) angezeigt. Es ist ersichtlich, wer bereits eine Karte gelegt hat.

- **Kartenwahl:**  
  Wählen Sie eine Karte aus einem vorgegebenen Set. Die Karten werden verdeckt gehalten, bis alle gewählt haben.

- **Karten aufdecken:**  
  Ein Klick auf "Karten aufdecken" enthüllt alle gewählten Karten. Danach können Sie eine neue Runde innerhalb derselben User-Story starten oder direkt mit einer neuen User-Story fortfahren.

- **Neue Runde vs. Neue User-Story:**  
  - **Neue Runde:** Die Historie (Rundenverlauf) wird beibehalten, um unterschiedliche Schätzrunden für dieselbe Story zu verfolgen.  
  - **Neue User-Story:** Setzt alles zurück und leert den Verlauf, um eine neue Story-Schätzung zu beginnen.

- **Einigungserkennung:**  
  Wenn alle Teilnehmenden die gleiche Schätzung abgegeben haben, wird nur noch "Neue User-Story" angeboten, um direkt zur nächsten Story zu wechseln.

- **Statistiken und Verlauf:**  
  Nach dem Aufdecken werden der Durchschnitt und der Median (für numerische Werte) berechnet. Nicht-numerische Werte werden als Häufigkeiten angezeigt.  
  Ein Verlauf des Schätzungsdurchschnitts pro Runde wird mittels [Chart.js](https://www.chartjs.org/) als Liniendiagramm dargestellt.

- **Timer:**  
  Ein Timer kann pro Runde gesetzt werden, um die Schätzungszeit zu begrenzen. Dieser wird serverseitig gespeichert und ist für alle sichtbar.

- **Persistenz:**  
  Die Daten werden in einer JSON-Datei (rooms.json) auf dem Server gespeichert. Kein Datenbank-Setup nötig.  
  Alte Räume können mittels Cronjob automatisch bereinigt werden, um das System sauber zu halten.

## Technische Voraussetzungen

- **Server:** PHP-fähiges Shared Webhosting (kein Datenbank-Zwang).
- **Client:** Moderner Browser mit aktiviertem JavaScript.
- **Keine zusätzliche Software:** Nur PHP, JS, CSS und eine JSON-Datei als Datenablage.

## Installation

1. Code in ein Webverzeichnis hochladen.
2. Schreibrechte auf `backend/rooms.json` sicherstellen (CHMOD 666 o.ä., je nach Hoster).
3. Aufrufen per `https://yourdomain.tld/?room=xyz` oder Start über die Startseite ohne Parameter.

## Optional: Cronjob zur Bereinigung

Ein DELETE-Request an `backend/api.php` löscht alte Räume, die älter als 48 Stunden sind. Ein Cronjob könnte beispielsweise alle 24 Stunden diesen DELETE-Request ausführen.

Beispiel (mit `curl`):  
`curl -X DELETE https://yourdomain.tld/backend/api.php`


## Quellen / Libraries

- **QRCode:** [qrcodejs](https://github.com/davidshimjs/qrcodejs) für das Erstellen des QR-Codes zum einfachen Teilen des Raum-Links.
- **Chart.js:** [Chart.js](https://www.chartjs.org/) für die Visualisierung des Rundenverlaufs.

Beides wird via CDN geladen, keine Registrierung oder Installation erforderlich.


<img width="108" alt="image" src="https://github.com/user-attachments/assets/155dc6cf-41e9-4964-823b-6eb7a4c71132" />



# netvis

Interaktive Visualisierung von Netzwerktopologien aus [Netspoc](https://github.com/hknutzen/Netspoc).

netvis zeigt Router und Netze aus einer Netspoc-Konfiguration als Graph an.

- Ausgehend von einem Startobjekt lassen sich Nachbarn schrittweise nachladen
- Es lassen sich Pfade zwischen zwei Objekten anzeigen
- Man kann das Ergebnis als Bild oder JSON (zur späteren weiteren Bearbeitung) speichern.

## Funktionen

- **Startobjekt wählen**: Beim Start wird ein Netspoc-Objekt angegeben (z. B. `router:internet-netze`), wahlweise mit
  IPv6.
- **Lokale Topologie**: Auf der Startseite kann eine mit `export-netvis` erzeugte Topologie-Datei ausgewählt werden.
  Danach kann ein Objekt aus dieser Datei angeben werden und mit „Anzeigen“ im Graphen dargestellt.
  Die Topologie-Datei wird ausschließlich im Browser eingelesen und geprüft.
  Objekte und Nachbarn werden ohne Backend-Anfragen aus dem lokalen Speicher geladen.
  Die Pfadanzeige ist in diesem Modus nicht verfügbar. „Backend verwenden“ wechselt vor dem Start zurück.
- **Pfadanzeige**: Zeigt im Backend-Modus den Pfad zwischen Quelle und Ziel (über das Netspoc-Tool `print-path`).
- **Nachbarn erkunden**: Im Info-Panel lassen sich einzelne oder alle Nachbarn eines Knotens nachladen. Über „Zeige
  Nachbarn“ werden die Nachbarn aller markierten Knoten (ohne Markierung: aller Knoten) eingeblendet.
- **Info-Panel**: Zeigt Nachbarn, Interfaces und Hosts des ausgewählten Objekts. Tooltips zeigen Area,
  IPv4/IPv6-Adresse, Anzahl der Hosts und Interfaces.
- **Layout**: Automatisches Layout mit `cose-bilkent` (abschaltbar), manuelles Anstoßen, Layout nur für markierte
  Knoten, Graph zentrieren.
- **Undo/Redo** für Hinzufügen, Entfernen und Layout.
- **Export**: SVG, PNG und JSON (Knoten mit Positionen). Gespeicherte JSON-Dateien lassen sich im Startdialog wieder
  laden.
- **Legende**: Managed Router (rot), Unmanaged Router (grau), Netze (blau).

### Bedienung

| Aktion                                | Wirkung                                         |
|---------------------------------------|-------------------------------------------------|
| Klick auf Knoten                      | Knoten auswählen, Info-Panel anzeigen           |
| Rechtsklick auf Knoten                | Knoten (bzw. Auswahl) aus dem Graphen entfernen |
| Mouseover                             | Tooltip mit Details                             |
| `Shift` + Mausklick Drag/Drop         | Mehrere Knoten gleichzeitig auswählen           |
| `Strg` + `S`                          | Graph als JSON speichern                        |
| `Strg` + `E`                          | Dialog „Objekt laden“ öffnen                    |
| `Strg` + `Z`                          | Rückgängig                                      |
| `Strg` + `Y` / `Strg` + `Shift` + `Z` | Wiederholen                                     |

## Architektur

```
Browser (Vue 3 + Cytoscape.js)
        │  /backend/get?id=…
        │  /backend/path?source=…&destination=…
        ▼
Go-Backend  ──►  objects.json   (Netspoc-Objekte, im Speicher gehalten)
            └─►  print-path     (externes Netspoc-Tool)

Alternativ ohne Backend:
objects.json ──► Datei-Auswahl im Browser ──► lokaler Objektspeicher ──► Graph
```

- **Frontend** (`src/`): Vue 3, Vite, Cytoscape.js mit den Erweiterungen `cose-bilkent`, `popper`, `svg` sowie einem
  eigenen Undo/Redo (`cytoscape-undo-redo.js`). Die Logik liegt im `Controller` (`src/controller.js`).
  Dieser verwendet entweder den lokalen Objektspeicher oder das Backend als Datenquelle. Beim lokalen Import
  (`src/local-objects.js`) werden die beiden Objekt-Maps nach ID indiziert und leere Listen (`null`) normalisiert.
- **Backend** (`backend/backend.go`): Kleiner HTTP-Server in Go ohne externe Abhängigkeiten.

## Backend

Das Backend läd alle Daten aus einer `objects.json` in den Zwischenspeicher und beantwortet die Anfragen an die
Endpunkte.

### Endpunkte

| Endpunkt                                   | Beschreibung                                                                                                                               |
|--------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------|
| `GET /get?id=<typ:name>`                   | Liefert das Objekt als JSON. Unterstützt werden die Typen `router:` und `network:`. Unbekannte Objekte ergeben `404`.                      |
| `GET /path?source=<obj>&destination=<obj>` | Ruft `print-path -q <VISSPOC> <source> <destination>` auf und gibt dessen Ausgabe zurück. Fehler des Tools werden als `400` zurückgegeben. |

### Konfiguration

Das Backend wird über Umgebungsvariablen konfiguriert. Alle vier sind Pflicht.

| Variable        | Bedeutung                                                          |
|-----------------|--------------------------------------------------------------------|
| `VISDATA`       | Verzeichnis mit der Datei `objects.json`                           |
| `VISSPOC`       | Pfad zur Netspoc-Konfiguration, der an `print-path` übergeben wird |
| `LISTENADDRESS` | Adresse, auf der der Server lauscht                                |
| `LISTENPORT`    | Port, auf dem der Server lauscht                                   |

Das Tool `print-path` muss im `PATH` des Backend-Prozesses liegen.

#### objects.json

Die Datei `objects.json` wird mit dem Netspoc-Tool `export-netvis` aus der Netspoc-Konfiguration erzeugt.

Sie enthält zwei Maps, getrennt nach Netzen und Routern. Der Schlüssel ist jeweils die Objekt-ID, z. B. `network:name`
oder `router:name`:

```json
{
  "network": {
    "network:name": {
      "id": "network:name",
      "type": "network",
      "in_area": "area:name",
      "address": "10.1.1.0/24",
      "address2": "2001:db8::/64",
      "neighbors": [
        {
          "id": "router:name",
          "neighbor_count": 1
        }
      ],
      "hosts": [
        "host:name"
      ]
    }
  },
  "router": {
    "router:name": {
      "id": "router:name",
      "type": "router",
      "neighbors": [
        {
          "id": "network:name",
          "neighbor_count": 1
        }
      ]
    }
  }
}
```

| Feld        | Gilt für     | Bedeutung                                                                                                                                                         |
|-------------|--------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `id`        | Netz, Router | Eindeutige Objekt-ID                                                                                                                                              |
| `type`      | Netz, Router | Objekttyp, z. B. `network`, `router`. Bei Managed Routern enthält er einen Zusatz mit Doppelpunkt (`router:…`), den das Frontend für Farbe und Tooltip auswertet. |
| `in_area`   | Netz, Router | Name der Area, optional                                                                                                                                           |
| `address`   | Netz, Router | IPv4-Adresse bzw. Netz, optional                                                                                                                                  |
| `address2`  | Netz, Router | IPv6-Adresse bzw. Netz, optional                                                                                                                                  |
| `neighbors` | Netz, Router | Liste der Nachbarn mit `id`, `neighbor_count` und `is_tunnel` (nur gesetzt, wenn `true`)                                                                          |
| `hosts`     | nur Netz     | Liste der Hosts im Netz                                                                                                                                           |

Leere Listen (`neighbors`, `hosts`) können als `null` ausgegeben werden.

Ein `SIGHUP` an den Prozess lädt `objects.json` neu, ohne den Server zu beenden:

```sh
kill -HUP <pid>
```

### Bauen

```sh
cd backend
go build .
```

### Starten

```sh
cd backend
VISDATA=/pfad/zu/daten \
VISSPOC=/pfad/zu/netspoc \
LISTENADDRESS=127.0.0.1 \
LISTENPORT=5042 \
./backend
```

## Frontend

Für den lokalen Modus genügt die statisch ausgelieferte Anwendung. Backend, `print-path` und Änderungen an der
Webserver-Konfiguration sind dafür nicht erforderlich. Die hochgeladene Topologie bleibt nur bis zum Neuladen
der Seite im Browser-Speicher und wird nicht an einen Server übertragen. Gespeicherte Graphen enthalten weiterhin
nur Knoten-IDs und Positionen, nicht die Topologie: Zum Wiederöffnen im lokalen Modus zuerst eine passende Topologie
auswählen und anschließend über „JSON Laden“ den gespeicherten Graphen laden.

Voraussetzungen: Node.js und npm.

```sh
npm install
```

### Entwicklung

```sh
npm run dev
```

Der Vite-Dev-Server leitet Anfragen an `/backend` an `http://localhost:5042` weiter (siehe `vite.config.js`). Das
Backend sollte daher auf Port `5042` laufen. Der Titel der Anwendung stammt aus `.env.development`.
Mit `npm test` lassen sich die Tests für den lokalen Import und die Datenquellen des Controllers ausführen.

### Produktion

```sh
npm run build
```

Das Ergebnis liegt in `dist/`. Im Backend-Modus ruft das Frontend das Backend über den relativen Pfad `backend/…` auf.
Ein Webserver muss daher die statischen Dateien ausliefern und Anfragen unter `/backend/` an das Go-Backend
weiterleiten, wobei das Präfix `/backend` entfernt wird. Der Titel stammt aus `.env.production`.

Beispiel für Apache (mit `mod_proxy` und `mod_proxy_http`):

```apache
Alias /netvis /pfad/zu/dist
ProxyPass /netvis/backend http://localhost:5042 retry=0
```

## Projektstruktur

```
backend/                  Go-Backend (backend.go)
src/
  App.vue                 Einstieg: Startdialog, dann Graph
  controller.js           Logik: Laden, Layout, Pfade, Export
  cy-style.js             Cytoscape-Styles (Farben, Formen)
  cytoscape-undo-redo.js  Undo/Redo-Erweiterung
  components/
    LoaderComponent.vue   Startdialog / Objekt laden
    CytoscapeComponent.vue  Graph-Canvas
    NodeInfoComponent.vue   Nachbarn, Interfaces, Hosts
    OptionsComponent.vue    Werkzeugleiste
    LegendComponent.vue     Legende
```
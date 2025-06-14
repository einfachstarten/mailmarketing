# mailmarketing

## Backend

Ein einfacher Express-Server speichert Empfänger und hochgeladene Dateien in einer SQLite-Datenbank bzw. im Dateisystem. Das Frontend wird ebenfalls vom Server ausgeliefert.
Die Anwendung nutzt [Pino](https://getpino.io) für strukturiertes JSON-Logging. Diese Logs lassen sich in der Grafana-Oberfläche von Fly.io komfortabel analysieren.

### Starten

1. Wechsle in den Ordner `backend` und installiere die Abhängigkeiten:
   ```
   npm install
   ```
   (Hinweis: Im Codex-Container schlägt dies mangels Internetzugriff fehl.)
2. Starte den Server:
   ```
   node index.js
   ```

Der Server liest folgende Umgebungsvariablen:
 - `PORT` – Port, auf dem der Server lauscht (wird durch die Umgebung vorgegeben, z. B. 8080 bei Fly.io)
- `DB_PATH` – Pfad zur SQLite-Datei (Standard `backend/db.sqlite`)
- `AUTH_TOKEN` – Bearer Token für geschützte Endpunkte
- `UPLOAD_DIR` – Ablageort für hochgeladene Dateien (Standard `backend/uploads`)
- `JWT_SECRET` – Geheimschlüssel für die Signierung der JWTs

### API-Beispiele

- `GET /recipients` – Liste aller Empfänger abrufen
- `POST /recipients` – Empfänger anlegen (Header `Authorization: Bearer <TOKEN>`)
- `DELETE /recipients/:id` – Empfänger löschen (Header `Authorization: Bearer <TOKEN>`)
- `POST /upload` – Datei hochladen (Header `Authorization: Bearer <TOKEN>`, Feldname `file`)
- `POST /register` – neuen Benutzer anlegen
- `POST /login` – Login, gibt ein JWT zurück
- `GET /users` – Benutzerliste (erfordert Admin-Token)
- `DELETE /users/:id` – Benutzer löschen (erfordert Admin-Token)

Eine einfache Benutzerverwaltung befindet sich in `admin.html`.

### Tests

Im Ordner `backend` befindet sich ein einfaches Skript `test-auth.js`, das Registrierungs-
und Login-Vorgänge gegen einen laufenden Server testet:

```
PORT=8080 node index.js &
node test-auth.js
```
Das Skript legt einen Testnutzer an und prüft den Login.

## Deployment auf Fly.io

1. Installiere `flyctl` und melde dich an.
2. Erstelle (falls noch nicht geschehen) eine App, z. B. mit
   ```
   flyctl apps create mailmarketing --machines
   ```
3. Prüfe die Datei `fly.toml`. Darin ist die HTTP‑Service-Konfiguration samt
   Healthcheck hinterlegt. Weitere Umgebungsvariablen lassen sich bei Bedarf
   über `fly secrets` setzen.
4. Starte das Deployment mit
   ```
   flyctl deploy
   ```
5. Standardmäßig nutzt das Frontend `window.location.origin` als Basis-URL.
   Bei Bedarf kann die Adresse (z.B. `https://mailmarketing.fly.dev`)
   manuell via `ServerConfig.set({ baseUrl: '<URL>' })` überschrieben werden.


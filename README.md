# mailmarketing

## Backend

Ein einfacher Express-Server speichert Empfänger und hochgeladene Dateien in einer SQLite-Datenbank bzw. im Dateisystem. Das Frontend wird ebenfalls vom Server ausgeliefert.

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
- `PORT` – Port, auf dem der Server lauscht (Standard 3000)
- `DB_PATH` – Pfad zur SQLite-Datei (Standard `backend/db.sqlite`)
- `AUTH_TOKEN` – Bearer Token für geschützte Endpunkte
- `UPLOAD_DIR` – Ablageort für hochgeladene Dateien (Standard `backend/uploads`)

### API-Beispiele

- `GET /recipients` – Liste aller Empfänger abrufen
- `POST /recipients` – Empfänger anlegen (Header `Authorization: Bearer <TOKEN>`)
- `DELETE /recipients/:id` – Empfänger löschen (Header `Authorization: Bearer <TOKEN>`)
- `POST /upload` – Datei hochladen (Header `Authorization: Bearer <TOKEN>`, Feldname `file`)

## Deployment auf Fly.io

1. `flyctl launch` ausführen oder die bereitgestellte `fly.toml` verwenden.
2. Beim ersten Start wird ein Volume für die SQLite-Datenbank angelegt (optional).
3. Mit `fly deploy` wird das Docker-Image gebaut und auf Fly.io gestartet.
4. Die URL der App (z. B. `https://mailmarketing-app.fly.dev`) kann anschließend im Frontend via `ServerConfig.set({ baseUrl: '<URL>' })` gesetzt werden.


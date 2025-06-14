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

Im Frontend findest du die Seiten `login.html` und `register.html`. Nach einem
erfolgreichen Login speichert das Skript `js/auth.js` das erhaltene JWT in
`ServerConfig`, damit weitere API-Aufrufe authentifiziert erfolgen.

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
5. Standardmäßig nutzen die Frontend-Skripte die aktuelle Herkunft (Origin)
   des Browsers als Basis-URL. Falls du den Server von einer anderen Domain
   aufrufst, kannst du die URL manuell mit
   `ServerConfig.set({ baseUrl: '<URL>' })` anpassen.


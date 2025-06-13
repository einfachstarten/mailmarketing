# mailmarketing

## Backend

Ein einfacher Express-Server speichert Empfänger in einer SQLite-Datenbank.

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

### API-Beispiele

- `GET /recipients` – Liste aller Empfänger abrufen
- `POST /recipients` – Empfänger anlegen (Header `Authorization: Bearer <TOKEN>`)
- `DELETE /recipients/:id` – Empfänger löschen (Header `Authorization: Bearer <TOKEN>`)


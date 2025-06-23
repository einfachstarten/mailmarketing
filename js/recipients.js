/**
 * E-Mail Marketing Tool - Recipients Management
 * Verwaltet Empfänger-Listen, CSV-Import und Validierung
 */

window.Recipients = (function() {
    'use strict';

    // ===== RECIPIENTS STATE =====
    let recipients = [];
    let importErrors = [];
    let lastImportStats = null;

    // Test-Daten für Demo-Zwecke
    const TEST_DATA = [
        { name: 'Marcus Braun', email: 'marcusbraun@outlook.com' },
        { name: '', email: 'anna.mueller@example.com' },
        { name: 'Max Schmidt', email: 'max@example.com' },
        { name: '', email: 'sarah.weber@company.de' },
        { name: 'Lisa Frank', email: 'lisa.frank@startup.de' },
        { name: '', email: 'thomas.berg@freelancer.com' }
    ];

    // ===== INITIALIZATION =====

    /**
     * Initialisiert das Recipients-Modul
     */
    function init() {
        setupEventListeners();
        loadPersistedRecipients();
        fetchRecipientsFromServer();
        updateDisplay();
        
        console.log('✓ Recipients module initialized');
    }

    /**
     * Setup Event-Listeners
     */
    function setupEventListeners() {
        // CSV File Input
        const csvFile = document.getElementById('csvFileInput');
        if (csvFile) {
            csvFile.addEventListener('change', loadCSV);
        }

        // Enter-Key Shortcuts für manuelle Eingabe
        const manualEmail = document.getElementById('manualRecipientEmail');
        if (manualEmail) {
            manualEmail.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addManualRecipient();
                }
            });
        }

        const manualName = document.getElementById('manualRecipientName');
        if (manualName) {
            manualName.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    Utils.focusElement('manualRecipientEmail');
                }
            });
        }
    }

    /**
     * Lädt persistierte Empfänger aus LocalStorage
     */
    function loadPersistedRecipients() {
        const saved = Utils.loadFromStorage('recipientsList', []);
        if (Array.isArray(saved) && saved.length > 0) {
            recipients = saved.map((recipient, index) => ({
                id: index,
                name: recipient.name || Utils.getNameFromEmail(recipient.email),
                email: recipient.email,
                status: recipient.status || 'pending'
            }));
            console.log(`Loaded ${recipients.length} persisted recipients`);
        }
    }

    /**
     * Persistiert aktuelle Empfänger-Liste
     */
    function persistRecipients() {
        Utils.saveToStorage('recipientsList', recipients);
    }

    async function fetchRecipientsFromServer() {
        try {
            const response = await fetch(ServerConfig.get().baseUrl + '/recipients');
            if (!response.ok) throw new Error('Failed to load recipients');
            const data = await response.json();
            if (Array.isArray(data)) {
                recipients = data.map(r => ({ ...r }));
                updateDisplay();
            }
        } catch (err) {
            console.warn('Could not fetch recipients from server:', err);
        }
    }

    async function createRecipientOnServer(recipient) {
        try {
            const response = await fetch(ServerConfig.get().baseUrl + '/recipients', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ServerConfig.get().authToken}`
                },
                body: JSON.stringify(recipient)
            });
            if (!response.ok) throw new Error('Failed to save recipient');
            const data = await response.json();
            return data;
        } catch (err) {
            console.error('createRecipientOnServer error:', err);
            return null;
        }
    }

    async function deleteRecipientFromServer(id) {
        try {
            const response = await fetch(ServerConfig.get().baseUrl + '/recipients/' + id, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${ServerConfig.get().authToken}`
                }
            });
            if (!response.ok) throw new Error('Failed to delete recipient');
            await response.json();
        } catch (err) {
            console.error('deleteRecipientFromServer error:', err);
        }
    }

    // ===== CSV IMPORT =====

    // Erweiterte PapaParse Konfiguration
    const parseConfig = {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        delimitersToGuess: [',', ';', '\t', '|'],
        transformHeader: (header) => header.trim(),
        complete: (results) => {
            // Robuste Verarbeitung mit besserer Validierung
            processCSVResults(results);
        },
        error: (error) => {
            showImportError(`CSV-Parsing Fehler: ${error.message}`);
        }
    };

    /**
     * Lädt CSV-Datei und importiert Empfänger
     */
    function loadCSV() {
        const fileInput = document.getElementById('csvFile');
        const file = fileInput?.files?.[0];

        if (!file) {
            console.warn('No file selected for CSV import');
            return;
        }

        processCSVFile(file);

        // File Input zurücksetzen
        const dropInput = document.getElementById('csvFileInput');
        if (fileInput) fileInput.value = '';
        if (dropInput) dropInput.value = '';
    }

    /**
     * Verarbeitet eine übergebene CSV-Datei
     * @param {File} file - CSV-Datei
     */
    function processCSVFile(file) {
        if (!file) return;

        console.log(`Loading CSV file: ${file.name} (${Utils.formatFileSize(file.size)})`);

        if (typeof Papa === 'undefined') {
            Utils.showStatus('recipientStatus', 'CSV-Parser nicht verfügbar', 'error');
            return;
        }

        Papa.parse(file, parseConfig);
    }

    /**
     * Behandelt CSV-Parse-Completion
     * @param {Object} results - Papa Parse Ergebnisse
     */
    function handleCSVParseComplete(results) {
        console.log('CSV Parse Results:', results);
        
        if (!results.data || results.data.length === 0) {
            Utils.showStatus('recipientStatus', 'CSV-Datei ist leer', 'error');
            return;
        }

        const processedData = processCSVData(results.data);
        const newRecipients = processedData.recipients;
        importErrors = processedData.errors;
        
        if (newRecipients.length === 0) {
            Utils.showStatus('recipientStatus', 'Keine gültigen E-Mail-Adressen gefunden', 'error');
            showImportErrors();
            return;
        }

        // Neue Empfänger zu bestehender Liste hinzufügen
        const addedCount = addNewRecipients(newRecipients);
        
        // Import-Statistiken
        lastImportStats = {
            total: results.data.length,
            processed: newRecipients.length,
            added: addedCount,
            duplicates: newRecipients.length - addedCount,
            errors: importErrors.length
        };

        updateDisplay();
        showImportResults();
        
        // File Input zurücksetzen
        const fileInput = document.getElementById('csvFile');
        const dropInput = document.getElementById('csvFileInput');
        if (fileInput) fileInput.value = '';
        if (dropInput) dropInput.value = '';
    }

    /**
     * Neue Verarbeitung der PapaParse Ergebnisse
     * @param {Object} results - Papa Parse Ergebnisse
     */
    function processCSVResults(results) {
        console.log('CSV Parse Results:', results);

        if (!results.data || results.data.length === 0) {
            showImportError('CSV-Datei ist leer');
            return;
        }

        const processedData = processCSVData(results.data);
        const newRecipients = processedData.recipients;
        importErrors = processedData.errors;

        if (newRecipients.length === 0) {
            showImportError('Keine gültigen E-Mail-Adressen gefunden');
            showImportErrors();
            return;
        }

        const addedCount = addNewRecipients(newRecipients);

        lastImportStats = {
            total: results.data.length,
            processed: newRecipients.length,
            added: addedCount,
            duplicates: newRecipients.length - addedCount,
            errors: importErrors.length
        };

        updateDisplay();
        showImportResults();

        const fileInput = document.getElementById('csvFile');
        const dropInput = document.getElementById('csvFileInput');
        if (fileInput) fileInput.value = '';
        if (dropInput) dropInput.value = '';
    }

    /**
     * Verarbeitet CSV-Rohdaten
     * @param {Array} rawData - Rohe CSV-Daten
     * @returns {Object} Verarbeitete Daten und Fehler
     */
    function processCSVData(rawData) {
        const processedRecipients = [];
        const errors = [];
        
        rawData.forEach((row, rowIndex) => {
            try {
                const processedRow = processCSVRow(row, rowIndex);
                if (processedRow.success) {
                    processedRecipients.push(processedRow.recipient);
                } else {
                    errors.push(processedRow.error);
                }
            } catch (error) {
                errors.push({
                    row: rowIndex + 1,
                    message: `Unerwarteter Fehler: ${error.message}`,
                    data: row
                });
            }
        });

        return { recipients: processedRecipients, errors };
    }

    /**
     * Verarbeitet einzelne CSV-Zeile
     * @param {Array} row - CSV-Zeile
     * @param {number} rowIndex - Zeilen-Index
     * @returns {Object} Verarbeitungsresultat
     */
    function processCSVRow(row, rowIndex) {
        const cells = Array.isArray(row) ? row : Object.values(row || {});
        // Leere Zeilen überspringen
        if (!cells || cells.length === 0 || (cells.length === 1 && !String(cells[0]).trim())) {
            return { success: false, error: null };
        }

        let name = '';
        let email = '';
        
        // CSV-Format erkennen
        if (cells.length === 1) {
            // Nur E-Mail
            email = String(cells[0] || '').trim();
            name = Utils.getNameFromEmail(email);
        } else if (cells.length >= 2) {
            // Name und E-Mail (oder E-Mail und Name)
            const col1 = String(cells[0] || '').trim();
            const col2 = String(cells[1] || '').trim();
            
            // Intelligente Spalten-Erkennung
            if (Utils.isValidEmail(col1) && !Utils.isValidEmail(col2)) {
                // Spalte 1 = E-Mail, Spalte 2 = Name
                email = col1;
                name = col2 || Utils.getNameFromEmail(email);
            } else if (Utils.isValidEmail(col2)) {
                // Standard: Spalte 1 = Name, Spalte 2 = E-Mail
                name = col1 || Utils.getNameFromEmail(col2);
                email = col2;
            } else {
                return {
                    success: false,
                    error: {
                        row: rowIndex + 1,
                        message: 'Keine gültige E-Mail-Adresse gefunden',
                        data: row
                    }
                };
            }
        }

        // E-Mail validieren
        if (!email || !Utils.isValidEmail(email)) {
            return {
                success: false,
                error: {
                    row: rowIndex + 1,
                    message: `Ungültige E-Mail-Adresse: "${email}"`,
                    data: row
                }
            };
        }

        return {
            success: true,
            recipient: {
                name: name,
                email: email,
                status: 'pending',
                source: 'csv'
            }
        };
    }

    /**
     * Behandelt CSV-Parse-Fehler
     * @param {Error} error - Parse-Fehler
     */
    function handleCSVParseError(error) {
        console.error('CSV Parse Error:', error);
        Utils.showStatus('recipientStatus', `CSV-Parse-Fehler: ${error.message}`, 'error');
    }

    // ===== RECIPIENT MANAGEMENT =====

    /**
     * Fügt neue Empfänger zur Liste hinzu (mit Duplikat-Prüfung)
     * @param {Array} newRecipients - Neue Empfänger
     * @returns {number} Anzahl hinzugefügter Empfänger
     */
    function addNewRecipients(newRecipients) {
        let addedCount = 0;
        
        newRecipients.forEach(newRecipient => {
            if (!isEmailExists(newRecipient.email)) {
                recipients.push({
                    id: recipients.length,
                    name: newRecipient.name,
                    email: newRecipient.email,
                    status: 'pending',
                    source: newRecipient.source || 'unknown'
                });
                createRecipientOnServer({
                    name: newRecipient.name,
                    email: newRecipient.email,
                    status: 'pending'
                });
                addedCount++;
            }
        });

        if (addedCount > 0) {
            reindexRecipients();
            persistRecipients();
        }

        return addedCount;
    }

    /**
     * Fügt manuellen Empfänger hinzu
     */
    function addManualRecipient() {
        const nameInput = document.getElementById('manualRecipientName');
        const emailInput = document.getElementById('manualRecipientEmail');

        if (!emailInput || !emailInput.value.trim()) {
            alert('Bitte geben Sie eine E-Mail-Adresse ein.');
            return;
        }

        const name = nameInput ? nameInput.value.trim() : '';
        const email = emailInput.value.trim();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
            return;
        }

        if (recipients.some(r => r.email.toLowerCase() === email.toLowerCase())) {
            alert('Diese E-Mail-Adresse ist bereits vorhanden.');
            return;
        }

        const newRecipient = {
            name: name || Utils.getNameFromEmail(email),
            email: email,
            status: 'pending',
            source: 'manual'
        };

        recipients.push(newRecipient);
        updateDisplay();
        persistRecipients();

        if (nameInput) nameInput.value = '';
        if (emailInput) emailInput.value = '';

        Utils.showStatus('recipientStatus', `Empfänger ${email} hinzugefügt`, 'success');
    }

    function addManual() {
        addManualRecipient();
    }

    /**
     * Entfernt Empfänger nach Index
     * @param {number} index - Index des zu entfernenden Empfängers
     */
    function removeRecipient(index) {
        if (index < 0 || index >= recipients.length) {
            console.warn(`Invalid recipient index: ${index}`);
            return;
        }

        const recipient = recipients[index];
        recipients.splice(index, 1);
        deleteRecipientFromServer(recipient.id);
        
        reindexRecipients();
        updateDisplay();
        persistRecipients();
        
        console.log(`Recipient removed: ${recipient.email}`);
    }

    /**
     * Lädt Test-Daten
     */
    function loadTestData() {
        const newRecipients = TEST_DATA.map(person => ({
            name: person.name || Utils.getNameFromEmail(person.email),
            email: person.email,
            status: 'pending',
            source: 'test'
        }));

        const addedCount = addNewRecipients(newRecipients);
        
        if (addedCount > 0) {
            updateDisplay();
            Utils.showStatus('recipientStatus', `${addedCount} Test-Empfänger hinzugefügt`, 'success');
        } else {
            Utils.showStatus('recipientStatus', 'Alle Test-Empfänger bereits vorhanden', 'info');
        }
    }

    /**
     * Löscht alle Empfänger
     */
    function clear() {
        if (recipients.length === 0) {
            Utils.showStatus('recipientStatus', 'Keine Empfänger vorhanden', 'info');
            return;
        }
        
        if (!confirm(`Wirklich alle ${recipients.length} Empfänger löschen?`)) {
            return;
        }
        
        const count = recipients.length;
        recipients.forEach(r => deleteRecipientFromServer(r.id));
        recipients = [];
        
        updateDisplay();
        persistRecipients();
        
        Utils.showStatus('recipientStatus', `${count} Empfänger gelöscht`, 'success');
        console.log('All recipients cleared');
    }

    /**
     * Exportiert aktuelle Empfänger als CSV-Datei
     */
    function exportCSV() {
        if (recipients.length === 0) {
            Utils.showStatus('recipientStatus', 'Keine Empfänger vorhanden', 'info');
            return;
        }

        const lines = recipients.map(r => {
            const name = r.name ? `"${r.name.replace(/"/g, '""')}"` : '';
            const email = r.email;
            return name ? `${name},${email}` : email;
        });
        const csvContent = lines.join('\n');
        const filename = `recipients-${Utils.getTimestampForFilename()}.csv`;
        Utils.downloadFile(csvContent, filename, 'text/csv');
        Utils.showStatus('recipientStatus', 'CSV exportiert', 'success');
    }

    // ===== UTILITY FUNCTIONS =====

    /**
     * Prüft ob E-Mail bereits existiert
     * @param {string} email - E-Mail zum Prüfen
     * @returns {boolean} true wenn bereits vorhanden
     */
    function isEmailExists(email) {
        return recipients.some(recipient => 
            recipient.email.toLowerCase() === email.toLowerCase()
        );
    }

    /**
     * Reindexiert Empfänger-IDs
     */
    function reindexRecipients() {
        recipients.forEach((recipient, index) => {
            recipient.id = index;
        });
    }

    /**
     * Aktualisiert Empfänger-Status
     * @param {number} index - Empfänger-Index
     * @param {string} status - Neuer Status ('pending', 'sending', 'sent', 'error')
     */
    function updateRecipientStatus(index, status) {
        if (index >= 0 && index < recipients.length) {
            recipients[index].status = status;
            persistRecipients();
        }
    }

    /**
     * Setzt alle Empfänger-Status zurück
     * @param {string} status - Status zum Setzen (default: 'pending')
     */
    function resetAllStatus(status = 'pending') {
        recipients.forEach(recipient => {
            recipient.status = status;
        });
        persistRecipients();
        updateDisplay();
    }

    // ===== DISPLAY FUNCTIONS =====

    /**
     * Aktualisiert komplette Empfänger-Anzeige
     */
    function updateDisplay() {
        displayRecipients();
        updateStats();
    }

    /**
     * Zeigt Empfänger-Liste an
     */
    function displayRecipients() {
        const container = document.getElementById('recipientsList');
        if (!container) return;
        
        if (recipients.length === 0) {
            container.innerHTML = '<p class="placeholder">Keine Empfänger geladen</p>';
            return;
        }

        container.innerHTML = recipients.map((recipient, index) => `
            <div class="recipient-item">
                <div class="recipient-info">
                    <div class="recipient-name">${Utils.escapeHtml(recipient.name)}</div>
                    <div class="recipient-email">${Utils.escapeHtml(recipient.email)}</div>
                </div>
                <span class="recipient-status status ${recipient.status}">${getStatusText(recipient.status)}</span>
                <button class="recipient-remove" onclick="Recipients.removeRecipient(${index})">✕</button>
            </div>
        `).join('');
    }

    /**
     * Aktualisiert Empfänger-Statistiken
     */
    function updateStats() {
        const statsContainer = document.getElementById('recipientStats');
        if (!statsContainer) return;

        const total = recipients.length;
        const sent = recipients.filter(r => r.status === 'sent').length;
        const errors = recipients.filter(r => r.status === 'error').length;
        const pending = recipients.filter(r => r.status === 'pending').length;
        const sending = recipients.filter(r => r.status === 'sending').length;

        statsContainer.innerHTML = `
            <div style="display: flex; gap: 20px; margin-top: 20px; justify-content: center; flex-wrap: wrap;">
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #4a90e2;">${total}</div>
                    <div style="font-size: 12px; color: #7f8c8d;">Gesamt</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #27ae60;">${sent}</div>
                    <div style="font-size: 12px; color: #7f8c8d;">Gesendet</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #e74c3c;">${errors}</div>
                    <div style="font-size: 12px; color: #7f8c8d;">Fehler</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #f39c12;">${pending}</div>
                    <div style="font-size: 12px; color: #7f8c8d;">Wartend</div>
                </div>
                ${sending > 0 ? `
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #3498db;">${sending}</div>
                    <div style="font-size: 12px; color: #7f8c8d;">Wird gesendet</div>
                </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Gibt Status-Text zurück
     * @param {string} status - Status-Code
     * @returns {string} Lesbare Status-Bezeichnung
     */
    function getStatusText(status) {
        const statusMap = {
            'pending': 'Wartend',
            'sending': 'Wird gesendet...',
            'sent': 'Gesendet ✓',
            'error': 'Fehler ✗'
        };
        return statusMap[status] || status;
    }

    // ===== IMPORT RESULTS =====

    /**
     * Zeigt Import-Ergebnisse an
     */
    function showImportResults() {
        if (!lastImportStats) return;

        const stats = lastImportStats;
        let message = `✅ CSV Import abgeschlossen: ${stats.added} neue Empfänger hinzugefügt`;
        
        if (stats.duplicates > 0) {
            message += `, ${stats.duplicates} Duplikate übersprungen`;
        }
        
        if (stats.errors > 0) {
            message += `, ${stats.errors} Fehler`;
        }

        const messageType = stats.errors > stats.added ? 'error' : 'success';
        Utils.showStatus('recipientStatus', message, messageType);
        
        if (stats.errors > 0) {
            setTimeout(showImportErrors, 1000);
        }
    }

    /**
     * Zeigt Import-Fehler an
     */
    function showImportErrors() {
        if (importErrors.length === 0) return;

        const maxShow = 5;
        const errorList = importErrors.slice(0, maxShow)
            .map(error => `Zeile ${error.row}: ${error.message}`)
            .join('\n');
        
        const additional = importErrors.length > maxShow ? 
            `\n... und ${importErrors.length - maxShow} weitere Fehler` : '';
        
        alert(`Import-Fehler:\n\n${errorList}${additional}`);
    }

    /**
     * Zeigt einen einzelnen Import-Fehler an
     * @param {string} message - Fehlermeldung
     */
    function showImportError(message) {
        Utils.showStatus('recipientStatus', message, 'error');
    }

    // ===== GETTERS & INFO =====

    /**
     * Gibt aktuelle Empfänger-Liste zurück
     * @returns {Array} Empfänger-Array
     */
    function getRecipients() {
        return [...recipients]; // Kopie zurückgeben
    }

    function getAll() {
        return getRecipients();
    }

    /**
     * Gibt Empfänger-Anzahl zurück
     * @returns {number} Anzahl Empfänger
     */
    function getRecipientCount() {
        return recipients.length;
    }

    /**
     * Gibt Empfänger-Statistiken zurück
     * @returns {Object} Statistik-Objekt
     */
    function getStats() {
        return {
            total: recipients.length,
            sent: recipients.filter(r => r.status === 'sent').length,
            errors: recipients.filter(r => r.status === 'error').length,
            pending: recipients.filter(r => r.status === 'pending').length,
            sending: recipients.filter(r => r.status === 'sending').length
        };
    }

    /**
     * Gibt Empfänger nach E-Mail zurück
     * @param {string} email - E-Mail-Adresse
     * @returns {Object|null} Empfänger oder null
     */
    function getRecipientByEmail(email) {
        return recipients.find(r => 
            r.email.toLowerCase() === email.toLowerCase()
        ) || null;
    }

    // ===== PUBLIC API =====
    return {
        // Core functions
        init,
        
        // Import functions
        loadCSV,
        processCSVFile,
        addManualRecipient,
        addManual,
        loadTestData,
        
        // Management functions
        removeRecipient,
        clear,
        exportCSV,
        updateRecipientStatus,
        resetAllStatus,
        
        // Display functions
        updateDisplay,
        updateStats,
        displayRecipients,
        
        // Getters
        getRecipients,
        getAll,
        getRecipientCount,
        getStats,
        getRecipientByEmail,

        // Utilities
        isEmailExists,
        persistRecipients,
        fetchRecipientsFromServer
    };
})();
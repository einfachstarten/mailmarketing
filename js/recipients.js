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
        updateDisplay();
        
        console.log('✓ Recipients module initialized');
    }

    /**
     * Setup Event-Listeners
     */
    function setupEventListeners() {
        // CSV File Input
        const csvFile = document.getElementById('csvFile');
        if (csvFile) {
            csvFile.addEventListener('change', loadCSV);
        }

        // Enter-Key Shortcuts für manuelle Eingabe
        const manualEmail = document.getElementById('manualEmail');
        if (manualEmail) {
            manualEmail.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addManual();
                }
            });
        }

        const manualName = document.getElementById('manualName');
        if (manualName) {
            manualName.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    Utils.focusElement('manualEmail');
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

    // ===== CSV IMPORT =====

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

        console.log(`Loading CSV file: ${file.name} (${Utils.formatFileSize(file.size)})`);
        
        // PapaParse für robustes CSV-Parsing
        if (typeof Papa === 'undefined') {
            Utils.showStatus('recipientStatus', 'CSV-Parser nicht verfügbar', 'error');
            return;
        }

        Papa.parse(file, {
            complete: handleCSVParseComplete,
            header: false,
            skipEmptyLines: true,
            delimiter: ',',
            quotes: true,
            delimitersToGuess: [',', '\t', '|', ';'],
            dynamicTyping: false, // Alles als String
            error: handleCSVParseError
        });
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
        if (fileInput) fileInput.value = '';
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
        // Leere Zeilen überspringen
        if (!row || row.length === 0 || (row.length === 1 && !row[0]?.trim())) {
            return { success: false, error: null };
        }

        let name = '';
        let email = '';
        
        // CSV-Format erkennen
        if (row.length === 1) {
            // Nur E-Mail
            email = (row[0] || '').trim();
            name = Utils.getNameFromEmail(email);
        } else if (row.length >= 2) {
            // Name und E-Mail (oder E-Mail und Name)
            const col1 = (row[0] || '').trim();
            const col2 = (row[1] || '').trim();
            
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
    function addManual() {
        const nameInput = document.getElementById('manualName');
        const emailInput = document.getElementById('manualEmail');
        
        if (!emailInput) {
            console.error('Manual email input not found');
            Utils.showStatus('recipientStatus', 'E-Mail-Eingabefeld nicht gefunden', 'error');
            return;
        }

        const email = emailInput.value.trim();
        const name = nameInput ? nameInput.value.trim() : '';
        
        // Debug-Log für Troubleshooting
        console.log('Adding manual recipient:', { email, name, emailLength: email.length });
        
        // Validierung mit besseren Fehlermeldungen
        if (!email) {
            Utils.showStatus('recipientStatus', 'Bitte E-Mail-Adresse eingeben', 'error');
            Utils.focusElement('manualEmail');
            return;
        }
        
        if (!Utils.isValidEmail(email)) {
            Utils.showStatus('recipientStatus', `"${email}" ist keine gültige E-Mail-Adresse`, 'error');
            Utils.focusElement('manualEmail');
            return;
        }
        
        if (isEmailExists(email)) {
            Utils.showStatus('recipientStatus', `E-Mail-Adresse "${email}" bereits vorhanden`, 'error');
            Utils.focusElement('manualEmail');
            return;
        }
        
        // Empfänger hinzufügen
        recipients.push({
            id: recipients.length,
            name: name || Utils.getNameFromEmail(email),
            email: email,
            status: 'pending',
            source: 'manual'
        });
        
        // UI zurücksetzen
        if (nameInput) nameInput.value = '';
        emailInput.value = '';
        Utils.focusElement('manualName');
        
        updateDisplay();
        persistRecipients();
        
        // Erfolgs-Nachricht
        Utils.showStatus('recipientStatus', `✅ "${email}" hinzugefügt`, 'success');
        console.log(`Manual recipient added: ${email}`);
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
        recipients = [];
        
        updateDisplay();
        persistRecipients();
        
        Utils.showStatus('recipientStatus', `${count} Empfänger gelöscht`, 'success');
        console.log('All recipients cleared');
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
            <div class="recipient">
                <div>
                    <strong>${Utils.escapeHtml(recipient.name)}</strong><br>
                    <small style="color: #7f8c8d;">${Utils.escapeHtml(recipient.email)}</small>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span class="status ${recipient.status}">${getStatusText(recipient.status)}</span>
                    <button onclick="Recipients.removeRecipient(${index})" 
                            style="background: #e74c3c; color: white; border: none; border-radius: 3px; padding: 4px 8px; cursor: pointer; font-size: 12px;"
                            title="Empfänger entfernen">✕</button>
                </div>
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

    // ===== GETTERS & INFO =====

    /**
     * Gibt aktuelle Empfänger-Liste zurück
     * @returns {Array} Empfänger-Array
     */
    function getRecipients() {
        return [...recipients]; // Kopie zurückgeben
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
        addManual,
        loadTestData,
        
        // Management functions
        removeRecipient,
        clear,
        updateRecipientStatus,
        resetAllStatus,
        
        // Display functions
        updateDisplay,
        updateStats,
        displayRecipients,
        
        // Getters
        getRecipients,
        getRecipientCount,
        getStats,
        getRecipientByEmail,
        
        // Utilities
        isEmailExists,
        persistRecipients
    };
})();
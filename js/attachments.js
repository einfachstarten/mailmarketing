/**
 * E-Mail Marketing Tool - Attachments Management
 * Verwaltet Datei-Uploads und Attachment-Handling für E-Mail-Versand
 */

window.Attachments = (function() {
    'use strict';

    // ===== ATTACHMENTS STATE =====
    let attachments = [];
    let maxFileSize = 2 * 1024 * 1024; // 2MB limit für EmailJS
    let maxFiles = 3; // Max 3 Attachments pro E-Mail
    
    // Erlaubte Dateitypen
    const allowedTypes = [
        'application/pdf',
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain', 'text/csv'
    ];

    // ===== INITIALIZATION =====

    /**
     * Initialisiert das Attachments-Modul
     */
    function init() {
        setupEventListeners();
        updateDisplay();
        console.log('✓ Attachments module initialized');
    }

    /**
     * Setup Event-Listeners
     */
    function setupEventListeners() {
        // File Input Change
        const fileInput = document.getElementById('attachmentFiles');
        if (fileInput) {
            fileInput.addEventListener('change', handleFileSelect);
        }

        // Drag & Drop Support
        const dropZone = document.getElementById('attachmentDropZone');
        if (dropZone) {
            dropZone.addEventListener('dragover', handleDragOver);
            dropZone.addEventListener('drop', handleFileDrop);
            dropZone.addEventListener('dragleave', handleDragLeave);
        }
    }

    // ===== FILE HANDLING =====

    /**
     * Behandelt Datei-Auswahl via File Input
     */
    function handleFileSelect(event) {
        const files = Array.from(event.target.files);
        processFiles(files);
        
        // Input zurücksetzen für erneute Auswahl derselben Datei
        event.target.value = '';
    }

    /**
     * Behandelt Drag & Drop Events
     */
    function handleDragOver(event) {
        event.preventDefault();
        event.currentTarget.classList.add('drag-over');
    }

    function handleDragLeave(event) {
        event.currentTarget.classList.remove('drag-over');
    }

    function handleFileDrop(event) {
        event.preventDefault();
        event.currentTarget.classList.remove('drag-over');
        
        const files = Array.from(event.dataTransfer.files);
        processFiles(files);
    }

    /**
     * Verarbeitet ausgewählte Dateien
     * @param {Array} files - File-Array
     */
    async function processFiles(files) {
        const statusContainer = document.getElementById('attachmentStatus');
        
        for (const file of files) {
            try {
                // Validierung
                const validation = validateFile(file);
                if (!validation.valid) {
                    showFileError(file.name, validation.message);
                    continue;
                }

                // Prüfe Attachment-Limit
                if (attachments.length >= maxFiles) {
                    showFileError(file.name, `Maximum ${maxFiles} Dateien erlaubt`);
                    continue;
                }

                // Loading-Status anzeigen
                showFileLoading(file.name);

                // Datei zu Base64 konvertieren
                const base64Data = await fileToBase64(file);
                
                // Attachment hinzufügen
                const attachment = {
                    id: generateAttachmentId(),
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    base64: base64Data,
                    addedAt: new Date()
                };

                attachments.push(attachment);
                console.log(`Attachment added: ${file.name} (${Utils.formatFileSize(file.size)})`);

            } catch (error) {
                console.error(`Error processing file ${file.name}:`, error);
                showFileError(file.name, 'Fehler beim Verarbeiten der Datei');
            }
        }

        updateDisplay();
        persistAttachments();
    }

    /**
     * Validiert Datei
     * @param {File} file - Zu validierende Datei
     * @returns {Object} Validierungsergebnis
     */
    function validateFile(file) {
        // Größe prüfen
        if (file.size > maxFileSize) {
            return {
                valid: false,
                message: `Datei zu groß (max. ${Utils.formatFileSize(maxFileSize)})`
            };
        }

        // Dateityp prüfen
        if (!allowedTypes.includes(file.type)) {
            return {
                valid: false,
                message: 'Dateityp nicht unterstützt'
            };
        }

        // Dateiname prüfen
        if (file.name.length > 100) {
            return {
                valid: false,
                message: 'Dateiname zu lang (max. 100 Zeichen)'
            };
        }

        return { valid: true, message: 'Valid' };
    }

    /**
     * Konvertiert Datei zu Base64
     * @param {File} file - Datei zum Konvertieren
     * @returns {Promise<string>} Base64-String
     */
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = () => {
                // Data URL Format: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
                // Wir brauchen nur den Base64-Teil nach dem Komma
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            
            reader.onerror = () => {
                reject(new Error('Fehler beim Lesen der Datei'));
            };
            
            reader.readAsDataURL(file);
        });
    }

    // ===== ATTACHMENT MANAGEMENT =====

    /**
     * Entfernt Attachment
     * @param {string} attachmentId - ID des zu entfernenden Attachments
     */
    function removeAttachment(attachmentId) {
        const index = attachments.findIndex(att => att.id === attachmentId);
        if (index !== -1) {
            const attachment = attachments[index];
            attachments.splice(index, 1);
            
            updateDisplay();
            persistAttachments();
            
            console.log(`Attachment removed: ${attachment.name}`);
            Utils.showStatus('attachmentStatus', `"${attachment.name}" entfernt`, 'success');
        }
    }

    /**
     * Löscht alle Attachments
     */
    function clearAll() {
        if (attachments.length === 0) {
            Utils.showStatus('attachmentStatus', 'Keine Attachments vorhanden', 'info');
            return;
        }

        if (!confirm(`Wirklich alle ${attachments.length} Attachments entfernen?`)) {
            return;
        }

        const count = attachments.length;
        attachments = [];
        
        updateDisplay();
        persistAttachments();
        
        Utils.showStatus('attachmentStatus', `${count} Attachments entfernt`, 'success');
    }

    /**
     * Generiert eindeutige Attachment-ID
     * @returns {string} Attachment-ID
     */
    function generateAttachmentId() {
        return `att_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }

    // ===== DISPLAY FUNCTIONS =====

    /**
     * Aktualisiert Attachment-Anzeige
     */
    function updateDisplay() {
        displayAttachmentList();
        updateAttachmentStats();
        updateSendTabDisplay();
    }

    /**
     * Zeigt Attachment-Liste an
     */
    function displayAttachmentList() {
        const container = document.getElementById('attachmentList');
        if (!container) return;

        if (attachments.length === 0) {
            container.innerHTML = '<p class="placeholder">Keine Attachments hinzugefügt</p>';
            return;
        }

        container.innerHTML = attachments.map(attachment => `
            <div class="attachment-item">
                <div class="attachment-info">
                    <div class="attachment-icon">${getFileIcon(attachment.type)}</div>
                    <div class="attachment-details">
                        <strong>${Utils.escapeHtml(attachment.name)}</strong><br>
                        <small>${Utils.formatFileSize(attachment.size)} • ${getFileTypeLabel(attachment.type)}</small>
                    </div>
                </div>
                <button onclick="Attachments.removeAttachment('${attachment.id}')" 
                        class="btn-remove" title="Attachment entfernen">✕</button>
            </div>
        `).join('');
    }

    /**
     * Aktualisiert Attachment-Statistiken
     */
    function updateAttachmentStats() {
        const statsContainer = document.getElementById('attachmentStats');
        if (!statsContainer) return;

        const totalSize = attachments.reduce((sum, att) => sum + att.size, 0);
        const remaining = maxFiles - attachments.length;

        statsContainer.innerHTML = `
            <div class="attachment-stats">
                <span>${attachments.length}/${maxFiles} Dateien</span>
                <span>${Utils.formatFileSize(totalSize)} gesamt</span>
                ${remaining > 0 ? 
                    `<span style="color: #27ae60;">Noch ${remaining} möglich</span>` : 
                    `<span style="color: #e74c3c;">Limit erreicht</span>`
                }
            </div>
        `;
    }

    /**
     * Aktualisiert Attachment-Anzeige im Send-Tab
     */
    function updateSendTabDisplay() {
        const container = document.getElementById('sendAttachmentInfo');
        if (!container) return;

        if (attachments.length === 0) {
            container.innerHTML = '<p style="color: #7f8c8d; font-size: 14px;">Keine Attachments</p>';
            return;
        }

        container.innerHTML = `
            <div class="send-attachment-summary">
                <strong>${attachments.length} Attachment(s):</strong><br>
                ${attachments.map(att => 
                    `<small>${Utils.escapeHtml(att.name)} (${Utils.formatFileSize(att.size)})</small>`
                ).join('<br>')}
            </div>
        `;
    }

    /**
     * Zeigt Datei-Fehler an
     * @param {string} filename - Dateiname
     * @param {string} message - Fehlermeldung
     */
    function showFileError(filename, message) {
        Utils.showStatus('attachmentStatus', `❌ ${filename}: ${message}`, 'error');
    }

    /**
     * Zeigt Datei-Loading an
     * @param {string} filename - Dateiname
     */
    function showFileLoading(filename) {
        Utils.showStatus('attachmentStatus', `⏳ Verarbeite: ${filename}...`, 'info');
    }

    // ===== UTILITY FUNCTIONS =====

    /**
     * Gibt Datei-Icon zurück
     * @param {string} mimeType - MIME-Type
     * @returns {string} Icon-Emoji
     */
    function getFileIcon(mimeType) {
        const iconMap = {
            'application/pdf': '📄',
            'image/jpeg': '🖼️', 'image/jpg': '🖼️', 'image/png': '🖼️', 'image/gif': '🖼️',
            'application/msword': '📝', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
            'application/vnd.ms-excel': '📊',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
            'text/plain': '📄',
            'text/csv': '📊'
        };
        return iconMap[mimeType] || '📎';
    }

    /**
     * Gibt Dateityp-Label zurück
     * @param {string} mimeType - MIME-Type
     * @returns {string} Typ-Label
     */
    function getFileTypeLabel(mimeType) {
        const typeMap = {
            'application/pdf': 'PDF',
            'image/jpeg': 'JPEG', 'image/jpg': 'JPEG', 'image/png': 'PNG', 'image/gif': 'GIF',
            'application/msword': 'Word', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
            'application/vnd.ms-excel': 'Excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
            'text/plain': 'Text',
            'text/csv': 'CSV'
        };
        return typeMap[mimeType] || 'Datei';
    }

    /**
     * Persistiert Attachments in LocalStorage
     */
    function persistAttachments() {
        // Nur Metadaten speichern, nicht Base64 (zu groß für localStorage)
        const metadata = attachments.map(att => ({
            id: att.id,
            name: att.name,
            type: att.type,
            size: att.size,
            addedAt: att.addedAt
        }));
        
        Utils.saveToStorage('attachmentMetadata', metadata);
    }

    /**
     * Lädt persistierte Attachment-Metadaten
     */
    function loadPersistedMetadata() {
        const metadata = Utils.loadFromStorage('attachmentMetadata', []);
        // Note: Base64-Daten können nicht aus localStorage geladen werden
        // Benutzer muss Dateien nach Seitenneuladung erneut hinzufügen
        if (metadata.length > 0) {
            console.log(`Found ${metadata.length} attachment metadata entries (files need to be re-added)`);
        }
    }

    // ===== EMAILJS INTEGRATION =====

    /**
     * Bereitet Attachments für EmailJS vor
     * @returns {Array} EmailJS-Attachment-Array
     */
    function prepareForEmailJS() {
        return attachments.map(attachment => ({
            name: attachment.name,
            content: attachment.base64,
            contentType: attachment.type
        }));
    }

    /**
     * Gibt Attachment-Daten für E-Mail-Versand zurück
     * @returns {Object} Template-Parameter für Attachments
     */
    function getEmailTemplateParams() {
        const emailJSAttachments = prepareForEmailJS();
        
        // EmailJS erwartet Attachments als Template-Parameter
        const attachmentParams = {};
        emailJSAttachments.forEach((att, index) => {
            attachmentParams[`attachment${index + 1}_name`] = att.name;
            attachmentParams[`attachment${index + 1}_content`] = att.content;
            attachmentParams[`attachment${index + 1}_contentType`] = att.contentType;
        });
        
        // Zusätzlich Attachment-Count
        attachmentParams.attachment_count = emailJSAttachments.length;
        
        return attachmentParams;
    }

    // ===== GETTERS =====

    /**
     * Gibt aktuelle Attachments zurück
     * @returns {Array} Attachment-Array
     */
    function getAttachments() {
        return [...attachments];
    }

    /**
     * Gibt Attachment-Anzahl zurück
     * @returns {number} Anzahl Attachments
     */
    function getAttachmentCount() {
        return attachments.length;
    }

    /**
     * Gibt Attachment-Statistiken zurück
     * @returns {Object} Statistik-Objekt
     */
    function getStats() {
        const totalSize = attachments.reduce((sum, att) => sum + att.size, 0);
        
        return {
            count: attachments.length,
            totalSize: totalSize,
            remaining: maxFiles - attachments.length,
            maxFiles: maxFiles,
            maxFileSize: maxFileSize
        };
    }

    /**
     * Prüft ob Attachments vorhanden sind
     * @returns {boolean} true wenn Attachments vorhanden
     */
    function hasAttachments() {
        return attachments.length > 0;
    }

    // ===== CONFIGURATION =====

    /**
     * Aktualisiert Attachment-Limits
     * @param {Object} limits - Neue Limits
     */
    function updateLimits(limits) {
        if (limits.maxFileSize) {
            maxFileSize = limits.maxFileSize;
        }
        if (limits.maxFiles) {
            maxFiles = limits.maxFiles;
        }
        
        updateDisplay();
        console.log('Attachment limits updated:', { maxFileSize, maxFiles });
    }

    // ===== PUBLIC API =====
    return {
        // Core functions
        init,
        
        // File management
        processFiles,
        removeAttachment,
        clearAll,
        
        // Display functions
        updateDisplay,
        displayAttachmentList,
        
        // EmailJS integration
        prepareForEmailJS,
        getEmailTemplateParams,
        
        // Getters
        getAttachments,
        getAttachmentCount,
        getStats,
        hasAttachments,
        
        // Configuration
        updateLimits,
        
        // Utilities
        validateFile,
        fileToBase64
    };
})();
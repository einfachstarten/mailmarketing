/**
 * E-Mail Marketing Tool - Attachments Management mit PHP Upload
 * Uploaded Dateien zu PHP Server statt Base64 Konvertierung
 */

window.Attachments = (function() {
    'use strict';

    // ===== UPLOAD KONFIGURATION =====
    const UPLOAD_CONFIG = {
        uploadUrl: ServerConfig.get().baseUrl + '/upload',
        get authHeader() {
            return { 'Authorization': `Bearer ${ServerConfig.get().authToken}` };
        }
    };

    // ===== ATTACHMENTS STATE =====
    let attachments = [];
    let maxFileSize = 20 * 1024 * 1024; // 2MB limit
    let maxFiles = 3;
    
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
    }

    /**
     * Setup Event-Listeners
     */
    function setupEventListeners() {
        const fileInput = document.getElementById('attachmentFiles');
        if (fileInput) {
            fileInput.addEventListener('change', handleFileSelect);
        }

        const dropZone = document.getElementById('attachmentDropZone');
        if (dropZone) {
            dropZone.addEventListener('dragover', handleDragOver);
            dropZone.addEventListener('drop', handleFileDrop);
            dropZone.addEventListener('dragleave', handleDragLeave);
        }
    }

    // ===== FILE HANDLING =====

    /**
     * Behandelt Datei-Auswahl
     */
    function handleFileSelect(event) {
        const files = Array.from(event.target.files);
        processFiles(files);
        event.target.value = '';
    }

    /**
     * Drag & Drop Event-Handler
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
     * Verarbeitet und uploaded Dateien
     * @param {Array} files - File-Array
     */
    async function processFiles(files) {
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

                // Datei zum Server uploaden
                const uploadResult = await uploadFileToServer(file);

                const absoluteUrl = new URL(uploadResult.url, ServerConfig.get().baseUrl).href;

                // Attachment zu Liste hinzufügen
                const attachment = {
                    id: generateAttachmentId(),
                    name: file.name, // Original-Name für Anzeige
                    type: file.type,
                    size: file.size,
                    url: absoluteUrl, // absoluter Pfad zum File
                    serverFilename: uploadResult.filename,
                    addedAt: new Date()
                };

                attachments.push(attachment);
                
                Utils.showStatus('attachmentStatus', 
                    `✅ "${file.name}" erfolgreich hochgeladen`, 'success');

            } catch (error) {
                console.error(`Error uploading file ${file.name}:`, error);
                showFileError(file.name, error.message || 'Upload fehlgeschlagen');
            }
        }

        updateDisplay();
        persistAttachments();
    }

    /**
     * Uploaded Datei zum PHP Server
     * @param {File} file - Datei zum Upload
     * @returns {Promise<Object>} Upload-Ergebnis
     */
    async function uploadFileToServer(file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(UPLOAD_CONFIG.uploadUrl, {
            method: 'POST',
            headers: UPLOAD_CONFIG.authHeader,
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Upload failed: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Upload failed');
        }

        return result.data;
    }

    /**
     * Validiert Datei
     */
    function validateFile(file) {
        if (file.size > maxFileSize) {
            return {
                valid: false,
                message: `Datei zu groß (max. ${Utils.formatFileSize(maxFileSize)})`
            };
        }

        if (!allowedTypes.includes(file.type)) {
            return {
                valid: false,
                message: 'Dateityp nicht unterstützt'
            };
        }

        if (file.name.length > 100) {
            return {
                valid: false,
                message: 'Dateiname zu lang (max. 100 Zeichen)'
            };
        }

        return { valid: true, message: 'Valid' };
    }

    // ===== ATTACHMENT MANAGEMENT =====

    /**
     * Entfernt Attachment (löscht auch vom Server)
     */
    async function removeAttachment(attachmentId) {
        const index = attachments.findIndex(att => att.id === attachmentId);
        if (index !== -1) {
            const attachment = attachments[index];
            
            // Optional: Vom Server löschen (braucht zusätzliches PHP Script)
            // await deleteFileFromServer(attachment.serverFilename);
            
            attachments.splice(index, 1);
            updateDisplay();
            persistAttachments();
            
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

    function generateAttachmentId() {
        return `att_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }

    // ===== DISPLAY FUNCTIONS =====

    function updateDisplay() {
        displayAttachmentList();
        updateAttachmentStats();
        updateSendTabDisplay();
    }

    function displayAttachmentList() {
        const container = document.getElementById('attachmentList');
        if (!container) return;

        if (attachments.length === 0) {
            container.innerHTML = '<p class="placeholder">Keine Attachments hinzugefügt</p>';
            return;
        }

        container.innerHTML = attachments.map((attachment, idx) => `
            <div class="attachment-item">
                <div class="attachment-info">
                    <div class="attachment-icon">${getFileIcon(attachment.type)}</div>
                    <div class="attachment-details">
                        <strong><a href="${attachment.url}" target="_new">${Utils.escapeHtml(attachment.name)}</a></strong><br>
                        <small>${Utils.formatFileSize(attachment.size)} • ${getFileTypeLabel(attachment.type)}</small><br>
                        <small style="color: #4a90e2;">📁 Hochgeladen</small>
                    </div>
                </div>
                <button class="btn btn-small" onclick="Attachments.insertAttachmentLink('${attachment.id}')" title="Link einfügen">🔗</button>
                <button onclick="Attachments.removeAttachment('${attachment.id}')"
                        class="btn-remove" title="Attachment entfernen">✕</button>
            </div>
        `).join('');
    }

    function updateAttachmentStats() {
        const statsContainer = document.getElementById('attachmentStats');
        if (!statsContainer) return;

        const totalSize = attachments.reduce((sum, att) => sum + att.size, 0);
        const remaining = maxFiles - attachments.length;

        statsContainer.innerHTML = `
            <div class="attachment-stats">
                <span>${attachments.length}/${maxFiles} Dateien</span>
                <span>${Utils.formatFileSize(totalSize)} hochgeladen</span>
                ${remaining > 0 ? 
                    `<span style="color: #27ae60;">Noch ${remaining} möglich</span>` : 
                    `<span style="color: #e74c3c;">Limit erreicht</span>`
                }
            </div>
        `;
    }

    function updateSendTabDisplay() {
        const container = document.getElementById('sendAttachmentInfo');
        if (!container) return;

        if (attachments.length === 0) {
            container.innerHTML = '<p style="color: #7f8c8d; font-size: 14px;">Keine Attachments</p>';
            return;
        }

        container.innerHTML = `
            <div class="send-attachment-summary">
                <strong>${attachments.length} Attachment(s) hochgeladen:</strong><br>
                ${attachments.map(att =>
                    `<small>📎 <a href="${att.url}" target="_new">${Utils.escapeHtml(att.name)}</a> (${Utils.formatFileSize(att.size)})</small>`
                ).join('<br>')}
            </div>
        `;
    }

    function showFileError(filename, message) {
        Utils.showStatus('attachmentStatus', `❌ ${filename}: ${message}`, 'error');
    }

    function showFileLoading(filename) {
        Utils.showStatus('attachmentStatus', `⏳ Uploading: ${filename}...`, 'info');
    }

    // ===== UTILITY FUNCTIONS =====

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

    function persistAttachments() {
        // Nur Metadaten speichern (URLs bleiben)
        Utils.saveToStorage('attachmentMetadata', attachments);
    }

    // ===== E-MAIL INTEGRATION =====

    /**
     * Generiert Attachment-Links für E-Mail
     * @returns {string} HTML mit Attachment-Links
     */
    function generateEmailAttachmentLinks() {
        if (attachments.length === 0) return '';
        
        const linksList = attachments.map(att => 
            `📎 <a href="${att.url}">${Utils.escapeHtml(att.name)}</a> (${Utils.formatFileSize(att.size)})`
        ).join('<br>');
        
        return `<br><br><strong>📎 Anhänge:</strong><br>${linksList}`;
    }

    /**
     * Bereitet Attachment-Parameter für E-Mail vor
     * @returns {Object} Template-Parameter
     */
    function getEmailTemplateParams() {
        const params = {
            attachment_links: generateEmailAttachmentLinks(),
            attachment_count: attachments.length
        };

        attachments.forEach((att, idx) => {
            const n = idx + 1;
            params[`attachment${n}_url`] = att.url;
            params[`attachment${n}_name`] = att.name;
        });

        return params;
    }

    /**
     * Fügt einen Platzhalter-Link für ein Attachment in den Editor ein
     * @param {string} attachmentId - ID des Attachments
     */
    function insertAttachmentLink(attachmentId) {
        if (!window.Templates || typeof Templates.insertTextAtCursor !== 'function') return;

        const index = attachments.findIndex(att => att.id === attachmentId);
        if (index === -1) return;

        const n = index + 1;
        const placeholder = `<a href="{{attachment${n}_url}}">{{attachment${n}_name}}</a>`;
        Templates.insertTextAtCursor(placeholder);
    }

    /**
     * Fügt die Variable für die gesamte Attachment-Liste ein
     */
    function insertAttachmentList() {
        if (!window.Templates || typeof Templates.insertTextAtCursor !== 'function') return;
        Templates.insertTextAtCursor('{{attachment_links}}');
    }

    // ===== GETTERS =====

    function getAttachments() {
        return [...attachments];
    }

    function getAttachmentCount() {
        return attachments.length;
    }

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

    function hasAttachments() {
        return attachments.length > 0;
    }

    // ===== CONFIGURATION =====

    function updateUploadConfig(config) {
        Object.assign(UPLOAD_CONFIG, config);
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

        // Email integration
        generateEmailAttachmentLinks,
        getEmailTemplateParams,
        insertAttachmentLink,
        insertAttachmentList,

        // Getters
        getAttachments,
        getAttachmentCount,
        getStats,
        hasAttachments,
        
        // Configuration
        updateUploadConfig,
        
        // Utilities
        validateFile
    };
})();
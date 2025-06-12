/**
 * E-Mail Marketing Tool - Email Sending System
 * Verwaltet E-Mail-Kampagnen, Versand und Progress-Tracking
 */

window.Sender = (function() {
    'use strict';

    // ===== SENDER STATE =====
    let campaignActive = false;
    let campaignPaused = false;
    let currentCampaign = null;
    let sendingStats = {
        sent: 0,
        errors: 0,
        total: 0,
        startTime: null,
        endTime: null
    };

    // Versand-Konfiguration
    let sendConfig = {
        speed: 1000, // Millisekunden zwischen E-Mails
        maxRetries: 2,
        retryDelay: 5000
    };

    // ===== INITIALIZATION =====

    /**
     * Initialisiert das Sender-Modul
     */
    function init() {
        loadSendConfig();
        setupEventListeners();
        
        console.log('✓ Sender module initialized');
    }

    /**
     * Lädt Versand-Konfiguration
     */
    function loadSendConfig() {
        const speed = document.getElementById('sendSpeed');
        if (speed) {
            sendConfig.speed = parseInt(speed.value) || 1000;
        }
    }

    /**
     * Setup Event-Listeners
     */
    function setupEventListeners() {
        // Versand-Geschwindigkeit
        const speedSelect = document.getElementById('sendSpeed');
        if (speedSelect) {
            speedSelect.addEventListener('change', (e) => {
                sendConfig.speed = parseInt(e.target.value) || 1000;
                console.log(`Send speed updated: ${sendConfig.speed}ms`);
            });
        }
    }

    // ===== CAMPAIGN MANAGEMENT =====

    /**
     * Startet E-Mail-Kampagne
     */
    async function start() {
        try {
            // Pre-Flight Checks
            const validationResult = validateCampaignStart();
            if (!validationResult.valid) {
                Utils.showStatus('sendStatus', validationResult.message, 'error');
                return;
            }

            // Kampagne initialisieren
            initializeCampaign();
            
            // UI für Versand vorbereiten
            updateSendingUI(true);
            
            // Versand starten
            await executeCampaign();
            
        } catch (error) {
            console.error('Campaign start error:', error);
            Utils.showStatus('sendStatus', `Kampagne-Fehler: ${error.message}`, 'error');
            stop();
        }
    }

    /**
     * Validiert Kampagne-Start
     * @returns {Object} Validierungsergebnis
     */
    function validateCampaignStart() {
        // Config-Prüfung
        if (!Config || !Config.isSetupComplete()) {
            return { valid: false, message: 'Bitte zuerst die Konfiguration vervollständigen' };
        }

        // Empfänger-Prüfung
        if (!Recipients || Recipients.getRecipientCount() === 0) {
            return { valid: false, message: 'Bitte zuerst Empfänger hinzufügen' };
        }

        // Template-Prüfung
        const htmlContent = document.getElementById('htmlContent');
        if (!htmlContent || !htmlContent.value.trim()) {
            return { valid: false, message: 'Bitte zuerst ein E-Mail-Template erstellen' };
        }

        // EmailJS-Prüfung
        if (typeof emailjs === 'undefined') {
            return { valid: false, message: 'EmailJS nicht verfügbar' };
        }

        return { valid: true, message: 'Validation successful' };
    }

    /**
     * Initialisiert neue Kampagne
     */
    function initializeCampaign() {
        const recipients = Recipients.getRecipients();
        
        currentCampaign = {
            id: generateCampaignId(),
            recipients: recipients,
            template: getCurrentTemplate(),
            config: Config.getConfig(),
            startTime: new Date(),
            status: 'running'
        };

        sendingStats = {
            sent: 0,
            errors: 0,
            total: recipients.length,
            startTime: new Date(),
            endTime: null
        };

        campaignActive = true;
        campaignPaused = false;

        // Alle Empfänger auf "pending" setzen
        Recipients.resetAllStatus('pending');
        
        console.log(`Campaign initialized: ${currentCampaign.id} with ${sendingStats.total} recipients`);
    }

    /**
     * Führt Kampagne aus
     */
    async function executeCampaign() {
        const recipients = currentCampaign.recipients;
        
        Utils.showStatus('sendStatus', 'Kampagne gestartet...', 'success');

        for (let i = 0; i < recipients.length && campaignActive; i++) {
            // Pause-Handling
            while (campaignPaused && campaignActive) {
                await Utils.delay(500);
            }

            if (!campaignActive) break;

            const recipient = recipients[i];
            
            try {
                // Status auf "sending" setzen
                await updateRecipientSendingStatus(i, 'sending');
                
                // E-Mail senden mit Retry-Logic
                await sendEmailWithRetries(recipient);
                
                // Erfolg
                await updateRecipientSendingStatus(i, 'sent');
                sendingStats.sent++;
                
            } catch (error) {
                // Fehler
                console.error(`Send failed for ${recipient.email}:`, error);
                await updateRecipientSendingStatus(i, 'error');
                sendingStats.errors++;
            }

            // Progress aktualisieren
            updateProgress();
            
            // Delay vor nächster E-Mail (außer bei letzter)
            if (i < recipients.length - 1 && campaignActive) {
                await Utils.delay(sendConfig.speed);
            }
        }

        // Kampagne beenden
        finalizeCampaign();
    }

    /**
     * Sendet E-Mail mit Retry-Logic
     * @param {Object} recipient - Empfänger-Objekt
     */
    async function sendEmailWithRetries(recipient) {
        let lastError = null;
        
        for (let attempt = 1; attempt <= sendConfig.maxRetries + 1; attempt++) {
            try {
                await sendSingleEmail(recipient);
                return; // Erfolg
            } catch (error) {
                lastError = error;
                console.warn(`Send attempt ${attempt} failed for ${recipient.email}:`, error.message);
                
                // Retry-Delay (außer beim letzten Versuch)
                if (attempt <= sendConfig.maxRetries) {
                    await Utils.delay(sendConfig.retryDelay);
                }
            }
        }
        
        // Alle Versuche fehlgeschlagen
        throw lastError;
    }

    // Ersetze die sendSingleEmail Funktion in js/sender.js:

/**
 * Sendet einzelne E-Mail
 * @param {Object} recipient - Empfänger-Objekt
 */
async function sendSingleEmail(recipient) {
    const config = currentCampaign.config;
    const template = currentCampaign.template;
    
    // Template personalisieren
    let personalizedSubject = Templates.personalizeContent(template.subject, recipient);
    let personalizedContent = Templates.personalizeContent(template.content, recipient);

    // Attachment-Links hinzufügen falls vorhanden
    if (window.Attachments && Attachments.hasAttachments()) {
        const attachmentLinks = Attachments.generateEmailAttachmentLinks();
        personalizedContent += attachmentLinks;
        
        console.log(`Sending email to: ${recipient.email} with ${Attachments.getAttachmentCount()} attachment link(s)`);
    } else {
        console.log(`Sending email to: ${recipient.email}`);
    }

    // EmailJS Template-Parameter
    const templateParams = {
        to_name: recipient.name,
        to_email: recipient.email,
        from_name: config.fromName,
        subject: personalizedSubject,
        message: personalizedContent
    };

    // E-Mail senden
    const response = await emailjs.send(
        config.serviceId,
        config.templateId,
        templateParams
    );
    
    if (response.status !== 200) {
        throw new Error(`EmailJS Error: ${response.status} - ${response.text}`);
    }
    
    return response;
}

    /**
     * Stoppt aktuelle Kampagne
     */
    function stop() {
        if (!campaignActive) {
            console.warn('No active campaign to stop');
            return;
        }

        campaignActive = false;
        campaignPaused = false;
        
        finalizeCampaign();
        
        console.log('Campaign stopped by user');
    }

    /**
     * Pausiert aktuelle Kampagne
     */
    function pause() {
        if (!campaignActive) {
            console.warn('No active campaign to pause');
            return;
        }

        campaignPaused = true;
        Utils.showStatus('sendStatus', 'Kampagne pausiert...', 'info');
        
        console.log('Campaign paused');
    }

    /**
     * Setzt pausierte Kampagne fort
     */
    function resume() {
        if (!campaignActive || !campaignPaused) {
            console.warn('No paused campaign to resume');
            return;
        }

        campaignPaused = false;
        Utils.showStatus('sendStatus', 'Kampagne fortgesetzt...', 'success');
        
        console.log('Campaign resumed');
    }

    /**
     * Finalisiert Kampagne
     */
    function finalizeCampaign() {
        sendingStats.endTime = new Date();
        
        if (currentCampaign) {
            currentCampaign.status = 'completed';
            currentCampaign.endTime = sendingStats.endTime;
        }

        updateSendingUI(false);
        showCampaignResults();
        
        // State zurücksetzen
        campaignActive = false;
        campaignPaused = false;
    }

    // ===== UI UPDATES =====

    /**
     * Aktualisiert Empfänger-Status während Versand
     * @param {number} index - Empfänger-Index
     * @param {string} status - Neuer Status
     */
    async function updateRecipientSendingStatus(index, status) {
        // Recipients-Modul aktualisieren
        if (Recipients) {
            Recipients.updateRecipientStatus(index, status);
        }

        // UI-Element aktualisieren
        const statusElement = document.getElementById(`status-${index}`);
        if (statusElement) {
            statusElement.className = `status ${status}`;
            statusElement.textContent = getStatusText(status);
        }

        // Haupt-Empfänger-Liste auch aktualisieren
        if (Recipients && typeof Recipients.displayRecipients === 'function') {
            Recipients.displayRecipients();
        }
    }

    /**
     * Aktualisiert Send-UI basierend auf Kampagne-Status
     * @param {boolean} sending - true wenn Versand aktiv
     */
    function updateSendingUI(sending) {
        const sendBtn = document.getElementById('sendBtn');
        const stopBtn = document.getElementById('stopBtn');
        const progressContainer = document.getElementById('progressContainer');
        const progressText = document.getElementById('progressText');

        if (sendBtn) {
            sendBtn.style.display = sending ? 'none' : 'inline-block';
        }

        if (stopBtn) {
            stopBtn.style.display = sending ? 'inline-block' : 'none';
        }

        if (progressContainer) {
            progressContainer.style.display = sending ? 'block' : 'none';
        }

        if (progressText) {
            progressText.style.display = sending ? 'block' : 'none';
        }
    }

    /**
     * Aktualisiert Progress-Anzeige
     */
    function updateProgress() {
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        
        if (!progressBar || !progressText) return;

        const processed = sendingStats.sent + sendingStats.errors;
        const progress = sendingStats.total > 0 ? (processed / sendingStats.total) * 100 : 0;
        
        progressBar.style.width = `${progress}%`;
        progressText.textContent = 
            `${processed} von ${sendingStats.total} verarbeitet (${sendingStats.sent} erfolgreich, ${sendingStats.errors} Fehler)`;
    }

    /**
     * Aktualisiert Empfänger-Liste für Send-Tab
     */
    function updateRecipientsList() {
        const container = document.getElementById('sendRecipientsList');
        if (!container) return;
        
        if (!Recipients || Recipients.getRecipientCount() === 0) {
            container.innerHTML = '<p class="placeholder">Keine Empfänger geladen - gehe zu "Empfänger" Tab</p>';
            return;
        }

        const recipients = Recipients.getRecipients();
        container.innerHTML = recipients.map((recipient, index) => `
            <div class="recipient">
                <div>
                    <strong>${Utils.escapeHtml(recipient.name)}</strong><br>
                    <small style="color: #7f8c8d;">${Utils.escapeHtml(recipient.email)}</small>
                </div>
                <span class="status ${recipient.status}" id="status-${index}">${getStatusText(recipient.status)}</span>
            </div>
        `).join('');
    }

    /**
     * Zeigt Kampagne-Ergebnisse an
     */
    function showCampaignResults() {
        const duration = sendingStats.endTime - sendingStats.startTime;
        const durationText = formatDuration(duration);
        
        let message;
        let messageType;
        
        if (sendingStats.sent === sendingStats.total) {
            message = `✅ Alle ${sendingStats.sent} E-Mails erfolgreich gesendet! (${durationText})`;
            messageType = 'success';
        } else if (sendingStats.sent > 0) {
            message = `📊 Kampagne abgeschlossen: ${sendingStats.sent} gesendet, ${sendingStats.errors} Fehler (${durationText})`;
            messageType = sendingStats.errors > sendingStats.sent ? 'error' : 'success';
        } else {
            message = `❌ Kampagne fehlgeschlagen: ${sendingStats.errors} Fehler (${durationText})`;
            messageType = 'error';
        }
        
        Utils.showStatus('sendStatus', message, messageType);
        
        // Detaillierte Statistiken loggen
        console.log('Campaign Results:', {
            ...sendingStats,
            duration: durationText,
            successRate: `${((sendingStats.sent / sendingStats.total) * 100).toFixed(1)}%`
        });
    }

    // ===== UTILITY FUNCTIONS =====

    /**
     * Holt aktuelles Template
     * @returns {Object} Template-Objekt
     */
    function getCurrentTemplate() {
        const subject = document.getElementById('subject');
        const htmlContent = document.getElementById('htmlContent');
        
        return {
            subject: subject ? subject.value : '',
            content: htmlContent ? htmlContent.value : ''
        };
    }

    /**
     * Generiert eindeutige Kampagne-ID
     * @returns {string} Kampagne-ID
     */
    function generateCampaignId() {
        return `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Formatiert Zeitdauer lesbar
     * @param {number} milliseconds - Dauer in Millisekunden
     * @returns {string} Formatierte Dauer
     */
    function formatDuration(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
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

    // ===== CAMPAIGN STATISTICS =====

    /**
     * Gibt aktuelle Sending-Statistiken zurück
     * @returns {Object} Statistik-Objekt
     */
    function getStats() {
        return {
            ...sendingStats,
            active: campaignActive,
            paused: campaignPaused,
            successRate: sendingStats.total > 0 ? 
                ((sendingStats.sent / sendingStats.total) * 100).toFixed(1) : 0
        };
    }

    /**
     * Gibt Kampagne-Informationen zurück
     * @returns {Object|null} Kampagne-Objekt oder null
     */
    function getCurrentCampaign() {
        return currentCampaign ? { ...currentCampaign } : null;
    }

    /**
     * Prüft ob Kampagne aktiv ist
     * @returns {boolean} true wenn aktiv
     */
    function isCampaignActive() {
        return campaignActive;
    }

    /**
     * Prüft ob Kampagne pausiert ist
     * @returns {boolean} true wenn pausiert
     */
    function isCampaignPaused() {
        return campaignPaused;
    }

    // ===== CONFIGURATION =====

    /**
     * Aktualisiert Versand-Konfiguration
     * @param {Object} newConfig - Neue Konfiguration
     */
    function updateSendConfig(newConfig) {
        sendConfig = { ...sendConfig, ...newConfig };
        console.log('Send config updated:', sendConfig);
    }

    /**
     * Gibt aktuelle Versand-Konfiguration zurück
     * @returns {Object} Konfigurationsobjekt
     */
    function getSendConfig() {
        return { ...sendConfig };
    }

    // ===== DIAGNOSTICS =====

    /**
     * Führt Sender-Diagnose durch
     * @returns {Object} Diagnose-Ergebnis
     */
    function diagnose() {
        const diagnosis = {
            status: 'healthy',
            issues: [],
            warnings: [],
            info: []
        };

        // Config-Prüfung
        if (!Config || !Config.isSetupComplete()) {
            diagnosis.issues.push('EmailJS-Konfiguration nicht vollständig');
        }

        // EmailJS-Verfügbarkeit
        if (typeof emailjs === 'undefined') {
            diagnosis.issues.push('EmailJS-Bibliothek nicht geladen');
        }

        // Empfänger-Prüfung
        if (!Recipients || Recipients.getRecipientCount() === 0) {
            diagnosis.warnings.push('Keine Empfänger vorhanden');
        }

        // Template-Prüfung
        const htmlContent = document.getElementById('htmlContent');
        if (!htmlContent || !htmlContent.value.trim()) {
            diagnosis.warnings.push('Kein E-Mail-Template vorhanden');
        }

        // Aktive Kampagne
        if (campaignActive) {
            diagnosis.info.push(`Aktive Kampagne: ${currentCampaign?.id}`);
            diagnosis.info.push(`Progress: ${sendingStats.sent + sendingStats.errors}/${sendingStats.total}`);
        }

        // Status bestimmen
        if (diagnosis.issues.length > 0) {
            diagnosis.status = 'error';
        } else if (diagnosis.warnings.length > 0) {
            diagnosis.status = 'warning';
        }

        return diagnosis;
    }

    // ===== PUBLIC API =====
    return {
        // Core functions
        init,
        
        // Campaign management
        start,
        stop,
        pause,
        resume,
        
        // UI updates
        updateRecipientsList,
        updateProgress,
        
        // Status & statistics
        getStats,
        getCurrentCampaign,
        isCampaignActive,
        isCampaignPaused,
        
        // Configuration
        updateSendConfig,
        getSendConfig,
        
        // Diagnostics
        diagnose,
        
        // Utilities
        getStatusText,
        formatDuration
    };
})();
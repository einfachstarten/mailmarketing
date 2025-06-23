window.CampaignSender = (function() {
    'use strict';

    let campaignData = null;
    let isRunning = false;
    let sendStats = { sent: 0, errors: 0, total: 0 };

    /**
     * Lädt Kampagnen-Daten vom Mail Wizard
     */
    function loadCampaignData(data) {
        campaignData = data;
        displayCampaignData();
        showSection('campaignDataContainer');
        showSection('sendControlsContainer');
        hideSection('emptyState');
    }

    /**
     * Zeigt Kampagnen-Daten an
     */
    function displayCampaignData() {
        if (!campaignData) return;

        document.getElementById('campaignSubject').textContent = campaignData.subject || 'Kein Betreff';
        document.getElementById('campaignTemplate').textContent = campaignData.template || 'Custom';
        document.getElementById('campaignRecipientCount').textContent = campaignData.selectedRecipients.length;
        document.getElementById('campaignAttachmentCount').textContent = campaignData.attachments?.length || 0;

        // Empfänger-Liste Preview
        const recipientsList = document.getElementById('campaignRecipientsList');
        const recipients = campaignData.selectedRecipients.slice(0, 5); // Erste 5 zeigen
        recipientsList.innerHTML = recipients.join(', ') +
            (campaignData.selectedRecipients.length > 5 ? ` ... (+${campaignData.selectedRecipients.length - 5} weitere)` : '');
    }

    /**
     * Startet Kampagne
     */
    function startCampaign() {
        if (!campaignData || isRunning) return;

        const testMode = document.getElementById('testModeCheckbox').checked;
        const delay = parseInt(document.getElementById('sendDelay').value) || 2;

        // Recipients filtern für Test-Modus
        let recipients = campaignData.selectedRecipients;
        if (testMode) {
            recipients = recipients.slice(0, 3);
        }

        // UI für Versand vorbereiten
        showSection('sendProgressContainer');
        hideSection('sendControlsContainer');
        
        sendStats = { sent: 0, errors: 0, total: recipients.length };
        isRunning = true;

        logMessage('🚀 Kampagne gestartet...', 'info');
        logMessage(`📧 ${recipients.length} E-Mails werden versendet`, 'info');
        
        // Versand starten
        sendEmails(recipients, delay);
    }

    /**
     * Sendet E-Mails
     */
    async function sendEmails(recipients, delay) {
        const startTime = Date.now();

        for (let i = 0; i < recipients.length; i++) {
            const email = recipients[i];
            
            try {
                updateProgress(i, recipients.length, `Sende an ${email}...`);
                
                // E-Mail senden (EmailJS)
                const result = await sendSingleEmail(email, campaignData);
                
                sendStats.sent++;
                logMessage(`✅ Erfolgreich gesendet an ${email}`, 'success');
                
            } catch (error) {
                sendStats.errors++;
                logMessage(`❌ Fehler beim Senden an ${email}: ${error.message}`, 'error');
            }
            
            // Progress Update
            updateProgress(i + 1, recipients.length);
            
            // Verzögerung (außer beim letzten)
            if (i < recipients.length - 1) {
                await new Promise(resolve => setTimeout(resolve, delay * 1000));
            }
        }

        // Versand abgeschlossen
        const totalTime = Math.round((Date.now() - startTime) / 1000);
        completeCapaign(totalTime);
    }

    /**
     * Einzelne E-Mail senden
     */
    async function sendSingleEmail(email, data) {
        // EmailJS Implementation
        const templateParams = {
            to_email: email,
            subject: data.subject,
            message: data.content,
            from_name: localStorage.getItem('fromName') || 'E-Mail Marketing Tool'
        };

        return window.emailjs.send(
            localStorage.getItem('emailjs_service_id'),
            localStorage.getItem('emailjs_template_id'),
            templateParams
        );
    }

    /**
     * Helper Functions
     */
    function showSection(id) {
        const element = document.getElementById(id);
        if (element) element.style.display = 'block';
    }

    function hideSection(id) {
        const element = document.getElementById(id);
        if (element) element.style.display = 'none';
    }

    function updateProgress(current, total, message = '') {
        const percentage = Math.round((current / total) * 100);
        const progressBar = document.getElementById('sendProgressBar');
        const progressText = document.getElementById('progressText');
        const progressStats = document.getElementById('progressStats');

        if (progressBar) progressBar.style.width = percentage + '%';
        if (progressText) progressText.textContent = message || `Versendet: ${current} von ${total}`;
        if (progressStats) progressStats.textContent = `${current} / ${total}`;
    }

    function logMessage(message, type = 'info') {
        const logContainer = document.getElementById('sendLog');
        if (!logContainer) return;

        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.textContent = `[${timestamp}] ${message}`;
        
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    function completeCapaign(totalTime) {
        isRunning = false;
        
        // Results anzeigen
        showSection('resultsContainer');
        document.getElementById('sentCount').textContent = sendStats.sent;
        document.getElementById('errorCount').textContent = sendStats.errors;
        document.getElementById('totalTime').textContent = totalTime + 's';
        
        // "Neue Kampagne" Button zeigen
        document.getElementById('newCampaignBtn').style.display = 'inline-block';
        
        logMessage(`🏁 Kampagne abgeschlossen! ${sendStats.sent} gesendet, ${sendStats.errors} Fehler`, 'info');
    }

    return {
        loadCampaignData,
        startCampaign,
        showPreview: () => alert('Preview-Funktion folgt später')
    };
})();

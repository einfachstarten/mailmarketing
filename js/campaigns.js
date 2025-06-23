/**
 * E-Mail Marketing Tool - Campaigns Management
 * Verwaltet gespeicherte Kampagnen und deren Versand
 */

window.Campaigns = (function() {
    'use strict';

    // ===== CAMPAIGNS STATE =====
    let campaigns = [];
    let activeCampaign = null;

    // ===== INITIALIZATION =====

    function init() {
        loadCampaigns();
        updateCampaignsList();
        
        console.log('✓ Campaigns module initialized');
    }

    // ===== CAMPAIGN MANAGEMENT =====

    /**
     * Lädt alle gespeicherten Kampagnen
     */
    function loadCampaigns() {
        try {
            campaigns = JSON.parse(localStorage.getItem('campaignDrafts') || '[]');
            console.log(`Loaded ${campaigns.length} campaigns`);
        } catch (error) {
            console.error('Error loading campaigns:', error);
            campaigns = [];
        }
    }

    /**
     * Prüft, ob neue Kampagnen vorliegen und aktualisiert ggf.
     */
    function checkForNewCampaigns() {
        try {
            const stored = JSON.parse(localStorage.getItem('campaignDrafts') || '[]');
            const storedIds = stored.map(c => c.id).join(',');
            const currentIds = campaigns.map(c => c.id).join(',');
            if (storedIds !== currentIds) {
                campaigns = stored;
                updateCampaignsList();
            }
        } catch (error) {
            console.error('Error checking campaigns:', error);
        }
    }

    /**
     * Aktualisiert Kampagnen-Liste
     */
    function updateCampaignsList() {
        const container = document.getElementById('campaignsList');
        if (!container) return;

        if (campaigns.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <h3>Keine Kampagnen vorhanden</h3>
                    <p>Erstelle deine erste Kampagne mit dem Mail Wizard</p>
                    <button class="btn btn-primary" onclick="showMailWizard()">
                        ➕ Erste Kampagne erstellen
                    </button>
                </div>
            `;
            return;
        }

        // Kampagnen nach Datum sortieren (neueste zuerst)
        const sortedCampaigns = [...campaigns].sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        const campaignsHTML = sortedCampaigns.map(campaign => `
            <div class="campaign-card" data-id="${campaign.id}">
                <div class="campaign-header">
                    <h4 class="campaign-title">${Utils.escapeHtml(campaign.name)}</h4>
                    <div class="campaign-status">
                        <span class="status-badge ${campaign.status}">${getStatusLabel(campaign.status)}</span>
                    </div>
                </div>
                
                <div class="campaign-details">
                    <div class="campaign-info">
                        <span class="info-item">📧 ${campaign.stats.total} Empfänger</span>
                        <span class="info-item">📅 ${new Date(campaign.createdAt).toLocaleDateString('de-DE')}</span>
                        <span class="info-item">📊 ${campaign.stats.sent}/${campaign.stats.total} gesendet</span>
                    </div>
                    
                    <div class="campaign-subject">
                        <strong>Betreff:</strong> ${Utils.escapeHtml(campaign.subject)}
                    </div>
                </div>
                
                <div class="campaign-actions">
                    <button class="btn btn-info btn-sm" onclick="Campaigns.previewCampaign('${campaign.id}')">
                        👁️ Vorschau
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="Campaigns.editCampaign('${campaign.id}')">
                        ✏️ Bearbeiten
                    </button>
                    ${campaign.status === 'draft' ? `
                        <button class="btn btn-success btn-sm" onclick="Campaigns.startCampaign('${campaign.id}')">
                            🚀 Senden
                        </button>
                    ` : ''}
                    <button class="btn btn-danger btn-sm" onclick="Campaigns.deleteCampaign('${campaign.id}')">
                        🗑️ Löschen
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = campaignsHTML;
    }

    /**
     * Startet Kampagnen-Versand
     */
    function startCampaign(campaignId) {
        const campaign = campaigns.find(c => c.id === campaignId);
        if (!campaign) {
            Utils.showToast('Kampagne nicht gefunden', 'error');
            return;
        }

        // Aktive Kampagne setzen
        activeCampaign = campaign;
        
        // UI für aktive Kampagne anzeigen
        showActiveCampaignUI(campaign);
        
        console.log('Starting campaign:', campaignId);
    }

    /**
     * Zeigt UI für aktive Kampagne
     */
    function showActiveCampaignUI(campaign) {
        const section = document.getElementById('activeCampaignSection');
        const container = document.getElementById('activeCampaignContainer');
        
        if (!section || !container) return;

        // UI-Container erstellen (DIESELBE wie im Mail Wizard)
        container.innerHTML = `
            <div class="active-campaign-card">
                <div class="campaign-header">
                    <h4>${Utils.escapeHtml(campaign.name)}</h4>
                    <button class="btn btn-secondary btn-sm" onclick="Campaigns.hideActiveCampaign()">
                        ✕ Schließen
                    </button>
                </div>
                
                <!-- Versand-Optionen -->
                <div class="send-options">
                    <div class="form-group">
                        <label for="activeCampaignSpeed">Versand-Geschwindigkeit:</label>
                        <select id="activeCampaignSpeed" class="form-control">
                            <option value="1000">Normal (1s Pause)</option>
                            <option value="2000" selected>Sicher (2s Pause)</option>
                            <option value="5000">Langsam (5s Pause)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="activeCampaignTestMode"> 
                            Test-Modus (nur erste 2 E-Mails)
                        </label>
                    </div>
                </div>
                
                <div class="send-actions">
                    <button id="startSendBtn" class="btn btn-success btn-large" onclick="Campaigns.executeCampaign('${campaign.id}')">
                        🚀 Kampagne jetzt senden
                    </button>
                </div>
                
                <!-- Progress (initially hidden) -->
                <div id="activeCampaignProgress" class="campaign-progress-section" style="display: none;">
                    <h4>📊 Versand-Fortschritt</h4>
                    <div class="progress-bar-container">
                        <div class="progress-bar">
                            <div id="activeCampaignProgressBar" class="progress-fill" style="width: 0%"></div>
                        </div>
                        <div class="progress-text">
                            <span id="activeCampaignProgressText">Bereit zum Versand</span>
                            <span id="activeCampaignProgressCount">0 / ${campaign.stats.total}</span>
                        </div>
                    </div>
                    
                    <!-- Live-Log -->
                    <div class="campaign-log">
                        <h5>📝 Versand-Log</h5>
                        <div id="activeCampaignLogContainer" class="log-container"></div>
                    </div>
                    
                    <div class="progress-actions">
                        <button id="pauseSendBtn" class="btn btn-warning" style="display: none;">
                            ⏸️ Pausieren
                        </button>
                        <button id="stopSendBtn" class="btn btn-danger" style="display: none;">
                            ⏹️ Stoppen
                        </button>
                    </div>
                </div>
            </div>
        `;

        section.style.display = 'block';
        container.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Führt Kampagnen-Versand aus (DIESELBE Logik wie Mail Wizard)
     */
    async function executeCampaign(campaignId) {
        const campaign = campaigns.find(c => c.id === campaignId);
        if (!campaign) return;

        try {
            const sendSpeed = parseInt(document.getElementById('activeCampaignSpeed')?.value) || 2000;
            const testMode = document.getElementById('activeCampaignTestMode')?.checked || false;

            let recipients = [...campaign.selectedRecipients];
            if (testMode) {
                recipients = recipients.slice(0, 2);
                logToActiveCampaign(`🧪 Test-Modus: Sende nur an ${recipients.length} Empfänger`);
            }

            // UI für Versand vorbereiten
            document.getElementById('activeCampaignProgress').style.display = 'block';
            document.getElementById('startSendBtn').disabled = true;

            ProgressManager.init({
                containerId: 'activeCampaignProgress',
                type: 'campaign',
                total: recipients.length
            });
            ProgressManager.log('🚀 Kampagne gestartet');

            for (let i = 0; i < recipients.length; i++) {
                const recipient = recipients[i];

                try {
                    ProgressManager.update(i, recipients.length, `Sende an ${recipient.email}...`);
                    ProgressManager.log(`📧 Sende an ${recipient.email}`);
                    await sendPersonalizedEmail(campaign, recipient);
                    ProgressManager.log(`✅ Erfolgreich: ${recipient.email}`, 'success');
                } catch (error) {
                    ProgressManager.log(`❌ Fehler: ${recipient.email} - ${error.message}`, 'error');
                }

                if (i < recipients.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, sendSpeed));
                }
            }

            ProgressManager.complete('🎉 Kampagne abgeschlossen!');
            ProgressManager.hide(5000);

            const duration = Math.round((Date.now() - startTime) / 1000);
            logToActiveCampaign(`🎉 Kampagne abgeschlossen: ${sent} gesendet, ${errors} Fehler in ${duration}s`);

            // Kampagne-Status updaten
            campaign.status = 'sent';
            campaign.stats.sent = sent;
            campaign.stats.errors = errors;
            saveCampaigns();
            updateCampaignsList();

        } catch (error) {
            console.error('Campaign execution error:', error);
            logToActiveCampaign(`❌ Fehler: ${error.message}`, 'error');
        }
    }

    // ===== UTILITY FUNCTIONS =====

    function getStatusLabel(status) {
        const labels = {
            draft: 'Entwurf',
            sending: 'Wird gesendet',
            sent: 'Gesendet',
            error: 'Fehler'
        };
        return labels[status] || status;
    }

    function saveCampaigns() {
        try {
            localStorage.setItem('campaignDrafts', JSON.stringify(campaigns));
        } catch (error) {
            console.error('Error saving campaigns:', error);
        }
    }

    function logToActiveCampaign(message, type = 'info') {
        const logContainer = document.getElementById('activeCampaignLogContainer');
        if (!logContainer) return;

        const timestamp = new Date().toLocaleTimeString('de-DE');
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry log-${type}`;
        logEntry.innerHTML = `<span class="log-time">[${timestamp}]</span> ${message}`;

        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }


    // Verwende dieselbe sendPersonalizedEmail Funktion wie Mail Wizard
    async function sendPersonalizedEmail(campaign, recipient) {
        let personalizedSubject = campaign.subject;
        let personalizedContent = campaign.content;

        if (window.Templates && typeof Templates.personalizeContent === 'function') {
            personalizedSubject = Templates.personalizeContent(campaign.subject, recipient);
            personalizedContent = Templates.personalizeContent(campaign.content, recipient);
        }

        const config = window.Config ? Config.getConfig() : {
            serviceId: localStorage.getItem('emailjs_service_id'),
            templateId: localStorage.getItem('emailjs_template_id'),
            fromName: localStorage.getItem('fromName')
        };

        const templateParams = {
            subject: personalizedSubject,
            message: personalizedContent,
            to_email: recipient.email,
            name: config.fromName,
            email: recipient.email
        };

        const response = await emailjs.send(config.serviceId, config.templateId, templateParams);

        if (response.status !== 200) {
            throw new Error(`EmailJS Status: ${response.status}`);
        }

        return response;
    }

    // ===== PUBLIC API =====
    return {
        init,
        loadCampaigns,
        updateCampaignsList,
        startCampaign,
        executeCampaign,
        previewCampaign: (id) => console.log('Preview campaign:', id),
        editCampaign: (id) => console.log('Edit campaign:', id),
        deleteCampaign: (id) => {
            Utils.showConfirm('Kampagne wirklich löschen?', () => {
                campaigns = campaigns.filter(c => c.id !== id);
                saveCampaigns();
                updateCampaignsList();
            });
        },
        hideActiveCampaign: () => {
            document.getElementById('activeCampaignSection').style.display = 'none';
            activeCampaign = null;
        },
        refreshList: () => {
            loadCampaigns();
            updateCampaignsList();
        },
        checkForNewCampaigns
    };
})();

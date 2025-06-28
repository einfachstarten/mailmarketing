/**
 * E-Mail Marketing Tool - Landing Page Integration
 * Verbindet Dashboard-Buttons mit den vorhandenen Modulen
 */

// ===== NAVIGATION FUNCTIONS =====

/**
 * Startet den Setup-Wizard
 * Verwendet das vorhandene Wizard-Modul
 */
function startSetup() {
    try {
        // Prüfe ob Wizard-Modul verfügbar ist
        if (window.Wizard && typeof window.Wizard.show === 'function') {
            window.Wizard.show();
        } else {
            console.error('Wizard module not found');
            // Temporärer Fallback bis Tab-System verfügbar ist
            Utils.showToast('Setup-Wizard wird geladen...', 'info');
        }
    } catch (error) {
        console.error('Error starting setup:', error);
        Utils.showToast('Fehler beim Starten des Setup-Wizards: ' + error.message, 'error');
    }
}

/**
 * Öffnet den Template Editor
 * Wechselt zur Templates-Ansicht in der Hauptanwendung
 */
function showTemplateEditor() {
    try {
        // Prüfe ob App-Modul verfügbar ist
        if (window.App && typeof window.App.showTab === 'function') {
            window.App.showTab('templates');
        } else {
            // Fallback: Direkte Navigation
            window.location.href = '/app.html#templates';
        }
    } catch (error) {
        console.error('Error opening template editor:', error);
        // Temporärer Fallback bis Tab-System verfügbar ist
        Utils.showToast('Template Editor wird geladen...', 'info');
    }
}

/**
 * Startet den Mail Wizard
 * Verwendet das MailWizard-Modul für geführten E-Mail-Versand
 */
function showMailWizard() {
    try {
        // Erweiterte Setup-Prüfung
        const isConfigured = localStorage.getItem('emailjs_configured') === 'true';
        const serviceId = localStorage.getItem('emailjs_service_id');

        if (!isConfigured || !serviceId) {
            Utils.showConfirm(
                'Setup noch nicht abgeschlossen. Jetzt konfigurieren?',
                () => {
                    startSetup();
                }
            );
            return;
        }

        // Mail Wizard starten
        if (window.MailWizard && typeof window.MailWizard.startWizard === 'function') {
            window.MailWizard.startWizard();
        } else {
            Utils.showToast('Mail Wizard wird geladen...', 'info');
        }
    } catch (error) {
        console.error('Error starting mail wizard:', error);
        Utils.showToast('Fehler beim Starten des Mail Wizards: ' + error.message, 'error');
    }
}

/**
 * Zeigt Empfänger-Verwaltung
 * Wechselt zur Recipients-Ansicht
 */
function showRecipients() {
    try {
        // Prüfe ob App-Modul verfügbar ist
        if (window.App && typeof window.App.showTab === 'function') {
            window.App.showTab('recipients');
        } else {
            // Fallback: Navigation
        }
    } catch (error) {
        console.error('Error opening recipients:', error);
        // Temporärer Fallback bis Tab-System verfügbar ist
        Utils.showToast('Empfänger-Verwaltung wird geladen...', 'info');
    }
}

/**
 * Zeigt Versand-Verlauf
 * Wechselt zur History-Ansicht
 */
function showHistory() {
    try {
        // Prüfe ob App-Modul verfügbar ist
        if (window.App && typeof window.App.showTab === 'function') {
            window.App.showTab('history');
        } else {
            // Fallback: Navigation
        }
    } catch (error) {
        console.error('Error opening history:', error);
        // Temporärer Fallback bis Tab-System verfügbar ist
        Utils.showToast('Verlauf wird geladen...', 'info');
    }
}

// ===== SETUP STATUS MANAGEMENT =====

/**
 * Prüft und zeigt Setup-Status an
 * Erweiterte Version mit echter Funktionalität
 */
function checkSetupStatus() {
    try {
        const setupStatus = document.getElementById('setupStatus');
        if (!setupStatus) {
            console.warn('Setup status element not found');
            return;
        }

        // Prüfe Setup-Konfiguration
        const isConfigured = localStorage.getItem('emailjs_configured') === 'true';
        const serviceId = localStorage.getItem('emailjs_service_id');
        const templateId = localStorage.getItem('emailjs_template_id');
        const fromName = localStorage.getItem('fromName');

        if (isConfigured && serviceId && templateId && fromName) {
            // Setup komplett - Banner ausblenden
            setupStatus.style.display = 'none';
        } else {
            // Setup erforderlich - Banner anzeigen
            setupStatus.style.display = 'block';
            setupStatus.className = 'setup-status needs-setup';
            setupStatus.innerHTML = `
                <div class="status-icon">⚙️</div>
                <div class="status-text">
                    <div class="status-title">Setup erforderlich</div>
                    <div class="status-desc">Tool noch nicht konfiguriert - Setup Wizard starten</div>
                </div>
                <button class="btn-primary" onclick="startSetup()">
                    Setup starten
                </button>
            `;
        }

        // Update Dashboard-Statistiken
        updateDashboardStats();

    } catch (error) {
        console.error('Error checking setup status:', error);
    }
}

/**
 * Aktualisiert Dashboard-Statistiken
 */
function updateDashboardStats() {
    try {
        // Empfänger-Anzahl
        const recipientCount = getRecipientCount();
        updateStatElement('recipientCount', recipientCount);
        
        // Template-Anzahl
        const templateCount = getTemplateCount();
        updateStatElement('templateCount', templateCount);
        
        // Letzte Kampagne
        const lastCampaign = getLastCampaignInfo();
        updateStatElement('lastCampaign', lastCampaign);
        
    } catch (error) {
        console.error('Error updating dashboard stats:', error);
    }
}

/**
 * Hilfsfunktion: Empfänger-Anzahl ermitteln
 */
function getRecipientCount() {
    try {
        const recipients = JSON.parse(localStorage.getItem('recipients') || '[]');
        return recipients.length;
    } catch {
        return 0;
    }
}

/**
 * Hilfsfunktion: Template-Anzahl ermitteln
 */
function getTemplateCount() {
    try {
        const templates = JSON.parse(localStorage.getItem('emailTemplates') || '[]');
        return templates.length;
    } catch {
        return 0;
    }
}

/**
 * Hilfsfunktion: Info zur letzten Kampagne
 */
function getLastCampaignInfo() {
    try {
        const history = JSON.parse(localStorage.getItem('mailHistory') || '[]');
        if (history.length > 0) {
            const last = history[history.length - 1];
            return `${new Date(last.timestamp).toLocaleDateString()} (${last.recipientCount} Empfänger)`;
        }
        return 'Keine Kampagnen';
    } catch {
        return 'Unbekannt';
    }
}

/**
 * Hilfsfunktion: Statistik-Element aktualisieren
 */
function updateStatElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

/**
 * Zeigt Settings Modal
 */
function showSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (!modal) return;

    // Aktuelle Settings laden
    loadCurrentSettings();

    modal.classList.remove('hidden');
}

/**
 * Versteckt Settings Modal
 */
function hideSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

/**
 * Lädt aktuelle Settings ins Modal
 */
function loadCurrentSettings() {
    try {
        // EmailJS Config laden
        const config = Config ? Config.getConfig() : {};

        // Fallback auf localStorage wenn Config-Modul nicht verfügbar
        const settings = {
            serviceId: config.serviceId || localStorage.getItem('emailjs_service_id') || '',
            templateId: config.templateId || localStorage.getItem('emailjs_template_id') || '',
            userId: config.userId || localStorage.getItem('emailjs_user_id') || '',
            fromName: config.fromName || localStorage.getItem('fromName') || ''
        };

        // Settings in Felder laden
        document.getElementById('settings-serviceId').value = settings.serviceId;
        document.getElementById('settings-templateId').value = settings.templateId;
        document.getElementById('settings-userId').value = settings.userId;
        document.getElementById('settings-fromName').value = settings.fromName;

        // App-Settings
        document.getElementById('settings-sendSpeed').value = localStorage.getItem('sendSpeed') || '1000';
        document.getElementById('settings-autoSave').checked = localStorage.getItem('autoSaveTemplates') !== 'false';

        // Status-Info
        updateSettingsStatusInfo();

    } catch (error) {
        console.error('Error loading settings:', error);
        Utils.showToast('Fehler beim Laden der Einstellungen', 'error');
    }
}

/**
 * Speichert Settings
 */
function saveSettings() {
    try {
        const newConfig = {
            serviceId: document.getElementById('settings-serviceId').value.trim(),
            templateId: document.getElementById('settings-templateId').value.trim(),
            userId: document.getElementById('settings-userId').value.trim(),
            fromName: document.getElementById('settings-fromName').value.trim(),
            setupCompleted: true
        };

        // Validierung
        if (!newConfig.serviceId || !newConfig.templateId || !newConfig.userId || !newConfig.fromName) {
            Utils.showToast('Bitte alle Felder ausfüllen', 'error');
            return;
        }

        // Config speichern
        if (Config) {
            const success = Config.saveConfig(newConfig);
            if (!success) {
                Utils.showToast('Fehler beim Speichern der EmailJS-Konfiguration', 'error');
                return;
            }
        }

        // App-Settings
        localStorage.setItem('sendSpeed', document.getElementById('settings-sendSpeed').value);
        localStorage.setItem('autoSaveTemplates', document.getElementById('settings-autoSave').checked);

        // UI aktualisieren
        Utils.showToast('Einstellungen gespeichert!', 'success');

        // Setup-Status neu laden
        setTimeout(() => {
            checkSetupStatus();
            hideSettingsModal();
        }, 1000);

    } catch (error) {
        console.error('Error saving settings:', error);
        Utils.showToast('Fehler beim Speichern', 'error');
    }
}

/**
 * Setzt alle Daten zurück
 */
function resetSettings() {
    Utils.showConfirm(
        'Wirklich alle Daten löschen? Dies kann nicht rückgängig gemacht werden!',
        () => {
            // Alle relevanten localStorage Keys löschen
            const keysToDelete = [
            'emailjs_service_id', 'emailjs_template_id', 'emailjs_user_id', 'fromName',
            'emailjs_configured', 'recipients', 'emailTemplates', 'emailConfig',
            'appSettings', 'sendSpeed', 'autoSaveTemplates'
            ];

            keysToDelete.forEach(key => localStorage.removeItem(key));

            // Page reload
            location.reload();
        }
    );
}

/**
 * Aktualisiert Status-Info im Settings Modal
 */
function updateSettingsStatusInfo() {
    const isConfigured = localStorage.getItem('emailjs_configured') === 'true';
    document.getElementById('settings-setupStatus').textContent = isConfigured ? '✅ Konfiguriert' : '❌ Nicht konfiguriert';
    document.getElementById('settings-recipientCount').textContent = getRecipientCount();
    document.getElementById('settings-templateCount').textContent = getTemplateCount();
}

// ===== KEYBOARD SHORTCUTS =====

/**
 * Registriert Keyboard Shortcuts für das Dashboard
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Nur wenn kein Input-Feld fokussiert ist
        if (document.activeElement.tagName === 'INPUT' || 
            document.activeElement.tagName === 'TEXTAREA') {
            return;
        }
        
        // Shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 's': // Ctrl+S = Setup
                    e.preventDefault();
                    startSetup();
                    break;
                case 'm': // Ctrl+M = Mail Wizard
                    e.preventDefault();
                    showMailWizard();
                    break;
                case 't': // Ctrl+T = Templates
                    e.preventDefault();
                    showTemplateEditor();
                    break;
                case 'r': // Ctrl+R = Recipients (override default refresh)
                    if (e.shiftKey) {
                        e.preventDefault();
                        showRecipients();
                    }
                    break;
            }
        }
        
        // Escape = Schließe aktive Modals
        if (e.key === 'Escape') {
            closeActiveModals();
        }
    });
}

/**
 * Schließt alle aktiven Modals
 */
function closeActiveModals() {
    // Setup Wizard schließen
    if (window.Wizard && typeof window.Wizard.hide === 'function') {
        window.Wizard.hide();
    }
    
    // Mail Wizard schließen
    if (window.MailWizard && typeof window.MailWizard.hideWizardModal === 'function') {
        window.MailWizard.hideWizardModal();
    }
}

// ===== INITIALIZATION =====

/**
 * Initialisiert das Landing-Page-System
 */
function initializeLandingPage() {
    
    try {
        // Setup-Status prüfen
        checkSetupStatus();
        
        // Keyboard Shortcuts registrieren
        setupKeyboardShortcuts();
        
        // Periodische Updates (alle 30 Sekunden)
        setInterval(updateDashboardStats, 30000);
        
        
    } catch (error) {
        console.error('Error initializing landing page:', error);
    }
}

// ===== EVENT LISTENERS =====

// Setup-Status beim Laden prüfen
document.addEventListener('DOMContentLoaded', function() {
    initializeLandingPage();
});

// Fokus-Events für Live-Updates
window.addEventListener('focus', function() {
    // Seite wurde fokussiert - Status aktualisieren
    checkSetupStatus();
});

// Storage-Events für Cross-Tab-Updates
window.addEventListener('storage', function(e) {
    if (e.key === 'emailjs_configured' || e.key === 'recipients' || e.key === 'emailTemplates') {
        checkSetupStatus();
    }
});

// ===== UTILITY FUNCTIONS =====

/**
 * Prüft ob erforderliche Module geladen sind
 */
function checkModuleAvailability() {
    const modules = {
        'Wizard': window.Wizard,
        'MailWizard': window.MailWizard,
        'App': window.App,
        'Utils': window.Utils,
        'Config': window.Config
    };
    
    const missing = Object.entries(modules)
        .filter(([name, module]) => !module)
        .map(([name]) => name);
    
    if (missing.length > 0) {
        console.warn('Missing modules:', missing);
    }
    
    return missing.length === 0;
}

/**
 * Debug-Funktion für Entwicklung
 */
function debugInfo() {
    return {
        setupComplete: localStorage.getItem('emailjs_configured') === 'true',
        recipients: getRecipientCount(),
        templates: getTemplateCount(),
        modules: checkModuleAvailability(),
        localStorage: Object.keys(localStorage).filter(key => key.includes('email') || key.includes('mail'))
    };
}

// Debug-Funktion global verfügbar machen (nur für Entwicklung)
window.debugLandingPage = debugInfo;

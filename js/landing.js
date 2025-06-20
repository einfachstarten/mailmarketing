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
            console.log('Starting setup wizard...');
            window.Wizard.show();
        } else {
            console.error('Wizard module not found');
            // Fallback: Zur Setup-Seite navigieren
            if (confirm('Setup-Wizard lädt... Zur Setup-Seite wechseln?')) {
                window.location.href = '/setup.html';
            }
        }
    } catch (error) {
        console.error('Error starting setup:', error);
        alert('Fehler beim Starten des Setup-Wizards: ' + error.message);
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
            console.log('Switching to template editor...');
            window.App.showTab('templates');
        } else {
            // Fallback: Direkte Navigation
            console.log('App module not found, using fallback navigation');
            window.location.href = '/app.html#templates';
        }
    } catch (error) {
        console.error('Error opening template editor:', error);
        // Weitere Fallback-Option
        if (confirm('Template Editor laden? (Neue Seite)')) {
            window.location.href = '/templates.html';
        }
    }
}

/**
 * Startet den Mail Wizard
 * Verwendet das MailWizard-Modul für geführten E-Mail-Versand
 */
function showMailWizard() {
    try {
        // Prüfe Setup-Status
        const isConfigured = localStorage.getItem('emailjs_configured') === 'true';
        
        if (!isConfigured) {
            if (confirm('Setup noch nicht abgeschlossen. Jetzt konfigurieren?')) {
                startSetup();
                return;
            }
        }
        
        // Mail Wizard starten
        if (window.MailWizard && typeof window.MailWizard.startWizard === 'function') {
            console.log('Starting mail wizard...');
            window.MailWizard.startWizard();
        } else if (window.App && typeof window.App.showTab === 'function') {
            // Fallback: Zur Mail-Tab wechseln
            console.log('MailWizard module not found, switching to mail tab');
            window.App.showTab('mail');
        } else {
            // Letzter Fallback: Navigation
            console.log('Using fallback navigation to mail page');
            window.location.href = '/app.html#mail';
        }
    } catch (error) {
        console.error('Error starting mail wizard:', error);
        alert('Fehler beim Starten des Mail Wizards: ' + error.message);
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
            console.log('Switching to recipients management...');
            window.App.showTab('recipients');
        } else {
            // Fallback: Navigation
            console.log('App module not found, using fallback navigation');
            window.location.href = '/app.html#recipients';
        }
    } catch (error) {
        console.error('Error opening recipients:', error);
        // Weitere Fallback-Option
        if (confirm('Empfänger-Verwaltung laden? (Neue Seite)')) {
            window.location.href = '/recipients.html';
        }
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
            console.log('Switching to mail history...');
            window.App.showTab('history');
        } else {
            // Fallback: Navigation
            console.log('App module not found, using fallback navigation');
            window.location.href = '/app.html#history';
        }
    } catch (error) {
        console.error('Error opening history:', error);
        // Weitere Fallback-Option
        if (confirm('Verlauf laden? (Neue Seite)')) {
            window.location.href = '/history.html';
        }
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
        const fromName = localStorage.getItem('fromName');
        
        if (isConfigured && serviceId && fromName) {
            // Setup komplett
            setupStatus.className = 'setup-status configured';
            setupStatus.innerHTML = `
                <div class="status-icon">✅</div>
                <div class="status-text">
                    <div class="status-title">Tool konfiguriert</div>
                    <div class="status-desc">Bereit für E-Mail-Kampagnen</div>
                    <div class="status-details">Service: ${serviceId.substring(0, 15)}... | Von: ${fromName}</div>
                </div>
                <button class="btn-primary" onclick="showMailWizard()">
                    Kampagne starten
                </button>
            `;
        } else {
            // Setup erforderlich
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
        
        // Update Dashboard-Statistiken wenn verfügbar
        updateDashboardStats();
        
    } catch (error) {
        console.error('Error checking setup status:', error);
        
        // Fallback-Anzeige
        const setupStatus = document.getElementById('setupStatus');
        if (setupStatus) {
            setupStatus.innerHTML = `
                <div class="status-icon">❌</div>
                <div class="status-text">
                    <div class="status-title">Status unbekannt</div>
                    <div class="status-desc">Fehler beim Laden des Setup-Status</div>
                </div>
                <button class="btn-secondary" onclick="startSetup()">
                    Setup prüfen
                </button>
            `;
        }
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
    console.log('Initializing landing page...');
    
    try {
        // Setup-Status prüfen
        checkSetupStatus();
        
        // Keyboard Shortcuts registrieren
        setupKeyboardShortcuts();
        
        // Periodische Updates (alle 30 Sekunden)
        setInterval(updateDashboardStats, 30000);
        
        console.log('✓ Landing page initialized');
        
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

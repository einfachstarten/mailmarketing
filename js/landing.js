// Grundlegende JavaScript-Funktionen für die Navigation
function startSetup() {
    window.location.href = 'app.html?setup=1';
}

function showTemplateEditor() {
    window.location.href = 'app.html?tab=template';
}

function showMailWizard() {
    window.location.href = 'app.html?mailwizard=1';
}

function showRecipients() {
    window.location.href = 'app.html?tab=recipients';
}

function showHistory() {
    window.location.href = 'app.html?tab=send';
}

// Setup-Status prüfen (würde normalerweise aus localStorage gelesen)
function checkSetupStatus() {
    const setupStatus = document.getElementById('setupStatus');
    
    // Konfiguration aus LocalStorage lesen
    const cfgRaw = localStorage.getItem('emailConfig');
    let isConfigured = false;
    if (cfgRaw) {
        try {
            const cfg = JSON.parse(cfgRaw);
            isConfigured = cfg && cfg.setupCompleted && cfg.serviceId && cfg.templateId && cfg.userId && cfg.fromName;
        } catch (e) {
            console.warn('Unable to parse emailConfig from storage');
        }
    }
    
    if (isConfigured) {
        setupStatus.className = 'setup-status configured';
        setupStatus.innerHTML = `
            <div class="status-icon">✅</div>
            <div class="status-text">
                <div class="status-title">Tool konfiguriert</div>
                <div class="status-desc">Bereit für E-Mail-Kampagnen</div>
            </div>
            <button class="btn-primary" onclick="showMailWizard()">
                Kampagne starten
            </button>
        `;
    }
}

// Setup-Status beim Laden prüfen
document.addEventListener('DOMContentLoaded', checkSetupStatus);

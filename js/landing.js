// Grundlegende JavaScript-Funktionen für die Navigation
function startSetup() {

}

// Setup-Status prüfen (würde normalerweise aus localStorage gelesen)
function checkSetupStatus() {
    const setupStatus = document.getElementById('setupStatus');
    
main
    
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

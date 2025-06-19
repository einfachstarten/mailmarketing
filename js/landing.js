// Grundlegende JavaScript-Funktionen für die Navigation
function startSetup() {
    alert('Setup Wizard wird geladen...\n(Integration mit bestehendem Setup-Code erforderlich)');
    // Hier würde der bestehende Wizard.show() aufgerufen
}

function showTemplateEditor() {
    alert('Template Editor wird geladen...\n(Integration mit Templates-Modul erforderlich)');
    // Hier würde zur Template-Ansicht gewechselt
}

function showMailWizard() {
    alert('Mail Wizard wird geladen...\n(Integration mit MailWizard-Modul erforderlich)');
    // Hier würde der MailWizard geöffnet
}

function showRecipients() {
    alert('Empfänger-Verwaltung wird geladen...\n(Integration mit Recipients-Modul erforderlich)');
    // Hier würde zur Empfänger-Verwaltung gewechselt
}

function showHistory() {
    alert('Verlauf wird geladen...\n(Integration mit History-Modul erforderlich)');
    // Hier würde der Versand-Verlauf angezeigt
}

// Setup-Status prüfen (würde normalerweise aus localStorage gelesen)
function checkSetupStatus() {
    const setupStatus = document.getElementById('setupStatus');
    
    // Beispiel: Setup als konfiguriert anzeigen
    // In der echten App würde hier der tatsächliche Status geprüft
    const isConfigured = localStorage.getItem('emailjs_configured') === 'true';
    
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

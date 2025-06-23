/**
 * E-Mail Marketing Tool - Setup Wizard
 * Verwaltet den 3-Schritt Setup-Prozess für neue Benutzer
 */

window.Wizard = (function() {
    'use strict';

    // ===== WIZARD STATE =====
    let currentStep = 1;
    let isVisible = false;
    let wizardData = {
        serviceId: '',
        templateId: '',
        userId: '',
        fromName: '',
        testEmail: ''
    };

    // ===== INITIALIZATION =====

    /**
     * Initialisiert das Wizard-Modul
     */
    function init() {
        console.log('✓ Wizard module initialized');
    }

    // ===== WIZARD DISPLAY MANAGEMENT =====

    /**
     * Zeigt den Setup-Wizard an
     */
    function show() {
        try {
            // Wizard-State zurücksetzen
            currentStep = 1;
            resetWizardData();
            
            // Gespeicherte Konfiguration laden wenn vorhanden
            loadExistingConfig();
            
            // UI aktualisieren
            updateWizardStep();
            
            // Wizard anzeigen
            const wizardOverlay = document.getElementById('setupWizard');
            if (wizardOverlay) {
                wizardOverlay.classList.remove('hidden');
                isVisible = true;
                
                // Fokus auf erstes Eingabefeld
                Utils.focusElement('wizard-serviceId', 200);
                
                console.log('Setup wizard shown');
            }
        } catch (error) {
            console.error('Error showing wizard:', error);
        }
    }

    /**
     * Versteckt den Setup-Wizard
     */
    function hide() {
        try {
            const wizardOverlay = document.getElementById('setupWizard');
            if (wizardOverlay) {
                wizardOverlay.classList.add('hidden');
                isVisible = false;
                console.log('Setup wizard hidden');
            }
        } catch (error) {
            console.error('Error hiding wizard:', error);
        }
    }

    /**
     * Setzt Wizard-Daten zurück
     */
    function resetWizardData() {
        wizardData = {
            serviceId: '',
            templateId: '',
            userId: '',
            fromName: '',
            testEmail: ''
        };
        
        // UI-Felder zurücksetzen
        const fields = ['wizard-serviceId', 'wizard-templateId', 'wizard-userId', 'wizard-fromName', 'wizard-testEmail'];
        fields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) {
                element.value = '';
            }
        });
        
        // Test-Ergebnis zurücksetzen
        clearTestResults();
    }

    /**
     * Lädt existierende Konfiguration in Wizard-Felder
     */
    function loadExistingConfig() {
        if (!Config) return;
        
        const config = Config.getConfig();
        if (config) {
            // Wizard-Felder mit vorhandenen Daten füllen
            updateWizardField('wizard-serviceId', config.serviceId);
            updateWizardField('wizard-templateId', config.templateId);
            updateWizardField('wizard-userId', config.userId);
            updateWizardField('wizard-fromName', config.fromName);
        }
    }

    /**
     * Aktualisiert ein Wizard-Feld
     * @param {string} fieldId - ID des Felds
     * @param {string} value - Wert zum Setzen
     */
    function updateWizardField(fieldId, value) {
        const element = document.getElementById(fieldId);
        if (element && value) {
            element.value = value;
        }
    }

    // ===== STEP NAVIGATION =====

    /**
     * Geht zum nächsten Schritt
     */
    function nextStep() {
        if (!validateCurrentStep()) {
            return;
        }

        if (currentStep < 3) {
            currentStep++;
            updateWizardStep();
        }
    }

    /**
     * Geht zum vorherigen Schritt
     */
    function previousStep() {
        if (currentStep > 1) {
            currentStep--;
            updateWizardStep();
        }
    }

    /**
     * Aktualisiert die Wizard-UI für aktuellen Schritt
     */
    function updateWizardStep() {
        try {
            // Alle Steps verstecken
            document.querySelectorAll('.wizard-step').forEach(step => {
                step.classList.remove('active');
            });

            // Progress Indicators aktualisieren
            for (let i = 1; i <= 3; i++) {
                const indicator = document.getElementById(`step${i}-indicator`);
                if (indicator) {
                    indicator.classList.remove('active', 'completed');
                    
                    if (i < currentStep) {
                        indicator.classList.add('completed');
                    } else if (i === currentStep) {
                        indicator.classList.add('active');
                    }
                }
            }

            // Aktuellen Step anzeigen
            const currentStepElement = document.getElementById(`wizard-step-${currentStep}`);
            if (currentStepElement) {
                currentStepElement.classList.add('active');
            }

            // Buttons aktualisieren
            updateWizardButtons();

            console.log(`Wizard step updated to: ${currentStep}`);

        } catch (error) {
            console.error('Error updating wizard step:', error);
        }
    }

    /**
     * Aktualisiert Wizard-Buttons basierend auf aktuellem Schritt
     */
    function updateWizardButtons() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const finishBtn = document.getElementById('finishBtn');

        if (prevBtn) {
            prevBtn.disabled = currentStep === 1;
        }

        if (nextBtn) {
            nextBtn.style.display = currentStep === 3 ? 'none' : 'inline-block';
        }

        if (finishBtn) {
            finishBtn.style.display = currentStep === 3 ? 'inline-block' : 'none';
            finishBtn.classList.toggle('hidden', currentStep !== 3);
        }
    }

    // ===== VALIDATION =====

    /**
     * Validiert den aktuellen Schritt
     * @returns {boolean} true wenn gültig
     */
    function validateCurrentStep() {
        switch (currentStep) {
            case 1:
                return validateStep1();
            case 2:
                return validateStep2();
            case 3:
                return true; // Schritt 3 hat keine Pflichtfelder
            default:
                return false;
        }
    }

    /**
     * Validiert Schritt 1 (EmailJS Konfiguration)
     * @returns {boolean} true wenn gültig
     */
    function validateStep1() {
        const serviceId = getWizardFieldValue('wizard-serviceId');
        const templateId = getWizardFieldValue('wizard-templateId');
        const userId = getWizardFieldValue('wizard-userId');

        if (!serviceId || !templateId || !userId) {
            showError('Bitte alle EmailJS-Felder ausfüllen');
            return false;
        }

        if (!Utils.isValidServiceId(serviceId)) {
            showError('Service ID sollte mit "service_" beginnen');
            focusWizardField('wizard-serviceId');
            return false;
        }

        if (!Utils.isValidTemplateId(templateId)) {
            showError('Template ID sollte mit "template_" beginnen');
            focusWizardField('wizard-templateId');
            return false;
        }

        if (!Utils.isValidUserId(userId)) {
            showError('Public Key ist ungültig oder zu kurz');
            focusWizardField('wizard-userId');
            return false;
        }

        // EmailJS initialisieren für Tests
        try {
            if (window.emailjs) {
                window.emailjs.init(userId);
            }
            return true;
        } catch (error) {
            showError('Fehler bei EmailJS Initialisierung: ' + error.message);
            return false;
        }
    }

    /**
     * Validiert Schritt 2 (Absender-Informationen)
     * @returns {boolean} true wenn gültig
     */
    function validateStep2() {
        const fromName = getWizardFieldValue('wizard-fromName');
        const testEmail = getWizardFieldValue('wizard-testEmail');

        if (!fromName) {
            showError('Bitte deinen Namen eingeben');
            focusWizardField('wizard-fromName');
            return false;
        }

        if (!testEmail || !Utils.isValidEmail(testEmail)) {
            showError('Bitte gültige E-Mail-Adresse eingeben');
            focusWizardField('wizard-testEmail');
            return false;
        }

        return true;
    }

    // ===== TEST EMAIL =====

    /**
     * Sendet Test-E-Mail
     */
    async function sendTestEmail() {
        const testBtn = document.getElementById('testEmailBtn');
        const spinner = document.getElementById('testSpinner');
        const result = document.getElementById('testResult');

        if (!testBtn || !spinner || !result) {
            console.error('Test email UI elements not found');
            return;
        }

        try {
            // UI für Senden vorbereiten
            testBtn.disabled = true;
            spinner.classList.remove('hidden');
            result.innerHTML = '';

            // Daten aus Wizard-Feldern holen
            const serviceId = getWizardFieldValue('wizard-serviceId');
            const templateId = getWizardFieldValue('wizard-templateId');
            const fromName = getWizardFieldValue('wizard-fromName');
            const testEmail = getWizardFieldValue('wizard-testEmail');

            // Template-Parameter für Test-E-Mail
            const templateParams = {
                to_name: fromName,
                to_email: testEmail,
                from_name: fromName,
                subject: 'Test E-Mail - Setup erfolgreich! 🎉',
                message: createTestEmailContent(fromName)
            };

            console.log('Sending test email...', { to: testEmail, from: fromName });

            // E-Mail senden
            const response = await window.emailjs.send(serviceId, templateId, templateParams);
            
            if (response.status === 200) {
                showTestSuccess();
                saveWizardConfig();
                showSetupComplete();
            } else {
                throw new Error(`Unerwarteter Status: ${response.status}`);
            }

        } catch (error) {
            console.error('Test email error:', error);
            showTestError(error.message);
        } finally {
            testBtn.disabled = false;
            spinner.classList.add('hidden');
        }
    }

    /**
     * Erstellt Inhalt für Test-E-Mail
     * @param {string} fromName - Name des Absenders
     * @returns {string} HTML-Content für Test-E-Mail
     */
    function createTestEmailContent(fromName) {
        return `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4a90e2;">🎉 Glückwunsch!</h2>
                <p>Dein E-Mail Marketing Tool ist erfolgreich eingerichtet und funktioniert perfekt.</p>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #4a90e2; margin-top: 0;">✅ Was funktioniert:</h3>
                    <ul>
                        <li>EmailJS-Konfiguration</li>
                        <li>E-Mail-Versand</li>
                        <li>Template-System</li>
                        <li>Personalisierung</li>
                    </ul>
                </div>
                
                <p><strong>Du kannst jetzt:</strong></p>
                <ul>
                    <li>📝 Templates erstellen und bearbeiten</li>
                    <li>👥 Empfänger-Listen verwalten</li>
                    <li>🚀 Personalisierte E-Mail-Kampagnen versenden</li>
                </ul>
                
                <p>Viel Erfolg mit deinen E-Mail-Kampagnen!</p>
                
                <p style="margin-top: 30px;">
                    Liebe Grüße,<br>
                    <strong>${fromName}</strong>
                </p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="font-size: 12px; color: #888; text-align: center;">
                    Diese Test-E-Mail wurde automatisch von deinem E-Mail Marketing Tool gesendet.
                </p>
            </div>
        `;
    }

    /**
     * Zeigt Test-Erfolg an
     */
    function showTestSuccess() {
        Utils.showToast('✅ Test-E-Mail erfolgreich gesendet! Prüfe dein Postfach.', 'success');
    }

    /**
     * Zeigt Test-Fehler an
     * @param {string} errorMessage - Fehlermeldung
     */
    function showTestError(errorMessage) {
        Utils.showToast(
            `❌ Fehler beim Senden: ${errorMessage}<br>Prüfe deine EmailJS-Konfiguration.`,
            'error',
            8000
        );
    }

    /**
     * Löscht Test-Ergebnisse
     */
    function clearTestResults() {
        const result = document.getElementById('testResult');
        if (result) {
            result.innerHTML = '';
        }

        const setupComplete = document.getElementById('setupComplete');
        if (setupComplete) {
            setupComplete.classList.add('hidden');
        }

        const testSection = document.getElementById('testEmailSection');
        if (testSection) {
            testSection.style.display = 'block';
        }
    }

    /**
     * Zeigt Setup-Abschluss an
     */
    function showSetupComplete() {
        const setupComplete = document.getElementById('setupComplete');
        const testSection = document.getElementById('testEmailSection');

        if (setupComplete) {
            setupComplete.classList.remove('hidden');
        }

        if (testSection) {
            testSection.style.display = 'none';
        }
    }

    // ===== CONFIG MANAGEMENT =====

    /**
     * Speichert Wizard-Konfiguration
     */
    function saveWizardConfig() {
        if (!Config) {
            console.error('Config module not available');
            return;
        }

        const config = {
            serviceId: getWizardFieldValue('wizard-serviceId'),
            templateId: getWizardFieldValue('wizard-templateId'),
            userId: getWizardFieldValue('wizard-userId'),
            fromName: getWizardFieldValue('wizard-fromName'),
            setupCompleted: true
        };

        // Config über offizielle API speichern (macht auch localStorage-Sync)
        const success = Config.saveConfig(config);

        if (success) {
            // Zusätzliche Setup-Status-Marker für Landing Page
            localStorage.setItem('emailjs_configured', 'true');

            // Hauptkonfiguration UI auch aktualisieren
            updateMainConfigUI(config);
            console.log('Wizard config saved successfully');
        }
    }

    /**
     * Aktualisiert Haupt-Konfiguration UI
     * @param {Object} config - Konfigurationsdaten
     */
    function updateMainConfigUI(config) {
        const fields = {
            'serviceId': config.serviceId,
            'templateId': config.templateId,
            'userId': config.userId,
            'fromName': config.fromName
        };

        Object.entries(fields).forEach(([fieldId, value]) => {
            const element = document.getElementById(fieldId);
            if (element) {
                element.value = value;
            }
        });
    }

    // ===== WIZARD COMPLETION =====

    /**
     * Schließt Setup ab und startet Hauptanwendung
     */
    function finishSetup() {
        try {
            // Sicherstellen, dass Config gespeichert ist
            saveWizardConfig();
            
            // Wizard verstecken
            hide();
            
            // Landing Page über Setup-Abschluss informieren
            if (window.checkSetupStatus) {
                setTimeout(() => {
                    window.checkSetupStatus();
                }, 100);
            }
            
            console.log('Setup completed successfully');
            
        } catch (error) {
            console.error('Error finishing setup:', error);
        }
    }

    // ===== UTILITY FUNCTIONS =====

    /**
     * Holt Wert aus Wizard-Feld
     * @param {string} fieldId - ID des Felds
     * @returns {string} Feldwert
     */
    function getWizardFieldValue(fieldId) {
        const element = document.getElementById(fieldId);
        return element ? element.value.trim() : '';
    }

    /**
     * Setzt Fokus auf Wizard-Feld
     * @param {string} fieldId - ID des Felds
     */
    function focusWizardField(fieldId) {
        Utils.focusElement(fieldId, 100);
    }

    /**
     * Zeigt Fehlermeldung an
     * @param {string} message - Fehlermeldung
     */
    function showError(message) {
        Utils.showToast(message, 'error');
    }

    /**
     * Gibt aktuellen Wizard-Schritt zurück
     * @returns {number} Aktueller Schritt
     */
    function getCurrentStep() {
        return currentStep;
    }

    /**
     * Prüft ob Wizard sichtbar ist
     * @returns {boolean} true wenn sichtbar
     */
    function isWizardVisible() {
        return isVisible;
    }

    /**
     * Gibt Wizard-Status zurück
     * @returns {Object} Status-Objekt
     */
    function getStatus() {
        return {
            visible: isVisible,
            currentStep: currentStep,
            totalSteps: 3,
            data: { ...wizardData }
        };
    }

    // ===== PUBLIC API =====
    return {
        // Core functions
        init,
        show,
        hide,
        
        // Navigation
        nextStep,
        previousStep,
        getCurrentStep,
        
        // Actions
        sendTestEmail,
        finishSetup,
        
        // Status
        isWizardVisible,
        getStatus,
        
        // Utilities
        resetWizardData,
        loadExistingConfig
    };
})();
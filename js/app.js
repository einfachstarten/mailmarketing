/**
 * E-Mail Marketing Tool - Main Application Controller
 * Koordiniert alle Module und verwaltet die Hauptlogik
 */

window.App = (function() {
    'use strict';

    // ===== APPLICATION STATE =====
    let isInitialized = false;
    // Default-Tab beim Start (muss zu index.html passen)
    let currentTab = 'dashboard';
    let modules = {};

    // ===== INITIALIZATION =====

    /**
     * Initialisiert die komplette Anwendung
     */
    function init() {
        if (isInitialized) {
            console.warn('App already initialized');
            return;
        }

        console.log('🚀 Initializing E-Mail Marketing Tool...');

        try {
            // 1. Prüfe Browser-Kompatibilität
            if (!checkBrowserCompatibility()) {
                showBrowserError();
                return;
            }

            // 2. Initialisiere Core-Module
            initializeCoreModules();

            // 3. Setup UI
            setupEventListeners();
            setupKeyboardShortcuts();

            // 4. Lade gespeicherte Daten
            loadApplicationData();

            // 5. Prüfe Setup-Status
            checkSetupStatus();

            // 6. Zeige initiale UI
            showInitialInterface();

            isInitialized = true;
            console.log('✅ App initialization complete');

        } catch (error) {
            console.error('❌ App initialization failed:', error);
            showInitializationError(error);
        }
    }

    /**
     * Prüft Browser-Kompatibilität
     * @returns {boolean} true wenn kompatibel
     */
    function checkBrowserCompatibility() {
        // Prüfe LocalStorage
        if (!Utils.isLocalStorageAvailable()) {
            console.error('LocalStorage not available');
            return false;
        }

        // Prüfe moderne JS Features
        try {
            // Arrow functions, const/let, template literals
            eval('const test = () => `test`; test();');
            return true;
        } catch (error) {
            console.error('Browser does not support modern JavaScript');
            return false;
        }
    }

    /**
     * Initialisiert alle Core-Module
     */
    function initializeCoreModules() {
        // Config-Modul initialisieren
        if (window.Config) {
            Config.init();
            modules.config = Config;
            console.log('✓ Config module loaded');
        }

        // Mail Wizard Modul initialisieren
        if (window.MailWizard) {
            MailWizard.init();
            modules.mailwizard = MailWizard;
            console.log('✓ MailWizard module loaded');
        }

        // Weitere Module werden hier initialisiert wenn verfügbar
        const moduleList = ['Wizard', 'Templates', 'Recipients', 'Sender', 'Attachments'];
                
        moduleList.forEach(moduleName => {
            if (window[moduleName]) {
                if (typeof window[moduleName].init === 'function') {
                    window[moduleName].init();
                }
                modules[moduleName.toLowerCase()] = window[moduleName];
                console.log(`✓ ${moduleName} module loaded`);
            }
        });
    }

    /**
     * Lädt gespeicherte Anwendungsdaten
     */
    function loadApplicationData() {
        // Letzten Tab wiederherstellen
        const savedTab = Utils.loadFromStorage('currentTab', 'dashboard');
        if (isValidTab(savedTab)) {
            currentTab = savedTab;
        }

        // Template-Liste laden wenn Templates-Modul verfügbar
        if (modules.templates && typeof modules.templates.loadTemplateList === 'function') {
            modules.templates.loadTemplateList();
        }

        // Weitere gespeicherte Daten laden...
    }

    /**
     * Prüft Setup-Status und zeigt entsprechende UI
     */
    function checkSetupStatus() {
        if (!Config.isSetupComplete()) {
            console.log('Setup not complete, showing wizard...');
            
            // Setup-Prompt anzeigen
            Utils.toggleElement('setupPrompt', true);
            
            // Optional: Wizard automatisch nach kurzer Verzögerung starten
            setTimeout(() => {
                if (modules.wizard && typeof modules.wizard.show === 'function') {
                    modules.wizard.show();
                }
            }, 1000);
        } else {
            console.log('Setup complete, hiding setup prompt');
            Utils.toggleElement('setupPrompt', false);
        }
    }

    /**
     * Zeigt initiale Benutzeroberfläche
     */
    function showInitialInterface() {
        // Aktiven Tab setzen
        // Dashboard immer als initialen Tab anzeigen
        showTab('dashboard');
        
        // Template-Preview aktualisieren wenn Templates-Modul verfügbar
        if (modules.templates && typeof modules.templates.updatePreview === 'function') {
            Utils.safeCall(modules.templates.updatePreview, 'Initial template preview');
        }

        // Template automatisch parsen wenn im Simple Mode
        if (modules.templates && typeof modules.templates.parseTemplate === 'function') {
            setTimeout(() => {
                Utils.safeCall(modules.templates.parseTemplate, 'Initial template parse');
            }, 100);
        }
    }

    // ===== TAB MANAGEMENT =====

    /**
     * Wechselt zwischen Tabs
     * @param {string} tabName - Name des Tabs
     */
    function showTab(tabName) {
        if (!isValidTab(tabName)) {
            console.warn(`Invalid tab: ${tabName}`);
            return;
        }

        try {
            // Alle Tabs deaktivieren
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });

            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });

            // Aktiven Tab setzen
            const activeTabButton = event?.target ||
                document.querySelector(`[onclick*="${tabName}"]`);

            if (activeTabButton && activeTabButton.classList) {
                activeTabButton.classList.add('active');
            }

            // Tab-Content anzeigen
            const tabContent = document.getElementById(tabName);
            if (tabContent && tabContent.classList) {
                tabContent.classList.add('active');
            }

            currentTab = tabName;
            
            // Tab speichern
            Utils.saveToStorage('currentTab', tabName);

            // Tab-spezifische Aktionen
            handleTabSwitch(tabName);

            console.log(`Switched to tab: ${tabName}`);

        } catch (error) {
            console.error('Error switching tab:', error);
        }
    }

    /**
     * Behandelt Tab-spezifische Aktionen
     * @param {string} tabName - Name des Tabs
     */
    function handleTabSwitch(tabName) {
        switch (tabName) {
            case 'dashboard':
                // Dashboard benötigt keine speziellen Aktionen
                break;

            case 'templates':
                // Template-Preview aktualisieren
                if (modules.templates && typeof modules.templates.updatePreview === 'function') {
                    Utils.safeCall(modules.templates.updatePreview, 'Tab switch template preview');
                }
                break;

            case 'recipients':
                // Empfänger-Statistiken aktualisieren
                if (modules.recipients && typeof modules.recipients.updateStats === 'function') {
                    modules.recipients.updateStats();
                }
                break;

            case 'mailwizard':
                // Beim Wechsel zum Mail Wizard sind keine Aktionen erforderlich
                break;

            case 'history':
                // Verlauf-Tab: zukünftig können hier Daten nachgeladen werden
                break;
        }
    }

    /**
     * Prüft ob Tab-Name gültig ist
     * @param {string} tabName - Tab-Name zum Prüfen
     * @returns {boolean} true wenn gültig
     */
    function isValidTab(tabName) {
        // Liste der vorhandenen Tabs (muss mit index.html übereinstimmen)
        const validTabs = ['dashboard', 'templates', 'recipients', 'mailwizard', 'history'];
        return validTabs.includes(tabName);
    }

    // ===== EVENT MANAGEMENT =====

    /**
     * Richtet Event-Listeners ein
     */
    function setupEventListeners() {
        // Window Events
        window.addEventListener('load', handleWindowLoad);
        window.addEventListener('beforeunload', handleWindowUnload);
        window.addEventListener('resize', Utils.debounce(handleWindowResize, 250));

        // Form Events
        setupFormEventListeners();

        // Storage Events (für Multi-Tab Synchronisation)
        window.addEventListener('storage', handleStorageChange);

        console.log('✓ Event listeners set up');
    }

    /**
     * Richtet Form-Event-Listeners ein
     */
    function setupFormEventListeners() {
        // Subject Input für Live-Preview
        const subjectInput = document.getElementById('subject');
        if (subjectInput) {
            subjectInput.addEventListener('input', Utils.debounce(() => {
                if (modules.templates && typeof modules.templates.updatePreview === 'function') {
                    modules.templates.updatePreview();
                }
            }, 300));
        }

        // HTML Content für Live-Preview
        const htmlContent = document.getElementById('htmlContent');
        if (htmlContent) {
            htmlContent.addEventListener('input', Utils.debounce(() => {
                if (modules.templates && typeof modules.templates.updatePreview === 'function') {
                    modules.templates.updatePreview();
                }
                
                // Re-parse für Simple Mode
                if (modules.templates && 
                    typeof modules.templates.getCurrentMode === 'function' &&
                    modules.templates.getCurrentMode() === 'simple') {
                    setTimeout(() => {
                        if (typeof modules.templates.parseTemplate === 'function') {
                            modules.templates.parseTemplate();
                        }
                    }, 500);
                }
            }, 500));
        }

        // Enter-Key Shortcuts für Empfänger-Eingabe
        const manualEmail = document.getElementById('manualEmail');
        if (manualEmail) {
            manualEmail.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && modules.recipients) {
                    e.preventDefault();
                    if (typeof modules.recipients.addManual === 'function') {
                        modules.recipients.addManual();
                    }
                }
            });
        }

        const manualName = document.getElementById('manualName');
        if (manualName) {
            manualName.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    Utils.focusElement('manualEmail');
                }
            });
        }
    }

    /**
     * Richtet Keyboard-Shortcuts ein
     */
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S = Template speichern
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (modules.templates && typeof modules.templates.save === 'function') {
                    modules.templates.save();
                }
            }

            // Ctrl/Cmd + Enter = Preview aktualisieren
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (modules.templates && typeof modules.templates.updatePreview === 'function') {
                    modules.templates.updatePreview();
                }
            }

            // Tab-Navigation (Ctrl + 1-5)
            if ((e.ctrlKey || e.metaKey) && ['1', '2', '3', '4', '5'].includes(e.key)) {
                e.preventDefault();
                const tabs = ['dashboard', 'templates', 'recipients', 'mailwizard', 'history'];
                const tabIndex = parseInt(e.key) - 1;
                if (tabs[tabIndex]) {
                    showTab(tabs[tabIndex]);
                }
            }

            // ESC = Setup-Wizard oder Mail-Wizard schließen
            if (e.key === 'Escape') {
                // Setup Wizard schließen
                const setupWizard = document.getElementById('setupWizard');
                if (setupWizard && !setupWizard.classList.contains('hidden')) {
                    if (modules.wizard && typeof modules.wizard.hide === 'function') {
                        modules.wizard.hide();
                    }
                }
                
                // Mail Wizard schließen
                const mailWizard = document.getElementById('mailWizardModal');
                if (mailWizard && !mailWizard.classList.contains('hidden')) {
                    if (modules.mailwizard && typeof modules.mailwizard.hideWizardModal === 'function') {
                        modules.mailwizard.hideWizardModal();
                    }
                }
            }

            // Ctrl/Cmd + M = Mail Wizard öffnen
            if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
                e.preventDefault();
                if (modules.mailwizard && typeof modules.mailwizard.startWizard === 'function') {
                    modules.mailwizard.startWizard();
                }
            }
        });

        console.log('✓ Keyboard shortcuts set up');
    }

    // ===== WINDOW EVENT HANDLERS =====

    /**
     * Behandelt Window Load Event
     */
    function handleWindowLoad() {
        console.log('Window loaded, performing final initialization...');
        
        // Finale UI-Updates
        Utils.safeCall(() => {
            if (modules.templates && typeof modules.templates.updatePreview === 'function') {
                modules.templates.updatePreview();
            }
        }, 'Window load template preview');
    }

    /**
     * Behandelt Window Unload Event
     */
    function handleWindowUnload() {
        // Aktuellen Zustand speichern
        Utils.saveToStorage('currentTab', currentTab);
        
        // Cleanup wenn nötig
        console.log('App cleanup on unload');
    }

    /**
     * Behandelt Window Resize Event
     */
    function handleWindowResize() {
        // UI-Anpassungen bei Größenänderung
        console.log('Window resized, adjusting UI...');
    }

    /**
     * Behandelt Storage Change Events (Multi-Tab Sync)
     */
    function handleStorageChange(e) {
        // Reagiere auf Änderungen in anderen Tabs
        if (e.key === 'emailConfig') {
            console.log('Config changed in another tab, reloading...');
            if (Config && typeof Config.loadConfig === 'function') {
                Config.loadConfig();
            }
        }
    }

    // ===== ERROR HANDLING =====

    /**
     * Zeigt Browser-Kompatibilitätsfehler
     */
    function showBrowserError() {
        document.body.innerHTML = `
            <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
                <h2>❌ Browser nicht unterstützt</h2>
                <p>Bitte verwenden Sie einen modernen Browser wie Chrome, Firefox, Safari oder Edge.</p>
            </div>
        `;
    }

    /**
     * Zeigt Initialisierungsfehler
     * @param {Error} error - Fehler-Objekt
     */
    function showInitializationError(error) {
        const errorMsg = `
            <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
                <h2>❌ Initialisierungsfehler</h2>
                <p>Die Anwendung konnte nicht geladen werden.</p>
                <details style="margin-top: 20px;">
                    <summary>Technische Details</summary>
                    <pre style="text-align: left; background: #f5f5f5; padding: 10px; margin-top: 10px;">
${error.message}
${error.stack}
                    </pre>
                </details>
                <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px;">
                    🔄 Seite neu laden
                </button>
            </div>
        `;
        
        document.body.innerHTML = errorMsg;
    }

    // ===== UTILITY FUNCTIONS =====

    /**
     * Gibt aktuellen Tab zurück
     * @returns {string} Aktueller Tab-Name
     */
    function getCurrentTab() {
        return currentTab;
    }

    /**
     * Gibt Informationen über geladene Module zurück
     * @returns {Object} Module-Informationen
     */
    function getModuleInfo() {
        const info = {};
        Object.keys(modules).forEach(key => {
            info[key] = {
                loaded: !!modules[key],
                functions: modules[key] ? Object.keys(modules[key]).length : 0
            };
        });
        return info;
    }

    /**
     * Gibt App-Status zurück
     * @returns {Object} Status-Informationen
     */
    function getStatus() {
        return {
            initialized: isInitialized,
            currentTab: currentTab,
            setupComplete: Config ? Config.isSetupComplete() : false,
            modules: getModuleInfo(),
            storageAvailable: Utils.isLocalStorageAvailable()
        };
    }

    /**
     * Führt App-Diagnose durch
     * @returns {Object} Diagnose-Ergebnis
     */
    function diagnose() {
        const diagnosis = {
            status: 'healthy',
            issues: [],
            warnings: []
        };

        // Prüfe Setup
        if (!Config || !Config.isSetupComplete()) {
            diagnosis.warnings.push('Setup nicht abgeschlossen');
        }

        // Prüfe Module
        const requiredModules = ['config', 'templates', 'recipients', 'sender', 'mailwizard'];
        requiredModules.forEach(module => {
            if (!modules[module]) {
                diagnosis.issues.push(`Modul ${module} nicht geladen`);
            }
        });

        // Prüfe LocalStorage
        if (!Utils.isLocalStorageAvailable()) {
            diagnosis.issues.push('LocalStorage nicht verfügbar');
        }

        // Bestimme Status
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
        
        // Navigation
        showTab,
        getCurrentTab,
        
        // Status & Diagnostics
        getStatus,
        getModuleInfo,
        diagnose,
        
        // State
        isInitialized: () => isInitialized
    };
})();

// ===== AUTO-INITIALIZATION =====
// App automatisch initialisieren wenn DOM ready
// Initialisierung erst nach kompletter DOM-Ladung
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

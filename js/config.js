/**
 * E-Mail Marketing Tool - Configuration Management
 * Verwaltet EmailJS-Konfiguration, Templates und Backup/Restore
 */

window.Config = (function() {
    'use strict';

    // ===== STORAGE KEYS =====
    const STORAGE_KEYS = {
        EMAIL_CONFIG: 'emailConfig',
        EMAIL_TEMPLATES: 'emailTemplates',
        APP_SETTINGS: 'appSettings'
    };

    // ===== DEFAULT CONFIG =====
    const DEFAULT_CONFIG = {
        serviceId: '',
        templateId: '',
        userId: '',
        fromName: '',
        setupCompleted: false,
        version: '2.0'
    };

    const DEFAULT_SETTINGS = {
        sendSpeed: 1000,
        autoSaveTemplates: true,
        showPreviewWarning: true,
        lastBackupDate: null
    };

    // ===== PRIVATE STATE =====
    let currentConfig = { ...DEFAULT_CONFIG };
    let currentSettings = { ...DEFAULT_SETTINGS };
    let isInitialized = false;

    // ===== INITIALIZATION =====

    /**
     * Initialisiert das Config-Modul
     */
    function init() {
        if (isInitialized) return;
        
        loadConfig();
        loadSettings();
        initializeEmailJS();
        isInitialized = true;
        
    }

    /**
     * Lädt die Konfiguration aus LocalStorage
     */
    function loadConfig() {
        // Strukturierte Config laden
        const config = Utils.loadFromStorage(STORAGE_KEYS.EMAIL_CONFIG, DEFAULT_CONFIG);
        currentConfig = { ...DEFAULT_CONFIG, ...config };

        // CRITICAL: Falls strukturierte Config leer, aus localStorage migrieren
        if (!currentConfig.serviceId && localStorage.getItem('emailjs_service_id')) {
            currentConfig = {
                serviceId: localStorage.getItem('emailjs_service_id') || '',
                templateId: localStorage.getItem('emailjs_template_id') || '',
                userId: localStorage.getItem('emailjs_user_id') || '',
                fromName: localStorage.getItem('fromName') || '',
                setupCompleted: localStorage.getItem('emailjs_configured') === 'true',
                version: '2.0'
            };

            // Migrierte Config in strukturiertem Format speichern
            Utils.saveToStorage(STORAGE_KEYS.EMAIL_CONFIG, currentConfig);
        }

        // UI-Felder aktualisieren wenn vorhanden
        updateConfigUI();
    }

    /**
     * Lädt die App-Einstellungen aus LocalStorage
     */
    function loadSettings() {
        const settings = Utils.loadFromStorage(STORAGE_KEYS.APP_SETTINGS, DEFAULT_SETTINGS);
        currentSettings = { ...DEFAULT_SETTINGS, ...settings };
    }

    /**
     * Initialisiert EmailJS falls konfiguriert
     */
    function initializeEmailJS() {
        if (currentConfig.userId && window.emailjs) {
            try {
                emailjs.init(currentConfig.userId);
            } catch (error) {
                console.error('EmailJS initialization failed:', error);
            }
        }
    }

    // ===== CONFIG MANAGEMENT =====

    /**
     * Speichert die EmailJS-Konfiguration
     * @param {Object} config - Konfigurationsobjekt
     * @returns {boolean} true wenn erfolgreich
     */
    function saveConfig(config = null) {
        try {
            // Config aus UI-Feldern lesen wenn nicht übergeben
            if (!config) {
                config = getConfigFromUI();
            }

            // Validierung
            const validation = validateConfig(config);
            if (!validation.valid) {
                Utils.showStatus('configStatus', validation.message, 'error');
                return false;
            }

            // Config speichern
            currentConfig = { ...currentConfig, ...config };
            const success = Utils.saveToStorage(STORAGE_KEYS.EMAIL_CONFIG, currentConfig);

            if (success) {
                // CRITICAL FIX: Legacy-Kompatibilität sicherstellen
                localStorage.setItem('emailjs_service_id', currentConfig.serviceId);
                localStorage.setItem('emailjs_template_id', currentConfig.templateId);
                localStorage.setItem('emailjs_user_id', currentConfig.userId);
                localStorage.setItem('fromName', currentConfig.fromName);
                localStorage.setItem('emailjs_configured', 'true');

                // EmailJS re-initialisieren
                if (currentConfig.userId && window.emailjs) {
                    emailjs.init(currentConfig.userId);
                }

                Utils.showStatus('configStatus', 'Konfiguration gespeichert!', 'success');

                // Setup-Prompt verstecken falls sichtbar
                Utils.toggleElement('setupPrompt', false);

                return true;
            } else {
                Utils.showStatus('configStatus', 'Fehler beim Speichern!', 'error');
                return false;
            }
        } catch (error) {
            console.error('Error saving config:', error);
            Utils.showStatus('configStatus', 'Speichern fehlgeschlagen!', 'error');
            return false;
        }
    }

    /**
     * Liest Konfiguration aus UI-Feldern
     * @returns {Object} Konfigurationsobjekt
     */
    function getConfigFromUI() {
        return {
            serviceId: document.getElementById('serviceId')?.value?.trim() || '',
            templateId: document.getElementById('templateId')?.value?.trim() || '',
            userId: document.getElementById('userId')?.value?.trim() || '',
            fromName: document.getElementById('fromName')?.value?.trim() || '',
            setupCompleted: true
        };
    }

    /**
     * Aktualisiert UI-Felder mit aktueller Konfiguration
     */
    function updateConfigUI() {
        const fields = ['serviceId', 'templateId', 'userId', 'fromName'];
        
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element && currentConfig[field]) {
                element.value = currentConfig[field];
            }
        });
    }

    /**
     * Validiert EmailJS-Konfiguration
     * @param {Object} config - Zu validierende Konfiguration
     * @returns {Object} Validierungsergebnis
     */
    function validateConfig(config) {
        if (!config.serviceId) {
            return { valid: false, message: 'Service ID fehlt' };
        }
        
        if (!Utils.isValidServiceId(config.serviceId)) {
            return { valid: false, message: 'Service ID sollte mit "service_" beginnen' };
        }
        
        if (!config.templateId) {
            return { valid: false, message: 'Template ID fehlt' };
        }
        
        if (!Utils.isValidTemplateId(config.templateId)) {
            return { valid: false, message: 'Template ID sollte mit "template_" beginnen' };
        }
        
        if (!config.userId) {
            return { valid: false, message: 'Public Key fehlt' };
        }
        
        if (!Utils.isValidUserId(config.userId)) {
            return { valid: false, message: 'Public Key ist zu kurz' };
        }
        
        if (!config.fromName) {
            return { valid: false, message: 'Name fehlt' };
        }
        
        return { valid: true, message: 'Konfiguration gültig' };
    }

    // ===== GETTERS =====

    /**
     * Gibt aktuelle Konfiguration zurück
     * @returns {Object} Konfigurationsobjekt
     */
    function getConfig() {
        return { ...currentConfig };
    }

    /**
     * Gibt einzelnen Konfigurationswert zurück
     * @param {string} key - Konfigurationsschlüssel
     * @returns {any} Konfigurationswert
     */
    function get(key) {
        return currentConfig[key];
    }

    /**
     * Prüft ob Setup abgeschlossen ist
     * @returns {boolean} true wenn Setup komplett
     */
    function isSetupComplete() {
        return currentConfig.setupCompleted && 
               currentConfig.serviceId && 
               currentConfig.templateId && 
               currentConfig.userId && 
               currentConfig.fromName;
    }

    /**
     * Gibt App-Einstellungen zurück
     * @returns {Object} Einstellungsobjekt
     */
    function getSettings() {
        return { ...currentSettings };
    }

    /**
     * Gibt einzelne Einstellung zurück
     * @param {string} key - Einstellungsschlüssel
     * @returns {any} Einstellungswert
     */
    function getSetting(key) {
        return currentSettings[key];
    }

    // ===== TEMPLATE MANAGEMENT =====

    /**
     * Speichert E-Mail-Template
     * @param {string} name - Template-Name
     * @param {Object} template - Template-Daten
     * @returns {boolean} true wenn erfolgreich
     */
    function saveTemplate(name, template) {
        if (!name || !template) return false;
        
        try {
            const templates = Utils.loadFromStorage(STORAGE_KEYS.EMAIL_TEMPLATES, {});
            templates[name] = {
                ...template,
                created: Utils.formatDate(new Date()),
                lastModified: Utils.formatDate(new Date())
            };
            
            return Utils.saveToStorage(STORAGE_KEYS.EMAIL_TEMPLATES, templates);
        } catch (error) {
            console.error('Error saving template:', error);
            return false;
        }
    }

    /**
     * Lädt E-Mail-Template
     * @param {string} name - Template-Name
     * @returns {Object|null} Template-Daten oder null
     */
    function loadTemplate(name) {
        if (!name) return null;
        
        try {
            const templates = Utils.loadFromStorage(STORAGE_KEYS.EMAIL_TEMPLATES, {});
            return templates[name] || null;
        } catch (error) {
            console.error('Error loading template:', error);
            return null;
        }
    }

    /**
     * Löscht E-Mail-Template
     * @param {string} name - Template-Name
     * @returns {boolean} true wenn erfolgreich
     */
    function deleteTemplate(name) {
        if (!name) return false;
        
        try {
            const templates = Utils.loadFromStorage(STORAGE_KEYS.EMAIL_TEMPLATES, {});
            delete templates[name];
            return Utils.saveToStorage(STORAGE_KEYS.EMAIL_TEMPLATES, templates);
        } catch (error) {
            console.error('Error deleting template:', error);
            return false;
        }
    }

    /**
     * Gibt alle Template-Namen zurück
     * @returns {Array} Array mit Template-Namen
     */
    function getTemplateNames() {
        try {
            const templates = Utils.loadFromStorage(STORAGE_KEYS.EMAIL_TEMPLATES, {});
            return Object.keys(templates);
        } catch (error) {
            console.error('Error getting template names:', error);
            return [];
        }
    }

    /**
     * Gibt alle Templates zurück
     * @returns {Object} Templates-Objekt
     */
    function getAllTemplates() {
        return Utils.loadFromStorage(STORAGE_KEYS.EMAIL_TEMPLATES, {});
    }

    // ===== BACKUP & RESTORE =====

    /**
     * Erstellt vollständiges Backup aller Daten
     * @returns {Object} Backup-Objekt
     */
    function createBackup() {
        try {
            return {
                version: '2.0',
                timestamp: new Date().toISOString(),
                created: Utils.formatDate(new Date()),
                emailConfig: currentConfig,
                emailTemplates: getAllTemplates(),
                appSettings: currentSettings
            };
        } catch (error) {
            console.error('Error creating backup:', error);
            return null;
        }
    }

    /**
     * Exportiert Backup als Download
     */
    function exportData() {
        try {
            const backup = createBackup();
            if (!backup) {
                Utils.showStatus('importStatus', 'Backup-Erstellung fehlgeschlagen', 'error');
                return;
            }

            const filename = `email-marketing-backup-${Utils.getTimestampForFilename()}.json`;
            const data = JSON.stringify(backup, null, 2);
            
            Utils.downloadFile(data, filename, 'application/json');
            Utils.showStatus('importStatus', '✅ Backup erfolgreich heruntergeladen!', 'success');
            
            // Backup-Datum aktualisieren
            updateSetting('lastBackupDate', new Date().toISOString());
            
        } catch (error) {
            console.error('Export error:', error);
            Utils.showStatus('importStatus', 'Export fehlgeschlagen!', 'error');
        }
    }

    /**
     * Importiert Backup aus Datei
     */
    function importData() {
        const fileInput = document.getElementById('configFile');
        const file = fileInput?.files?.[0];
        
        if (!file) {
            Utils.showStatus('importStatus', 'Bitte Datei auswählen', 'error');
            return;
        }
        
        if (!file.name.endsWith('.json')) {
            Utils.showStatus('importStatus', 'Bitte .json Datei auswählen', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const backup = JSON.parse(event.target.result);
                
                if (!backup.version) {
                    throw new Error('Ungültige Backup-Datei (keine Version)');
                }
                
                // Konfiguration wiederherstellen
                let restored = 0;
                
                if (backup.emailConfig) {
                    currentConfig = { ...DEFAULT_CONFIG, ...backup.emailConfig };
                    Utils.saveToStorage(STORAGE_KEYS.EMAIL_CONFIG, currentConfig);
                    updateConfigUI();
                    initializeEmailJS();
                    restored++;
                }
                
                // Templates wiederherstellen
                if (backup.emailTemplates) {
                    Utils.saveToStorage(STORAGE_KEYS.EMAIL_TEMPLATES, backup.emailTemplates);
                    const templateCount = Object.keys(backup.emailTemplates).length;
                    restored += templateCount;
                }
                
                // Settings wiederherstellen
                if (backup.appSettings) {
                    currentSettings = { ...DEFAULT_SETTINGS, ...backup.appSettings };
                    Utils.saveToStorage(STORAGE_KEYS.APP_SETTINGS, currentSettings);
                }
                
                Utils.showStatus('importStatus', 
                    `✅ Import erfolgreich! ${restored} Elemente wiederhergestellt.`, 
                    'success'
                );
                
                // File Input zurücksetzen
                fileInput.value = '';
                
                // Setup-Prompt verstecken falls Setup komplett
                if (isSetupComplete()) {
                    Utils.toggleElement('setupPrompt', false);
                }
                
            } catch (error) {
                console.error('Import error:', error);
                Utils.showStatus('importStatus', 
                    `❌ Import fehlgeschlagen: ${error.message}`, 
                    'error'
                );
            }
        };
        
        reader.readAsText(file);
    }

    // ===== SETTINGS MANAGEMENT =====

    /**
     * Aktualisiert eine Einstellung
     * @param {string} key - Einstellungsschlüssel
     * @param {any} value - Neuer Wert
     * @returns {boolean} true wenn erfolgreich
     */
    function updateSetting(key, value) {
        try {
            currentSettings[key] = value;
            return Utils.saveToStorage(STORAGE_KEYS.APP_SETTINGS, currentSettings);
        } catch (error) {
            console.error('Error updating setting:', error);
            return false;
        }
    }

    /**
     * Aktualisiert mehrere Einstellungen
     * @param {Object} settings - Einstellungsobjekt
     * @returns {boolean} true wenn erfolgreich
     */
    function updateSettings(settings) {
        try {
            currentSettings = { ...currentSettings, ...settings };
            return Utils.saveToStorage(STORAGE_KEYS.APP_SETTINGS, currentSettings);
        } catch (error) {
            console.error('Error updating settings:', error);
            return false;
        }
    }

    // ===== RESET & CLEANUP =====

    /**
     * Setzt Konfiguration auf Default zurück
     * @param {boolean} confirm - Bestätigung erforderlich
     * @returns {boolean} true wenn zurückgesetzt
     */
    function resetConfig(confirm = true) {
        if (confirm) {
            Utils.showConfirm(
                'Wirklich alle Einstellungen zurücksetzen? Dies kann nicht rückgängig gemacht werden!',
                () => resetConfig(false)
            );
            return false;
        }
        
        try {
            currentConfig = { ...DEFAULT_CONFIG };
            Utils.removeFromStorage(STORAGE_KEYS.EMAIL_CONFIG);
            updateConfigUI();
            
            Utils.showStatus('configStatus', 'Konfiguration zurückgesetzt', 'success');
            return true;
        } catch (error) {
            console.error('Error resetting config:', error);
            return false;
        }
    }

    /**
     * Löscht alle Templates
     * @param {boolean} confirm - Bestätigung erforderlich
     * @returns {boolean} true wenn gelöscht
     */
    function clearAllTemplates(confirm = true) {
        if (confirm) {
            Utils.showConfirm(
                'Wirklich alle Templates löschen? Dies kann nicht rückgängig gemacht werden!',
                () => clearAllTemplates(false)
            );
            return false;
        }
        
        try {
            Utils.removeFromStorage(STORAGE_KEYS.EMAIL_TEMPLATES);
            Utils.showStatus('importStatus', 'Alle Templates gelöscht', 'success');
            return true;
        } catch (error) {
            console.error('Error clearing templates:', error);
            return false;
        }
    }

    // ===== PUBLIC API =====
    return {
        // Initialization
        init,
        
        // Config management
        saveConfig,
        getConfig,
        get,
        isSetupComplete,
        validateConfig,
        resetConfig,
        
        // Settings
        getSettings,
        getSetting,
        updateSetting,
        updateSettings,
        
        // Template management
        saveTemplate,
        loadTemplate,
        deleteTemplate,
        getTemplateNames,
        getAllTemplates,
        clearAllTemplates,
        
        // Backup & Restore
        createBackup,
        exportData,
        importData,
        
        // Utilities
        updateConfigUI,
        initializeEmailJS
    };
})();
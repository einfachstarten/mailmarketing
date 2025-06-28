/**
 * E-Mail Marketing Tool - Utility Functions
 * Wiederverwendbare Helper-Funktionen für alle Module
 */

window.Utils = (function() {
    'use strict';

    // ===== VALIDATION =====
    
    /**
     * Validiert E-Mail-Adressen
     * @param {string} email - E-Mail zum Validieren
     * @returns {boolean} true wenn gültig
     */
    function isValidEmail(email) {
        if (!email || typeof email !== 'string') return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim());
    }

    /**
     * Validiert EmailJS Service IDs
     * @param {string} serviceId - Service ID zum Validieren
     * @returns {boolean} true wenn gültig
     */
    function isValidServiceId(serviceId) {
        if (!serviceId || typeof serviceId !== 'string') return false;
        return serviceId.trim().startsWith('service_') && serviceId.length > 8;
    }

    /**
     * Validiert EmailJS Template IDs
     * @param {string} templateId - Template ID zum Validieren
     * @returns {boolean} true wenn gültig
     */
    function isValidTemplateId(templateId) {
        if (!templateId || typeof templateId !== 'string') return false;
        return templateId.trim().startsWith('template_') && templateId.length > 9;
    }

    /**
     * Validiert EmailJS User IDs (Public Keys)
     * @param {string} userId - User ID zum Validieren
     * @returns {boolean} true wenn gültig
     */
    function isValidUserId(userId) {
        if (!userId || typeof userId !== 'string') return false;
        return userId.trim().length >= 10; // Mindestlänge für EmailJS Public Keys
    }

    // ===== STRING UTILITIES =====

    /**
     * Generiert einen Namen aus einer E-Mail-Adresse
     * @param {string} email - E-Mail-Adresse
     * @returns {string} Generierter Name
     */
    function getNameFromEmail(email) {
        if (!email || !email.includes('@')) return '';

        try {
            const localPart = email.split('@')[0];
            const nameParts = localPart.split(/[._-]+/);

            const processedParts = nameParts
                .slice(0, 2)
                .filter(part => part.length > 0)
                .map(part => {
                    return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
                });

            const result = processedParts.join(' ');
            return result;

        } catch (error) {
            console.error('Error generating name from email:', error);
            return '';
        }
    }

    /**
     * Escapet HTML-Zeichen für sichere Ausgabe
     * @param {string} text - Text zum Escapen
     * @returns {string} HTML-escaped Text
     */
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Entfernt HTML-Tags aus Text
     * @param {string} html - HTML-String
     * @returns {string} Nur Text ohne Tags
     */
    function stripHtml(html) {
        if (!html) return '';
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }

    /**
     * Kürzt Text auf maximale Länge
     * @param {string} text - Text zum Kürzen
     * @param {number} maxLength - Maximale Länge
     * @returns {string} Gekürzter Text
     */
    function truncateText(text, maxLength = 100) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }

    // ===== DOM UTILITIES =====

    /**
     * Zeigt Status-Nachrichten in einem Element an
     * @param {string} elementId - ID des Elements
     * @param {string} message - Nachricht
     * @param {string} type - Typ: 'success', 'error', 'info'
     * @param {number} timeout - Auto-Hide nach Millisekunden (0 = kein Auto-Hide)
     */
    function showStatus(elementId, message, type = 'info') {

        // Legacy API-Unterstützung: ElementId wird ignoriert
        showToast(message, type);
    }

    /**
     * Zeigt/versteckt ein Element
     * @param {string} elementId - ID des Elements
     * @param {boolean} show - true = zeigen, false = verstecken
     */
    function toggleElement(elementId, show) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        if (show) {
            element.classList.remove('hidden');
        } else {
            element.classList.add('hidden');
        }
    }

    /**
     * Setzt den Fokus auf ein Element
     * @param {string} elementId - ID des Elements
     * @param {number} delay - Verzögerung in Millisekunden
     */
    function focusElement(elementId, delay = 0) {
        setTimeout(() => {
            const element = document.getElementById(elementId);
            if (element && element.focus) {
                element.focus();
            }
        }, delay);
    }

    /**
     * Zeigt eine Toast-Nachricht an
     * @param {string} message - Nachricht (HTML erlaubt)
     * @param {string} type - success, error, warning, info, confirm
     * @param {number} duration - Anzeigezeit in ms (0 = manuell)
     * @param {Function} callback - Callback nach Dismiss
     * @returns {HTMLElement} Toast-Element
     */
    function showToast(message, type = 'info', duration, callback) {
        const container = document.getElementById('toastContainer');
        if (!container) {
            console.warn('Toast container missing. Falling back to alert().');
            alert(message);
            if (callback) callback();
            return null;
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = message;

        container.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));

        const auto = duration !== undefined ? duration :
            (type === 'error' ? 8000 : type === 'warning' ? 6000 : 4000);

        let hideTimeout;
        if (auto > 0) {
            hideTimeout = setTimeout(hideToast, auto);
        }

        toast.addEventListener('click', hideToast);

        function hideToast() {
            clearTimeout(hideTimeout);
            toast.classList.add('hide');
            toast.addEventListener('animationend', () => {
                toast.remove();
                if (callback) callback();
            }, { once: true });
        }

        return toast;
    }

    /**
     * Zeigt einen Bestätigungs-Toast
     * @param {string} message - Nachricht
     * @param {Function} onConfirm - Callback bei Bestätigung
     * @param {Function} onCancel - Callback bei Abbruch
     */
    function showConfirm(message, onConfirm, onCancel) {
        const toast = showToast(`<div>${message}</div>`, 'confirm', 0);
        if (!toast) {
            const result = window.confirm(message);
            if (result) { if (onConfirm) onConfirm(); } else { if (onCancel) onCancel(); }
            return;
        }

        const actions = document.createElement('div');
        actions.className = 'toast-actions';
        const yesBtn = document.createElement('button');
        yesBtn.className = 'confirm';
        yesBtn.textContent = 'Ja';
        const noBtn = document.createElement('button');
        noBtn.className = 'cancel';
        noBtn.textContent = 'Nein';
        actions.appendChild(yesBtn);
        actions.appendChild(noBtn);
        toast.appendChild(actions);

        yesBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            hide(true);
        });
        noBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            hide(false);
        });

        function hide(result) {
            toast.classList.add('hide');
            toast.addEventListener('animationend', () => {
                toast.remove();
                if (result) { if (onConfirm) onConfirm(); } else { if (onCancel) onCancel(); }
            }, { once: true });
        }
    }

    // ===== LOCALSTORAGE UTILITIES =====

    /**
     * Speichert Daten in LocalStorage mit Error-Handling
     * @param {string} key - Storage-Key
     * @param {any} data - Zu speichernde Daten
     * @returns {boolean} true wenn erfolgreich
     */
    function saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error(`Error saving to localStorage (${key}):`, error);
            return false;
        }
    }

    /**
     * Lädt Daten aus LocalStorage mit Error-Handling
     * @param {string} key - Storage-Key
     * @param {any} defaultValue - Default-Wert bei Fehler
     * @returns {any} Geladene Daten oder Default-Wert
     */
    function loadFromStorage(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error(`Error loading from localStorage (${key}):`, error);
            return defaultValue;
        }
    }

    /**
     * Entfernt Daten aus LocalStorage
     * @param {string} key - Storage-Key
     * @returns {boolean} true wenn erfolgreich
     */
    function removeFromStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error removing from localStorage (${key}):`, error);
            return false;
        }
    }

    // ===== ARRAY/OBJECT UTILITIES =====

    /**
     * Entfernt Duplikate aus Array basierend auf Property
     * @param {Array} array - Array zum Deduplizieren
     * @param {string} key - Property-Name für Vergleich
     * @returns {Array} Array ohne Duplikate
     */
    function removeDuplicates(array, key) {
        if (!Array.isArray(array)) return [];
        
        const seen = new Set();
        return array.filter(item => {
            const value = item[key];
            if (seen.has(value)) {
                return false;
            }
            seen.add(value);
            return true;
        });
    }

    /**
     * Gruppiert Array-Elemente nach Property
     * @param {Array} array - Array zum Gruppieren
     * @param {string} key - Property-Name für Gruppierung
     * @returns {Object} Gruppierte Objekte
     */
    function groupBy(array, key) {
        if (!Array.isArray(array)) return {};
        
        return array.reduce((groups, item) => {
            const groupKey = item[key];
            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(item);
            return groups;
        }, {});
    }

    // ===== TIMING UTILITIES =====

    /**
     * Erstellt eine Delay-Promise
     * @param {number} ms - Millisekunden zu warten
     * @returns {Promise} Promise die nach ms resolved
     */
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Debounce-Funktion für Performance
     * @param {Function} func - Funktion zum Debouncing
     * @param {number} wait - Wartezeit in Millisekunden
     * @returns {Function} Debounced Funktion
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // ===== FILE UTILITIES =====

    /**
     * Erstellt Download-Link für Datei
     * @param {string} data - Dateiinhalt
     * @param {string} filename - Dateiname
     * @param {string} mimeType - MIME-Type
     */
    function downloadFile(data, filename, mimeType = 'application/json') {
        const blob = new Blob([data], { type: mimeType });
        const link = document.createElement('a');
        
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Cleanup
        setTimeout(() => URL.revokeObjectURL(link.href), 100);
    }

    /**
     * Formatiert Dateigröße lesbar
     * @param {number} bytes - Anzahl Bytes
     * @returns {string} Formatierte Größe
     */
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // ===== DATE UTILITIES =====

    /**
     * Formatiert Datum für deutsche Anzeige
     * @param {Date|string} date - Datum zum Formatieren
     * @returns {string} Formatiertes Datum
     */
    function formatDate(date) {
        try {
            const d = new Date(date);
            return d.toLocaleDateString('de-DE');
        } catch (error) {
            return 'Ungültiges Datum';
        }
    }

    /**
     * Formatiert Timestamp für Dateinamen
     * @param {Date} date - Datum (optional, default: jetzt)
     * @returns {string} Formatierter Timestamp
     */
    function getTimestampForFilename(date = new Date()) {
        return date.toLocaleDateString('de-DE').replace(/\./g, '-');
    }

    // ===== ERROR HANDLING =====

    /**
     * Sicherer Funktionsaufruf mit Error-Handling
     * @param {Function} func - Funktion zum Ausführen
     * @param {string} context - Kontext für Error-Logging
     * @param {...any} args - Argumente für die Funktion
     * @returns {any} Rückgabewert oder null bei Fehler
     */
    function safeCall(func, context, ...args) {
        try {
            return func(...args);
        } catch (error) {
            console.error(`Error in ${context}:`, error);
            return null;
        }
    }

    /**
     * Async sicherer Funktionsaufruf
     * @param {Function} func - Async Funktion zum Ausführen  
     * @param {string} context - Kontext für Error-Logging
     * @param {...any} args - Argumente für die Funktion
     * @returns {Promise} Promise mit Ergebnis oder Error
     */
    async function safeAsyncCall(func, context, ...args) {
        try {
            return await func(...args);
        } catch (error) {
            console.error(`Async error in ${context}:`, error);
            throw error;
        }
    }

    // ===== BROWSER UTILITIES =====

    /**
     * Prüft ob Browser LocalStorage unterstützt
     * @returns {boolean} true wenn verfügbar
     */
    function isLocalStorageAvailable() {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Kopiert Text in die Zwischenablage
     * @param {string} text - Text zum Kopieren
     * @returns {Promise<boolean>} true wenn erfolgreich
     */
    async function copyToClipboard(text) {
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback für ältere Browser
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.select();
                const success = document.execCommand('copy');
                document.body.removeChild(textArea);
                return success;
            }
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            return false;
        }
    }

    // ===== CSS UTILITIES =====

    /**
     * Lädt eine CSS-Datei und resolved, wenn sie geladen wurde
     * @param {string} href - Pfad zur CSS-Datei
     * @returns {Promise<void>}
     */
    function loadCSS(href) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.onload = () => resolve();
            link.onerror = reject;
            document.head.appendChild(link);
        });
    }

    /**
     * Wartet bis styles.css vollständig geladen wurde
     * @returns {Promise<void>}
     */
    function waitForCSS() {
        return new Promise(resolve => {
            function checkCSS() {
                const testEl = document.createElement('div');
                testEl.className = 'container';
                document.body.appendChild(testEl);
                const style = window.getComputedStyle(testEl);
                const loaded = style.maxWidth === '1400px';
                document.body.removeChild(testEl);
                if (loaded) {
                    resolve();
                } else {
                    setTimeout(checkCSS, 50);
                }
            }
            checkCSS();
        });
    }

    // ===== PUBLIC API =====
    return {
        // Validation
        isValidEmail,
        isValidServiceId,
        isValidTemplateId,
        isValidUserId,
        
        // String utilities
        getNameFromEmail,
        escapeHtml,
        stripHtml,
        truncateText,
        
        // DOM utilities
        showStatus,
        showToast,
        showConfirm,
        toggleElement,
        focusElement,
        
        // Storage utilities
        saveToStorage,
        loadFromStorage,
        removeFromStorage,
        
        // Array/Object utilities
        removeDuplicates,
        groupBy,
        
        // Timing utilities
        delay,
        debounce,
        
        // File utilities
        downloadFile,
        formatFileSize,
        
        // Date utilities
        formatDate,
        getTimestampForFilename,
        
        // Error handling
        safeCall,
        safeAsyncCall,
        
        // Browser utilities
        isLocalStorageAvailable,
        copyToClipboard,
        loadCSS,
        waitForCSS
    };
})();

/**
 * CSS Loading Fix für MIME-Type Probleme
 * Prüft ob CSS geladen wurde und lädt Fallback falls nötig
 */
window.CSSLoader = (function() {
    'use strict';

    let cssLoaded = false;
    let fallbackLoaded = false;

    function checkCSSLoaded() {
        try {
            const testDiv = document.createElement('div');
            testDiv.className = 'main-card btn-primary';
            testDiv.style.position = 'absolute';
            testDiv.style.visibility = 'hidden';
            testDiv.style.top = '-9999px';
            document.body.appendChild(testDiv);

            const computedStyle = window.getComputedStyle(testDiv);

            const hasBackground = computedStyle.background !== 'rgba(0, 0, 0, 0)';
            const hasBorderRadius = computedStyle.borderRadius !== '0px';
            const hasPadding = computedStyle.padding !== '0px';
            const hasBoxShadow = computedStyle.boxShadow !== 'none';

            document.body.removeChild(testDiv);

            cssLoaded = hasBackground || hasBorderRadius || hasPadding || hasBoxShadow;

                hasBackground, hasBorderRadius, hasPadding, hasBoxShadow,
                result: cssLoaded
            });

            return cssLoaded;

        } catch (error) {
            console.error('CSS check error:', error);
            return false;
        }
    }

    function loadMinimalCSS() {
        if (fallbackLoaded) return;

        console.warn('🎨 CSS nicht geladen - lade Fallback CSS');

        const fallbackCSS = `
            /* E-MAIL MARKETING TOOL - FALLBACK CSS */
            * { box-sizing: border-box; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                margin: 0; padding: 20px; color: #2d3748; line-height: 1.6;
            }
            .container { max-width: 1200px; margin: 0 auto; }
            .main-card {
                background: white; border-radius: 12px; padding: 30px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.1); margin-bottom: 20px;
            }
            .btn, .btn-primary, .btn-secondary {
                background: #4a90e2; color: white; border: none; padding: 12px 24px;
                border-radius: 6px; cursor: pointer; text-decoration: none;
                display: inline-block; transition: all 0.2s; margin: 5px;
            }
            .btn:hover, .btn-primary:hover { background: #357abd; transform: translateY(-1px); }
            .btn-secondary { background: #6c757d; }
            .btn-secondary:hover { background: #545b62; }
            .tabs {
                display: flex; background: #f8f9fa; border-radius: 8px;
                overflow: hidden; margin-bottom: 20px;
            }
            .tab {
                padding: 15px 25px; background: none; border: none;
                cursor: pointer; flex: 1; text-align: center; transition: all 0.2s;
            }
            .tab.active { background: #4a90e2; color: white; }
            .tab:hover:not(.active) { background: #e9ecef; }
            .tab-content { display: none; }
            .tab-content.active { display: block; }
            .hidden { display: none !important; }
            .setup-status {
                background: #e3f2fd; border: 1px solid #bbdefb; padding: 20px;
                border-radius: 8px; margin-bottom: 30px; display: flex;
                align-items: center; gap: 15px;
            }
            .action-grid {
                display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 20px; margin-top: 30px;
            }
            .action-card {
                background: white; border: 1px solid #e2e8f0; border-radius: 8px;
                padding: 20px; text-decoration: none; color: inherit;
                transition: all 0.2s; display: block;
            }
            .action-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            .form-control {
                width: 100%; padding: 10px; border: 1px solid #ddd;
                border-radius: 4px; margin-bottom: 15px;
            }
            .alert {
                padding: 15px; border-radius: 6px; margin-bottom: 20px;
            }
            .alert.success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
            .alert.error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
            .toast-container {
                position: fixed; top: 20px; right: 20px; z-index: 10000;
                display: flex; flex-direction: column; gap: 10px;
            }
            .toast {
                min-width: 240px; padding: 12px 18px; border-radius: 6px; color: white;
                background: #333; box-shadow: 0 4px 8px rgba(0,0,0,0.1); cursor: pointer;
                opacity: 0; transform: translateX(100%); transition: all 0.3s;
            }
            .toast.show { opacity: 1; transform: translateX(0); }
            .toast.success { background: #27ae60; }
            .toast.error { background: #e74c3c; }
            .toast.warning { background: #f39c12; }
            .toast.info { background: #3498db; }
            .progress-bar {
                height: 20px; background: #4a90e2; border-radius: 10px;
                transition: width 0.3s; width: 0%;
            }
        `;

        const style = document.createElement('style');
        style.textContent = fallbackCSS;
        style.id = 'fallback-css';
        document.head.appendChild(style);

        fallbackLoaded = true;

        setTimeout(() => {
            if (window.Utils && Utils.showToast) {
                Utils.showToast('CSS Fallback geladen - Server MIME-Type Problem erkannt', 'warning', 8000);
            } else {
                console.warn('🎨 CSS Fallback aktiv - Kontaktiere Admin wegen Server MIME-Type Problem');
            }
        }, 1500);
    }

    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', checkAndLoad);
        } else {
            setTimeout(checkAndLoad, 100);
        }
    }

    function checkAndLoad() {
        setTimeout(() => {
            if (!checkCSSLoaded()) {
                loadMinimalCSS();
            } else {
            }
        }, 500);
    }

    return {
        init,
        check: checkCSSLoaded,
        loadFallback: loadMinimalCSS,
        isLoaded: () => cssLoaded,
        hasFallback: () => fallbackLoaded
    };
})();

// CSS-Loader automatisch starten
if (typeof window !== 'undefined') {
    CSSLoader.init();
}

// Debug-Informationen für Entwicklung
window.debugStartup = function() {
    return {
        version: '2.1',
        cssLoaded: window.CSSLoader ? CSSLoader.isLoaded() : 'CSSLoader not available',
        hasFallback: window.CSSLoader ? CSSLoader.hasFallback() : false,
        senderModule: typeof window.Sender !== 'undefined',
        progressManager: typeof window.ProgressManager !== 'undefined',
        updateProgressAvailable: window.Sender && typeof Sender.updateProgress === 'function',
        emailjsLoaded: typeof window.emailjs !== 'undefined'
    };
};



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
            console.log(`Generated name from email: ${email} → ${result}`);
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
    function showStatus(elementId, message, type = 'info', timeout = 5000) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn(`Status element not found: ${elementId}`);
            return;
        }

        const alertClass = type === 'success' ? 'success' : 
                          type === 'error' ? 'error' : 'info-box';
        
        element.innerHTML = `<div class="alert ${alertClass}">${message}</div>`;
        
        if (timeout > 0) {
            setTimeout(() => {
                if (element.innerHTML.includes(message)) {
                    element.innerHTML = '';
                }
            }, timeout);
        }
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
        copyToClipboard
    };
})();
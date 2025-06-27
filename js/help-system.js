/**
 * Contextual Help System - Intelligente Tooltips
 */
window.HelpSystem = (function() {
    'use strict';

    // ===== HELP CONTENT DATABASE =====
    const HELP_CONTENT = {
        // KOMPLIZIERT: EmailJS Setup Fields
        'emailjs-service-id': {
            title: '📧 Service ID',
            content: `
                <div class="help-content">
                    <p><strong>Format:</strong> service_xxxxxxxxx</p>
                    <p>Du findest sie in deinem EmailJS Dashboard unter <strong>"Services"</strong>.</p>
                    <div class="help-example">
                        ✅ Richtig: service_abc123xyz<br>
                        ❌ Falsch: abc123xyz
                    </div>
                    <a href="howto.html#step-2" target="_blank" class="help-link">
                        📖 Detailed Tutorial
                    </a>
                </div>
            `,
            placement: 'right',
            trigger: 'focus'
        },

        'emailjs-template-id': {
            title: '📄 Template ID', 
            content: `
                <div class="help-content">
                    <p><strong>Format:</strong> template_xxxxxxxxx</p>
                    <p>Erstelle ein Template in EmailJS mit den Variablen:</p>
                    <div class="help-code">{{subject}}, {{message}}, {{name}}, {{email}}</div>
                    <div class="help-example">
                        ✅ Richtig: template_xyz789abc<br>
                        ❌ Falsch: my_template_123
                    </div>
                    <a href="howto.html#step-3" target="_blank" class="help-link">
                        📖 Template erstellen
                    </a>
                </div>
            `,
            placement: 'right',
            trigger: 'focus'
        },

        'emailjs-public-key': {
            title: '🔐 Public Key',
            content: `
                <div class="help-content">
                    <p><strong>Format:</strong> user_xxxxxxxxxxxxxx (ca. 20 Zeichen)</p>
                    <p>Finde ihn unter: <strong>EmailJS → Account → General</strong></p>
                    <div class="help-warning">
                        ⚠️ NICHT den Private Key verwenden!
                    </div>
                    <div class="help-example">
                        ✅ Richtig: user_ABCDEfghIJKLmnopQRST<br>
                        ❌ Falsch: private_key_xyz
                    </div>
                    <a href="howto.html#step-4" target="_blank" class="help-link">
                        📖 Public Key finden
                    </a>
                </div>
            `,
            placement: 'right',
            trigger: 'focus'
        },

        // KOMPLIZIERT: Mail Wizard Steps
        'wizard-step-1-mailtype': {
            title: 'Mail-Typ',
            content: `
                <div class="help-content">
                    <p>Wähle je nach Zweck:</p>
                    <div class="help-tip">
                        • <strong>Newsletter:</strong> Regelmäßige Updates<br>
                        • <strong>Ankündigung:</strong> Wichtige News<br>
                        • <strong>Individuell:</strong> Eigenes Design
                    </div>
                </div>
            `,
            placement: 'bottom',
            trigger: 'hover'
        },

        'wizard-step-2-template': {
            title: '🎨 Template auswählen',
            content: `
                <div class="help-content">
                    <p>Wähle eine Vorlage oder nutze gespeicherte Templates:</p>
                    <ul>
                        <li><strong>📋 Vordefinierte:</strong> Fertige Designs</li>
                        <li><strong>💾 Gespeicherte:</strong> Deine eigenen Templates</li>
                    </ul>
                    <div class="help-tip">
                        💡 Templates können im Editor angepasst werden
                    </div>
                </div>
            `,
            placement: 'top',
            trigger: 'hover'
        },

        'wizard-step-3-editor': {
            title: '✏️ E-Mail bearbeiten',
            content: `
                <div class="help-content">
                    <p><strong>Betreff:</strong> Wird personalisiert mit {{name}}</p>
                    <p><strong>Inhalt:</strong> HTML oder Text eingeben</p>
                    <div class="help-variables">
                        <strong>Verfügbare Variablen:</strong><br>
                        {{name}} - Name des Empfängers<br>
                        {{email}} - E-Mail des Empfängers
                    </div>
                    <div class="help-tip">
                        💡 Live-Vorschau zeigt finales Ergebnis
                    </div>
                </div>
            `,
            placement: 'left',
            trigger: 'focus'
        },

        'wizard-subject-help': {
            title: 'Betreff-Tipps',
            content: `
                <div class="help-content">
                    <p>Nutze Platzhalter wie <code>{{name}}</code> für Personalisierung.</p>
                </div>
            `,
            placement: 'bottom',
            trigger: 'hover'
        },

        'wizard-content-help': {
            title: 'Inhalt bearbeiten',
            content: `
                <div class="help-content">
                    <p>Verwende HTML oder Text. Platzhalter wie {{name}} werden beim Versand ersetzt.</p>
                </div>
            `,
            placement: 'bottom',
            trigger: 'hover'
        },

        'wizard-step-4-recipients': {
            title: '👥 Empfänger auswählen',
            content: `
                <div class="help-content">
                    <p>Wähle aus deiner Empfänger-Liste:</p>
                    <ul>
                        <li><strong>Alle auswählen:</strong> Für Broadcasts</li>
                        <li><strong>Einzelauswahl:</strong> Für gezielte Kampagnen</li>
                        <li><strong>Suchen:</strong> Bestimmte Empfänger finden</li>
                    </ul>
                    <div class="help-warning">
                        ⚠️ Mindestens 1 Empfänger erforderlich
                    </div>
                </div>
            `,
            placement: 'top',
            trigger: 'hover'
        },

        // KOMPLIZIERT: CSV Import
        'csv-import-format': {
            title: '📊 CSV Format',
            content: `
                <div class="help-content">
                    <p><strong>Erforderliche Spalten:</strong></p>
                    <div class="help-code">
name,email<br>
Max Mustermann,max@example.com<br>
Anna Schmidt,anna@example.com
                    </div>
                    <div class="help-tips">
                        <strong>✅ Richtig:</strong><br>
                        • UTF-8 Encoding<br>
                        • Komma als Trenner<br>
                        • Header-Zeile mit "name,email"<br><br>
                        <strong>❌ Häufige Fehler:</strong><br>
                        • Semikolon statt Komma<br>
                        • Fehlende Header<br>
                        • Umlaute-Probleme
                    </div>
                </div>
            `,
            placement: 'right',
            trigger: 'click'
        },

        // KOMPLIZIERT: Template Editor
        'template-editor-variables': {
            title: '🏷️ Template Variablen',
            content: `
                <div class="help-content">
                    <p><strong>Personalisierung mit Variablen:</strong></p>
                    <div class="help-variables">
                        <strong>{{name}}</strong> - Name des Empfängers<br>
                        <strong>{{email}}</strong> - E-Mail-Adresse<br>
                        <strong>{{date}}</strong> - Aktuelles Datum<br>
                        <strong>{{company}}</strong> - Firmenname (optional)
                    </div>
                    <div class="help-example">
                        Beispiel: "Hallo {{name}}, willkommen!"<br>
                        Wird zu: "Hallo Max Mustermann, willkommen!"
                    </div>
                </div>
            `,
            placement: 'left',
            trigger: 'hover'
        },

        'template-editor-html': {
            title: '💻 HTML Editor',
            content: `
                <div class="help-content">
                    <p>Erweiterte HTML-E-Mail-Gestaltung:</p>
                    <ul>
                        <li><strong>Inline CSS:</strong> Für E-Mail-Kompatibilität</li>
                        <li><strong>Tables:</strong> Für Layout-Struktur</li>
                        <li><strong>Web-sichere Farben:</strong> #RRGGBB Format</li>
                    </ul>
                    <div class="help-warning">
                        ⚠️ JavaScript wird in E-Mails nicht unterstützt
                    </div>
                </div>
            `,
            placement: 'top',
            trigger: 'focus'
        },

        // KOMPLIZIERT: Campaign Settings
        'campaign-send-speed': {
            title: '⚡ Versand-Geschwindigkeit',
            content: `
                <div class="help-content">
                    <p><strong>Empfohlene Einstellungen:</strong></p>
                    <ul>
                        <li><strong>1000ms (Normal):</strong> Für die meisten Fälle</li>
                        <li><strong>2000ms (Langsam):</strong> Bei EmailJS-Limits</li>
                        <li><strong>500ms (Schnell):</strong> Nur für kleine Listen</li>
                    </ul>
                    <div class="help-warning">
                        ⚠️ Zu schnell kann zu Fehlern führen
                    </div>
                </div>
            `,
            placement: 'right',
            trigger: 'hover'
        }
    };

    // ===== TOOLTIP MANAGEMENT =====
    let activeTooltip = null;
    let tooltipTimeout = null;

    /**
     * Initialisiert das Help System
     */
    function init() {
        createTooltipContainer();
        attachEventListeners();
        console.log('✓ Help System initialized');
    }

    /**
     * Erstellt Tooltip-Container
     */
    function createTooltipContainer() {
        if (document.getElementById('helpTooltipContainer')) return;

        const container = document.createElement('div');
        container.id = 'helpTooltipContainer';
        container.className = 'help-tooltip-container';
        document.body.appendChild(container);
    }

    /**
     * Hängt Event Listeners an alle Help-Elemente
     */
    function attachEventListeners() {
        // MutationObserver für dynamisch hinzugefügte Elemente
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Element node
                        attachHelpToElement(node);
                        // Auch child elements prüfen
                        const helpElements = node.querySelectorAll('[data-help]');
                        helpElements.forEach(attachHelpToElement);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Bestehende Elemente verarbeiten
        document.querySelectorAll('[data-help]').forEach(attachHelpToElement);

        // Global click handler für Tooltip schließen
        document.addEventListener('click', handleGlobalClick);
        document.addEventListener('keydown', handleKeydown);
    }

    /**
     * Hängt Help-Funktionalität an ein Element
     */
    function attachHelpToElement(element) {
        const helpId = element.getAttribute('data-help');
        if (!helpId || !HELP_CONTENT[helpId]) return;

        const config = HELP_CONTENT[helpId];
        let hoverTimer;

        switch (config.trigger) {
            case 'hover':
                element.addEventListener('mouseenter', () => {
                    clearTimeout(hoverTimer);
                    hoverTimer = setTimeout(() => {
                        showTooltip(element, helpId);
                    }, 300);
                });

                element.addEventListener('mouseleave', () => {
                    clearTimeout(hoverTimer);
                    if (activeTooltip) {
                        setTimeout(() => {
                            if (!activeTooltip?.matches(':hover')) {
                                hideTooltip();
                            }
                        }, 100);
                    }
                });
                break;
            case 'focus':
                element.addEventListener('focus', () => showTooltip(element, helpId));
                element.addEventListener('blur', () => hideTooltip());
                break;
            case 'click':
                element.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showTooltip(element, helpId);
                });
                break;
        }

        if (!element.querySelector('.help-indicator')) {
            const indicator = document.createElement('span');
            indicator.className = 'help-indicator';
            indicator.innerHTML = '?';
            indicator.title = 'Hilfe anzeigen';

            if (element.tagName === 'LABEL') {
                element.appendChild(indicator);
            } else {
                element.style.position = 'relative';
                element.appendChild(indicator);
            }
        }
    }

    /**
     * Zeigt Tooltip an
     */
    function showTooltip(element, helpId) {
        clearTimeout(tooltipTimeout);
        hideTooltip();

        const config = HELP_CONTENT[helpId];
        const container = document.getElementById('helpTooltipContainer');

        const tooltip = document.createElement('div');
        tooltip.className = 'help-tooltip';
        tooltip.dataset.placement = config.placement;
        tooltip.innerHTML = `
            <div class="help-tooltip-body">
                <div class="tooltip-title">${config.title}</div>
                ${config.content}
            </div>
        `;

        container.appendChild(tooltip);

        requestAnimationFrame(() => {
            positionTooltip(tooltip, element, config.placement);
            setTimeout(() => {
                tooltip.classList.add('show');
            }, 10);
        });

        activeTooltip = tooltip;

        if (config.trigger === 'hover') {
            tooltipTimeout = setTimeout(() => {
                hideTooltip();
            }, 5000);
        }
    }

    /**
     * Positioniert Tooltip relativ zum Element
     */
    function positionTooltip(tooltip, element, placement) {
        const elementRect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        let top, left;

        switch (placement) {
            case 'top':
                top = elementRect.top - tooltipRect.height - 10;
                left = elementRect.left + (elementRect.width - tooltipRect.width) / 2;
                break;
            case 'bottom':
                top = elementRect.bottom + 10;
                left = elementRect.left + (elementRect.width - tooltipRect.width) / 2;
                break;
            case 'left':
                top = elementRect.top + (elementRect.height - tooltipRect.height) / 2;
                left = elementRect.left - tooltipRect.width - 10;
                break;
            case 'right':
            default:
                top = elementRect.top + (elementRect.height - tooltipRect.height) / 2;
                left = elementRect.right + 10;
                break;
        }

        // Viewport constraints
        if (left < 10) left = 10;
        if (left + tooltipRect.width > viewport.width - 10) {
            left = viewport.width - tooltipRect.width - 10;
        }
        if (top < 10) top = 10;
        if (top + tooltipRect.height > viewport.height - 10) {
            top = viewport.height - tooltipRect.height - 10;
        }

        tooltip.style.top = top + 'px';
        tooltip.style.left = left + 'px';
    }

    /**
     * Versteckt aktiven Tooltip
     */
    function hideTooltip() {
        if (activeTooltip) {
            activeTooltip.classList.add('hide');
            tooltipTimeout = setTimeout(() => {
                if (activeTooltip && activeTooltip.parentNode) {
                    activeTooltip.parentNode.removeChild(activeTooltip);
                }
                activeTooltip = null;
            }, 300);
        }
    }

    /**
     * Global click handler
     */
    function handleGlobalClick(e) {
        if (activeTooltip && !activeTooltip.contains(e.target)) {
            hideTooltip();
        }
    }

    /**
     * Keyboard handler
     */
    function handleKeydown(e) {
        if (e.key === 'Escape' && activeTooltip) {
            hideTooltip();
        }
    }

    // ===== PUBLIC API =====
    return {
        init,
        showTooltip,
        hideTooltip
    };
})();

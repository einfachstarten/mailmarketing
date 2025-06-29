/**
 * E-Mail Marketing Tool - Mail Wizard Integration
 * Professioneller Wizard als Alternative zum Template-Editor
 */

window.MailWizard = (function() {
    'use strict';

    // ===== WIZARD STATE =====
    let currentStep = 1;
    let wizardData = {
        mailType: '',
        template: '',
        subject: '',
        content: '',
        attachments: [],
        selectedRecipients: [], // NEU: Ausgewählte Empfänger
        settings: {
            speed: 1000,
            testEmail: false
        }
    };

    // ===== EMPFÄNGER-VERWALTUNG =====
    let allRecipients = [];
    let filteredRecipients = [];
    let recipientPage = 1;
    let recipientsPerPage = 10;

    const STEP_NAMES = [
        'Mail-Typ',
        'Template',
        'Editor',
        'Empfänger',
        'Attachments',
        'Review'
    ];

    // ===== TEMPLATE LIBRARY =====
    const TEMPLATE_LIBRARY = {
        newsletter: {
            modern: {
                name: 'Modern Newsletter',
                description: 'Klares Design mit Sections',
                icon: '📰',
                subject: '{{name}}, dein Weekly Update! 📰',
                html: `<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; margin-bottom: 20px; border-radius: 10px;">
                <h1 style="margin: 0; font-size: 28px;">Newsletter</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Hallo {{name}}! 👋</p>
            </div>
            <h2>📈 Diese Woche</h2>
            <p>Hier sind die wichtigsten Updates und Neuigkeiten für dich.</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
            <p>Bei Fragen bin ich gerne für dich da!</p>`
            },

            simple: {
                name: 'Simple Newsletter',
                description: 'Minimalistisch und clean',
                icon: '📄',
                subject: 'Newsletter {{name}} - {{month}}',
                html: `<h1>Newsletter</h1>
            <p>Hallo {{name}},</p>
            <p>hier ist dein monatlicher Newsletter mit allen wichtigen Updates.</p>
            <h2>Neuigkeiten</h2>
            <ul>
                <li>Update 1</li>
                <li>Update 2</li>
                <li>Update 3</li>
            </ul>
            <p>Viele Grüße!</p>`
            },

            professional: {
                name: 'Professional Newsletter',
                description: 'Business-orientiert',
                icon: '💼',
                subject: 'Business Update für {{name}}',
                html: `<div style="border-left: 4px solid #4a90e2; padding-left: 20px; margin-bottom: 20px;">
                <h1 style="color: #2c3e50;">Business Newsletter</h1>
                <p style="color: #6c757d;">{{name}} • $(date)</p>
            </div>
            <h2>Executive Summary</h2>
            <p>Liebe/r {{name}},</p>
            <p>hier ist unser aktueller Business Update mit den wichtigsten Kennzahlen und Entwicklungen.</p>
            <p>Mit freundlichen Grüßen</p>`
            }
        },

        announcement: {
            urgent: {
                name: 'Wichtige Ankündigung',
                description: 'Aufmerksamkeitsstark',
                icon: '🚨',
                subject: '🚨 Wichtige Ankündigung für {{name}}',
                html: `<div style="background: #dc3545; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
                <h1 style="margin: 0; font-size: 24px;">🚨 Wichtige Ankündigung</h1>
            </div>
            <p>Hallo {{name}},</p>
            <p>wir haben wichtige Neuigkeiten für dich:</p>
            <p><strong>Platz für deine wichtige Ankündigung...</strong></p>
            <p>Bei Fragen bin ich gerne für dich da!</p>`
            },

            news: {
                name: 'Neuigkeit',
                description: 'Positive Nachrichten',
                icon: '📢',
                subject: 'Neuigkeiten für {{name}} 🎉',
                html: `<div style="background: #28a745; color: white; padding: 25px; border-radius: 10px; text-align: center; margin-bottom: 25px;">
                <h1 style="margin: 0;">🎉 Großartige Neuigkeiten!</h1>
            </div>
            <p>Hallo {{name}},</p>
            <p>ich habe aufregende Neuigkeiten für dich:</p>
            <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                <p><strong>Platz für deine wichtige Nachricht...</strong></p>
            </div>
            <p>🚀 Jetzt erfahren</p>`
            }
        },

        custom: {
            blank: {
                name: 'Blank Template',
                description: 'Komplett leer zum selbst gestalten',
                icon: '🎨',
                subject: 'E-Mail von {{name}}',
                html: `<p>Hallo {{name}}!</p>
            <p>Hier ist Platz für deinen Inhalt...</p>
            <p>Viele Grüße!</p>`
            }
        }
    };

    // ===== INITIALIZATION =====

    /**
     * Initialisiert das MailWizard-Modul
     */
    function init() {
        console.log('✓ MailWizard module initialized');
    }

    // ===== WIZARD MANAGEMENT =====

    /**
     * Startet neuen Mail-Wizard
     */
    function startWizard() {
        const modal = document.getElementById('mailWizardModal');
        if (!modal) {
            console.error('Mail wizard modal not found');
            return;
        }

        const progressContainer = document.getElementById('wizardProgressContainer');
        const contentContainer = document.getElementById('wizardContentContainer');
        const buttonContainer = document.getElementById('wizardButtonsContainer');

        console.log('=== MODAL STRUCTURE CHECK ===');
        console.log('Progress container:', !!progressContainer);
        console.log('Content container:', !!contentContainer);
        console.log('Button container:', !!buttonContainer);

        if (!buttonContainer) {
            console.warn('Button container missing, creating...');
            const newButtonContainer = document.createElement('div');
            newButtonContainer.id = 'wizardButtonsContainer';
            newButtonContainer.className = 'wizard-buttons';
            modal.appendChild(newButtonContainer);
            console.log('Button container created');
        }

        resetWizardState();
        modal.classList.remove('hidden');
        generateWizardHTML();

        console.log('Wizard started, button container check:', !!document.getElementById('wizardButtonsContainer'));
    }

    /**
     * Setzt Wizard-Daten zurück
     */
function resetWizardData() {
        wizardData = {
            mailType: '',
            template: '',
            subject: '',
            content: '',
            attachments: [],
            selectedRecipients: [],
            settings: {
                speed: 1000,
                testEmail: false
            }
        };
    }

    /**
     * Zeigt Wizard-Modal
     */
    function showWizardModal() {
        const modal = document.getElementById('mailWizardModal');
        if (modal) {
            resetWizardState();
            modal.classList.remove('hidden');
            generateWizardHTML();
            updateWizardStep();
            initMailWizardKeyboard();
        }
    }

    /**
     * Generiert komplettes Wizard-HTML dynamisch
     */
function generateWizardHTML() {
        console.log('🔧 Starting generateWizardHTML...');

        // 1. Progress updaten
        updateProgress();

        // 2. Steps generieren
        generateWizardSteps();

        // 3. Buttons updaten
        updateNavigationButtons();

        // 4. WICHTIG: Synchron ersten Step aktivieren
        activateStepDirectly(currentStep);
    }

    /**
     * Generiert Progress-Indikatoren
     */
function updateProgress() {
        const container = document.getElementById('wizardProgressContainer');
        if (!container) return;

        let html = '<div class="wizard-progress">';

        for (let i = 1; i <= 6; i++) {
            const isActive = i === currentStep;
            const isCompleted = i < currentStep;
            const isClickable = i <= currentStep || isCompleted;

            let stepClass = 'wizard-step-circle';
            if (isActive) stepClass += ' active';
            if (isCompleted) stepClass += ' completed';
            if (isClickable) stepClass += ' clickable';

            const clickHandler = isClickable ? `onclick="MailWizard.jumpToStep(${i})"` : '';
            const title = `Schritt ${i}: ${STEP_NAMES[i-1]}${isClickable ? ' (klicken zum springen)' : ''}`;

            html += `<div class="${stepClass}" ${clickHandler} title="${title}">${i}</div>`;

            if (i < 6) {
                const lineClass = isCompleted ? 'step-line completed' : 'step-line';
                html += `<div class="${lineClass}"></div>`;
            }
        }

        html += '</div>';
        container.innerHTML = html;
    }

    /**
     * Generiert alle Wizard-Schritte
     */
    function generateWizardSteps() {
        const container = document.getElementById('wizardContentContainer');
        if (!container) {
            console.error('❌ wizardContentContainer not found!');
            return;
        }

        const htmlContent = `
        ${generateStep1()}
        ${generateStep2()}
        ${generateStep3()}
        ${generateStep4()}
        ${generateStep5()}
        ${generateStep6()}
    `;

        console.log('📝 Generated HTML length:', htmlContent.length);
        console.log('📝 HTML preview:', htmlContent.substring(0, 200) + '...');

        container.innerHTML = htmlContent;

        setTimeout(() => {
            const step1 = document.getElementById('mail-wizard-step-1');
            console.log('🔍 Step 1 immediately after innerHTML:', !!step1);

            if (step1) {
                console.log('✅ Step 1 found in DOM');
            } else {
                console.error('❌ Step 1 NOT in DOM after innerHTML set');
                console.log('Container content:', container.innerHTML.substring(0, 300));
            }
        }, 0);
    }

    /**
     * Generiert Schritt 1: Mail-Typ
     */
    function generateStep1() {
        return `\n        <div id="mail-wizard-step-1" class="wizard-step-content active">\n            <div class="step-intro">\n                <h3 class="step-title">📧 Mail-Typ wählen</h3>\n                <p class="step-subtitle">Welche Art von E-Mail möchtest du versenden?</p>\n                <div class="help-widget" data-help="wizard-step-1-mailtype">\n                    💡 Hilfe: Welcher Typ ist richtig?\n                </div>\n            </div>\n            \n            <div class="wizard-mail-types">\n                <div class="wizard-mail-type-card" onclick="MailWizard.selectMailType('newsletter')">\n                    <div class="mail-type-icon">📰</div>\n                    <h3>Newsletter</h3>\n                    <p>Regelmäßige Updates und News</p>\n                    <ul>\n                        <li>Professionelle Templates</li>\n                        <li>Mehrere Sections</li>\n                        <li>Call-to-Action Buttons</li>\n                    </ul>\n                </div>\n                \n                <div class="wizard-mail-type-card" onclick="MailWizard.selectMailType('announcement')">\n                    <div class="mail-type-icon">📢</div>\n                    <h3>Ankündigung</h3>\n                    <p>Wichtige Neuigkeiten mitteilen</p>\n                    <ul>\n                        <li>Aufmerksamkeitsstarkes Design</li>\n                        <li>Klare Botschaft</li>\n                        <li>Sofortige Wirkung</li>\n                    </ul>\n                </div>\n                \n                <div class="wizard-mail-type-card" onclick="MailWizard.selectMailType('custom')">\n                    <div class="mail-type-icon">🎨</div>\n                    <h3>Individuell</h3>\n                    <p>Komplett frei gestaltbar</p>\n                    <ul>\n                        <li>Blank Template</li>\n                        <li>Volle Kontrolle</li>\n                        <li>Eigenes Design</li>\n                    </ul>\n                </div>\n            </div>\n        </div>\n    `;
    }

    /**
     * Generiert Schritt 2: Template
     */
    function generateStep2() {
        return `\n        <div id="mail-wizard-step-2" class="wizard-step-content">\n            <div class="step-intro">\n                <h3 class="step-title">🎨 Template auswählen</h3>\n                <p class="step-subtitle">Template für <span id="selected-mail-type">deine E-Mail</span> wählen</p>\n                <div class="help-widget" data-help="wizard-step-2-template">\n                    💡 Hilfe: Templates verstehen\n                </div>\n            </div>\n            \n            <div id="wizardTemplateLibrary" class="wizard-template-library">\n                <!-- Templates werden dynamisch geladen -->\n            </div>\n        </div>\n    `;
    }

    /**
     * Generiert Schritt 3: Editor
     */
    function generateStep3() {
        return `
    <div id="mail-wizard-step-3" class="wizard-step-content">
        <div class="step-intro">
            <h3 class="step-title">✏️ Inhalt bearbeiten</h3>
            <p class="step-subtitle">Betreff und E-Mail-Inhalt anpassen</p>
        </div>

        <div class="wizard-editor-container">
            <div class="editor-panel">
                <div class="form-group">
                    <label for="wizardSubject">📧 Betreff *</label>
                    <input type="text" id="wizardSubject" class="form-control"
                           placeholder="E-Mail Betreff eingeben...">
                </div>

                <div class="form-group">
                    <label for="wizardVisualEditor">📝 E-Mail Inhalt</label>

                    <div class="editor-toolbar">
                        <div class="toolbar-section">
                            <span class="toolbar-label">Format:</span>
                            <button type="button" class="btn-editor" onclick="MailWizard.formatText('bold')" title="Fett"><strong>B</strong></button>
                            <button type="button" class="btn-editor" onclick="MailWizard.formatText('italic')" title="Kursiv"><em>I</em></button>
                            <button type="button" class="btn-editor" onclick="MailWizard.formatText('underline')" title="Unterstrichen"><u>U</u></button>
                        </div>
                        <div class="toolbar-section">
                            <span class="toolbar-label">Einfügen:</span>
                            <button type="button" class="btn-editor variable-btn" onclick="MailWizard.insertPersonalization('name')" title="Name einfügen">{{name}}</button>
                            <button type="button" class="btn-editor variable-btn" onclick="MailWizard.insertPersonalization('email')" title="E-Mail einfügen">{{email}}</button>
                            <button type="button" class="btn-editor variable-btn" onclick="MailWizard.insertPersonalization('company')" title="Firma einfügen">{{company}}</button>
                        </div>
                        <div class="toolbar-section">
                            <span class="toolbar-label">Aktionen:</span>
                            <button type="button" class="btn-editor action-btn" onclick="MailWizard.clearEditor()" title="Alles löschen">🗑️ Löschen</button>
                            <button type="button" class="btn-editor action-btn" onclick="MailWizard.insertTemplate()" title="Template einfügen">📋 Template</button>
                        </div>
                        <div class="toolbar-section">
                            <button type="button" class="btn-editor attachment-btn" onclick="MailWizard.showAttachmentMenu()" id="attachmentMenuBtn">
                                📎 Anhänge (<span id="attachmentCount">0</span>)
                            </button>
                            <button type="button" class="btn-editor variable-btn" onclick="MailWizard.insertAttachmentList()">
                                📋 Alle Anhänge einfügen
                            </button>
                        </div>
                    </div>

                    <div id="attachmentDropdownMenu" class="attachment-dropdown hidden">
                        <div class="dropdown-header">📎 Verfügbare Anhänge</div>
                        <div id="attachmentMenuList" class="attachment-menu-list"></div>
                        <div class="dropdown-footer">
                            <small>💡 Tipp: Anhänge werden automatisch an jede E-Mail angehängt</small>
                        </div>
                    </div>

                    <div id="wizardVisualEditor" class="wizard-visual-editor"
                         contenteditable="true"
                         placeholder="Hier deinen E-Mail-Inhalt eingeben..."></div>

                    <div class="editor-status">
                        <span id="editorCharCount" class="char-count">0 Zeichen</span>
                        <span id="editorWordCount" class="word-count">0 Wörter</span>
                    </div>
                </div>
            </div>

            <div class="preview-panel">
                <h4>📱 Live-Vorschau</h4>
                <div class="preview-controls">
                    <button type="button" class="btn btn-sm" onclick="MailWizard.refreshPreview()">🔄 Aktualisieren</button>
                    <select id="previewDevice" class="form-control-sm" onchange="MailWizard.switchPreviewDevice()">
                        <option value="desktop">💻 Desktop</option>
                        <option value="mobile">📱 Mobile</option>
                    </select>
                </div>
                <div id="wizardEmailPreviewStep3" class="wizard-email-preview-container">
                    <!-- Live Preview wird hier angezeigt -->
                </div>
            </div>
        </div>
    </div>
    `;
    }


    /**
     * Generiert Schritt 4: Empfänger
     */
    function generateStep4() {
        return `
        <div id="mail-wizard-step-4" class="wizard-step-content">
            <div class="step-intro">
                <h3 class="step-title">👥 Empfänger auswählen</h3>
                <p class="step-subtitle">Wer soll diese E-Mail erhalten?</p>
            </div>

            <div class="wizard-recipient-controls">
                <input type="text" id="wizardRecipientSearch"
                       placeholder="Empfänger suchen..."
                       class="form-control"
                       oninput="MailWizard.filterRecipients()">
                <div class="recipient-actions">
                    <button type="button" class="btn btn-secondary" onclick="MailWizard.selectAllRecipients()">
                        ✓ Alle auswählen
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="MailWizard.deselectAllRecipients()">
                        ✗ Alle abwählen
                    </button>
                </div>
            </div>

            <div id="wizardRecipientList" class="wizard-recipient-list">
                <p class="placeholder">Lade Empfänger...</p>
            </div>

            <div id="wizardRecipientPagination" class="wizard-pagination" style="display: none;">
                <button type="button" class="btn btn-secondary" onclick="MailWizard.previousRecipientPage()">
                    ← Vorherige
                </button>
                <span id="wizardRecipientPageInfo" class="page-info">Seite 1 von 1</span>
                <button type="button" class="btn btn-secondary" onclick="MailWizard.nextRecipientPage()">
                    Nächste →
                </button>
            </div>

            <div class="wizard-recipient-stats">
                <div class="recipient-stat-card">
                    <div class="stat-number" id="wizardSelectedRecipients">0</div>
                    <div class="stat-label">Ausgewählt</div>
                </div>
                <div class="recipient-stat-card">
                    <div class="stat-number" id="wizardTotalRecipients">0</div>
                    <div class="stat-label">Gesamt</div>
                </div>
            </div>
        </div>
    `;
    }
    /**
     * Generiert Schritt 5: Anhänge
     */
    function generateStep5() {
        return `\n        <div id="mail-wizard-step-5" class="wizard-step-content">\n            <div class="step-intro">\n                <h3 class="step-title">📎 Anhänge (Optional)</h3>\n                <p class="step-subtitle">Dateien zu deiner E-Mail hinzufügen</p>\n            </div>\n            \n            <div class="attachment-upload">\n                <div id="attachmentDropZone" class="attachment-drop-zone">\n                    <p>📁 Dateien hier ablegen oder klicken zum Auswählen</p>\n                    <input type="file" id="attachmentFileInput" multiple hidden>\n                </div>\n            </div>\n            \n            <div id="attachmentList" class="attachment-list">\n                <!-- Anhänge werden hier angezeigt -->\n            </div>\n        </div>\n    `;
    }

    /**
     * Generiert Schritt 6: Review
     */
function generateStep6() {
        return `
        <div id="mail-wizard-step-6" class="wizard-step-content">
            <div class="step-intro">
                <h3 class="step-title">🎯 Finale Überprüfung</h3>
                <p class="step-subtitle">Prüfe alle Details vor dem Versand</p>
            </div>

            <!-- Bestehende Summary -->
            <div class="wizard-summary">
                <!-- ... bestehender Summary-Code ... -->
            </div>

            <!-- Neue Test-Funktionen -->
            <div class="wizard-test-section">
                <h4>🧪 Vor dem Versand testen</h4>
                <div class="test-actions">
                    <button type="button" class="btn btn-info" onclick="MailWizard.sendTestEmail()">
                        📧 Test-E-Mail senden
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="MailWizard.generateRealEmailPreview()">
                        🔄 Vorschau aktualisieren
                    </button>
                </div>
                <small>Test-E-Mail wird an den ersten ausgewählten Empfänger gesendet</small>
            </div>

            <div id="wizardEmailPreview" class="wizard-email-preview">
                <!-- Vorschau wird hier generiert -->
            </div>
        </div>
    `;
}

    /**
     * Aktualisiert Navigation Buttons mit besserem Feedback
     */
    function updateNavigationButtons() {
        const container = document.getElementById('wizardButtonsContainer');
        if (!container) return;

        const isFirstStep = currentStep === 1;
        const isLastStep = currentStep === 6;

        const prevDisabled = isFirstStep ? 'disabled' : '';
        const nextText = isLastStep ? '🚀 Kampagne starten' : 'Weiter →';
        const nextClass = isLastStep ? 'btn btn-success' : 'btn btn-primary';

        const html = `
            <button type="button" class="btn btn-secondary"
                    onclick="MailWizard.previousStep()" ${prevDisabled}>
                ← Zurück
            </button>

            <div class="wizard-nav-info">
                <span class="nav-step-info">Schritt ${currentStep} von 6</span>
                <span class="nav-step-name">${STEP_NAMES[currentStep-1]}</span>
            </div>

            <button type="button" class="${nextClass}"
                    onclick="MailWizard.nextStep()">
                ${nextText}
            </button>
        `;

        container.innerHTML = html;
    }

    /**
     * Setzt gesamten Wizard-Zustand zurück
     */
    function resetWizardState() {
        currentStep = 1;
        resetWizardData();
        const progress = document.getElementById('wizardProgressContainer');
        const content = document.getElementById('wizardContentContainer');
        const buttons = document.getElementById('wizardButtonsContainer');
        if (progress) progress.innerHTML = '';
        if (content) content.innerHTML = '';
        if (buttons) buttons.innerHTML = '';
    }

    /**
     * Generiert Wizard-Buttons
*/


    /**
     * Versteckt Wizard-Modal
     */
    function hideWizardModal() {
        const modal = document.getElementById('mailWizardModal');
        if (modal) {
            modal.classList.add('hidden');
        }
        document.removeEventListener('keydown', handleMailWizardKeydown);
        resetWizardState();
    }

    /**
     * Keyboard Navigation für Mail Wizard
     */
    function initMailWizardKeyboard() {
        document.addEventListener('keydown', handleMailWizardKeydown);
    }

    function handleMailWizardKeydown(event) {
        const mailWizardModal = document.querySelector('#mailWizardModal:not(.hidden)');
        if (!mailWizardModal) return;

        const activeElement = document.activeElement;
        const isInputFocused = activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.contentEditable === 'true'
        );

        switch (event.key) {
            case 'Escape':
                event.preventDefault();
                hideWizardModal();
                break;

            case 'Enter':
                if (!isInputFocused) {
                    event.preventDefault();
                    if (currentStep < 6) {
                        nextStep();
                    } else {
                        finishWizard();
                    }
                }
                break;

            case 'ArrowRight':
                if (!isInputFocused) {
                    event.preventDefault();
                    if (currentStep < 6) nextStep();
                }
                break;

            case 'ArrowLeft':
                if (!isInputFocused) {
                    event.preventDefault();
                    if (currentStep > 1) previousStep();
                }
                break;
        }
    }

    // ===== STEP NAVIGATION =====

    /**
     * Nächster Schritt
     */
    function nextStep() {
        if (validateCurrentStep()) {
            if (currentStep < 6) { // Erweitert auf 6 Steps
                currentStep++;
                updateWizardStep();
            } else {
                finishWizard();
            }
        }
    }

    /**
     * Vorheriger Schritt
     */
    function previousStep() {
        if (currentStep > 1) {
            currentStep--;
            updateWizardStep();
        }
    }

    /**
     * Springt zu bestimmtem Step (mit Validation)
     */
    function jumpToStep(targetStep) {
        if (targetStep === currentStep) return;

        if (targetStep > currentStep + 1) {
            Utils.showToast('Bitte schließe den aktuellen Schritt zuerst ab', 'warning');
            return;
        }

        if (targetStep < currentStep - 1) {
            if (!confirm(`Möchtest du wirklich zu Schritt ${targetStep} zurückspringen? Änderungen bleiben erhalten.`)) {
                return;
            }
        }

        currentStep = targetStep;
        showStep(targetStep);
        Utils.showToast(`⚡ Zu Schritt ${targetStep} gesprungen`, 'success');
    }

    function activateStepDirectly(stepNumber) {
        console.log(`🎯 Activating step ${stepNumber} directly...`);

        document.querySelectorAll('.wizard-step-content').forEach(step => {
            step.classList.remove('active');
        });

        let stepElement = document.getElementById(`mail-wizard-step-${stepNumber}`);

        if (stepElement) {
            stepElement.classList.add('active');
            console.log(`✅ Step ${stepNumber} activated successfully`);
            initializeStepFeatures(stepNumber);

            const content = document.getElementById('wizardContentContainer');
            if (content) {
                content.classList.remove('loading');
            }
        } else {
            console.error(`❌ Step element mail-wizard-step-${stepNumber} not found`);
            const allElements = document.querySelectorAll('[id^="mail-wizard-step-"]');
            console.log('Available step elements:', Array.from(allElements).map(el => el.id));

            const firstStep = document.querySelector('.wizard-step-content');
            if (firstStep) {
                firstStep.classList.add('active');
                console.log('⚠️ Used first available step as fallback');
            }
        }
    }

    function initializeStepFeatures(stepNumber) {
        switch (stepNumber) {
            case 2:
                setTimeout(loadTemplateLibrary, 50);
                break;
            case 3:
                setTimeout(initializeEditor, 50);
                break;
            case 4:
                setTimeout(loadRecipientSelector, 50);
                break;
            case 5:
                setTimeout(initializeAttachments, 50);
                break;
            case 6:
                setTimeout(prepareReviewStep, 50);
                break;
        }
    }

    /**
     * Aktualisiert Wizard-Anzeige
     */
function showStep(stepNumber) {
        console.log(`🔄 Navigating to step ${stepNumber}`);

        const content = document.getElementById('wizardContentContainer');
        if (content) {
            content.classList.add('loading');
        }

        setTimeout(() => {
            activateStepDirectly(stepNumber);
            updateProgress();
            updateNavigationButtons();
        }, 100);
    }

    function updateWizardStep() {
        console.log('Updating wizard step to:', currentStep);

        showStep(currentStep);
    }


    /**
     * Lädt Empfänger-Liste
     */

    /**
     * Initialisiert Anhänge-System
     */
    function initializeAttachments() {
        console.log('Initializing wizard attachments integration...');

        // Warte bis DOM ready
        setTimeout(() => {
            setupAttachmentIntegration();
        }, 100);
    }

    function setupAttachmentIntegration() {
        const fileInput = document.getElementById('attachmentFileInput');
        const dropZone = document.getElementById('attachmentDropZone');

        if (!fileInput || !dropZone) {
            console.error('Attachment elements not found in DOM');
            return;
        }

        fileInput.addEventListener('change', (e) => {
            handleWizardFileSelect(e.target.files);
        });

        dropZone.addEventListener('click', () => {
            fileInput.click();
        });

        dropZone.addEventListener('dragover', handleWizardDragOver);
        dropZone.addEventListener('drop', handleWizardDrop);
        dropZone.addEventListener('dragleave', handleWizardDragLeave);

        updateWizardAttachmentDisplay();

        console.log('✓ Attachment integration setup complete');
    }

    async function handleWizardFileSelect(files) {
        if (!window.Attachments) {
            console.error('Attachments module not available');
            return;
        }

        const dropZone = document.getElementById('attachmentDropZone');
        if (dropZone) {
            dropZone.innerHTML = '<p>📤 Uploading files...</p>';
        }

        try {
            await Attachments.processFiles(files);

            wizardData.attachments = Attachments.getAttachments();

            updateWizardAttachmentDisplay();

            resetDropZone();

        } catch (error) {
            handleUploadError(error, files[0]?.name || 'Datei');
        }
    }

    function handleWizardDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }

    function handleWizardDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        handleWizardFileSelect(e.dataTransfer.files);
    }

    function handleWizardDragLeave(e) {
        e.currentTarget.classList.remove('dragover');
    }

    function resetDropZone() {
        const dropZone = document.getElementById('attachmentDropZone');
        if (dropZone) {
            dropZone.innerHTML = '<p>📁 Dateien hier ablegen oder klicken zum Auswählen</p>';
        }
    }

    function updateWizardAttachmentDisplay() {
        const container = document.getElementById('attachmentList');
        if (!container) return;

        const attachments = wizardData.attachments || [];

        if (attachments.length === 0) {
            container.innerHTML = '<p class="placeholder">Keine Anhänge vorhanden</p>';
            return;
        }

        container.innerHTML = `
            <div class="wizard-attachment-stats">
                <h4>📎 ${attachments.length} Datei(en) ausgewählt</h4>
            </div>
            <div class="wizard-attachment-items">
                ${attachments.map((att, index) => `
                    <div class="wizard-attachment-item">
                        <div class="attachment-info">
                            <span class="attachment-name">📄 ${att.name}</span>
                            <span class="attachment-size">${Utils.formatFileSize(att.size)}</span>
                        </div>
                        <div class="attachment-actions">
                            <button type="button" class="btn btn-sm btn-secondary" onclick="MailWizard.insertAttachmentLink('${att.id}')">📝 In E-Mail einfügen</button>
                            <button type="button" class="btn btn-sm btn-danger" onclick="MailWizard.removeWizardAttachment(${index})">🗑️ Entfernen</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function removeWizardAttachment(index) {
        if (!wizardData.attachments[index]) return;

        const attachment = wizardData.attachments[index];

        if (window.Attachments) {
            Attachments.removeAttachment(attachment.id);
        }

        wizardData.attachments = window.Attachments ? Attachments.getAttachments() : [];

        updateWizardAttachmentDisplay();
    }

    function handleUploadError(error, fileName) {
        console.error('Upload error:', error);

        let errorMessage = 'Upload fehlgeschlagen';
        if (error.message.includes('too large')) {
            errorMessage = 'Datei zu groß (max. 20MB)';
        } else if (error.message.includes('not allowed')) {
            errorMessage = 'Dateityp nicht unterstützt';
        } else if (error.message.includes('server')) {
            errorMessage = 'Server-Fehler beim Upload';
        }

        Utils.showToast(`${fileName}: ${errorMessage}`, 'error');

        resetDropZone();
    }

    /**
     * Aktualisiert Review-Zusammenfassung
     */
    function updateReviewSummary() {
        const elements = {
            'summary-mailtype': getMailTypeLabel(wizardData.mailType) || 'Nicht ausgewählt',
            'summary-template': getTemplateLabel(wizardData.template) || 'Nicht ausgewählt',
            'summary-subject': wizardData.subject || 'Nicht gesetzt',
            'summary-recipients': `${wizardData.selectedRecipients.length} ausgewählt`
        };

        Object.entries(elements).forEach(([id, text]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = text;
        });

        // NEUE FUNKTION: Echte E-Mail-Vorschau generieren
        generateRealEmailPreview();
    }

    /**
     * Generiert echte E-Mail-Vorschau mit Personalisierung
     */
    function generateRealEmailPreview() {
        const previewContainer = document.getElementById('wizardEmailPreview');
        if (!previewContainer) return;

        const testRecipient = wizardData.selectedRecipients.length > 0 ?
            findRecipientByEmail(wizardData.selectedRecipients[0]) :
            { name: 'Max Mustermann', email: 'test@example.com' };

        console.log('=== PREVIEW PERSONALIZATION DEBUG ===');
        console.log('Test Recipient:', testRecipient);
        console.log('Wizard Subject:', wizardData.subject);
        console.log('Wizard Content:', wizardData.content?.substring(0, 200));

        let personalizedSubject = wizardData.subject || 'Kein Betreff';
        let personalizedContent = wizardData.content || '<p>Kein Inhalt</p>';

        if (window.Templates && typeof Templates.personalizeContent === 'function') {
            console.log('Using Templates.personalizeContent...');
            personalizedSubject = Templates.personalizeContent(personalizedSubject, testRecipient);
            personalizedContent = Templates.personalizeContent(personalizedContent, testRecipient);
        } else {
            console.log('Templates module not available, using fallback...');
            const recipientName = testRecipient.name ||
                                 (testRecipient.email ? testRecipient.email.split('@')[0].replace(/[._]/g, ' ') : '') ||
                                 'Liebe/r Interessent/in';

            personalizedSubject = personalizedSubject.replace(/\{\{name\}\}/g, recipientName);
            personalizedContent = personalizedContent.replace(/\{\{name\}\}/g, recipientName)
                                                    .replace(/\{\{email\}\}/g, testRecipient.email || '');
        }

        console.log('Personalized Subject:', personalizedSubject);
        console.log('Personalized Content Preview:', personalizedContent.substring(0, 200));
        console.log('Still has placeholders:', {
            subject: personalizedSubject.includes('{{'),
            content: personalizedContent.includes('{{')
        });
        console.log('=== END PREVIEW DEBUG ===');

        previewContainer.innerHTML = `
        <div class="email-preview-container">
            <div class="email-header">
                <h4>📧 E-Mail-Vorschau für: ${testRecipient.name} (${testRecipient.email})</h4>
                <div class="preview-warning">
                    <strong>Betreff:</strong> ${personalizedSubject}
                </div>
            </div>
            <div class="email-body" style="border: 1px solid #ddd; padding: 20px; background: white; font-family: Arial, sans-serif;">
                ${personalizedContent}
            </div>
            <div class="email-footer">
                <small>Diese Vorschau zeigt wie die E-Mail beim Empfänger aussieht</small>
            </div>
        </div>
        `;

        if (personalizedSubject.includes('{{') || personalizedContent.includes('{{')) {
            previewContainer.innerHTML += `
            <div class="alert alert-warning" style="margin-top: 15px; padding: 10px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px;">
                ⚠️ <strong>Warnung:</strong> Template enthält noch nicht aufgelöste Platzhalter.
                Prüfe die Browser-Console für Debug-Informationen.
            </div>
            `;
        }
    }

    /**
     * Findet Empfänger-Objekt anhand E-Mail
     */
    function findRecipientByEmail(email) {
        if (window.Recipients && typeof Recipients.getRecipients === 'function') {
            const allRecipients = Recipients.getRecipients();
            const found = allRecipients.find(r => r.email === email);
            if (found) return found;
        }

        return {
            email: email,
            name: window.Utils ? Utils.getNameFromEmail(email) : email.split('@')[0].replace(/[._]/g, ' ')
        };
    }

    /**
     * Sendet Test-E-Mail an ersten Empfänger
     */
    async function sendTestEmail() {
        if (wizardData.selectedRecipients.length === 0) {
            Utils.showToast('Bitte zuerst Empfänger auswählen', 'warning');
            return;
        }

        const testRecipient = findRecipientByEmail(wizardData.selectedRecipients[0]);

        Utils.showConfirm(
            `Test-E-Mail an ${testRecipient.name} (${testRecipient.email}) senden?`,
            async () => {
                try {
                    const testCampaign = {
                        config: window.Config ? Config.getConfig() : {
                            serviceId: localStorage.getItem('emailjs_service_id'),
                            templateId: localStorage.getItem('emailjs_template_id'),
                            fromName: localStorage.getItem('fromName')
                        },
                        template: {
                            subject: wizardData.subject,
                            content: wizardData.content
                        }
                    };
                    console.log('=== TEST EMAIL DEBUG ===');
                    console.log('Test Campaign:', testCampaign);
                    console.log('Test Recipient:', testRecipient);

                    let personalizedSubject = testCampaign.template.subject;
                    let personalizedContent = testCampaign.template.content;

                    if (window.Templates && typeof Templates.personalizeContent === 'function') {
                        personalizedSubject = Templates.personalizeContent(personalizedSubject, testRecipient);
                        personalizedContent = Templates.personalizeContent(personalizedContent, testRecipient);
                    }

                    const templateParams = {
                        subject: personalizedSubject,
                        message: personalizedContent,
                        to_email: testRecipient.email,
                        name: testCampaign.config.fromName,
                        email: testRecipient.email
                    };

                    console.log('Test Email Params:', templateParams);

                    const response = await emailjs.send(
                        testCampaign.config.serviceId,
                        testCampaign.config.templateId,
                        templateParams
                    );

                    if (response.status === 200) {
                        Utils.showToast(`✅ Test-E-Mail erfolgreich an ${testRecipient.email} gesendet!`, 'success');
                    } else {
                        throw new Error(`EmailJS Status: ${response.status}`);
                    }

                } catch (error) {
                    console.error('Test email failed:', error);
                    Utils.showToast(`❌ Test-E-Mail fehlgeschlagen: ${error.message}`, 'error');
                }
            }
        );
    }

    // ===== STEP VALIDATION =====

    /**
     * Freundlichere Validation Messages
     */
    function showValidationMessage(step, issue) {
        const messages = {
            1: {
                'no-type': '😊 Wähle zunächst einen Mail-Typ aus, damit wir dir passende Templates zeigen können!'
            },
            2: {
                'no-template': '🎨 Wähle ein Template aus oder erstelle dein eigenes Design!'
            },
            3: {
                'no-subject': '📧 Ein aussagekräftiger Betreff hilft deinen Empfängern zu verstehen, worum es geht!',
                'no-content': '✍️ Füge deinen E-Mail-Inhalt hinzu - das ist das Herzstück deiner Nachricht!'
            },
            4: {
                'no-recipients': '👥 Wähle mindestens einen Empfänger aus, damit deine E-Mail auch ankommt!'
            }
        };

        const message = messages[step]?.[issue] || 'Bitte vervollständige diesen Schritt.';
        Utils.showToast(message, 'info');
    }

    /**
     * Validiert aktuellen Schritt
     */
    function validateCurrentStep() {
        switch (currentStep) {
            case 1:
                if (!wizardData.mailType) {
                    showValidationMessage(1, 'no-type');
                    return false;
                }
                break;
            case 2:
                if (!wizardData.template) {
                    showValidationMessage(2, 'no-template');
                    return false;
                }
                break;
            case 3:
                // NEUER VALIDATION-CHECK für Editor
                const subjectInput = document.getElementById('wizardSubject');
                const visualEditor = document.getElementById('wizardVisualEditor');

                if (!subjectInput?.value?.trim()) {
                    showValidationMessage(3, 'no-subject');
                    if (subjectInput) subjectInput.focus();
                    return false;
                }

                if (!visualEditor?.innerHTML?.trim() || visualEditor.innerHTML === '') {
                    showValidationMessage(3, 'no-content');
                    if (visualEditor) visualEditor.focus();
                    return false;
                }

                // Daten in wizardData speichern
                wizardData.subject = subjectInput.value;
                const editorContent = visualEditor.innerHTML;
                wizardData.content = generateCompleteEmailHTML(editorContent, wizardData.subject);

                console.log('Step 3 validation passed:', { subject: wizardData.subject, hasContent: !!wizardData.content }); // DEBUG
                break;
            case 4:
                console.log('Validating recipients:', wizardData.selectedRecipients); // DEBUG
                if (!wizardData.selectedRecipients || wizardData.selectedRecipients.length === 0) {
                    showValidationMessage(4, 'no-recipients');
                    return false;
                }
                break;
        }
        return true;
    }

    // ===== STEP 1: MAIL TYPE =====

    /**
     * Wählt Mail-Typ aus
     */
    function selectMailType(type) {
        wizardData.mailType = type;

        // Visual Update
        document.querySelectorAll('.wizard-mail-type-card').forEach(card => {
            card.classList.remove('selected');
        });
        event.currentTarget.classList.add('selected');
    }

    // ===== STEP 2: TEMPLATE =====

    /**
     * Lädt gespeicherte Templates aus localStorage
     */
    function loadSavedTemplates() {
        try {
            const emailTemplates = JSON.parse(localStorage.getItem('emailTemplates') || '{}');
            return Object.entries(emailTemplates).map(([key, template]) => ({
                key: key,
                name: template.name || key,
                subject: template.subject || '',
                content: template.content || '',
                created: template.created || '',
                lastModified: template.lastModified || ''
            }));
        } catch (error) {
            console.error('Error loading saved templates:', error);
            return [];
        }
    }

    /**
     * Lädt Template-Bibliothek
     */
    function loadTemplateLibrary() {
        const library = document.getElementById('wizardTemplateLibrary');
        if (!library) return;

        const selectedMailType = wizardData.mailType || 'newsletter';
        const templates = TEMPLATE_LIBRARY[selectedMailType] || {};

        // Update Anzeige
        const mailTypeSpan = document.getElementById('selected-mail-type');
        if (mailTypeSpan) {
            mailTypeSpan.textContent = getMailTypeLabel(selectedMailType);
        }

        let html = '';

        // Vordefinierte Templates
        if (Object.keys(templates).length > 0) {
            html += '<div class="template-section">';
            html += '<h4>📋 Vordefinierte Templates</h4>';
            html += '<div class="wizard-template-grid">';

            Object.entries(templates).forEach(([key, template]) => {
                const templateId = `hardcoded_${key}`;
                html += `
                <div class="wizard-template-card" onclick="MailWizard.selectTemplate('${templateId}', event)">
                    <div class="wizard-template-preview">${template.icon}</div>
                    <div class="wizard-template-info">
                        <div class="wizard-template-name">${template.name}</div>
                        <div class="wizard-template-description">${template.description}</div>
                        <div class="template-subject-preview">📧 ${template.subject}</div>
                    </div>
                </div>
            `;
            });

            html += '</div></div>';
        }

        // Gespeicherte Templates
        const savedTemplates = loadSavedTemplates();
        if (savedTemplates.length > 0) {
            html += '<div class="template-section">';
            html += '<h4>💾 Gespeicherte Templates</h4>';
            html += '<div class="wizard-template-grid">';

            savedTemplates.forEach(template => {
                const templateId = `saved_${template.key}`;
                html += `
                <div class="wizard-template-card" onclick="MailWizard.selectTemplate('${templateId}', event)" data-type="saved">
                    <div class="wizard-template-preview">💾</div>
                    <div class="wizard-template-info">
                        <div class="wizard-template-name">${template.name}</div>
                        <div class="wizard-template-description">Erstellt: ${formatDate(template.created)}</div>
                        <div class="template-source">Gespeichert</div>
                    </div>
                </div>
            `;
            });

            html += '</div></div>';
        }

        // Fallback wenn keine Templates
        if (Object.keys(templates).length === 0 && savedTemplates.length === 0) {
            html = '<div class="empty-templates"><p>Keine Templates für diesen Mail-Typ verfügbar.</p></div>';
        }

        library.innerHTML = html;
    }

    function formatDate(dateStr) {
        if (!dateStr) return 'Unbekannt';
        try {
            return new Date(dateStr).toLocaleDateString('de-DE');
        } catch {
            return 'Unbekannt';
        }
    }

    /**
     * Wählt Template aus
     */
    function selectTemplate(templateKey) {
        console.log('Selecting template:', templateKey);
        let template = null;

        if (templateKey.startsWith('hardcoded_')) {
            const key = templateKey.replace('hardcoded_', '');
            template = TEMPLATE_LIBRARY[wizardData.mailType][key];
            if (template) {
                wizardData.template = templateKey;
                wizardData.subject = template.subject;
                wizardData.content = template.html;
            }
        } else if (templateKey.startsWith('saved_')) {
            const key = templateKey.replace('saved_', '');
            const savedTemplates = JSON.parse(localStorage.getItem('emailTemplates') || '{}');
            template = savedTemplates[key];
            if (template) {
                wizardData.template = templateKey;
                wizardData.subject = template.subject || '';
                wizardData.content = template.content || '';
            }
        }

        if (template) {
            document.querySelectorAll('.wizard-template-card').forEach(card => {
                card.classList.remove('selected');
            });
            event.currentTarget.classList.add('selected');
        }
    }

    // ===== STEP 3: EDITOR =====

    /**
     * Initialisiert Editor
     */
    function initializeEditor() {
        const subjectInput = document.getElementById('wizardSubject');
        const visualEditor = document.getElementById('wizardVisualEditor');

        if (!subjectInput || !visualEditor) return;

        if (wizardData.subject) {
            subjectInput.value = wizardData.subject;
        }

        if (wizardData.content) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = wizardData.content;
            const bodyDiv = tempDiv.querySelector('body .email-container, body > div');
            visualEditor.innerHTML = bodyDiv ? bodyDiv.innerHTML : getDefaultEditorContent();
        } else {
            visualEditor.innerHTML = getDefaultEditorContent();
        }

        subjectInput.addEventListener('input', (e) => {
            wizardData.subject = e.target.value;
            debouncePreviewUpdate();
        });

        visualEditor.addEventListener('input', () => {
            updateEditorStats();
            debouncePreviewUpdate();
        });

        visualEditor.addEventListener('paste', (e) => {
            setTimeout(() => {
                updateEditorStats();
                debouncePreviewUpdate();
            }, 50);
        });

        visualEditor.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'b':
                        e.preventDefault();
                        formatText('bold');
                        break;
                    case 'i':
                        e.preventDefault();
                        formatText('italic');
                        break;
                    case 'u':
                        e.preventDefault();
                        formatText('underline');
                        break;
                }
            }
        });

        // Attachment Menu initial aktualisieren
        updateAttachmentMenu();

        // Bei Attachment-Änderungen Menu aktualisieren
        if (window.Attachments) {
            document.addEventListener('attachmentsUpdated', updateAttachmentMenu);
        }

        updateEditorStats();
        setTimeout(() => updateWizardPreview(), 300);
    }

    let previewUpdateTimeout;
    let isPreviewUpdating = false;

    function debouncePreviewUpdate() {
        clearTimeout(previewUpdateTimeout);
        if (isPreviewUpdating) return;
        previewUpdateTimeout = setTimeout(() => {
            isPreviewUpdating = true;
            updateWizardPreview();
            setTimeout(() => {
                isPreviewUpdating = false;
            }, 200);
        }, 300);
    }

    /**
     * Aktualisiert Editor-Vorschau (optimiert)
     */
    function updateWizardPreview() {
        const editor = document.getElementById('wizardVisualEditor');
        const preview = document.getElementById('wizardEmailPreviewStep3');

        if (!editor || !preview) return;

        let content = editor.innerHTML.trim();

        if (!content || content === '<div><br></div>' || content === '<br>') {
            content = getDefaultEditorContent();
        }

        const cleanContent = cleanHTMLContent(content);
        const personalizedContent = personalizePreviewContent(cleanContent);

        wizardData.content = generateCompleteEmailHTML(personalizedContent, wizardData.subject);

        renderPreviewIframe(preview, personalizedContent);
    }

    /** Standard Editor-Inhalt */
    function getDefaultEditorContent() {
        return `
        <p>Hallo {{name}}! 👋</p>
        <p>Hier ist dein wöchentliches Update...</p>
        <p>Viele Grüße!</p>
    `;
    }

    /** Bereinigt HTML-Content vom Editor */
    function cleanHTMLContent(content) {
        return content
            .replace(/<div><br><\/div>/g, '<br>')
            .replace(/<div>/g, '<p>')
            .replace(/<\/div>/g, '</p>')
            .replace(/<p><\/p>/g, '')
            .replace(/<br>\s*<br>/g, '</p><p>')
            .trim();
    }

    /** Personalisiert Content für Vorschau */
    function personalizePreviewContent(content) {
        const testRecipient = {
            name: 'Max Mustermann',
            email: 'max@example.com',
            first_name: 'Max',
            company: 'Musterunternehmen GmbH'
        };

        let personalized = content;
        Object.entries({
            '{{name}}': testRecipient.name,
            '{{email}}': testRecipient.email,
            '{{first_name}}': testRecipient.first_name,
            '{{company}}': testRecipient.company
        }).forEach(([placeholder, value]) => {
            const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            personalized = personalized.replace(regex, value);
        });

        return personalized;
    }

    /** Rendert Preview iframe */
    function renderPreviewIframe(preview, content) {
        preview.classList.add('loading');

        const subject = document.getElementById('wizardSubject')?.value || 'E-Mail Vorschau';
        const html = generatePreviewHTML(content, subject);

        setTimeout(() => {
            preview.innerHTML = '';
            preview.classList.remove('loading');

            const iframe = document.createElement('iframe');
            iframe.style.cssText = 'width: 100%; height: 400px; border: none; border-radius: 10px;';
            iframe.setAttribute('sandbox', 'allow-same-origin');
            iframe.setAttribute('srcdoc', html);

            iframe.onload = () => console.log('✅ Preview loaded');
            iframe.onerror = () => preview.innerHTML = '<div style="padding: 20px; color: #dc3545;">Fehler beim Laden der Vorschau</div>';

            preview.appendChild(iframe);
        }, 100);
    }

    /** Generiert Preview-HTML mit externem CSS */
    function generatePreviewHTML(content, subject) {
        return `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <link rel="stylesheet" href="css/email-preview.css">
</head>
<body>
    <div class="email-container">
        ${content}
    </div>
</body>
</html>`;
    }

    function generateCompleteEmailHTML(content, subject = '') {
        return `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject || 'E-Mail'}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        h1, h2, h3, h4, h5, h6 {
            color: #2c3e50;
            margin: 0 0 16px 0;
            font-weight: 600;
        }
        p {
            margin: 0 0 16px 0;
            color: #333;
        }
        a {
            color: #4a90e2;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="email-container">
        ${content}
    </div>
</body>
</html>`;
    }

    // ===== STEP 4: EMPFÄNGER AUSWÄHLEN =====
    /**
     * Lädt Empfänger-Auswahl
     */
    function loadRecipientSelector() {
        if (!window.Recipients) {
            document.getElementById('wizardRecipientList').innerHTML =
                '<p class="placeholder">Empfänger-Modul nicht verfügbar</p>';
            return;
        }

        // Alle verfügbaren Empfänger laden
        allRecipients = Recipients.getAll() || [];
        filteredRecipients = [...allRecipients];
        recipientPage = 1;

        // Standardmäßig KEINE Empfänger auswählen
        wizardData.selectedRecipients = [];

        updateRecipientDisplay();
        updateRecipientStats();
    }

    /**
     * Aktualisiert Empfänger-Anzeige
     */
    function updateRecipientDisplay() {
        const container = document.getElementById('wizardRecipientList');
        if (!container) return;

        const recipientCount = allRecipients.length;
        if (recipientCount === 0) {
            container.innerHTML = `
        <div class="wizard-empty-recipients" style="
            text-align: center;
            padding: 40px 20px;
            color: #6c757d;
            background: #f8f9fa;
            border-radius: 8px;
            border: 2px dashed #dee2e6;
        ">
            <div style="font-size: 48px; margin-bottom: 16px;">👥</div>
            <h4 style="margin-bottom: 8px; color: #495057;">Keine Empfänger verfügbar</h4>
            <p style="margin-bottom: 16px;">Fügen Sie zuerst Empfänger hinzu um eine Kampagne zu starten.</p>
            <button onclick="App.showTab('recipients')" style="
                background: #4a90e2;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 500;
            ">📧 Empfänger hinzufügen</button>
        </div>
    `;
            return;
        }

        if (filteredRecipients.length === 0) {
            container.innerHTML = '<p class="placeholder">Keine Empfänger gefunden</p>';
            return;
        }

        // Pagination
        const startIndex = (recipientPage - 1) * recipientsPerPage;
        const endIndex = startIndex + recipientsPerPage;
        const pageRecipients = filteredRecipients.slice(startIndex, endIndex);

        container.innerHTML = pageRecipients.map(recipient => {
            const isSelected = wizardData.selectedRecipients.includes(recipient.email);
            return `
                <div class="wizard-recipient-item ${isSelected ? 'selected' : ''}"
                     onclick="MailWizard.toggleRecipient('${recipient.email}')">
                    <input type="checkbox" class="wizard-recipient-checkbox"
                           ${isSelected ? 'checked' : ''}
                           onclick="event.stopPropagation(); MailWizard.toggleRecipient('${recipient.email}')">
                    <div class="wizard-recipient-info">
                        <div class="wizard-recipient-name">${Utils.escapeHtml(recipient.name)}</div>
                        <div class="wizard-recipient-email">${Utils.escapeHtml(recipient.email)}</div>
                    </div>
                </div>
            `;
        }).join('');

        updateRecipientPagination();
    }

    /**
     * Aktualisiert Empfänger-Statistiken
     */
    function updateRecipientStats() {
        const totalElement = document.getElementById('wizardTotalRecipients');
        const selectedElement = document.getElementById('wizardSelectedRecipients');

        if (totalElement) totalElement.textContent = allRecipients.length;
        if (selectedElement) selectedElement.textContent = wizardData.selectedRecipients.length;
    }

    /**
     * Togglet Empfänger-Auswahl
     */
    function toggleRecipient(email) {
        console.log('Toggling recipient:', email); // DEBUG

        const index = wizardData.selectedRecipients.indexOf(email);

        if (index > -1) {
            wizardData.selectedRecipients.splice(index, 1);
            console.log('Removed recipient, now selected:', wizardData.selectedRecipients); // DEBUG
        } else {
            wizardData.selectedRecipients.push(email);
            console.log('Added recipient, now selected:', wizardData.selectedRecipients); // DEBUG
        }

        updateRecipientDisplay();
        updateRecipientStats();
    }

    /**
     * Wählt alle Empfänger aus
     */
    function selectAllRecipients() {
        wizardData.selectedRecipients = filteredRecipients.map(r => r.email);
        updateRecipientDisplay();
        updateRecipientStats();
    }

    /**
     * Wählt alle Empfänger ab
     */
    function deselectAllRecipients() {
        wizardData.selectedRecipients = [];
        updateRecipientDisplay();
        updateRecipientStats();
    }

    /**
     * Filtert Empfänger nach Suchbegriff
     */
    function filterRecipients() {
        const searchInput = document.getElementById('wizardRecipientSearch');
        const searchTerm = searchInput.value.toLowerCase();

        if (searchTerm.trim() === '') {
            filteredRecipients = [...allRecipients];
        } else {
            filteredRecipients = allRecipients.filter(recipient =>
                recipient.name.toLowerCase().includes(searchTerm) ||
                recipient.email.toLowerCase().includes(searchTerm)
            );
        }

        recipientPage = 1;
        updateRecipientDisplay();
    }

    /**
     * Aktualisiert Pagination
     */
    function updateRecipientPagination() {
        const paginationContainer = document.getElementById('wizardRecipientPagination');
        const pageInfo = document.getElementById('wizardRecipientPageInfo');

        // NULL-Check hinzufügen
        if (!paginationContainer) {
            console.warn('Pagination container not found');
            return;
        }

        const totalPages = Math.ceil(filteredRecipients.length / recipientsPerPage);

        if (totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }

        paginationContainer.style.display = 'flex';
        if (pageInfo) {
            pageInfo.textContent = `Seite ${recipientPage} von ${totalPages}`;
        }

        // Button states
        const prevBtn = paginationContainer.querySelector('button:first-child');
        const nextBtn = paginationContainer.querySelector('button:last-child');

        // Weitere NULL-Checks für alle DOM-Elemente
        if (prevBtn) prevBtn.disabled = recipientPage === 1;
        if (nextBtn) nextBtn.disabled = recipientPage === totalPages;
    }

    /**
     * Vorherige Empfänger-Seite
     */
    function previousRecipientPage() {
        if (recipientPage > 1) {
            recipientPage--;
            updateRecipientDisplay();
        }
    }

    /**
     * Nächste Empfänger-Seite
     */
    function nextRecipientPage() {
        const totalPages = Math.ceil(filteredRecipients.length / recipientsPerPage);
        if (recipientPage < totalPages) {
            recipientPage++;
            updateRecipientDisplay();
        }
    }

    // ===== STEP 5: ATTACHMENTS =====

    /**
     * Lädt Attachment-Manager
     */
    function loadAttachmentManager() {
        // Integration mit bestehendem Attachments-Modul
        if (window.Attachments) {
            const currentAttachments = Attachments.getAttachments();
            wizardData.attachments = currentAttachments;

            updateWizardAttachmentDisplay();
        }
    }

    /**
     * Aktualisiert Attachment-Anzeige im Wizard
     */
    function updateWizardAttachmentDisplay() {
        const container = document.getElementById('wizardAttachmentList');
        if (!container) return;

        if (wizardData.attachments.length === 0) {
            container.innerHTML = '<p class="placeholder">Keine Attachments vorhanden</p>';
            return;
        }

        container.innerHTML = wizardData.attachments.map(att => `
            <div class="wizard-attachment-item">
                <span><a href="${att.url}" target="_new">${att.name}</a> (${Utils.formatFileSize(att.size)})</span>
                <button onclick="MailWizard.insertAttachmentLink('${att.id}')" class="wizard-btn-small">
                    📝 In Text einfügen
                </button>
            </div>
        `).join('');
    }

    /**
     * Fügt Attachment-Link in Editor ein
     */
    function insertAttachmentLink(attachmentId) {
        const attachment = wizardData.attachments.find(a => a.id === attachmentId);
        if (!attachment) return;

        const editor = document.getElementById('wizardVisualEditor');
        const linkHtml = `<p><a href="${attachment.url}" target="_new" style="color: #667eea;">📎 ${attachment.name}</a> (${Utils.formatFileSize(attachment.size)})</p>`;

        if (editor) {
            editor.innerHTML += linkHtml;
            updateWizardPreview();
        }
    }

    // ===== STEP 6: REVIEW =====

    /**
     * Bereitet Review-Step vor
     */
    function prepareReviewStep() {
        const summary = document.getElementById('wizardSummary');
        if (summary) {
            summary.innerHTML = `
                <div class="wizard-summary-item">
                    <strong>Mail-Typ:</strong> ${getMailTypeLabel(wizardData.mailType)}
                </div>
                <div class="wizard-summary-item">
                    <strong>Template:</strong> ${getTemplateLabel(wizardData.template)}
                </div>
                <div class="wizard-summary-item">
                    <strong>Betreff:</strong> ${wizardData.subject}
                </div>
                <div class="wizard-summary-item">
                    <strong>Attachments:</strong> ${wizardData.attachments.length} Datei(en)
                </div>
                <div class="wizard-summary-item">
                    <strong>Empfänger:</strong> ${wizardData.selectedRecipients.length} ausgewählt
                </div>
            `;
        }

        // Mobile Preview
        const mobilePreview = document.getElementById('wizardMobilePreview');
        if (mobilePreview) {
            let content = wizardData.content;
            content = content.replace(/\{\{name\}\}/g, 'Max M.');

            const parser = new DOMParser();
            const doc = parser.parseFromString(content, 'text/html');
            const bodyDiv = doc.querySelector('body > div');

            mobilePreview.innerHTML = bodyDiv ? bodyDiv.innerHTML : content;
        }

        // Ausgewählte Empfänger anzeigen
        updateSelectedRecipientsList();
    }

    /**
     * Aktualisiert Liste der ausgewählten Empfänger
     */
    function updateSelectedRecipientsList() {
        const container = document.getElementById('wizardSelectedList');
        if (!container) return;

        if (wizardData.selectedRecipients.length === 0) {
            container.innerHTML = '<p class="placeholder">Keine Empfänger ausgewählt</p>';
            return;
        }

        const selectedDetails = allRecipients.filter(r =>
            wizardData.selectedRecipients.includes(r.email)
        );

        if (selectedDetails.length <= 5) {
            // Zeige alle wenn wenige
            container.innerHTML = selectedDetails.map(r => `
                <div class="wizard-selected-item">
                    <strong>${Utils.escapeHtml(r.name)}</strong><br>
                    <small>${Utils.escapeHtml(r.email)}</small>
                </div>
            `).join('');
        } else {
            // Zeige erste 3 + "... und X weitere"
            const first3 = selectedDetails.slice(0, 3);
            const remaining = selectedDetails.length - 3;

            container.innerHTML = `
                ${first3.map(r => `
                    <div class="wizard-selected-item">
                        <strong>${Utils.escapeHtml(r.name)}</strong><br>
                        <small>${Utils.escapeHtml(r.email)}</small>
                    </div>
                `).join('')}
                <div class="wizard-selected-item" style="font-style: italic; color: #6c757d;">
                    ... und ${remaining} weitere Empfänger
                </div>
            `;
        }
    }

    // ===== WIZARD COMPLETION =====

    /**
     * Schließt Wizard ab und speichert Kampagne (KEIN Versand!)
     */
    function finishWizard() {
        console.log('=== SAVE CAMPAIGN (WIZARD) ===');

        try {
            // Validierung
            if (!wizardData.subject || !wizardData.content || !wizardData.selectedRecipients.length) {
                Utils.showToast('Wizard-Daten unvollständig. Bitte alle Schritte durchlaufen.', 'error');
                return;
            }

            // Kampagnen-Objekt erstellen
            const campaignData = {
                id: generateCampaignId(),
                name: wizardData.subject || `Kampagne vom ${new Date().toLocaleDateString('de-DE')}`,
                subject: wizardData.subject,
                content: wizardData.content,
                selectedRecipients: wizardData.selectedRecipients.map(email => findRecipientByEmail(email)),
                createdAt: new Date(),
                status: 'draft',
                stats: {
                    total: wizardData.selectedRecipients.length,
                    sent: 0,
                    errors: 0
                }
            };

            console.log('Campaign created:', campaignData);

            // Kampagne speichern
            saveCampaignDraft(campaignData);

            // Wizard schließen und zurücksetzen
            resetWizardState();
            hideWizardModal();

            // Kampagnenliste aktualisieren und zum Tab wechseln
            if (window.Campaigns && typeof Campaigns.loadCampaigns === 'function') {
                Campaigns.loadCampaigns();
                if (typeof Campaigns.updateCampaignsList === 'function') {
                    Campaigns.updateCampaignsList();
                }
            }
            if (window.App && typeof App.showTab === 'function') {
                App.showTab('campaigns');
            }

            // Optionales Toast-Feedback
            if (window.Utils && typeof Utils.showToast === 'function') {
                Utils.showToast('Kampagne gespeichert', 'success');
            }
        } catch (error) {
            console.error('Save campaign error:', error);
            Utils.showToast(`Fehler beim Speichern der Kampagne: ${error.message}`, 'error');
        }
    }

    /**
     * Zeigt einfache Erfolgs-Nachricht (KEIN komplexes Modal)
     */
    function showSimpleSuccessMessage(campaignData) {
        const modal = document.getElementById('mailWizardModal');
        if (!modal) return;

        // Einfache Success-Nachricht
        modal.innerHTML = `
            <div class="wizard-modal">
                <div class="success-message-container">
                    <div class="success-icon">🎉</div>
                    <h2>Kampagne gespeichert!</h2>
                    <div class="success-details">
                        <p><strong>${campaignData.name}</strong></p>
                        <p>📧 ${campaignData.stats.total} Empfänger</p>
                        <p>📅 ${campaignData.createdAt.toLocaleDateString('de-DE')}</p>
                    </div>
                    <div class="success-info">
                        <p>Du wirst zum Kampagnen-Tab weitergeleitet...</p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generiert eindeutige Kampagnen-ID
     */
    function generateCampaignId() {
        return 'campaign_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Speichert Kampagnen-Entwurf
     */
    function saveCampaignDraft(campaignData) {
        try {
            const drafts = JSON.parse(localStorage.getItem('campaignDrafts') || '[]');
            drafts.push(campaignData);
            localStorage.setItem('campaignDrafts', JSON.stringify(drafts));
            console.log('Campaign draft saved to localStorage');
        } catch (error) {
            console.error('Error saving campaign draft:', error);
        }
    }

    /**
     * Zeigt schöne Kampagnen-Übersicht nach Wizard
     */
    function showCampaignOverview(campaignData) {
        const modal = document.getElementById('mailWizardModal');
        if (!modal) return;

        const firstRecipient = campaignData.selectedRecipients[0];

        let personalizedSubject = campaignData.subject;
        let personalizedContent = campaignData.content;

        if (window.Templates && typeof Templates.personalizeContent === 'function') {
            personalizedSubject = Templates.personalizeContent(campaignData.subject, firstRecipient);
            personalizedContent = Templates.personalizeContent(campaignData.content, firstRecipient);
        }

        modal.innerHTML = `
        <div class="wizard-modal large success-modal">
            <div class="wizard-header success-header">
                <div class="success-icon">🎉</div>
                <h2>Kampagne erfolgreich erstellt!</h2>
                <span class="wizard-close" onclick="MailWizard.hideCampaignOverview()">&times;</span>
            </div>
            <div class="success-content">
                <div class="success-summary">
                    <div class="summary-icon">📧</div>
                    <h3>${Utils.escapeHtml(campaignData.subject)}</h3>
                    <p>${campaignData.selectedRecipients.length} Empfänger ausgewählt</p>
                </div>

                <div class="success-actions">
                    <button class="btn btn-primary btn-large" onclick="App.showTab('campaigns')">
                        📋 Zu Kampagnen wechseln
                    </button>
                    <button class="btn btn-success btn-large" onclick="Campaigns.startCampaign('${campaignData.id}')">
                        🚀 Jetzt senden
                    </button>
                    <button class="btn btn-secondary" onclick="MailWizard.hideCampaignOverview()">
                        Später senden
                    </button>
                </div>

                <div class="success-preview">
                    <h4>📧 E-Mail Vorschau:</h4>
                    <div class="email-preview-frame">
                        <div class="email-preview-header">
                            <strong>Betreff:</strong> ${Utils.escapeHtml(personalizedSubject)}
                        </div>
                        <div class="email-preview-body">
                            ${personalizedContent.substring(0, 200)}...
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

        modal.classList.remove('hidden');
    }

    function hideCampaignOverview() {
        const modal = document.getElementById('mailWizardModal');
        if (modal) {
            modal.classList.add('hidden');
        }
        resetWizardState();
    }

    /**
     * Startet Kampagnen-Versand mit UI-Feedback
     */
    async function startCampaignSend(campaignId) {
        console.log('=== START CAMPAIGN SEND ===', campaignId);

        try {
            const campaignData = loadCampaignDraft(campaignId);
            if (!campaignData) {
                Utils.showToast('Kampagne nicht gefunden', 'error');
                return;
            }

            const sendSpeed = parseInt(document.getElementById('campaignSendSpeed')?.value) || 2000;
            const testMode = document.getElementById('campaignTestMode')?.checked || false;

            let recipients = [...campaignData.selectedRecipients];
            if (testMode) {
                recipients = recipients.slice(0, 2);
                logToCampaign(`🧪 Test-Modus: Sende nur an ${recipients.length} Empfänger`);
            }

            document.getElementById('campaignProgress').style.display = 'block';
            document.getElementById('campaignPauseBtn').style.display = 'inline-block';
            document.getElementById('campaignStopBtn').style.display = 'inline-block';

            const sendBtn = document.querySelector('.btn.btn-success.btn-large');
            if (sendBtn) {
                sendBtn.disabled = true;
                sendBtn.textContent = '📤 Wird gesendet...';
            }

            logToCampaign(`🚀 Kampagne gestartet: ${recipients.length} E-Mails`);

            await sendCampaignEmails(campaignData, recipients, sendSpeed);

        } catch (error) {
            console.error('Campaign send error:', error);
            logToCampaign(`❌ Fehler: ${error.message}`, 'error');
        }
    }

    async function sendCampaignEmails(campaignData, recipients, sendSpeed) {
        ProgressManager.init({ containerId: "campaignProgress", type: "campaign", total: recipients.length });
        ProgressManager.log("🚀 Kampagne gestartet");
        for (let i = 0; i < recipients.length; i++) {
            const recipient = recipients[i];
            try {
                ProgressManager.update(i, recipients.length, `Sende an ${recipient.email}...`);
                ProgressManager.log(`📨 Sende an ${recipient.email}`);
                await sendPersonalizedEmail(campaignData, recipient);
                ProgressManager.log(`✅ Erfolgreich: ${recipient.email}`, 'success');
            } catch (error) {
                ProgressManager.log(`❌ Fehler: ${recipient.email} - ${error.message}`, 'error');
            }
            if (i < recipients.length - 1) {
                await new Promise(resolve => setTimeout(resolve, sendSpeed));
            }
        }
        ProgressManager.complete("🎉 Kampagne abgeschlossen!");
        ProgressManager.hide(5000);
    }

    async function sendPersonalizedEmail(campaignData, recipient) {
        let personalizedSubject = campaignData.subject;
        let personalizedContent = campaignData.content;

        if (window.Templates && typeof Templates.personalizeContent === 'function') {
            personalizedSubject = Templates.personalizeContent(campaignData.subject, recipient);
            personalizedContent = Templates.personalizeContent(campaignData.content, recipient);
        }

        const config = window.Config ? Config.getConfig() : {
            serviceId: localStorage.getItem('emailjs_service_id'),
            templateId: localStorage.getItem('emailjs_template_id'),
            fromName: localStorage.getItem('fromName')
        };

        const templateParams = {
            subject: personalizedSubject,
            message: personalizedContent,
            to_email: recipient.email,
            name: config.fromName,
            email: recipient.email
        };

        const response = await emailjs.send(config.serviceId, config.templateId, templateParams);

        if (response.status !== 200) {
            throw new Error(`EmailJS Status: ${response.status}`);
        }

        return response;
    }


    function logToCampaign(message, type = 'info') {
        const logContainer = document.getElementById('campaignLogContainer');
        if (!logContainer) return;

        const timestamp = new Date().toLocaleTimeString('de-DE');
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry log-${type}`;
        logEntry.innerHTML = `<span class="log-time">[${timestamp}]</span> ${message}`;

        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    function loadCampaignDraft(campaignId) {
        try {
            const drafts = JSON.parse(localStorage.getItem('campaignDrafts') || '[]');
            return drafts.find(c => c.id === campaignId);
        } catch (error) {
            console.error('Error loading campaign draft:', error);
            return null;
        }
    }

    function saveCampaignForLater() {
        hideCampaignOverview();
    }

    function pauseCampaign() {
        logToCampaign('⏸️ Pausieren aktuell nicht implementiert');
    }

    function stopCampaign() {
        logToCampaign('⏹️ Stoppen aktuell nicht implementiert');
    }


    /**
     * Überträgt Wizard-Daten zum Haupt-Editor
     */
    function transferToMainEditor() {
        // Daten sammeln
        const campaignData = {
            subject: wizardData.subject,
            content: wizardData.content,
            template: wizardData.template,
            selectedRecipients: wizardData.selectedRecipients,
            attachments: wizardData.attachments || []
        };

        // An CampaignSender übergeben
        if (window.CampaignSender) {
            CampaignSender.loadCampaignData(campaignData);
        }
    }

    // ===== UTILITY FUNCTIONS =====

    function getMailTypeLabel(type) {
        const labels = {
            newsletter: 'Newsletter',
            update: 'Persönliches Update',
            announcement: 'Ankündigung',
            custom: 'Individuell'
        };
        return labels[type] || type;
    }

    function getTemplateLabel(templateKey) {
        if (!templateKey) return 'Kein Template';

        if (templateKey.startsWith('hardcoded_')) {
            const key = templateKey.replace('hardcoded_', '');
            const template = TEMPLATE_LIBRARY[wizardData.mailType]?.[key];
            return template ? template.name : templateKey;
        }

        if (templateKey.startsWith('saved_')) {
            const key = templateKey.replace('saved_', '');
            const savedTemplates = JSON.parse(localStorage.getItem('emailTemplates') || '{}');
            const template = savedTemplates[key];
            return template ? template.name : templateKey;
        }

        return templateKey;
    }

    // ===== EDITOR FUNCTIONS =====

    /**
     * Text-Formatierung im Editor
     */
    function formatText(command) {
        document.execCommand(command, false, null);
        updateWizardPreview();
    }

    /**
     * Variable einfügen
     */
    function insertVariable(variable) {
        const editor = document.getElementById('wizardVisualEditor');
        const selection = window.getSelection();

        if (selection.rangeCount > 0 && editor && editor.contains(selection.anchorNode)) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(document.createTextNode(variable));
            range.collapse(false);
            updateWizardPreview();
        }
    }

    /**
     * Fügt Personalisierung ein
     */
    function insertPersonalization(type) {
        const editor = document.getElementById('wizardVisualEditor');
        if (editor) {
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            const placeholder = document.createTextNode(`{{${type}}}`);
            range.insertNode(placeholder);
            updateWizardPreview();
        }
    }

    /**
     * Löscht kompletten Editor-Inhalt
     */
    function clearEditor() {
        const editor = document.getElementById('wizardVisualEditor');
        if (editor && confirm('Möchtest du den gesamten Inhalt löschen?')) {
            editor.innerHTML = '';
            updateWizardPreview();
            updateEditorStats();
            Utils.showToast('Editor geleert', 'info');
        }
    }

    /**
     * Fügt Template-Baustein ein
     */
    function insertTemplate() {
        const editor = document.getElementById('wizardVisualEditor');
        if (!editor) return;

        const templates = [
            'Hallo {{name}},\n\nHier ist dein Update...',
            'Liebe/r {{name}},\n\nwir freuen uns, dir mitzuteilen...',
            'Hi {{name}}! 👋\n\nHier sind die Neuigkeiten...',
            '🎉 Großartige Neuigkeiten für {{name}}!\n\nWir haben...'
        ];

        const selected = prompt('Wähle Template:\n' + templates.map((t, i) => `${i+1}. ${t.split('\n')[0]}`).join('\n'));
        const index = parseInt(selected) - 1;

        if (index >= 0 && index < templates.length) {
            const template = templates[index].replace(/\n/g, '</p><p>');
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(document.createElement('p')).innerHTML = template;
            updateWizardPreview();
        }
    }

    /**
     * Fügt Text an der Cursor-Position in den Mail Wizard Editor ein
     * @param {string} text - einzufügender Text
     */
    function insertTextIntoEditor(text) {
        const editor = document.getElementById('wizardVisualEditor');
        if (!editor) {
            console.error('Wizard editor not found');
            return false;
        }

        // Focus setzen falls nicht fokussiert
        if (document.activeElement !== editor) {
            editor.focus();
        }

        try {
            // Moderne Browser: execCommand
            if (document.execCommand) {
                const success = document.execCommand('insertHTML', false, text);
                if (success) {
                    updateWizardPreview();
                    updateEditorStats();
                    return true;
                }
            }

            // Fallback: Selection API
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);

                // Prüfen ob Cursor im Editor ist
                if (editor.contains(range.commonAncestorContainer)) {
                    range.deleteContents();
                    const textNode = document.createTextNode(text);
                    range.insertNode(textNode);

                    // Cursor nach dem eingefügten Text positionieren
                    range.setStartAfter(textNode);
                    range.setEndAfter(textNode);
                    selection.removeAllRanges();
                    selection.addRange(range);

                    updateWizardPreview();
                    updateEditorStats();
                    return true;
                }
            }

            // Letzter Fallback: Ans Ende anhängen
            const br = document.createElement('br');
            const span = document.createElement('span');
            span.innerHTML = text;
            editor.appendChild(br);
            editor.appendChild(span);

            updateWizardPreview();
            updateEditorStats();
            return true;

        } catch (error) {
            console.error('Error inserting text into editor:', error);
            return false;
        }
    }

    /**
     * Aktualisiert Editor-Statistiken
     */
    function updateEditorStats() {
        const editor = document.getElementById('wizardVisualEditor');
        const charCount = document.getElementById('editorCharCount');
        const wordCount = document.getElementById('editorWordCount');

        if (!editor || !charCount || !wordCount) return;

        const text = editor.textContent || '';
        const chars = text.length;
        const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

        charCount.textContent = `${chars} Zeichen`;
        wordCount.textContent = `${words} Wörter`;

        if (chars > 1000) {
            charCount.style.color = '#dc3545';
        } else if (chars > 500) {
            charCount.style.color = '#ffc107';
        } else {
            charCount.style.color = '#28a745';
        }
    }
    /**
     * Aktualisiert Vorschau manuell
     */
    function refreshPreview() {
        console.log('🔄 Manual preview refresh triggered');

        setTimeout(() => {
            updateWizardPreview();
            Utils.showToast('✅ Vorschau aktualisiert', 'success');
        }, 100);
    }

    /**
     * Wechselt Vorschau-Gerät
     */
    function switchPreviewDevice() {
        const select = document.getElementById('previewDevice');
        const container = document.getElementById('wizardEmailPreviewStep3');

        if (select && container) {
            if (select.value === 'mobile') {
                container.classList.add('mobile-view');
            } else {
                container.classList.remove('mobile-view');
            }
        }
    }

    // Attachment Menu anzeigen/verstecken
    function showAttachmentMenu() {
        const menu = document.getElementById('attachmentDropdownMenu');
        const btn = document.getElementById('attachmentMenuBtn');

        if (!menu || !btn) return;

        if (menu.classList.contains('hidden')) {
            updateAttachmentMenu();
            menu.classList.remove('hidden');
            btn.classList.add('active');

            setTimeout(() => {
                document.addEventListener('click', closeAttachmentMenuOnClickOutside);
            }, 100);
        } else {
            menu.classList.add('hidden');
            btn.classList.remove('active');
            document.removeEventListener('click', closeAttachmentMenuOnClickOutside);
        }
    }

    function closeAttachmentMenuOnClickOutside(event) {
        const menu = document.getElementById('attachmentDropdownMenu');
        const btn = document.getElementById('attachmentMenuBtn');

        if (!menu || !btn) return;

        if (!menu.contains(event.target) && !btn.contains(event.target)) {
            menu.classList.add('hidden');
            btn.classList.remove('active');
            document.removeEventListener('click', closeAttachmentMenuOnClickOutside);
        }
    }

    // Attachment Menu aktualisieren
    function updateAttachmentMenu() {
        const container = document.getElementById('attachmentMenuList');
        const countSpan = document.getElementById('attachmentCount');

        if (!container || !window.Attachments) return;

        const attachments = Attachments.getAttachments();

        if (countSpan) {
            countSpan.textContent = attachments.length;
        }

        if (attachments.length === 0) {
            container.innerHTML = `
                <div class="attachment-menu-empty">
                    <p>Keine Anhänge vorhanden</p>
                    <button onclick="MailWizard.jumpToStep(5)" class="btn-small">→ Zu Step 5 (Anhänge)</button>
                </div>
            `;
            return;
        }

        container.innerHTML = attachments.map(att => `
            <div class="attachment-menu-item" onclick="MailWizard.insertSingleAttachment('${att.id}')">
                <span class="attachment-icon">📄</span>
                <div class="attachment-info">
                    <div class="attachment-name">${Utils.escapeHtml(att.name)}</div>
                    <div class="attachment-size">${Utils.formatFileSize(att.size)}</div>
                </div>
                <span class="insert-icon">+</span>
            </div>
        `).join('');
    }

    // Einzelnen Attachment-Link einfügen - NEUE VERSION
    function insertSingleAttachment(attachmentId) {
        if (!window.Attachments) {
            Utils.showToast('Attachments-Modul nicht verfügbar', 'error');
            return;
        }

        const attachments = Attachments.getAttachments();
        const attachment = attachments.find(att => att.id === attachmentId);

        if (!attachment) {
            Utils.showToast('Attachment nicht gefunden', 'error');
            return;
        }

        const linkHTML = `📎 <a href="${attachment.url}" target="_blank">${Utils.escapeHtml(attachment.name)}</a> (${Utils.formatFileSize(attachment.size)}) `;

        const success = insertTextIntoEditor(linkHTML);

        if (success) {
            showAttachmentMenu();
            Utils.showToast('Attachment-Link eingefügt', 'success');
        } else {
            Utils.showToast('Fehler beim Einfügen des Links', 'error');
        }
    }

    // Alle Attachment-Links einfügen - NEUE VERSION
    function insertAttachmentList() {
        if (!window.Attachments) {
            Utils.showToast('Attachments-Modul nicht verfügbar', 'error');
            return;
        }

        const attachments = Attachments.getAttachments();

        if (attachments.length === 0) {
            Utils.showToast('Keine Anhänge vorhanden', 'warning');
            return;
        }

        // Attachment-Links manuell generieren statt Template-Variable
        const attachmentLinksHTML = generateAttachmentLinksHTML();

        const success = insertTextIntoEditor(attachmentLinksHTML);

        if (success) {
            Utils.showToast(`${attachments.length} Attachment-Links eingefügt`, 'success');
        } else {
            Utils.showToast('Fehler beim Einfügen der Links', 'error');
        }
    }

    /**
     * Generiert HTML für Attachment-Links
     */
    function generateAttachmentLinksHTML() {
        if (!window.Attachments) return '';

        const attachments = Attachments.getAttachments();
        if (attachments.length === 0) return '';

        const linksList = attachments.map(att =>
            `📎 <a href="${att.url}" target="_blank">${Utils.escapeHtml(att.name)}</a> (${Utils.formatFileSize(att.size)})`
        ).join('<br>');

        return `<br><br><strong>📎 Anhänge:</strong><br>${linksList}<br>`;
    }

    /**
     * Generiert vollständiges E-Mail-HTML
     */
    function generateCompleteEmailHTML(content, subject = '') {
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${subject || 'E-Mail'}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4; }
        .email-container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
    </style>
</head>
<body>
    <div class="email-container">
        ${content}
    </div>
</body>
</html>`;
    }

    function generateFullHTML(content) {
        return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>${content}</body></html>`;
    }

    // ===== PUBLIC API =====
    return {
        // Core functions
        init,
        startWizard,
        hideWizardModal,

        // Navigation
        nextStep,
        previousStep,

        // Step functions
        selectMailType,
        selectTemplate,
        insertAttachmentLink,

        // Empfänger-Funktionen
        toggleRecipient,
        selectAllRecipients,
        deselectAllRecipients,
        filterRecipients,
        previousRecipientPage,
        nextRecipientPage,

        // Editor functions
        formatText,
        insertVariable,
        insertPersonalization,
        clearEditor,
        insertTemplate,
        showAttachmentMenu,
        insertSingleAttachment,
        insertAttachmentList,
        insertTextIntoEditor,
        generateAttachmentLinksHTML,
        updateAttachmentMenu,
        updateEditorStats,
        refreshPreview,
        switchPreviewDevice,
        updateWizardPreview,
        generateCompleteEmailHTML,
        debouncePreviewUpdate,

        // Preview & Testing
        generateRealEmailPreview,
        sendTestEmail,

        // Completion
        finishWizard,
        showCampaignOverview,
        hideCampaignOverview,
        startCampaignSend,
        saveCampaignForLater,
        pauseCampaign,
        stopCampaign,

        // Utilities
        getMailTypeLabel,
        getTemplateLabel,
        loadSavedTemplates
    };
})();

// DEBUGGING TOOL: Inspect modal dimensions in the browser console
function debugModalLayout() {
    const modal = document.querySelector('.wizard-modal');
    const content = document.querySelector('.wizard-content');
    const buttons = document.querySelector('.wizard-buttons');

    console.log('=== MODAL LAYOUT DEBUG ===');
    console.log('Viewport height:', window.innerHeight);
    console.log('Viewport width:', window.innerWidth);

    if (modal) {
        const rect = modal.getBoundingClientRect();
        console.log('Modal dimensions:', {
            width: rect.width,
            height: rect.height,
            top: rect.top,
            bottom: rect.bottom,
            isInViewport: rect.bottom <= window.innerHeight
        });
    }

    if (content) {
        const rect = content.getBoundingClientRect();
        console.log('Content dimensions:', {
            height: rect.height,
            maxHeight: getComputedStyle(content).maxHeight,
            overflow: getComputedStyle(content).overflow
        });
    }

    if (buttons) {
        const rect = buttons.getBoundingClientRect();
        console.log('Buttons dimensions:', {
            height: rect.height,
            top: rect.top,
            bottom: rect.bottom,
            isVisible: rect.top < window.innerHeight && rect.bottom > 0,
            display: getComputedStyle(buttons).display,
            position: getComputedStyle(buttons).position
        });
    }

    console.log('=== END MODAL DEBUG ===');
}


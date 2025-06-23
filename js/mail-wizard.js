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
                html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Newsletter</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">Newsletter</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Hallo {{name}}! 👋</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px;">
            <h2 style="color: #2c3e50; border-bottom: 2px solid #667eea; padding-bottom: 10px;">📢 Was gibt's Neues?</h2>
            <p>Hier sind die wichtigsten Updates dieser Woche für dich zusammengefasst.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                <h3 style="color: #667eea; margin-top: 0;">💡 Highlight der Woche</h3>
                <p style="margin-bottom: 0;">Spannende Neuigkeiten und Entwicklungen, die dich interessieren könnten.</p>
            </div>
            
            <h3 style="color: #2c3e50;">📚 Neue Inhalte</h3>
            <ul style="color: #555;">
                <li>Artikel 1: Wichtiges Update</li>
                <li>Artikel 2: Neue Features</li>
                <li>Artikel 3: Community Highlights</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="#" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">🚀 Mehr erfahren</a>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="margin: 0; font-size: 12px; color: #888;">
                Du erhältst diese E-Mail, weil du dich für unseren Newsletter angemeldet hast.<br>
                <a href="#" style="color: #667eea;">Abmelden</a>
            </p>
        </div>
    </div>
</body>
</html>`
            },
            minimal: {
                name: 'Minimal Newsletter',
                description: 'Einfach und elegant',
                icon: '📄',
                subject: 'Update: {{name}} 📄',
                html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Newsletter</title>
</head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #ffffff;">
    <div style="max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; font-weight: 300; font-size: 32px; margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px;">
            Hallo {{name}} 👋
        </h1>
        
        <p style="font-size: 16px; color: #555; margin-bottom: 25px;">
            Hier ist dein wöchentliches Update mit den wichtigsten Neuigkeiten.
        </p>
        
        <h2 style="color: #333; font-weight: 400; font-size: 24px; margin-top: 30px;">Updates</h2>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; color: #666;">
                Platz für deine Inhalte...
            </p>
        </div>
        
        <p style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #888;">
            Beste Grüße<br>
            <strong>Dein Team</strong>
        </p>
    </div>
</body>
</html>`
            }
        },
        
        update: {
            personal: {
                name: 'Persönliches Update',
                description: 'Warmherziger Ton für Coaching',
                icon: '💬',
                subject: 'Hallo {{name}}, dein persönliches Update! 💪',
                html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Persönliches Update</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
        <h1 style="color: #333; border-bottom: 3px solid #4a90e2; padding-bottom: 10px;">
            Hallo {{name}}! 👋
        </h1>
        
        <h2 style="color: #4a90e2; margin-top: 25px;">
            Deine persönlichen Lernziele
        </h2>
        
        <p style="font-size: 16px; color: #555;">
            Ich hoffe, es geht dir gut und du kommst mit deinem Lernprojekt gut voran!
        </p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #4a90e2; margin-top: 0;">📚 Dein persönlicher Lerntipp:</h3>
            <p style="margin-bottom: 0;">
                Denk daran: Kleine, regelmäßige Lerneinheiten sind oft effektiver als lange Marathonsitzungen. 
                Plane dir heute 15 Minuten für dein Lernziel ein!
            </p>
        </div>
        
        <p style="color: #555;">
            Falls du Fragen hast oder Unterstützung brauchst, melde dich gerne bei mir.
        </p>
        
        <p style="color: #555;">
            Liebe Grüße,<br>
            <strong>Anna</strong>
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #888; text-align: center;">
            Du erhältst diese E-Mail, weil du dich für mein Lerncoaching interessiert hast.<br>
            <a href="#" style="color: #4a90e2;">Abmelden</a>
        </p>
    </div>
</body>
</html>`
            }
        },
        
        announcement: {
            event: {
                name: 'Event Ankündigung',
                description: 'Auffällig für wichtige Mitteilungen',
                icon: '🎉',
                subject: '🎉 Wichtige Ankündigung für {{name}}!',
                html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Ankündigung</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%); color: white; padding: 40px; text-align: center;">
            <h1 style="margin: 0; font-size: 32px;">🎉</h1>
            <h2 style="margin: 10px 0 0 0; font-size: 24px;">Wichtige Ankündigung!</h2>
        </div>
        
        <div style="padding: 30px;">
            <h2 style="color: #2c3e50; margin-top: 0;">Hallo {{name}}!</h2>
            
            <p style="font-size: 18px; color: #555; margin-bottom: 25px;">
                Ich habe aufregende Neuigkeiten für dich:
            </p>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <p style="margin: 0; font-size: 16px; color: #856404;">
                    <strong>Platz für deine wichtige Mitteilung...</strong>
                </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="#" style="background: #ff6b6b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">🚀 Jetzt erfahren</a>
            </div>
            
            <p style="color: #555;">
                Bei Fragen bin ich gerne für dich da!
            </p>
        </div>
    </div>
</body>
</html>`
            }
        },
        
        custom: {
            blank: {
                name: 'Blank Template',
                description: 'Komplett leer - gestalte frei',
                icon: '📝',
                subject: 'Nachricht für {{name}}',
                html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>E-Mail</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
        <h1>Hallo {{name}}!</h1>
        
        <p>Hier kannst du deinen Inhalt frei gestalten...</p>
        
        <p>
            Liebe Grüße<br>
            <strong>Dein Name</strong>
        </p>
    </div>
</body>
</html>`
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

        modal.classList.remove('hidden');
        currentStep = 1;
        wizardData = {
            mailType: '',
            template: '',
            subject: '',
            content: '',
            attachments: [],
            selectedRecipients: [],
            settings: { speed: 1000, testEmail: false }
        };

        generateWizardSteps();
        generateProgressIndicators();
        generateWizardButtons();

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
            modal.classList.remove('hidden');
            generateWizardHTML();
            updateWizardStep();
        }
    }

    /**
     * Generiert komplettes Wizard-HTML dynamisch
     */
    function generateWizardHTML() {
        generateProgressIndicators();
        generateWizardSteps();
        generateWizardButtons();
    }

    /**
     * Generiert Progress-Indikatoren
     */
    function generateProgressIndicators() {
        const container = document.getElementById('wizardProgressContainer');
        if (!container) return;

        const progressHTML = Array.from({length: 6}, (_, i) => {
            const stepNum = i + 1;
            const isActive = stepNum === currentStep;
            const isCompleted = stepNum < currentStep;

            let classes = 'wizard-step-circle';
            if (isActive) classes += ' active';
            if (isCompleted) classes += ' completed';

            return `\n            <div class="${classes}">${stepNum}</div>\n            ${stepNum < 6 ? '<div class="step-line"></div>' : ''}\n        `;
        }).join('');

        container.innerHTML = progressHTML;
    }

    /**
     * Generiert alle Wizard-Schritte
     */
    function generateWizardSteps() {
        const container = document.getElementById('wizardContentContainer');
        if (!container) return;

        container.innerHTML = `\n        ${generateStep1()}\n        ${generateStep2()}\n        ${generateStep3()}\n        ${generateStep4()}\n        ${generateStep5()}\n        ${generateStep6()}\n    `;
    }

    /**
     * Generiert Schritt 1: Mail-Typ
     */
    function generateStep1() {
        return `\n        <div id="mail-wizard-step-1" class="wizard-step-content active">\n            <div class="step-intro">\n                <h3 class="step-title">📧 Mail-Typ wählen</h3>\n                <p class="step-subtitle">Welche Art von E-Mail möchtest du versenden?</p>\n            </div>\n            \n            <div class="wizard-mail-types">\n                <div class="wizard-mail-type-card" onclick="MailWizard.selectMailType('newsletter')">\n                    <div class="mail-type-icon">📰</div>\n                    <h3>Newsletter</h3>\n                    <p>Regelmäßige Updates und News</p>\n                    <ul>\n                        <li>Professionelle Templates</li>\n                        <li>Mehrere Sections</li>\n                        <li>Call-to-Action Buttons</li>\n                    </ul>\n                </div>\n                \n                <div class="wizard-mail-type-card" onclick="MailWizard.selectMailType('announcement')">\n                    <div class="mail-type-icon">📢</div>\n                    <h3>Ankündigung</h3>\n                    <p>Wichtige Neuigkeiten mitteilen</p>\n                    <ul>\n                        <li>Aufmerksamkeitsstarkes Design</li>\n                        <li>Klare Botschaft</li>\n                        <li>Sofortige Wirkung</li>\n                    </ul>\n                </div>\n                \n                <div class="wizard-mail-type-card" onclick="MailWizard.selectMailType('custom')">\n                    <div class="mail-type-icon">🎨</div>\n                    <h3>Individuell</h3>\n                    <p>Komplett frei gestaltbar</p>\n                    <ul>\n                        <li>Blank Template</li>\n                        <li>Volle Kontrolle</li>\n                        <li>Eigenes Design</li>\n                    </ul>\n                </div>\n            </div>\n        </div>\n    `;
    }

    /**
     * Generiert Schritt 2: Template
     */
    function generateStep2() {
        return `\n        <div id="mail-wizard-step-2" class="wizard-step-content">\n            <div class="step-intro">\n                <h3 class="step-title">🎨 Template auswählen</h3>\n                <p class="step-subtitle">Template für <span id="selected-mail-type">deine E-Mail</span> wählen</p>\n            </div>\n            \n            <div id="wizardTemplateLibrary" class="wizard-template-library">\n                <!-- Templates werden dynamisch geladen -->\n            </div>\n        </div>\n    `;
    }

    /**
     * Generiert Schritt 3: Editor
     */
    function generateStep3() {
        return `\n        <div id="mail-wizard-step-3" class="wizard-step-content">\n            <div class="step-intro">\n                <h3 class="step-title">✏️ Inhalt bearbeiten</h3>\n                <p class="step-subtitle">Betreff und E-Mail-Inhalt anpassen</p>\n            </div>\n            \n            <div class="wizard-editor-container">\n                <div class="form-group">\n                    <label for="wizardSubject">Betreff *</label>\n                    <input type="text" id="wizardSubject" class="form-control" placeholder="E-Mail Betreff eingeben...">\n                    <small class="form-hint">Verwende {{name}} für Personalisierung</small>\n                </div>\n                \n                <div class="wizard-editor-toolbar">\n                    <button type="button" onclick="MailWizard.formatText('bold')" title="Fett">\n                        <strong>B</strong>\n                    </button>\n                    <button type="button" onclick="MailWizard.formatText('italic')" title="Kursiv">\n                        <em>I</em>\n                    </button>\n                    <button type="button" onclick="MailWizard.insertVariable('{{name}}')" title="Name einfügen">\n                        {{name}}\n                    </button>\n                </div>\n                \n                <div class="form-group">\n                    <label for="wizardVisualEditor">E-Mail Inhalt</label>\n                    <div id="wizardVisualEditor" class="wizard-visual-editor" contenteditable="true">\n                        <!-- Inhalt wird dynamisch geladen -->\n                    </div>\n                </div>\n                \n                <div class="wizard-preview">\n                    <h4>Live Vorschau:</h4>\n                    <div id="wizardEmailPreview" class="email-preview">\n                        <!-- Vorschau wird dynamisch generiert -->\n                    </div>\n                </div>\n            </div>\n        </div>\n    `;
    }

    /**
     * Generiert Schritt 4: Empfänger
     */
    function generateStep4() {
        return `\n        <div id="mail-wizard-step-4" class="wizard-step-content">\n            <div class="step-intro">\n                <h3 class="step-title">👥 Empfänger auswählen</h3>\n                <p class="step-subtitle">Wer soll diese E-Mail erhalten?</p>\n            </div>\n            \n            <div class="wizard-recipient-controls">\n                <input type="text" id="wizardRecipientSearch" placeholder="Empfänger suchen..." class="form-control">\n                <div class="recipient-actions">\n                    <button type="button" onclick="MailWizard.selectAllRecipients()">Alle auswählen</button>\n                    <button type="button" onclick="MailWizard.deselectAllRecipients()">Alle abwählen</button>\n                </div>\n            </div>\n            \n            <div id="wizardRecipientList" class="wizard-recipient-list">\n                <p>Keine Empfänger verfügbar. <a href="#" onclick="alert('Empfänger-Verwaltung öffnen')">Empfänger hinzufügen</a></p>\n            </div>\n            \n            <div class="wizard-recipient-stats">\n                <div class="recipient-stat-card">\n                    <div class="stat-number" id="wizardSelectedRecipients">0</div>\n                    <div class="stat-label">Ausgewählt</div>\n                </div>\n                <div class="recipient-stat-card">\n                    <div class="stat-number" id="wizardTotalRecipients">0</div>\n                    <div class="stat-label">Gesamt</div>\n                </div>\n            </div>\n        </div>\n    `;
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
        return `\n        <div id="mail-wizard-step-6" class="wizard-step-content">\n            <div class="step-intro">\n                <h3 class="step-title">✅ Überprüfung & Versand</h3>\n                <p class="step-subtitle">Letzte Kontrolle vor dem Versand</p>\n            </div>\n            \n            <div class="wizard-review-container">\n                <div class="wizard-summary">\n                    <h4>Kampagnen-Zusammenfassung:</h4>\n                    <div id="wizardSummary">\n                        <div class="wizard-summary-item">\n                            <strong>Mail-Typ:</strong> <span id="summary-mailtype">Nicht ausgewählt</span>\n                        </div>\n                        <div class="wizard-summary-item">\n                            <strong>Template:</strong> <span id="summary-template">Nicht ausgewählt</span>\n                        </div>\n                        <div class="wizard-summary-item">\n                            <strong>Betreff:</strong> <span id="summary-subject">Nicht gesetzt</span>\n                        </div>\n                        <div class="wizard-summary-item">\n                            <strong>Empfänger:</strong> <span id="summary-recipients">0 ausgewählt</span>\n                        </div>\n                    </div>\n                </div>\n                \n                <div class="wizard-mobile-preview">\n                    <h4>Mobil-Vorschau:</h4>\n                    <div id="wizardMobilePreview" class="mobile-preview-container">\n                        <p>Vorschau wird nach Template-Auswahl angezeigt</p>\n                    </div>\n                </div>\n                \n                <div class="wizard-send-options">\n                    <div class="form-group">\n                        <label>\n                            <input type="checkbox" id="sendTestEmail"> \n                            Zuerst Test-E-Mail an mich senden\n                        </label>\n                    </div>\n                    \n                    <div class="form-group">\n                        <label for="sendSpeed">Versand-Geschwindigkeit:</label>\n                        <select id="sendSpeed" class="form-control">\n                            <option value="500">Sehr schnell (0.5s)</option>\n                            <option value="1000" selected>Normal (1s)</option>\n                            <option value="2000">Langsam (2s)</option>\n                            <option value="5000">Sehr langsam (5s)</option>\n                        </select>\n                    </div>\n                </div>\n            </div>\n        </div>\n    `;
    }

    /**
     * Generiert Wizard-Buttons
*/

function generateWizardButtons() {
    const container = document.getElementById('wizardButtonsContainer');

    // EXTENDED DEBUGGING
    console.log('=== BUTTON DEBUG ===');
    console.log('Container found:', !!container);
    console.log('Container visible:', container ? getComputedStyle(container).display : 'N/A');
    console.log('Container HTML before:', container ? container.innerHTML : 'N/A');

    if (!container) {
        console.error('\u274c wizardButtonsContainer not found! Searching for alternatives...');

        const modalButtons = document.querySelector('.wizard-modal .wizard-buttons');
        const anyButtons = document.querySelector('.wizard-buttons');

        console.log('Alternative modal buttons:', !!modalButtons);
        console.log('Any wizard-buttons:', !!anyButtons);

        if (modalButtons) {
            console.log('Using alternative container');
            modalButtons.id = 'wizardButtonsContainer';
            generateWizardButtons(); // Retry
            return;
        }

        return;
    }

    const isFirstStep = currentStep === 1;
    const isLastStep = currentStep === 6;

    const buttonsHTML = `
        <button type="button" id="wizardPrevBtn" class="btn btn-secondary" 
                onclick="MailWizard.previousStep()" ${isFirstStep ? 'disabled' : ''}
                style="display: inline-block !important; visibility: visible !important;">
            \u2190 Zur\u00fcck
        </button>
        
        <button type="button" id="wizardNextBtn" class="btn btn-primary" 
                onclick="MailWizard.nextStep()" ${isLastStep ? 'style="display:none"' : 'style="display: inline-block !important; visibility: visible !important;"'}>
            Weiter \u2192
        </button>
        
        <button type="button" id="wizardFinishBtn" class="btn btn-success" 
                onclick="MailWizard.finishWizard()" ${!isLastStep ? 'style="display:none"' : 'style="display: inline-block !important; visibility: visible !important;"'}>
            \ud83d\ude80 Kampagne starten
        </button>
    `;

    container.innerHTML = buttonsHTML;

    // POST-GENERATION DEBUGGING
    console.log('Container HTML after:', container.innerHTML);
    console.log('Next button found:', !!document.getElementById('wizardNextBtn'));
    console.log('Next button visible:', document.getElementById('wizardNextBtn') ? getComputedStyle(document.getElementById('wizardNextBtn')).display : 'N/A');
    console.log('=== END BUTTON DEBUG ===');
}

    /**
     * Versteckt Wizard-Modal
     */
    function hideWizardModal() {
        const modal = document.getElementById('mailWizardModal');
        if (modal) {
            modal.classList.add('hidden');
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
                
                // Step-spezifische Aktionen
                handleStepEnter(currentStep);
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
     * Aktualisiert Wizard-Anzeige
     */
    function updateWizardStep() {
        console.log('Updating wizard step to:', currentStep);

        // Progress Update
        generateProgressIndicators();

        // Content Update
        document.querySelectorAll('.wizard-step-content').forEach(content => {
            content.classList.remove('active');
        });

        const currentContent = document.getElementById(`mail-wizard-step-${currentStep}`);
        if (currentContent) {
            currentContent.classList.add('active');
        } else {
            console.error('Step content not found:', `mail-wizard-step-${currentStep}`);
        }

        // Button Update
        generateWizardButtons();

        // Step-spezifische Aktionen
        handleStepEnter(currentStep);
    }

    /**
     * Behandelt Step-Enter-Events
     */
    function handleStepEnter(step) {
        switch(step) {
            case 1:
                // Mail-Typ Schritt - nichts spezielles
                break;
            case 2:
                // Template Schritt - Template-Bibliothek laden
                loadTemplateLibrary();
                break;
            case 3:
                // CRITICAL FIX: Editor-Schritt - Editor initialisieren
                setTimeout(() => {
                    initializeEditor();
                    generateWizardButtons(); // Explizit Buttons neu generieren
                }, 100);
                break;
            case 4:
                // Empfänger Schritt - Empfänger laden
                loadRecipientSelector();
                break;
            case 5:
                // Anhänge Schritt - Drop-Zone initialisieren
                initializeAttachments();
                break;
            case 6:
                // Review Schritt - Zusammenfassung aktualisieren
                updateReviewSummary();
                break;
        }
    }

    /**
     * Lädt Empfänger-Liste
     */

    /**
     * Initialisiert Anhänge-System
     */
    function initializeAttachments() {
        console.log('Initializing attachments...');
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
    }

    // ===== STEP VALIDATION =====

    /**
     * Validiert aktuellen Schritt
     */
    function validateCurrentStep() {
        switch (currentStep) {
            case 1:
                if (!wizardData.mailType) {
                    alert('Bitte wähle einen Mail-Typ aus');
                    return false;
                }
                break;
            case 2:
                if (!wizardData.template) {
                    alert('Bitte wähle ein Template aus');
                    return false;
                }
                break;
            case 3:
                // NEUER VALIDATION-CHECK für Editor
                const subjectInput = document.getElementById('wizardSubject');
                const visualEditor = document.getElementById('wizardVisualEditor');

                if (!subjectInput?.value?.trim()) {
                    alert('Bitte gib einen Betreff ein');
                    if (subjectInput) subjectInput.focus();
                    return false;
                }

                if (!visualEditor?.innerHTML?.trim() || visualEditor.innerHTML === '') {
                    alert('Bitte füge E-Mail-Inhalt hinzu');
                    if (visualEditor) visualEditor.focus();
                    return false;
                }

                // Daten in wizardData speichern
                wizardData.subject = subjectInput.value;
                const editorContent = visualEditor.innerHTML;
                wizardData.content = generateFullHTML(editorContent);

                console.log('Step 3 validation passed:', { subject: wizardData.subject, hasContent: !!wizardData.content }); // DEBUG
                break;
            case 4:
                console.log('Validating recipients:', wizardData.selectedRecipients); // DEBUG
                if (!wizardData.selectedRecipients || wizardData.selectedRecipients.length === 0) {
                    alert('Bitte wähle mindestens einen Empfänger aus');
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
     * Lädt Template-Bibliothek
     */
    function loadTemplateLibrary() {
        const container = document.getElementById('wizardTemplateLibrary');
        const typeLabel = document.getElementById('selected-mail-type');
        
        if (!container) return;

        if (typeLabel) {
            typeLabel.textContent = getMailTypeLabel(wizardData.mailType);
        }

        const templates = TEMPLATE_LIBRARY[wizardData.mailType] || {};
        
        container.innerHTML = Object.entries(templates).map(([key, template]) => `
            <div class="wizard-template-card" onclick="MailWizard.selectTemplate('${key}')">
                <div class="wizard-template-preview">${template.icon}</div>
                <div class="wizard-template-info">
                    <div class="wizard-template-name">${template.name}</div>
                    <div class="wizard-template-description">${template.description}</div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Wählt Template aus
     */
    function selectTemplate(templateKey) {
        const template = TEMPLATE_LIBRARY[wizardData.mailType][templateKey];
        if (template) {
            wizardData.template = templateKey;
            wizardData.subject = template.subject;
            wizardData.content = template.html;
            
            // Visual Update
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
        console.log('Initializing editor for step 3'); // DEBUG

        const subjectInput = document.getElementById('wizardSubject');
        const visualEditor = document.getElementById('wizardVisualEditor');

        if (subjectInput) {
            subjectInput.value = wizardData.subject || '';
            subjectInput.addEventListener('input', (e) => {
                wizardData.subject = e.target.value;
                console.log('Subject updated:', wizardData.subject); // DEBUG
            });
        } else {
            console.error('wizardSubject input not found!'); // DEBUG
        }

        if (visualEditor) {
            // Template-Content laden wenn verfügbar
            if (wizardData.content) {
                // HTML zu editierbaren Content konvertieren
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = wizardData.content;

                // Body-Content extrahieren falls HTML-Template
                const bodyDiv = tempDiv.querySelector('body > div');
                let editorContent = bodyDiv ? bodyDiv.innerHTML : wizardData.content;

                // Falls immer noch komplexes HTML, vereinfachen
                if (editorContent.includes('<!DOCTYPE') || editorContent.includes('<html>')) {
                    editorContent = 'Hallo {{name}}! \uD83D\uDC4B\n\nHier ist dein w\u00f6chentliches Update mit den wichtigsten Neuigkeiten.\n\nUpdate-Inhalt...';
                }

                visualEditor.innerHTML = editorContent;
            } else {
                // Fallback Content
                visualEditor.innerHTML = 'Hallo {{name}}! \uD83D\uDC4B\n\nIhr E-Mail-Inhalt hier...';
            }

            // Event Listener f\u00fcr Live-Updates
            visualEditor.addEventListener('input', () => {
                console.log('Editor content changed'); // DEBUG
                updateWizardPreview();
            });

            // Initial Preview Update
            setTimeout(updateWizardPreview, 100);
        } else {
            console.error('wizardVisualEditor not found!'); // DEBUG
        }
    }

    /**
     * Aktualisiert Editor-Vorschau
     */
    function updateWizardPreview() {
        const editor = document.getElementById('wizardVisualEditor');
        const preview = document.getElementById('wizardEmailPreview'); // GEÄNDERT: war 'wizardPreview'
        
        if (editor && preview) {
            let content = editor.innerHTML;
            
            // Personalisierung simulieren
            content = content.replace(/\{\{name\}\}/g, 'Max Mustermann');
            content = content.replace(/\{\{email\}\}/g, 'max@example.com');
            
            // Wizard-Content für vollständiges HTML template speichern
            wizardData.content = generateFullHTML(content);
            
            preview.innerHTML = `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; background: white; border-radius: 8px; border: 1px solid #e9ecef;">
                    ${content}
                </div>
            `;
        }
    }

    /**
     * Generiert vollständiges HTML
     */
    function generateFullHTML(content) {
        // Einfaches HTML-Template für E-Mail
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${wizardData.subject || 'E-Mail'}</title>
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
     * Schließt Wizard ab und überträgt Daten
     */
    function finishWizard() {
        try {
            // Validierung: Mindestens ein Empfänger
            if (wizardData.selectedRecipients.length === 0) {
                alert('Bitte wähle mindestens einen Empfänger aus');
                currentStep = 4; // Zurück zur Empfänger-Auswahl
                updateWizardStep();
                return;
            }
            
            // Daten in Haupt-Template-Editor übertragen
            transferToMainEditor();
            
            // Wizard schließen
            hideWizardModal();
            
            // Nach Abschluss zum Mailwizard-Tab wechseln
            if (window.App) {
                App.showTab('mailwizard');
            }
            
            // Erfolgs-Nachricht
            Utils.showStatus('sendStatus', 
                `✅ Mail aus Wizard übernommen - ${wizardData.selectedRecipients.length} Empfänger bereit zum Versenden!`, 
                'success'
            );
            
        } catch (error) {
            console.error('Error finishing wizard:', error);
            alert('Fehler beim Übertragen der Mail-Daten: ' + error.message);
        }
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
        const template = TEMPLATE_LIBRARY[wizardData.mailType]?.[templateKey];
        return template ? template.name : templateKey;
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
        updateWizardPreview,
        
        // Completion
        finishWizard,
        
        // Utilities
        getMailTypeLabel,
        getTemplateLabel
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


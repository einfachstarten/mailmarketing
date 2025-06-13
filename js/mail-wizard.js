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
        resetWizardData();
        currentStep = 1;
        showWizardModal();
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
            updateWizardStep();
        }
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
        // Progress Update
        document.querySelectorAll('.wizard-step-circle').forEach((circle, index) => {
            circle.classList.remove('active', 'completed');
            if (index + 1 < currentStep) {
                circle.classList.add('completed');
            } else if (index + 1 === currentStep) {
                circle.classList.add('active');
            }
        });

        // Content Update
        document.querySelectorAll('.wizard-step-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const currentContent = document.getElementById(`mail-wizard-step-${currentStep}`);
        if (currentContent) {
            currentContent.classList.add('active');
        }

        // Button Update
        const prevBtn = document.getElementById('wizardPrevBtn');
        const nextBtn = document.getElementById('wizardNextBtn');

        if (prevBtn) prevBtn.disabled = currentStep === 1;
        if (nextBtn) nextBtn.textContent = currentStep === 6 ? '🚀 Mail erstellen' : 'Weiter →';

        const breadcrumb = document.getElementById('wizardBreadcrumb');
        if (breadcrumb) {
            breadcrumb.textContent = `Schritt ${currentStep} von 6: ${STEP_NAMES[currentStep - 1]}`;
        }

        const backLink = document.getElementById('wizardBackLink');
        if (backLink) {
            if (currentStep > 1) {
                backLink.classList.remove('hidden');
                backLink.textContent = `← Zurück zu Schritt ${currentStep - 1}`;
            } else {
                backLink.classList.add('hidden');
            }
        }
    }

    /**
     * Behandelt Step-Enter-Events
     */
    function handleStepEnter(step) {
        switch (step) {
            case 2:
                loadTemplateLibrary();
                break;
            case 3:
                initializeEditor();
                break;
            case 4:
                loadRecipientSelector();
                break;
            case 5:
                loadAttachmentManager();
                break;
            case 6:
                prepareReviewStep();
                break;
        }
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
                if (!wizardData.subject.trim()) {
                    alert('Bitte gib einen Betreff ein');
                    return false;
                }
                break;
            case 4:
                if (wizardData.selectedRecipients.length === 0) {
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
        const subjectInput = document.getElementById('wizardSubject');
        const visualEditor = document.getElementById('wizardVisualEditor');
        
        if (subjectInput) {
            subjectInput.value = wizardData.subject;
            subjectInput.addEventListener('input', (e) => {
                wizardData.subject = e.target.value;
            });
        }
        
        if (visualEditor) {
            // HTML zu Text für WYSIWYG-Editor konvertieren
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = wizardData.content;
            const bodyContent = tempDiv.querySelector('body > div') || tempDiv;
            
            visualEditor.innerHTML = bodyContent.innerHTML || wizardData.content;
            visualEditor.addEventListener('input', updateWizardPreview);
            
            updateWizardPreview();
        }
    }

    /**
     * Aktualisiert Editor-Vorschau
     */
    function updateWizardPreview() {
        const editor = document.getElementById('wizardVisualEditor');
        const preview = document.getElementById('wizardPreview');
        
        if (editor && preview) {
            let content = editor.innerHTML;
            
            // Personalisierung simulieren
            content = content.replace(/\{\{name\}\}/g, 'Max Mustermann');
            content = content.replace(/\{\{email\}\}/g, 'max@example.com');
            
            // Wizard-Content für vollständiges HTML template speichern
            wizardData.content = generateFullHTML(content);
            
            preview.innerHTML = `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; background: white; border-radius: 8px;">
                    ${content}
                </div>
            `;
        }
    }

    /**
     * Generiert vollständiges HTML
     */
    function generateFullHTML(content) {
        const template = TEMPLATE_LIBRARY[wizardData.mailType][wizardData.template];
        if (template) {
            // Template-HTML nehmen und Body-Content ersetzen
            const parser = new DOMParser();
            const doc = parser.parseFromString(template.html, 'text/html');
            const bodyDiv = doc.querySelector('body > div');
            
            if (bodyDiv) {
                bodyDiv.innerHTML = content;
                return doc.documentElement.outerHTML;
            }
        }
        
        // Fallback: Einfaches HTML
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${wizardData.subject}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
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
        allRecipients = Recipients.getRecipients();
        filteredRecipients = [...allRecipients];
        recipientPage = 1;
        
        // Standardmäßig alle auswählen
        wizardData.selectedRecipients = allRecipients.map(r => r.email);
        
        updateRecipientDisplay();
        updateRecipientStats();
    }

    /**
     * Aktualisiert Empfänger-Anzeige
     */
    function updateRecipientDisplay() {
        const container = document.getElementById('wizardRecipientList');
        if (!container) return;
        
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
        const index = wizardData.selectedRecipients.indexOf(email);
        
        if (index > -1) {
            wizardData.selectedRecipients.splice(index, 1);
        } else {
            wizardData.selectedRecipients.push(email);
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
                <span>${att.name} (${Utils.formatFileSize(att.size)})</span>
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
        const linkHtml = `<p><a href="${attachment.url}" style="color: #667eea;">📎 ${attachment.name}</a> (${Utils.formatFileSize(attachment.size)})</p>`;
        
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
            
            // Zum Send-Tab wechseln
            if (window.App) {
                App.showTab('send');
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
        // Subject
        const subjectInput = document.getElementById('subject');
        if (subjectInput) {
            subjectInput.value = wizardData.subject;
        }
        
        // HTML Content
        const htmlContent = document.getElementById('htmlContent');
        if (htmlContent) {
            htmlContent.value = wizardData.content;
        }
        
        // Template Name für Speicherung
        const templateName = document.getElementById('templateName');
        if (templateName && !templateName.value.trim()) {
            const timestamp = new Date().toLocaleDateString('de-DE');
            templateName.value = `Wizard Mail ${timestamp}`;
        }
        
        // Preview aktualisieren
        if (window.Templates) {
            Templates.updatePreview();
            
            // Simple Editor neu parsen
            setTimeout(() => {
                if (Templates.getCurrentMode() === 'simple') {
                    Templates.parseTemplate();
                }
            }, 100);
        }
        
        // Send-Tab Empfänger-Liste aktualisieren
        if (window.Sender) {
            Sender.updateRecipientsList();
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
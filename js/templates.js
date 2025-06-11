/**
 * E-Mail Marketing Tool - Template Management & Editors
 * Verwaltet E-Mail-Templates, Simple/HTML-Editoren und Live-Preview
 */

window.Templates = (function() {
    'use strict';

    // ===== TEMPLATE STATE =====
    let currentMode = 'simple';
    let parsedTemplateData = {};
    let hasUnsavedChanges = false;
    let currentTemplateName = '';

    // Default Template für neue Benutzer
    const DEFAULT_TEMPLATE = `<!DOCTYPE html>
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
</html>`;

    // ===== INITIALIZATION =====

    /**
     * Initialisiert das Templates-Modul
     */
    function init() {
        setupEventListeners();
        loadInitialTemplate();
        loadTemplateList();
        
        // Initial Parse für Simple Editor
        setTimeout(() => {
            Utils.safeCall(parseTemplate, 'Initial template parse');
            Utils.safeCall(updatePreview, 'Initial preview update');
        }, 100);
        
        console.log('✓ Templates module initialized');
    }

    /**
     * Lädt initiales Template
     */
    function loadInitialTemplate() {
        const htmlContent = document.getElementById('htmlContent');
        if (htmlContent && !htmlContent.value.trim()) {
            htmlContent.value = DEFAULT_TEMPLATE;
        }
    }

    /**
     * Setup Event-Listeners für Template-Funktionen
     */
    function setupEventListeners() {
        // HTML Content Change für Live-Updates
        const htmlContent = document.getElementById('htmlContent');
        if (htmlContent) {
            htmlContent.addEventListener('input', Utils.debounce(() => {
                markAsChanged();
                updatePreview();
                
                // Re-parse für Simple Mode
                if (currentMode === 'simple') {
                    setTimeout(parseTemplate, 500);
                }
            }, 500));
        }

        // Subject Change für Preview
        const subjectInput = document.getElementById('subject');
        if (subjectInput) {
            subjectInput.addEventListener('input', Utils.debounce(() => {
                markAsChanged();
                updatePreview();
            }, 300));
        }
    }

    // ===== EDITOR MODE MANAGEMENT =====

    /**
     * Wechselt zwischen Editor-Modi
     * @param {string} mode - 'simple' oder 'html'
     */
    function switchMode(mode) {
        if (!['simple', 'html'].includes(mode)) {
            console.warn(`Invalid editor mode: ${mode}`);
            return;
        }

        currentMode = mode;
        
        // Tab-Styling aktualisieren
        updateEditorTabs(mode);
        
        // Editor-Visibility
        toggleEditorVisibility(mode);
        
        // Mode-spezifische Aktionen
        if (mode === 'simple') {
            parseTemplate();
        }
        
        updatePreview();
        console.log(`Switched to ${mode} editor mode`);
    }

    /**
     * Aktualisiert Editor-Tab-Styling
     * @param {string} activeMode - Aktiver Modus
     */
    function updateEditorTabs(activeMode) {
        const simpleTab = document.getElementById('simpleEditorTab');
        const htmlTab = document.getElementById('htmlEditorTab');

        if (simpleTab && htmlTab) {
            simpleTab.classList.toggle('active', activeMode === 'simple');
            htmlTab.classList.toggle('active', activeMode === 'html');
        }
    }

    /**
     * Togglet Editor-Sichtbarkeit
     * @param {string} activeMode - Aktiver Modus
     */
    function toggleEditorVisibility(activeMode) {
        const simpleEditor = document.getElementById('simpleEditor');
        const htmlEditor = document.getElementById('htmlEditor');

        if (simpleEditor) {
            simpleEditor.style.display = activeMode === 'simple' ? 'block' : 'none';
        }

        if (htmlEditor) {
            htmlEditor.style.display = activeMode === 'html' ? 'block' : 'none';
        }
    }

    /**
     * Gibt aktuellen Editor-Modus zurück
     * @returns {string} Aktueller Modus
     */
    function getCurrentMode() {
        return currentMode;
    }

    // ===== TEMPLATE PARSING (Simple Editor) =====

    /**
     * Parst HTML-Template für Simple Editor
     */
    function parseTemplate() {
        const htmlContent = document.getElementById('htmlContent');
        if (!htmlContent || !htmlContent.value.trim()) {
            showEmptyTemplateMessage();
            return;
        }

        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent.value, 'text/html');
            
            parsedTemplateData = {
                title: extractTextFromElement(doc, 'title'),
                h1: extractAllTextFromElements(doc, 'h1'),
                h2: extractAllTextFromElements(doc, 'h2'),
                h3: extractAllTextFromElements(doc, 'h3'),
                h4: extractAllTextFromElements(doc, 'h4'),
                paragraphs: extractEditableParagraphs(doc),
                links: extractEditableLinks(doc),
                strong: extractStrongElements(doc)
            };
            
            generateTemplateFields();
            
        } catch (error) {
            console.error('Error parsing template:', error);
            showParsingError();
        }
    }

    /**
     * Extrahiert Text aus einzelnem Element
     * @param {Document} doc - DOM Document
     * @param {string} tagName - Tag-Name
     * @returns {string} Extrahierter Text
     */
    function extractTextFromElement(doc, tagName) {
        const element = doc.querySelector(tagName);
        return element ? element.textContent.trim() : '';
    }

    /**
     * Extrahiert Text aus allen Elementen eines Typs
     * @param {Document} doc - DOM Document
     * @param {string} tagName - Tag-Name
     * @returns {Array} Array mit Element-Daten
     */
    function extractAllTextFromElements(doc, tagName) {
        const elements = doc.querySelectorAll(tagName);
        return Array.from(elements).map((el, index) => ({
            index: index,
            text: el.textContent.trim(),
            element: el
        })).filter(item => item.text.length > 0);
    }

    /**
     * Extrahiert editierbare Paragraphen
     * @param {Document} doc - DOM Document
     * @returns {Array} Array mit Paragraph-Daten
     */
    function extractEditableParagraphs(doc) {
        const paragraphs = doc.querySelectorAll('p');
        return Array.from(paragraphs).map((p, index) => {
            const text = p.textContent.trim();
            if (text.length > 15 && !isOnlyLink(p)) {
                return {
                    index: index,
                    text: text,
                    element: p
                };
            }
            return null;
        }).filter(p => p !== null);
    }

    /**
     * Extrahiert editierbare Links
     * @param {Document} doc - DOM Document
     * @returns {Array} Array mit Link-Daten
     */
    function extractEditableLinks(doc) {
        const links = doc.querySelectorAll('a');
        return Array.from(links).map((link, index) => {
            const text = link.textContent.trim();
            const href = link.getAttribute('href') || '#';
            if (text.length > 0 && text.length < 100) {
                return {
                    index: index,
                    text: text,
                    href: href,
                    element: link
                };
            }
            return null;
        }).filter(link => link !== null);
    }

    /**
     * Extrahiert Strong/Bold-Elemente
     * @param {Document} doc - DOM Document
     * @returns {Array} Array mit Strong-Daten
     */
    function extractStrongElements(doc) {
        const strongElements = doc.querySelectorAll('strong, b');
        return Array.from(strongElements).map((strong, index) => {
            const text = strong.textContent.trim();
            if (text.length > 2 && text.length < 50) {
                return {
                    index: index,
                    text: text,
                    element: strong
                };
            }
            return null;
        }).filter(strong => strong !== null);
    }

    /**
     * Prüft ob Paragraph nur einen Link enthält
     * @param {Element} element - HTML Element
     * @returns {boolean} true wenn nur Link
     */
    function isOnlyLink(element) {
        const links = element.querySelectorAll('a');
        return links.length === 1 && element.textContent.trim() === links[0].textContent.trim();
    }

    // ===== SIMPLE EDITOR UI GENERATION =====

    /**
     * Generiert Felder für Simple Editor
     */
    function generateTemplateFields() {
        const container = document.getElementById('templateFields');
        if (!container) return;

        let fieldsHTML = '';
        let fieldCount = 0;
        
        // Title
        if (parsedTemplateData.title) {
            fieldCount++;
            fieldsHTML += createFieldHTML('title', '📄 E-Mail Titel', parsedTemplateData.title, 'input');
        }
        
        // Überschriften
        ['h1', 'h2', 'h3', 'h4'].forEach(tag => {
            const icon = { h1: '📢', h2: '📝', h3: '🏷️', h4: '🔖' }[tag];
            const label = { h1: 'Hauptüberschrift', h2: 'Unterüberschrift', h3: 'Titel', h4: 'Untertitel' }[tag];
            
            parsedTemplateData[tag].forEach((item, index) => {
                fieldCount++;
                fieldsHTML += createFieldHTML(`${tag}_${index}`, `${icon} ${label} ${index + 1}`, item.text, 'input');
            });
        });
        
        // Paragraphen
        parsedTemplateData.paragraphs.forEach((p, index) => {
            fieldCount++;
            fieldsHTML += createFieldHTML(`p_${index}`, `📄 Textabschnitt ${index + 1}`, p.text, 'textarea');
        });
        
        // Links
        parsedTemplateData.links.forEach((link, index) => {
            fieldCount++;
            fieldsHTML += `
                <div class="form-group">
                    <label>🔗 Link ${index + 1}:</label>
                    <input type="text" id="field_link_text_${index}" placeholder="Link-Text" 
                           value="${Utils.escapeHtml(link.text)}" onchange="showApplyButton()" 
                           style="margin-bottom: 5px;">
                    <input type="url" id="field_link_href_${index}" placeholder="URL" 
                           value="${Utils.escapeHtml(link.href)}" onchange="showApplyButton()">
                </div>
            `;
        });
        
        // Strong Texte
        parsedTemplateData.strong.forEach((strong, index) => {
            fieldCount++;
            fieldsHTML += createFieldHTML(`strong_${index}`, `💪 Hervorgehobener Text ${index + 1}`, strong.text, 'input');
        });
        
        // Ergebnis anzeigen
        if (fieldCount === 0) {
            showNoEditableFields();
        } else {
            showEditableFields(fieldCount, fieldsHTML);
        }
        
        updateApplyButton(fieldCount > 0);
    }

    /**
     * Erstellt HTML für ein Eingabefeld
     * @param {string} id - Feld-ID
     * @param {string} label - Label-Text
     * @param {string} value - Feld-Wert
     * @param {string} type - 'input' oder 'textarea'
     * @returns {string} HTML-String
     */
    function createFieldHTML(id, label, value, type) {
        const fieldId = `field_${id}`;
        const escapedValue = Utils.escapeHtml(value);
        
        if (type === 'textarea') {
            return `
                <div class="form-group">
                    <label>${label}:</label>
                    <textarea id="${fieldId}" onchange="showApplyButton()" style="min-height: 80px;">${escapedValue}</textarea>
                </div>
            `;
        } else {
            return `
                <div class="form-group">
                    <label>${label}:</label>
                    <input type="text" id="${fieldId}" value="${escapedValue}" onchange="showApplyButton()">
                </div>
            `;
        }
    }

    /**
     * Zeigt leere Template-Nachricht
     */
    function showEmptyTemplateMessage() {
        const container = document.getElementById('templateFields');
        if (container) {
            container.innerHTML = `
                <p class="placeholder">
                    Kein HTML Template gefunden. Gehe zum HTML Editor und erstelle oder lade ein Template.
                </p>
            `;
        }
    }

    /**
     * Zeigt Parsing-Fehler
     */
    function showParsingError() {
        const container = document.getElementById('templateFields');
        if (container) {
            container.innerHTML = `
                <div class="error-box" style="margin: 20px 0;">
                    <h4>❌ Template-Parsing-Fehler</h4>
                    <p>Das HTML-Template konnte nicht analysiert werden. Prüfe die HTML-Syntax im HTML-Editor.</p>
                </div>
            `;
        }
    }

    /**
     * Zeigt "Keine editierbaren Felder" Nachricht
     */
    function showNoEditableFields() {
        const container = document.getElementById('templateFields');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; color: #6c757d; margin: 20px 0;">
                    <h4>Keine editierbaren Bereiche gefunden</h4>
                    <p>Das Template enthält möglicherweise nur komplexe HTML-Strukturen oder sehr kurze Texte.</p>
                    <p><strong>Tipp:</strong> Verwende den HTML Editor für komplexe Anpassungen.</p>
                </div>
            `;
        }
    }

    /**
     * Zeigt editierbare Felder mit Erfolgs-Message
     * @param {number} fieldCount - Anzahl Felder
     * @param {string} fieldsHTML - HTML für Felder
     */
    function showEditableFields(fieldCount, fieldsHTML) {
        const container = document.getElementById('templateFields');
        if (container) {
            container.innerHTML = `
                <div class="info-box" style="margin-bottom: 20px;">
                    <strong>✨ ${fieldCount} editierbare Bereiche gefunden!</strong><br>
                    Bearbeite die Felder und klicke dann auf "✅ Änderungen übernehmen"
                </div>
                ${fieldsHTML}
            `;
        }
    }

    /**
     * Zeigt/versteckt Apply-Button
     * @param {boolean} show - Button anzeigen
     */
    function updateApplyButton(show) {
        const applyBtn = document.getElementById('applyBtn');
        if (applyBtn) {
            applyBtn.style.display = show ? 'inline-block' : 'none';
        }
    }

    /**
     * Zeigt Apply-Button in "Änderungen bereit" Status
     */
    function showApplyButton() {
        const applyBtn = document.getElementById('applyBtn');
        if (applyBtn) {
            applyBtn.style.display = 'inline-block';
            applyBtn.textContent = '⚡ Änderungen übernehmen';
            applyBtn.style.background = '#f39c12';
        }
        markAsChanged();
    }

    // ===== TEMPLATE UPDATES =====

    /**
     * Wendet Änderungen aus Simple Editor auf HTML an
     */
    function applyChanges() {
        try {
            updateTemplateFromFields();
            
            const applyBtn = document.getElementById('applyBtn');
            if (applyBtn) {
                applyBtn.textContent = '✅ Übernommen!';
                applyBtn.style.background = '#27ae60';
                setTimeout(() => {
                    applyBtn.textContent = '✅ Änderungen übernehmen';
                    applyBtn.style.background = '#27ae60';
                }, 2000);
            }
            
        } catch (error) {
            console.error('Error applying changes:', error);
            Utils.showStatus('templateStatus', 'Fehler beim Anwenden der Änderungen!', 'error');
        }
    }

    /**
     * Aktualisiert HTML-Template aus Simple Editor Feldern
     */
    function updateTemplateFromFields() {
        const htmlContent = document.getElementById('htmlContent');
        if (!htmlContent) return;

        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent.value, 'text/html');
        
        // Title aktualisieren
        if (parsedTemplateData.title) {
            updateDocumentElement(doc, 'title', 'field_title');
        }
        
        // Überschriften aktualisieren
        ['h1', 'h2', 'h3', 'h4'].forEach(tag => {
            parsedTemplateData[tag].forEach((item, index) => {
                updateDocumentElements(doc, tag, index, `field_${tag}_${index}`);
            });
        });
        
        // Paragraphen aktualisieren
        parsedTemplateData.paragraphs.forEach((p, index) => {
            updateParagraphByIndex(doc, p.index, `field_p_${index}`);
        });
        
        // Links aktualisieren
        parsedTemplateData.links.forEach((link, index) => {
            updateLinkByIndex(doc, link.index, `field_link_text_${index}`, `field_link_href_${index}`);
        });
        
        // Strong Texte aktualisieren
        parsedTemplateData.strong.forEach((strong, index) => {
            updateStrongByIndex(doc, strong.index, `field_strong_${index}`);
        });
        
        // HTML zurück ins Textarea
        htmlContent.value = doc.documentElement.outerHTML;
        updatePreview();
        markAsChanged();
    }

    /**
     * Aktualisiert einzelnes Document-Element
     * @param {Document} doc - DOM Document
     * @param {string} tagName - Tag-Name
     * @param {string} fieldId - Input-Field ID
     */
    function updateDocumentElement(doc, tagName, fieldId) {
        const newValue = getFieldValue(fieldId);
        const element = doc.querySelector(tagName);
        if (element && newValue !== null) {
            element.textContent = newValue;
        }
    }

    /**
     * Aktualisiert Document-Elemente nach Index
     * @param {Document} doc - DOM Document
     * @param {string} tagName - Tag-Name
     * @param {number} index - Element-Index
     * @param {string} fieldId - Input-Field ID
     */
    function updateDocumentElements(doc, tagName, index, fieldId) {
        const newValue = getFieldValue(fieldId);
        const elements = doc.querySelectorAll(tagName);
        if (elements[index] && newValue !== null) {
            elements[index].textContent = newValue;
        }
    }

    /**
     * Aktualisiert Paragraph nach originalem Index
     * @param {Document} doc - DOM Document
     * @param {number} originalIndex - Ursprünglicher Index
     * @param {string} fieldId - Input-Field ID
     */
    function updateParagraphByIndex(doc, originalIndex, fieldId) {
        const newValue = getFieldValue(fieldId);
        const paragraphs = doc.querySelectorAll('p');
        if (paragraphs[originalIndex] && newValue !== null) {
            paragraphs[originalIndex].textContent = newValue;
        }
    }

    /**
     * Aktualisiert Link nach Index
     * @param {Document} doc - DOM Document
     * @param {number} index - Link-Index
     * @param {string} textFieldId - Text-Field ID
     * @param {string} hrefFieldId - Href-Field ID
     */
    function updateLinkByIndex(doc, index, textFieldId, hrefFieldId) {
        const newText = getFieldValue(textFieldId);
        const newHref = getFieldValue(hrefFieldId);
        const links = doc.querySelectorAll('a');
        
        if (links[index]) {
            if (newText !== null) links[index].textContent = newText;
            if (newHref !== null) links[index].setAttribute('href', newHref);
        }
    }

    /**
     * Aktualisiert Strong-Element nach Index
     * @param {Document} doc - DOM Document
     * @param {number} index - Strong-Index
     * @param {string} fieldId - Input-Field ID
     */
    function updateStrongByIndex(doc, index, fieldId) {
        const newValue = getFieldValue(fieldId);
        const strongElements = doc.querySelectorAll('strong, b');
        if (strongElements[index] && newValue !== null) {
            strongElements[index].textContent = newValue;
        }
    }

    /**
     * Holt Wert aus Eingabefeld
     * @param {string} fieldId - Field ID
     * @returns {string|null} Feldwert oder null
     */
    function getFieldValue(fieldId) {
        const element = document.getElementById(fieldId);
        return element ? element.value || '' : null;
    }

    // ===== PREVIEW SYSTEM =====

    /**
     * Aktualisiert Live-Vorschau
     */
    function updatePreview() {
        const htmlContent = document.getElementById('htmlContent');
        const subject = document.getElementById('subject');
        const preview = document.getElementById('preview');
        
        if (!htmlContent || !preview) return;

        try {
            const subjectValue = subject ? subject.value : '';
            
            // Beispiel-Personalisierung
            const personalizedHTML = personalizeContent(htmlContent.value, {
                name: 'Max Mustermann',
                email: 'max@example.com'
            }, subjectValue);

            preview.innerHTML = personalizedHTML;
            
        } catch (error) {
            console.error('Error updating preview:', error);
            preview.innerHTML = `
                <div class="error-box">
                    <h4>❌ Preview-Fehler</h4>
                    <p>Das Template konnte nicht in der Vorschau angezeigt werden.</p>
                    <details>
                        <summary>Technische Details</summary>
                        <pre>${error.message}</pre>
                    </details>
                </div>
            `;
        }
    }

    /**
     * Personalisiert Template-Content
     * @param {string} content - Template-Content
     * @param {Object} recipient - Empfänger-Daten
     * @param {string} subject - E-Mail-Betreff
     * @returns {string} Personalisierter Content
     */
    function personalizeContent(content, recipient, subject = '') {
        if (!content) return '';
        
        return content
            .replace(/\{\{name\}\}/g, recipient.name || 'Unbekannt')
            .replace(/\{\{email\}\}/g, recipient.email || '')
            .replace(/\{\{subject\}\}/g, subject);
    }

    // ===== TEMPLATE MANAGEMENT =====

    /**
     * Speichert aktuelles Template
     */
    function save() {
        const name = document.getElementById('templateName');
        const subject = document.getElementById('subject');
        const htmlContent = document.getElementById('htmlContent');
        
        if (!name || !name.value.trim()) {
            alert('Bitte Template-Namen eingeben');
            Utils.focusElement('templateName');
            return;
        }
        
        const templateData = {
            subject: subject ? subject.value : '',
            content: htmlContent ? htmlContent.value : ''
        };
        
        const success = Config.saveTemplate(name.value.trim(), templateData);
        
        if (success) {
            currentTemplateName = name.value.trim();
            loadTemplateList();
            showSaveSuccess();
            markAsSaved();
        } else {
            Utils.showStatus('templateStatus', 'Fehler beim Speichern!', 'error');
        }
    }

    /**
     * Lädt Template-Liste in Dropdown
     */
    function loadTemplateList() {
        const select = document.getElementById('savedTemplates');
        if (!select) return;
        
        // Bestehende Optionen löschen (außer erste)
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }
        
        const templates = Config.getAllTemplates();
        Object.keys(templates).forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = `${name} (${templates[name].created || 'Unbekannt'})`;
            select.appendChild(option);
        });
    }

    /**
     * Lädt ausgewähltes Template
     */
    function loadSelected() {
        const select = document.getElementById('savedTemplates');
        if (!select || !select.value) return;
        
        const template = Config.loadTemplate(select.value);
        if (!template) {
            Utils.showStatus('templateStatus', 'Template nicht gefunden!', 'error');
            return;
        }
        
        // Template-Daten laden
        const subject = document.getElementById('subject');
        const htmlContent = document.getElementById('htmlContent');
        const templateName = document.getElementById('templateName');
        
        if (subject) subject.value = template.subject || '';
        if (htmlContent) htmlContent.value = template.content || '';
        if (templateName) templateName.value = select.value;
        
        currentTemplateName = select.value;
        
        // UI aktualisieren
        updatePreview();
        if (currentMode === 'simple') {
            parseTemplate();
        }
        
        markAsSaved();
        console.log(`Template loaded: ${select.value}`);
    }

    /**
     * Löscht ausgewähltes Template
     */
    function deleteTemplate() {
        const select = document.getElementById('savedTemplates');
        if (!select || !select.value) {
            alert('Bitte Template auswählen');
            return;
        }
        
        const templateName = select.value;
        if (!confirm(`Template "${templateName}" wirklich löschen?`)) {
            return;
        }
        
        const success = Config.deleteTemplate(templateName);
        
        if (success) {
            // UI zurücksetzen
            select.value = '';
            document.getElementById('templateName').value = '';
            loadTemplateList();
            
            if (currentTemplateName === templateName) {
                currentTemplateName = '';
            }
            
            Utils.showStatus('templateStatus', `Template "${templateName}" gelöscht`, 'success');
        } else {
            Utils.showStatus('templateStatus', 'Fehler beim Löschen!', 'error');
        }
    }

    // ===== CHANGE TRACKING =====

    /**
     * Markiert Template als geändert
     */
    function markAsChanged() {
        hasUnsavedChanges = true;
        updateSaveButtonState();
    }

    /**
     * Markiert Template als gespeichert
     */
    function markAsSaved() {
        hasUnsavedChanges = false;
        updateSaveButtonState();
    }

    /**
     * Aktualisiert Save-Button Status
     */
    function updateSaveButtonState() {
        // TODO: Visual indicator für unsaved changes implementieren
    }

    /**
     * Zeigt Speicher-Erfolg an
     */
    function showSaveSuccess() {
        const saveBtn = document.querySelector('[onclick="Templates.save()"]');
        if (saveBtn) {
            const originalText = saveBtn.textContent;
            saveBtn.textContent = '✅ Gespeichert!';
            saveBtn.style.background = '#27ae60';
            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.style.background = '#4a90e2';
            }, 2000);
        }
    }

    // ===== PUBLIC API =====
    return {
        // Core functions
        init,
        
        // Editor management
        switchMode,
        getCurrentMode,
        
        // Template parsing & editing
        parseTemplate,
        applyChanges,
        updatePreview,
        
        // Template management
        save,
        loadSelected,
        deleteTemplate: deleteTemplate,
        loadTemplateList,
        
        // Preview & personalization
        personalizeContent,
        
        // Utilities
        markAsChanged,
        markAsSaved,
        showApplyButton
    };
})();
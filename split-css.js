const fs = require('fs');
const path = require('path');

const mapping = {
  'RESET & BASE': 'core/reset.css',
  'LAYOUT': 'core/layout.css',
  'SIMPLE HEADER': 'components/navigation.css',
  'AUTH PAGES': 'pages/auth.css',
  'HEADER': 'components/navigation.css',
  'NAVIGATION TABS': 'components/navigation.css',
  'TAB CONTENT': 'pages/dashboard.css',
  'FORMS': 'components/forms.css',
  'UNIFIED BUTTON SYSTEM': 'components/buttons.css',
  'TEMPLATE CONTROLS': 'components/forms.css',
  'EDITORS': 'components/forms.css',
  'RECIPIENTS': 'pages/recipients.css',
  'CSV IMPORT': 'pages/recipients.css',
  'MANUAL INPUT': 'pages/recipients.css',
  'CAMPAIGNS CSS': 'pages/campaigns.css',
  'RECIPIENT CONTROLS': 'pages/recipients.css',
  'RECIPIENT LIST': 'pages/recipients.css',
  'STATUS INDICATORS': 'components/progress.css',
  'PROGRESS': 'components/progress.css',
  'ALERTS & NOTIFICATIONS': 'components/modals.css',
  'FILE UPLOAD': 'components/forms.css',
  'BACKUP CONTROLS': 'pages/dashboard.css',
  'SETUP PROMPT': 'pages/setup.css',
  'SETUP WIZARD': 'pages/wizard.css',
  'ATTACHMENT STYLES': 'components/forms.css',
  'MAIL WIZARD STYLES': 'pages/wizard.css',
  'WIZARD ATTACHMENT STYLES': 'pages/wizard.css',
  'WIZARD PROGRESS FIX': 'pages/wizard.css',
  'WIZARD EMPFÄNGER-AUSWAHL': 'pages/wizard.css',
  'RESPONSIVE ATTACHMENT STYLES': 'pages/wizard.css',
  'RESPONSIVE DESIGN': 'utilities/responsive.css',
  'UTILITY CLASSES': 'utilities/spacing.css',
  'LANDING PAGE SPEZIFISCHE STYLES': 'pages/landing.css',
  'CAMPAIGN SUMMARY': 'pages/campaigns.css',
  'SEND CONTROLS': 'pages/campaigns.css',
  'SEND LOG': 'pages/campaigns.css',
  'RESULTS': 'pages/campaigns.css',
  'EMPTY STATE': 'pages/campaigns.css',
  'DARK MODE SUPPORT (Optional)': 'themes/dark-mode.css',
  'LOADING SCREEN': 'components/progress.css',
  'CSS ORB (WebGL-Alternative)': 'components/progress.css',
  'ORB ANIMATIONS': 'themes/animations.css',
  'LOADING CONTENT': 'components/progress.css',
  'ANIMATED DOTS': 'components/progress.css',
  'PROGRESS BAR': 'components/progress.css',
  'RESPONSIVE': 'utilities/responsive.css',
  'MODAL DESKTOP BUTTON VISIBILITY FIX': 'utilities/responsive.css',
  'TOAST NOTIFICATIONS': 'components/modals.css',
  'UNIFIED PROGRESS SYSTEM': 'components/progress.css'
};

const styles = fs.readFileSync('styles.css', 'utf8').split(/\r?\n/);
let current = 'core/reset.css';
let sections = { [current]: [] };
let order = [current];

for (let line of styles) {
  const match = line.match(/\/\*\s*===\s*(.*?)\s*===\s*\*\//);
  if (match) {
    const name = match[1].trim();
    const target = mapping[name] || 'components/' + name.replace(/[^a-z0-9]+/gi,'-').toLowerCase() + '.css';
    current = target;
    if (!sections[current]) { sections[current] = []; order.push(current); }
    sections[current].push(line);
  } else {
    if (!sections[current]) { sections[current] = []; order.push(current); }
    sections[current].push(line);
  }
}

for (const file in sections) {
  const dir = path.join('css', path.dirname(file));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join('css', file), sections[file].join('\n'));
}

// generate index.css with imports in order
const imports = order.map(f => `@import './${f.replace(/\\/g, '/')}';`).join('\n');
fs.writeFileSync('css/index.css', imports + '\n');

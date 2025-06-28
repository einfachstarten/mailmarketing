const fs = require('fs');

function generateVersion() {
    try {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 19).replace('T', ' ');
        const timestamp = Math.floor(now.getTime() / 1000);
        const buildNumber = timestamp.toString().slice(-6);
        const version = `2.0.${buildNumber}`;
        const fullVersion = `${version} (${dateStr})`;
        
        const versionData = {
            version: version,
            fullVersion: fullVersion,
            buildDate: dateStr,
            buildNumber: buildNumber,
            timestamp: timestamp
        };
        
        fs.writeFileSync('version.txt', fullVersion);
        fs.writeFileSync('version.json', JSON.stringify(versionData, null, 2));
        
        const versionJs = `// Auto-generated version file
window.APP_VERSION = ${JSON.stringify(versionData)};

function displayVersion() {
    const versionElements = document.querySelectorAll('.app-version');
    versionElements.forEach(el => {
        if (el.classList.contains('version-short')) {
            el.textContent = window.APP_VERSION.version;
        } else if (el.classList.contains('version-full')) {
            el.textContent = window.APP_VERSION.fullVersion;
        } else {
            el.textContent = window.APP_VERSION.version;
        }
        el.title = \`Version: \${window.APP_VERSION.version}\\nBuild: \${window.APP_VERSION.buildDate}\`;
    });
}

function insertVersionedCSS() {
    const href = 'styles.css?v=' + window.APP_VERSION.buildNumber;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => document.body.classList.add('css-loaded');
    link.onerror = () => {
        const fallback = document.createElement('link');
        fallback.rel = 'stylesheet';
        fallback.href = 'styles.css';
        fallback.onload = () => document.body.classList.add('css-loaded');
        document.head.appendChild(fallback);
    };
    document.head.appendChild(link);
}

function initVersion() {
    displayVersion();
    insertVersionedCSS();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVersion);
} else {
    initVersion();
}
`;
        
        fs.writeFileSync('js/version.js', versionJs);
        
    } catch (error) {
        console.error('Error generating version:', error);
        const fallbackVersion = '2.0.0';
        const fallbackDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const fallback = `${fallbackVersion} (${fallbackDate})`;
        fs.writeFileSync('version.txt', fallback);
        fs.writeFileSync('js/version.js', `window.APP_VERSION = {version: "${fallbackVersion}", buildDate: "${fallbackDate}"}; function displayVersion() { document.querySelectorAll('.app-version').forEach(el => el.textContent = "${fallbackVersion}"); } if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', displayVersion); } else { displayVersion(); }`);
    }
}

if (require.main === module) {
    generateVersion();
}

module.exports = generateVersion;

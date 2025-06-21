const fs = require('fs');
const { execSync } = require('child_process');

function generateVersion() {
    try {
        // Datum und Zeit
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 19).replace('T', ' ');
        const timestamp = Math.floor(now.getTime() / 1000);
        
        // Git-Informationen (falls verfügbar)
        let gitCommit = 'unknown';
        let gitBranch = 'unknown';
        
        try {
            gitCommit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
            gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
        } catch (e) {
            console.log('Git info not available, using defaults');
        }
        
        // Build-Nummer basierend auf Timestamp
        const buildNumber = timestamp.toString().slice(-6); // Letzte 6 Ziffern
        
        // Version-String generieren
        const majorMinor = '1.0'; // Kann manuell erhöht werden
        const version = `${majorMinor}.${buildNumber}`;
        const fullVersion = `${version} (${dateStr} - ${gitCommit})`;
        
        // Version-Objekt erstellen
        const versionData = {
            version: version,
            fullVersion: fullVersion,
            buildDate: dateStr,
            gitCommit: gitCommit,
            gitBranch: gitBranch,
            buildNumber: buildNumber,
            timestamp: timestamp
        };
        
        // version.txt für einfachen Zugriff
        fs.writeFileSync('version.txt', fullVersion);
        
        // version.json für JavaScript-Zugriff
        fs.writeFileSync('version.json', JSON.stringify(versionData, null, 2));
        
        // js/version.js aktualisieren
        const versionJs = `// Auto-generated version file
window.APP_VERSION = ${JSON.stringify(versionData)};

// Version display function
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

        // Tooltip mit vollständigen Informationen
        el.title = 'Version: ' + window.APP_VERSION.version +
            '\\nBuild: ' + window.APP_VERSION.buildDate +
            '\\nCommit: ' + window.APP_VERSION.gitCommit +
            '\\nBranch: ' + window.APP_VERSION.gitBranch;
    });
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', displayVersion);
} else {
    displayVersion();
}

console.log('App Version:', window.APP_VERSION.version);
`;
        
        fs.writeFileSync('js/version.js', versionJs);
        
        console.log('\u2713 Version generated:', version);
        console.log('\u2713 Build date:', dateStr);
        console.log('\u2713 Git commit:', gitCommit);
        
    } catch (error) {
        console.error('Error generating version:', error);
        
        // Fallback-Version bei Fehlern
        const fallbackVersion = '1.0.0';
        const fallbackDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
        
        fs.writeFileSync('version.txt', `${fallbackVersion} (${fallbackDate} - fallback)`);
        fs.writeFileSync('js/version.js', `window.APP_VERSION = {version: "${fallbackVersion}", buildDate: "${fallbackDate}"};`);
    }
}

// Direkt ausführen wenn als Script aufgerufen
if (require.main === module) {
    generateVersion();
}

module.exports = generateVersion;

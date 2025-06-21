// Auto-generated version file
window.APP_VERSION = {"version":"1.0.490248","fullVersion":"1.0.490248 (2025-06-21 07:17:28)","buildDate":"2025-06-21 07:17:28","buildNumber":"490248","timestamp":1750490248};

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
        el.title = `Version: ${window.APP_VERSION.version}
Build: ${window.APP_VERSION.buildDate}`;
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', displayVersion);
} else {
    displayVersion();
}

console.log('App Version:', window.APP_VERSION.version);

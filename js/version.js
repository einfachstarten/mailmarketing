// Auto-generated version file
window.APP_VERSION = {"version":"2.0.507756","fullVersion":"2.0.507756 (2025-06-21 12:09:16)","buildDate":"2025-06-21 12:09:16","buildNumber":"507756","timestamp":1750507756};

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

// Auto-generated version file
window.APP_VERSION = {"version":"2.0.128279","fullVersion":"2.0.128279 (2025-06-28 16:31:19)","buildDate":"2025-06-28 16:31:19","buildNumber":"128279","timestamp":1751128279};

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
        el.title = `Version: ${window.APP_VERSION.version}\nBuild: ${window.APP_VERSION.buildDate}`;
    });
}

function insertVersionedCSS() {
    const href = 'css/index.css?v=' + window.APP_VERSION.buildNumber;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => document.body.classList.add('css-loaded');
    link.onerror = () => {
        const fallback = document.createElement('link');
        fallback.rel = 'stylesheet';
        fallback.href = 'css/index.css';
        fallback.onload = () => document.body.classList.add('css-loaded');
        document.head.appendChild(fallback);
    };
    document.head.appendChild(link);
}

function initVersion() {
    displayVersion();
    insertVersionedCSS();
    console.log('App Version:', window.APP_VERSION.version);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVersion);
} else {
    initVersion();
}

window.ProgressManager = (function() {
    'use strict';

    let activeProgress = null;
    let progressState = {
        current: 0,
        total: 0,
        message: '',
        type: 'campaign'
    };

    function initProgress(config) {
        const { containerId, type = 'campaign', total = 0 } = config;
        cleanup();

        let container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Progress container ${containerId} not found`);
            return null;
        }

        const progressHTML = generateProgressHTML(type);
        container.innerHTML = progressHTML;
        container.style.display = 'block';

        progressState = { current: 0, total, message: 'Initialisiere...', type };
        activeProgress = {
            container: container,
            bar: container.querySelector('.unified-progress-bar'),
            text: container.querySelector('.unified-progress-text'),
            count: container.querySelector('.unified-progress-count'),
            log: container.querySelector('.unified-progress-log')
        };

        return activeProgress;
    }

    function updateProgress(current, total, message = '') {
        if (!activeProgress) {
            console.warn('No active progress bar');
            return;
        }

        progressState.current = Math.min(current, total);
        progressState.total = total;
        progressState.message = message;

        const percentage = total > 0 ? (progressState.current / total) * 100 : 0;
        requestAnimationFrame(() => updateProgressDOM(percentage));
    }

    function updateProgressDOM(percentage) {
        if (!activeProgress) return;

        if (activeProgress.bar) {
            activeProgress.bar.style.width = Math.round(percentage) + '%';
        }

        if (activeProgress.text) {
            activeProgress.text.textContent = progressState.message ||
                `Verarbeite ${progressState.current} von ${progressState.total}`;
        }

        if (activeProgress.count) {
            activeProgress.count.textContent = `${progressState.current} / ${progressState.total}`;
        }
    }

    function addLog(message, type = 'info') {
        if (!activeProgress || !activeProgress.log) return;

        const timestamp = new Date().toLocaleTimeString('de-DE');
        const logEntry = document.createElement('div');
        logEntry.className = `unified-log-entry unified-log-${type}`;
        logEntry.innerHTML = `<span class="unified-log-time">[${timestamp}]</span> ${message}`;

        activeProgress.log.appendChild(logEntry);
        activeProgress.log.scrollTop = activeProgress.log.scrollHeight;
    }

    function completeProgress(message = 'Abgeschlossen!') {
        if (!activeProgress) return;
        updateProgress(progressState.total, progressState.total, message);
        if (activeProgress.bar) {
            activeProgress.bar.classList.add('progress-complete');
        }
    }

    function hideProgress(delay = 3000) {
        if (!activeProgress) return;
        setTimeout(() => {
            if (activeProgress && activeProgress.container) {
                activeProgress.container.style.opacity = '0';
                setTimeout(() => {
                    if (activeProgress && activeProgress.container) {
                        activeProgress.container.style.display = 'none';
                    }
                    cleanup();
                }, 300);
            }
        }, delay);
    }

    function cleanup() {
        activeProgress = null;
        progressState = { current: 0, total: 0, message: '', type: 'campaign' };
    }

    function generateProgressHTML(type) {
        return `
            <div class="unified-progress-container">
                <h4>📊 ${type === 'campaign' ? 'Kampagnen-' : ''}Fortschritt</h4>
                <div class="unified-progress-bar-container">
                    <div class="unified-progress-track">
                        <div class="unified-progress-bar" style="width: 0%"></div>
                    </div>
                    <div class="unified-progress-info">
                        <span class="unified-progress-text">Bereit...</span>
                        <span class="unified-progress-count">0 / 0</span>
                    </div>
                </div>
                <div class="unified-progress-log-container">
                    <div class="unified-progress-log"></div>
                </div>
            </div>
        `;
    }

    return {
        init: initProgress,
        update: updateProgress,
        log: addLog,
        complete: completeProgress,
        hide: hideProgress,
        cleanup,
        getState: () => ({ ...progressState })
    };
})();

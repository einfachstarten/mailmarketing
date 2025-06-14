window.ServerConfig = (function() {
    const DEFAULT_CONFIG = {
        // Falls im Frontend keine URL gesetzt wird, nutzen wir die aktuelle
        // Herkunft des Browsers. Das funktioniert direkt nach dem Deployment
        // auf Fly.io ohne weitere Anpassungen.
        baseUrl: '',
        authToken: 'secret-token'
    };

    let config = { ...DEFAULT_CONFIG };

    function get() {
        return config;
    }

    function set(newConfig) {
        config = { ...config, ...newConfig };
    }

    return { get, set };
})();

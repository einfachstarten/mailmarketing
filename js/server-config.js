window.ServerConfig = (function() {
    const DEFAULT_CONFIG = {
        baseUrl: window.location.origin,
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

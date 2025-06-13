window.ServerConfig = (function() {
    const DEFAULT_CONFIG = {
        baseUrl: 'http://localhost:3000',
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

const isProduction = process.env.NODE_ENV === 'production';

const runtimeConfig = typeof window !== 'undefined' && window.ENV ? window.ENV : {};

const config = {
    apiUrl: runtimeConfig.REACT_APP_API_URL ||
        process.env.REACT_APP_API_URL ||
        (isProduction
            ? 'http://16.171.126.113:8000/api'
            : 'http://localhost:8000/api'),

    appName: 'Connecting The Dots',
    appVersion: '1.0.0',
};

export default config; 
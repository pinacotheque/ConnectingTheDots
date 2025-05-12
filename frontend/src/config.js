const isProduction = process.env.NODE_ENV === 'production';

const runtimeConfig = typeof window !== 'undefined' && window.ENV ? window.ENV : {};

const config = {
    apiUrl: runtimeConfig.REACT_APP_API_URL ||
        process.env.REACT_APP_API_URL ||
        (isProduction
            ? 'http://16.171.126.113:8000/api'  // EC2 public IP for production
            : 'http://localhost:8000/api'),     // localhost for development

    appName: 'Connecting The Dots',
    appVersion: '1.0.0',
};

export default config; 
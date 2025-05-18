const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';


const config = {
    apiUrl: isProduction ? 'http://13.61.57.200:8000/api' : 'http://localhost:8000/api',
    appName: 'Connecting The Dots',
    appVersion: '1.0.0',
};
if (typeof window !== 'undefined') {
    console.log(`Environment: ${isProduction ? 'Production' : 'Development'}`);
    console.log(`API URL: ${config.apiUrl}`);
}

export default config; 
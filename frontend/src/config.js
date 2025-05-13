const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

const runtimeConfig = typeof window !== 'undefined' && window.ENV ? window.ENV : {};

const config = {
    apiUrl: 'http://51.20.48.230:8000/api',
    appName: 'Connecting The Dots',
    appVersion: '1.0.0',
};
if (typeof window !== 'undefined') {
    console.log(`Environment: ${isProduction ? 'Production' : 'Development'}`);
    console.log(`API URL: ${config.apiUrl}`);
}


// const config = {
//     apiUrl: runtimeConfig.REACT_APP_API_URL ||
//         process.env.REACT_APP_API_URL ||
//         (isProduction
//             ? 'http://51.20.48.230:8000/api'
//             : 'http://localhost:8000/api'),

//     appName: 'Connecting The Dots',
//     appVersion: '1.0.0',
// };
// if (typeof window !== 'undefined') {
//     console.log(`Environment: ${isProduction ? 'Production' : 'Development'}`);
//     console.log(`API URL: ${config.apiUrl}`);
// }

export default config; 
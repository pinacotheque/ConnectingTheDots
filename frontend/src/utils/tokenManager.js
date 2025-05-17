const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_EXPIRY_KEY = 'token_expiry';

export const getToken = () => {
    return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token) => {
    if (token) {
        localStorage.setItem(TOKEN_KEY, token);
    }
};

export const getRefreshToken = () => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setRefreshToken = (refreshToken) => {
    if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
};

export const setTokenExpiry = (expiresIn) => {
    const expiryTime = Date.now() + expiresIn * 1000;
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
};

export const isTokenExpired = () => {
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiry) return true;

    return Date.now() > parseInt(expiry);
};

export const removeToken = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
};

export const getAuthHeader = () => {
    const token = getToken();
    if (token) {
        const cleanToken = token.replace('Bearer ', '');
        return `Bearer ${cleanToken}`;
    }
    return null;
}; 
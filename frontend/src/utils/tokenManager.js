const TOKEN_KEY = 'token';

export const getToken = () => {
    return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token) => {
    if (token) {
        localStorage.setItem(TOKEN_KEY, token);
    }
};

export const removeToken = () => {
    localStorage.removeItem(TOKEN_KEY);
};

export const getAuthHeader = () => {
    const token = getToken();
    if (token) {
        const cleanToken = token.replace('Bearer ', '');
        return `Bearer ${cleanToken}`;
    }
    return null;
}; 
import axios from "axios";
import {
    setToken,
    removeToken,
    getAuthHeader,
    getRefreshToken,
    setRefreshToken,
    isTokenExpired,
    setTokenExpiry
} from "../utils/tokenManager";
import config from "../config";

const API = axios.create({
    baseURL: config.apiUrl,
    headers: {
        "Content-Type": "application/json",
    },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

export const refreshToken = async () => {
    const refresh = getRefreshToken();
    if (!refresh) {
        throw new Error('No refresh token available');
    }

    try {
        const response = await axios.post(`${config.apiUrl}/refresh-token/`, {
            refresh
        });
        const { token, expires_in } = response.data;

        setToken(token);
        setTokenExpiry(expires_in);
        return token;
    } catch (error) {
        removeToken();
        throw error;
    }
};

API.interceptors.request.use(
    async (config) => {
        if (isTokenExpired() && !config.url.includes('/refresh-token/') && !config.url.includes('/login/') && !config.url.includes('/register/')) {
            if (!isRefreshing) {
                isRefreshing = true;
                try {
                    await refreshToken();
                    isRefreshing = false;
                    processQueue(null, getAuthHeader());
                } catch (error) {
                    processQueue(error, null);
                    isRefreshing = false;
                    removeToken();
                    window.location.href = '/login';
                    return Promise.reject(error);
                }
            } else {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    config.headers.Authorization = token;
                    return config;
                }).catch(error => {
                    return Promise.reject(error);
                });
            }
        }

        const authHeader = getAuthHeader();
        if (authHeader) {
            config.headers.Authorization = authHeader;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            if (!error.config.url.includes('/refresh-token/')) {
                removeToken();
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export const registerUser = async (userData) => {
    try {
        const response = await API.post("/register/", userData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'An error occurred during registration' };
    }
};

export const loginUser = async (credentials) => {
    try {
        const response = await API.post("/login/", credentials);
        if (response.data.token) {
            setToken(response.data.token);
            setRefreshToken(response.data.refresh);
            setTokenExpiry(response.data.expires_in);
        }
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'An error occurred during login' };
    }
};

export const createSpace = async (spaceData) => {
    try {
        const response = await API.post("/spaces/", spaceData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'An error occurred while creating the space' };
    }
};

export const getSpaces = async () => {
    try {
        const response = await API.get("/spaces/");
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'An error occurred while fetching spaces' };
    }
};

export const joinSpace = async (spaceId) => {
    try {
        const response = await API.post(`/spaces/${spaceId}/join/`);
        return {
            message: response.data.detail,
            space: response.data.space
        };
    } catch (error) {
        throw error.response?.data || { message: 'An error occurred while joining the space' };
    }
};

export const leaveSpace = async (spaceId) => {
    try {
        const response = await API.post(`/spaces/${spaceId}/leave/`);
        return {
            message: response.data.detail,
            space: response.data.space
        };
    } catch (error) {
        throw error.response?.data || { message: 'An error occurred while leaving the space' };
    }
};

export const getSpace = async (spaceId) => {
    try {
        const response = await API.get(`/spaces/${spaceId}/`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'An error occurred while fetching the space' };
    }
};

export const searchWikidata = async (query) => {
    try {
        const response = await API.get(`/spaces/search_wikidata/?q=${encodeURIComponent(query)}`);
        return response.data;
    } catch (error) {
        console.error('Error searching Wikidata:', error);
        throw error;
    }
};

export const getWikidataProperties = async (entityId) => {
    try {
        const response = await API.get(`spaces/get_wikidata_properties/?entity_id=${entityId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching Wikidata properties:', error);
        throw error;
    }
};

export const createNode = async (spaceId, entity, selectedValues, properties) => {
    try {
        const propertiesObject = properties.reduce((acc, prop) => {
            const selectedValuesForProp = selectedValues[prop.wikidata_id] || [];
            if (selectedValuesForProp.length > 0) {
                acc[prop.wikidata_id] = {
                    label: prop.label,
                    values: selectedValuesForProp,
                };
            }
            return acc;
        }, {});

        const response = await API.post("/nodes/", {
            space: spaceId,
            wikidata_id: entity.wikidata_id,
            label: entity.label,
            description: entity.description,
            properties: propertiesObject,
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'An error occurred while creating the node' };
    }
};

export const deleteSpace = async (spaceId) => {
    try {
        const response = await API.delete(`/spaces/${spaceId}/`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'An error occurred while deleting the space' };
    }
};

export const createEdge = async (sourceNodeId, targetNodeId, propertyId, customLabel) => {
    try {
        const response = await API.post(`/nodes/${sourceNodeId}/create_edge/`, {
            source_node_id: sourceNodeId,
            target_node_id: targetNodeId,
            property_wikidata_id: propertyId,
            custom_label: customLabel
        });
        return response.data;
    } catch (error) {
        console.error('Edge creation error:', error.response?.data || error);
        throw error.response?.data || { message: 'An error occurred while creating the edge' };
    }
};

export const getEdges = async (spaceId) => {
    try {
        const response = await API.get(`/spaces/${spaceId}/edges/`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'An error occurred while fetching edges' };
    }
};

export const getUserProfile = async () => {
    try {
        const response = await API.get('/profile/');
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'An error occurred while fetching user profile' };
    }
};

export const logoutUser = async () => {
    try {
        await API.post('/logout/');
        removeToken();
        return { success: true };
    } catch (error) {
        removeToken();
        return { success: true };
    }
};

export const getTags = async () => {
    try {
        const response = await API.get('/tags/');
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'An error occurred while fetching tags' };
    }
};

export const deleteNode = async (nodeId) => {
    try {
        const response = await API.delete(`/nodes/${nodeId}/`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'An error occurred while deleting the node' };
    }
};

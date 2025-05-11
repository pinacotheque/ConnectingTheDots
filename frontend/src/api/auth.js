import axios from "axios";
import { setToken, removeToken, getAuthHeader } from "../utils/tokenManager";
import config from "../config";

const API = axios.create({
    baseURL: config.apiUrl,
    headers: {
        "Content-Type": "application/json",
    },
});

API.interceptors.request.use(
    (config) => {
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
            removeToken();
            window.location.href = '/login';
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
        const { access } = response.data;
        if (access) {
            setToken(access);
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
        const response = await API.get(`spaces/search_wikidata/?q=${encodeURIComponent(query)}`);
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

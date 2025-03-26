import axios from "axios";

const API = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

export const registerUser = async (userData) => {
    const response = await API.post("/register/", userData);
    return response.data;
};

export const loginUser = async (credentials) => {
    const response = await API.post("/login/", credentials);
    return response.data;
};

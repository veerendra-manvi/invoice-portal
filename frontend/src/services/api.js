import axios from "axios";
import { API_BASE_URL } from "../config/api";

const api = axios.create({
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API ERROR:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Add interceptor to include user_id in every request
api.interceptors.request.use((config) => {
  const userString = localStorage.getItem('user');
  if (userString) {
    const user = JSON.parse(userString);
    if (user.id) {
      // Append user_id to query parameters for all requests
      config.params = {
        ...config.params,
        user_id: user.id
      };
    }
  }
  return config;
});

export default api;
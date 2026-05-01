import axios from "axios";

// Deployed API Base URL
export const API_BASE_URL = "https://invoiceportal.rf.gd/backend/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

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
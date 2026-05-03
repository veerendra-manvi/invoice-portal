import api from './api';
import { API_BASE_URL } from '../config/api';

const clientService = {
  getClients: async () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const response = await api.get(`${API_BASE_URL}/clients.php?user_id=${user.id}`);
    return response.data;
  },
  
  createClient: async (clientData) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const response = await api.post(`${API_BASE_URL}/clients.php?user_id=${user.id}`, clientData);
    return response.data;
  },
  
  deleteClient: async (id) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const response = await api.delete(`${API_BASE_URL}/clients.php?id=${id}&user_id=${user.id}`);
    return response.data;
  }
};

export default clientService;

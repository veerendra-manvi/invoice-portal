import api from './api';

const clientService = {
  getClients: async () => {
    const response = await api.get('/clients.php');
    return response.data;
  },
  
  createClient: async (clientData) => {
    const response = await api.post('/clients.php', clientData);
    return response.data;
  },
  
  deleteClient: async (id) => {
    const response = await api.delete(`/clients.php?id=${id}`);
    return response.data;
  }
};

export default clientService;

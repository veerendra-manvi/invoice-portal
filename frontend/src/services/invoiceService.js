import api from './api';

const invoiceService = {
  getInvoices: async () => {
    const response = await api.get('/invoices.php');
    return response.data;
  },

  getInvoice: async (id) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const response = await api.get(`/invoices.php?id=${id}&user_id=${user.id}`);
    return response.data;
  },

  createInvoice: async (invoiceData) => {
    const response = await api.post('/invoices.php', invoiceData);
    return response.data;
  },

  updateInvoiceStatus: async (id, status) => {
    const response = await api.put(`/invoices.php?id=${id}`, { status });
    return response.data;
  },

  deleteInvoice: async (id) => {
    const response = await api.delete(`/invoices.php?id=${id}`);
    return response.data;
  },

  getPayments: async (invoiceId) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const response = await api.get(`/payments.php?invoice_id=${invoiceId}&user_id=${user.id}`);
    return response.data;
  },

  recordPayment: async (paymentData) => {
    const response = await api.post('/payments.php', paymentData);
    return response.data;
  }
};

export default invoiceService;

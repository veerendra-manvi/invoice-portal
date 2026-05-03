import api from './api';
import { API_BASE_URL } from '../config/api';

const invoiceService = {
  getInvoices: async () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const response = await api.get(`${API_BASE_URL}/invoices.php?action=list&user_id=${user.id}`);
    return response.data;
  },

  getInvoice: async (id) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const response = await api.get(`${API_BASE_URL}/invoices.php?action=get&id=${id}&user_id=${user.id}`);
    return response.data;
  },

  createInvoice: async (invoiceData) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const response = await api.post(`${API_BASE_URL}/invoices.php?user_id=${user.id}`, invoiceData);
    return response.data;
  },

  updateInvoiceStatus: async (id, status) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const response = await api.post(`${API_BASE_URL}/invoices.php?action=update_status&user_id=${user.id}`, { id, status });
    return response.data;
  },

  deleteInvoice: async (id) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const response = await api.post(`${API_BASE_URL}/invoices.php?action=delete&id=${id}&user_id=${user.id}`);
    return response.data;
  },

  getPayments: async (invoiceId) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const response = await api.get(`${API_BASE_URL}/payments.php?invoice_id=${invoiceId}&user_id=${user.id}`);
    return response.data;
  },

  recordPayment: async (paymentData) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const response = await api.post(`${API_BASE_URL}/payments.php?user_id=${user.id}`, paymentData);
    return response.data;
  }
};

export default invoiceService;

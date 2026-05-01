import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../services/api';
import Navbar from '../components/Navbar';
import { formatCurrency } from '../utils/formatCurrency';

const EditInvoice = () => {
  const { id: invoiceId } = useParams();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    client_id: '',
    issue_date: '',
    due_date: '',
    tax_rate: 18,
    status: 'Draft',
    notes: ''
  });

  const [items, setItems] = useState([]);

  useEffect(() => {
    const init = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (!user.id) {
          navigate('/login');
          return;
        }

        // Fetch Clients and Invoice Data
        const [clientsRes, invoiceRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/clients.php?user_id=${user.id}`),
          axios.get(`${API_BASE_URL}/invoices.php?action=get&id=${invoiceId}&user_id=${user.id}`)
        ]);

        if (clientsRes.data.status === 'success') setClients(clientsRes.data.data);
        
        if (invoiceRes.data.status === 'success') {
          const inv = invoiceRes.data.data.invoice;
          setFormData({
            client_id: inv.client_id,
            issue_date: inv.issue_date,
            due_date: inv.due_date,
            tax_rate: inv.tax_rate,
            status: inv.status,
            notes: inv.notes || ''
          });
          setItems(invoiceRes.data.data.items);
        }
      } catch (err) {
        console.error("Initialization error", err);
        alert("Failed to load invoice data");
        navigate('/invoices');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [invoiceId]);

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0 }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const calculateSubtotal = () => items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const subtotal = calculateSubtotal();
  const taxAmount = (subtotal * formData.tax_rate) / 100;
  const total = subtotal + taxAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const res = await axios.post(`${API_BASE_URL}/invoices.php?action=update&id=${invoiceId}&user_id=${user.id}`, {
        ...formData,
        items
      });

      if (res.data.status === 'success') {
        setSuccess(true);
        setTimeout(() => navigate(`/invoices/${invoiceId}`), 1000);
      }
    } catch (err) {
      console.error("Update error", err);
      alert("Failed to update invoice");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Invoice</h1>
              <p className="text-sm text-gray-500">Update the details of your invoice below.</p>
            </div>
            <div className="flex space-x-3">
              <button type="button" onClick={() => navigate(-1)} className="px-5 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium transition-colors">Cancel</button>
              <button type="submit" disabled={submitting || success} className={`px-8 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all ${success ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-50`}>
                {success ? 'Saved!' : submitting ? 'Saving...' : 'Update Invoice'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                <h2 className="text-lg font-bold text-gray-800 mb-6">Invoice Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-full">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Client</label>
                    <select
                      className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      value={formData.client_id}
                      onChange={(e) => setFormData({...formData, client_id: e.target.value})}
                    >
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Issue Date</label>
                    <input type="date" className="w-full rounded-xl border border-gray-300 p-3 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500" value={formData.issue_date} onChange={(e) => setFormData({...formData, issue_date: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Due Date</label>
                    <input type="date" className="w-full rounded-xl border border-gray-300 p-3 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500" value={formData.due_date} onChange={(e) => setFormData({...formData, due_date: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-gray-800">Line Items</h2>
                  <button type="button" onClick={handleAddItem} className="text-blue-600 font-bold bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-all">Add Row</button>
                </div>
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-center">
                      <input type="text" className="col-span-6 rounded-xl border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Description" value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} />
                      <input type="number" className="col-span-2 rounded-xl border border-gray-300 p-3 text-center outline-none focus:ring-2 focus:ring-blue-500" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)} />
                      <input type="number" className="col-span-3 rounded-xl border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-blue-500" value={item.unit_price} onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)} />
                      <button type="button" onClick={() => handleRemoveItem(index)} className="col-span-1 text-red-400 hover:text-red-600 flex justify-center"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm h-fit sticky top-24">
              <h2 className="text-lg font-bold text-gray-800 mb-6">Summary</h2>
              <div className="space-y-4">
                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                <div className="space-y-2 pb-4 border-b">
                  <label className="text-xs font-bold text-gray-400 uppercase">Tax Rate (%)</label>
                  <input type="number" className="w-full rounded-lg border border-gray-200 p-2 outline-none focus:ring-2 focus:ring-blue-500" value={formData.tax_rate} onChange={(e) => setFormData({...formData, tax_rate: e.target.value})} />
                </div>
                <div className="pt-2 text-right">
                  <span className="text-gray-900 font-bold block mb-1">Grand Total</span>
                  <span className="text-3xl font-black text-blue-600">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default EditInvoice;

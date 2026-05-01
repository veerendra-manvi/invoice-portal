import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import clientService from '../services/clientService';
import invoiceService from '../services/invoiceService';
import { formatCurrency } from '../utils/formatCurrency';

const CreateInvoice = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Get user default tax rate
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const defaultTaxRate = user.tax_rate !== undefined ? parseFloat(user.tax_rate) : 18;

  // Invoice Header
  const [formData, setFormData] = useState({
    client_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    tax_rate: defaultTaxRate,
    status: 'Draft',
    notes: ''
  });

  // Invoice Items
  const [items, setItems] = useState([
    { description: '', quantity: 1, unit_price: 0 }
  ]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await clientService.getClients();
        if (res.status === 'success') setClients(res.data);
      } catch (err) {
        console.error("Failed to fetch clients", err);
      }
    };
    fetchClients();
  }, []);

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

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const subtotal = calculateSubtotal();
  const taxAmount = (subtotal * formData.tax_rate) / 100;
  const total = subtotal + taxAmount;

  const isFormValid = () => {
    return (
      formData.client_id !== '' &&
      items.length > 0 &&
      items.every(item => item.description.trim() !== '' && item.quantity > 0 && item.unit_price >= 0)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setLoading(true);
    try {
      const payload = {
        ...formData,
        items
      };
      const res = await invoiceService.createInvoice(payload);
      if (res.status === 'success') {
        setSuccess(true);
        setTimeout(() => {
          navigate(`/invoices/${res.invoice_id}`);
        }, 1500);
      }
    } catch (err) {
      console.error("CREATE INVOICE ERROR:", err);
      alert(err.response?.data?.message || 'Error creating invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Header Action Bar */}
          <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New Invoice</h1>
              <p className="text-sm text-gray-500">Fill in the details below to generate a professional invoice.</p>
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => navigate('/invoices')}
                className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !isFormValid() || success}
                className={`px-8 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 ${
                  success ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {success ? 'Success!' : loading ? 'Processing...' : 'Generate Invoice'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT COLUMN: Details and Items */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Section: Invoice Details */}
              <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center mb-6 space-x-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">1</div>
                  <h2 className="text-lg font-bold text-gray-800">Invoice Details</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-full">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Select Client</label>
                    <select
                      required
                      className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      value={formData.client_id}
                      onChange={(e) => setFormData({...formData, client_id: e.target.value})}
                    >
                      <option value="">Choose a client...</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Issue Date</label>
                    <input
                      type="date"
                      required
                      className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      value={formData.issue_date}
                      onChange={(e) => setFormData({...formData, issue_date: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Due Date</label>
                    <input
                      type="date"
                      required
                      className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      value={formData.due_date}
                      onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                    />
                  </div>

                  <div className="col-span-full">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                    <textarea
                      placeholder="Additional information (e.g. Bank details, shipping info)"
                      className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all h-24"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Section: Line Items */}
              <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">2</div>
                    <h2 className="text-lg font-bold text-gray-800">Line Items</h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-blue-600 font-bold flex items-center hover:text-blue-800 bg-blue-50 px-4 py-2 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                    Add Row
                  </button>
                </div>

                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-start animate-in fade-in slide-in-from-left-2 duration-300">
                      <div className="col-span-6">
                        <input
                          type="text"
                          placeholder="Description (e.g. Logo Design)"
                          required
                          className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-blue-500"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="Qty"
                          min="1"
                          required
                          className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-blue-500 text-center"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          placeholder="Price"
                          min="0"
                          required
                          className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-blue-500"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-1 flex justify-center pt-3">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-400 hover:text-red-600 transition-colors"
                          disabled={items.length === 1}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Summary */}
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm sticky top-24">
                <div className="flex items-center mb-6 space-x-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">3</div>
                  <h2 className="text-lg font-bold text-gray-800">Summary</h2>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  
                  <div className="space-y-2 pb-4 border-b">
                    <label className="text-xs font-bold text-gray-400 uppercase">Tax Rate (%)</label>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-gray-200 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.tax_rate}
                      onChange={(e) => setFormData({...formData, tax_rate: e.target.value})}
                    />
                    <div className="flex justify-between text-gray-600 text-sm">
                      <span>Calculated Tax</span>
                      <span>{formatCurrency(taxAmount)}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-gray-900 font-bold text-lg">Grand Total</span>
                    </div>
                    <div className="text-3xl font-black text-blue-600">
                      {formatCurrency(total)}
                    </div>
                  </div>
                </div>

                {!isFormValid() && (
                  <div className="mt-6 p-3 bg-yellow-50 text-yellow-700 text-xs rounded-lg border border-yellow-100">
                    Please select a client and provide descriptions for all items.
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CreateInvoice;

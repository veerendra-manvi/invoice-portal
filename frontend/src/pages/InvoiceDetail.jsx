import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { API_BASE_URL } from '../config/api';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency } from '../utils/formatCurrency';

const InvoiceDetail = () => {
  const { id: invoiceId } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [items, setItems] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  useEffect(() => {
    fetchData();
  }, [invoiceId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !user.id) {
          window.location.href = "/login";
          return;
      }

      const response = await axios.get(
          `${API_BASE_URL}/invoices.php?action=get&id=${invoiceId}&user_id=${user.id}`
      );

      if (response.data.status === 'success') {
        setInvoice(response.data.data.invoice);
        setItems(response.data.data.items);
        
        const payRes = await axios.get(
          `${API_BASE_URL}/payments.php?invoice_id=${invoiceId}&user_id=${user.id}`
        );
        if (payRes.data.status === 'success') {
          setPayments(payRes.data.data);
        }
      } else {
        setError(response.data.message || 'Invoice not found');
      }
    } catch (err) {
      console.error(err.response?.data || err.message);
      setError(err.response?.data?.message || 'Error loading invoice.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const formData = new FormData();
      formData.append('id', invoiceId);
      formData.append('status', newStatus);
      formData.append('user_id', user.id);
      formData.append('action', 'update_status');

      const res = await axios.post(`${API_BASE_URL}/invoices.php`, formData);
      if (res.data.status === 'success') {
        fetchData();
      }
    } catch (err) {
      console.error("UPDATE STATUS ERROR:", err);
      alert(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const formData = new FormData();
      formData.append('id', invoiceId);
      formData.append('user_id', user.id);
      formData.append('action', 'delete');

      const res = await axios.post(`${API_BASE_URL}/invoices.php`, formData);
      if (res.data.status === 'success') {
        navigate('/invoices');
      }
    } catch (err) {
      console.error("DELETE ERROR:", err);
      alert(err.response?.data?.message || 'Failed to delete invoice.');
    }
  };

  const downloadPDF = async () => {
    const element = document.getElementById("invoice-container");
    if (!element) {
      alert("Invoice container not found");
      return;
    }

    setIsGeneratingPDF(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: true
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgScaledWidth = imgWidth * ratio;
      const imgScaledHeight = imgHeight * ratio;

      // Handle multi-page (simple approach)
      let heightLeft = imgScaledHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgScaledWidth, imgScaledHeight);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgScaledHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgScaledWidth, imgScaledHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`Invoice_${invoice.invoice_number}.pdf`);
    } catch (err) {
      console.error("PDF ERROR:", err);
      alert("Failed to generate PDF. Check console for details.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) return;

    setIsSubmittingPayment(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const res = await axios.post(`${API_BASE_URL}/payments.php`, {
        invoice_id: invoiceId,
        amount: amount,
        payment_date: new Date().toISOString().split('T')[0],
        method: 'Cash',
        user_id: user.id
      });

      if (res.data.status === 'success') {
        setPaymentAmount('');
        fetchData();
      }
    } catch (err) {
      console.error("PAYMENT ERROR:", err);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const balance = invoice ? parseFloat(invoice.total) - totalPaid : 0;

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  if (error || !invoice) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
        <p className="text-gray-600 mb-6">{error || 'Invoice not found'}</p>
        <button onClick={() => navigate('/invoices')} className="text-blue-600 font-semibold hover:underline">Back to Invoices</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-container, #invoice-container * { visibility: visible; }
          #invoice-container { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            background: white !important;
            border: none !important;
            box-shadow: none !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="no-print mb-8 flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate('/invoices')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{invoice.invoice_number}</h1>
            <StatusBadge status={invoice.status} />
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={() => navigate(`/invoices/edit/${invoiceId}`)} className="bg-blue-50 text-blue-600 px-5 py-2.5 rounded-xl font-bold hover:bg-blue-100 transition-all">Edit</button>
            <button onClick={handleDelete} className="bg-red-50 text-red-600 px-5 py-2.5 rounded-xl font-bold hover:bg-red-100 transition-all">Delete</button>
            <button onClick={() => window.print()} className="bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-xl font-bold hover:bg-gray-50 transition-all">Print</button>
            <button 
              onClick={downloadPDF} 
              disabled={isGeneratingPDF}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {isGeneratingPDF ? 'Downloading...' : 'Download PDF'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div id="invoice-container" className="bg-white p-16 rounded-2xl shadow-sm border border-gray-100">
              {/* Header */}
              <div className="flex justify-between items-start mb-16">
                <div>
                  <h2 className="text-4xl font-black text-blue-600 mb-1">Invoice Portal</h2>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Professional Billing</p>
                </div>
                <div className="text-right">
                  <h3 className="text-2xl font-black text-gray-900 mb-1 uppercase tracking-tighter">INVOICE</h3>
                  <p className="text-gray-500 font-bold">{invoice.invoice_number}</p>
                  <div className="mt-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      invoice.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {invoice.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Billing Info */}
              <div className="grid grid-cols-2 gap-16 mb-16">
                <div>
                  <p className="text-[10px] uppercase text-gray-400 font-black tracking-widest mb-4">Billed To</p>
                  <p className="text-xl font-black text-gray-900 mb-1">{invoice.client_name}</p>
                  <p className="text-gray-600 font-medium">{invoice.client_email}</p>
                  <p className="text-gray-600 font-medium">{invoice.client_phone}</p>
                  <p className="text-gray-500 mt-4 leading-relaxed text-sm">{invoice.client_address || 'No address provided'}</p>
                </div>
                <div className="text-right flex flex-col justify-end">
                  <div className="space-y-3">
                    <div className="flex justify-end space-x-6">
                      <span className="text-[10px] uppercase text-gray-400 font-black tracking-widest">Issue Date</span>
                      <span className="text-sm font-bold text-gray-900">{invoice.issue_date}</span>
                    </div>
                    <div className="flex justify-end space-x-6">
                      <span className="text-[10px] uppercase text-gray-400 font-black tracking-widest">Due Date</span>
                      <span className="text-sm font-bold text-red-600">{invoice.due_date}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full mb-16">
                <thead>
                  <tr className="border-b-2 border-gray-900 text-left">
                    <th className="pb-4 text-[10px] uppercase text-gray-900 font-black tracking-widest">Description</th>
                    <th className="pb-4 text-[10px] uppercase text-gray-900 font-black tracking-widest text-center w-24">Qty</th>
                    <th className="pb-4 text-[10px] uppercase text-gray-900 font-black tracking-widest text-right w-32">Price</th>
                    <th className="pb-4 text-[10px] uppercase text-gray-900 font-black tracking-widest text-right w-32">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td className="py-6 text-sm font-bold text-gray-800">{item.description}</td>
                      <td className="py-6 text-sm font-medium text-gray-600 text-center">{item.quantity}</td>
                      <td className="py-6 text-sm font-medium text-gray-600 text-right">{formatCurrency(item.unit_price)}</td>
                      <td className="py-6 text-sm font-black text-gray-900 text-right">{formatCurrency(item.total_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Financials */}
              <div className="flex justify-end">
                <div className="w-72 space-y-4">
                  <div className="flex justify-between text-gray-500 text-sm">
                    <span className="font-bold">Subtotal</span>
                    <span className="font-black text-gray-900">{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 text-sm">
                    <span className="font-bold">Tax ({invoice.tax_rate}%)</span>
                    <span className="font-black text-gray-900">{formatCurrency(invoice.total - invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-2xl font-black text-blue-600 pt-6 border-t-4 border-gray-900">
                    <span>Grand Total</span>
                    <span>{formatCurrency(invoice.total)}</span>
                  </div>
                  <div className="space-y-1 pt-2">
                    <div className="flex justify-between text-[10px] font-black text-green-600 uppercase tracking-widest">
                      <span>Amount Paid</span>
                      <span>{formatCurrency(totalPaid)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-black text-red-600 uppercase tracking-widest">
                      <span>Balance Due</span>
                      <span>{formatCurrency(balance)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {invoice.notes && (
                <div className="mt-20 pt-10 border-t border-gray-100">
                  <p className="text-[10px] uppercase text-gray-400 font-black tracking-widest mb-4">Additional Notes</p>
                  <p className="text-sm text-gray-600 leading-relaxed italic">{invoice.notes}</p>
                </div>
              )}

              {/* Footer */}
              <div className="mt-20 text-center">
                <p className="text-lg font-black text-gray-900">Thank you for your business!</p>
                <p className="text-gray-400 text-[10px] uppercase tracking-widest mt-2">Invoice Portal &copy; 2026</p>
              </div>
            </div>

            {/* Payment History (Screen Only) */}
            <div className="no-print bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-8">
                <div className="px-8 py-5 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-black text-gray-900 uppercase tracking-tighter">Payment History</h3>
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{payments.length} Records</span>
                </div>
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/50 text-[10px] uppercase text-gray-400 font-black tracking-widest border-b border-gray-100">
                            <th className="px-8 py-4">Date</th>
                            <th className="px-8 py-4">Method</th>
                            <th className="px-8 py-4 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {payments.length > 0 ? payments.map((p, i) => (
                            <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-8 py-4 text-sm font-bold text-gray-700">{p.payment_date}</td>
                                <td className="px-8 py-4 text-sm font-medium text-gray-500">{p.payment_method || 'Cash'}</td>
                                <td className="px-8 py-4 text-sm font-black text-green-600 text-right">{formatCurrency(p.amount)}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="3" className="px-8 py-12 text-center text-gray-400 font-medium italic">No payments recorded.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
          </div>

          {/* Sidebars (Screen Only) */}
          <div className="no-print space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-black text-gray-900 mb-6 uppercase tracking-tighter">Status</h3>
              <div className="grid grid-cols-1 gap-3">
                {['Draft', 'Pending', 'Paid', 'Overdue', 'Cancelled'].map(s => (
                  <button 
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className={`py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${invoice.status === s ? 'bg-blue-600 text-white shadow-xl scale-[1.02]' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-black text-gray-900 mb-6 uppercase tracking-tighter">Record Payment</h3>
              <form onSubmit={handleRecordPayment} className="space-y-6">
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Amount (INR)</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black">₹</span>
                        <input
                            type="number"
                            step="0.01"
                            max={balance}
                            placeholder="0.00"
                            className="w-full pl-8 pr-4 py-4 rounded-xl border-2 border-gray-50 bg-gray-50 outline-none focus:border-blue-600 focus:bg-white font-black text-lg transition-all"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                        />
                    </div>
                </div>
                <button 
                  type="submit" 
                  disabled={isSubmittingPayment || !paymentAmount || balance <= 0} 
                  className="w-full bg-green-600 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-green-200 hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmittingPayment ? 'Processing...' : 'Record Payment'}
                </button>
                {balance <= 0 && <p className="text-[10px] text-center text-green-600 font-black uppercase tracking-widest mt-4">Payment Complete</p>}
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InvoiceDetail;

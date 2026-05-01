import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    business_name: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await api.post('/auth.php?action=register', formData);

      if (response.data.status === 'success') {
        setSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(response.data.message || 'Registration failed');
      }
    } catch (err) {
      console.error("REGISTRATION ERROR:", err);
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed. Please check your connection.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-xl border border-gray-100">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Create Account</h1>
          <p className="mt-2 text-gray-500">Join the Invoice Portal community</p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-200 animate-in fade-in slide-in-from-top-1">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-xl bg-green-50 p-4 text-sm text-green-700 border border-green-200 animate-in fade-in slide-in-from-top-1">
            {success}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700 uppercase tracking-wider ml-1">Full Name</label>
            <input
              type="text"
              required
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700 uppercase tracking-wider ml-1">Business Name</label>
            <input
              type="text"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              placeholder="Doe Design Studio"
              value={formData.business_name}
              onChange={(e) => setFormData({...formData, business_name: e.target.value})}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700 uppercase tracking-wider ml-1">Email Address</label>
            <input
              type="email"
              required
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700 uppercase tracking-wider ml-1">Password</label>
            <input
              type="password"
              required
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !!success}
            className={`w-full rounded-xl bg-blue-600 px-4 py-4 font-black text-white uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/30 transform active:scale-95 transition-all ${
              loading || success ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm">
          <span className="text-gray-500">Already have an account? </span>
          <Link to="/login" className="font-bold text-blue-600 hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;

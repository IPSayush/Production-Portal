import { useState } from 'react';
import { Link, useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiUser, FiLock } from 'react-icons/fi';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') === 'viewer' ? 'viewer' : 'manager';
  const navigate = useNavigate();
  const { login, error, loading, isAuthenticated, isManager } = useAuth();

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  // If already logged in, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to={isManager ? '/manager/home' : '/viewer/home'} replace />;
  }

  const isManagerRole = role === 'manager';
  const title = isManagerRole ? 'Manager Login' : 'Viewer Login';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    try {
      const user = await login(userId.trim(), password, role);
      if (user.role === 'manager') {
        navigate('/manager/home');
      } else {
        navigate('/viewer/home');
      }
    } catch (err) {
      setLocalError(err.response?.data?.message || 'Invalid credentials');
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-slate-800 mb-1 text-center">{title}</h1>
        <p className="text-sm text-slate-500 mb-8 text-center">Enter your credentials to continue</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">User ID</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="text-slate-400" />
                </div>
                <input
                type="text"
                inputMode="numeric"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                required
                autoComplete="username"
                placeholder="Enter ID"
                />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Password</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="text-slate-400" />
                </div>
                <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                required
                autoComplete="current-password"
                placeholder="Enter password"
                />
            </div>
          </div>

          {displayError && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl text-center border border-red-100">{displayError}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white px-4 py-3 rounded-xl hover:bg-primary-700 text-sm font-semibold shadow-md shadow-primary-200 disabled:opacity-50 transition-all"
          >
            Login Securely
          </button>
        </form>

        <Link
          to="/landing"
          className="block text-center text-sm text-slate-500 mt-6 hover:text-primary-600"
        >
          ← Back to home
        </Link>
      </div>

      {loading && <LoadingSpinner fullScreen />}
    </div>
  );
}
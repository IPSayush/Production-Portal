import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') === 'viewer' ? 'viewer' : 'manager';
  const navigate = useNavigate();
  const { login, error, loading } = useAuth();

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const isManager = role === 'manager';
  const title = isManager ? 'Production Manager Login' : 'Viewer Login';

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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-800 mb-6 text-center">{title}</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone / ID</label>
            <input
              type="text"
              inputMode="numeric"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              required
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              required
              autoComplete="current-password"
            />
          </div>

          {displayError && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{displayError}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-800 text-sm font-medium disabled:opacity-50"
          >
            Login
          </button>
        </form>

        <Link
          to="/landing"
          className="block text-center text-sm text-gray-500 mt-4 hover:text-gray-700"
        >
          ← Back to home
        </Link>
      </div>

      {loading && <LoadingSpinner fullScreen />}
    </div>
  );
}

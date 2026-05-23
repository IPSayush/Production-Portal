import { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import SheetCard from '../components/SheetCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { sheetsApi } from '../api';
import { useAuth } from '../context/AuthContext';

export default function ViewerHome() {
  const { user } = useAuth();
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSheets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await sheetsApi.getAll();
      setSheets(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load sheets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSheets();
  }, [fetchSheets]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header subtitle={user?.name ? `Welcome, ${user.name}` : undefined} />

      <main className="max-w-2xl mx-auto px-4 py-6">
        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>
        )}

        {loading ? (
          <LoadingSpinner />
        ) : sheets.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No sheets available.</p>
        ) : (
          <div className="space-y-3">
            {sheets.map((sheet) => (
              <SheetCard key={sheet._id} sheet={sheet} isManager={false} />
            ))}
          </div>
        )}
      </main>

    </div>
  );
}

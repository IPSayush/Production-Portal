import { useState, useEffect, useCallback } from 'react';
import { FiPlus } from 'react-icons/fi';
import Header from '../components/Header';
import SheetCard from '../components/SheetCard';
import CreateSheetWizard from '../components/CreateSheetWizard';
import DeleteModal from '../components/DeleteModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { sheetsApi } from '../api';

export default function ManagerHome() {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

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

  const handleDeleteSheet = async (password) => {
    await sheetsApi.delete(deleteTarget._id, password);
    setSheets((prev) => prev.filter((s) => s._id !== deleteTarget._id));
    setDeleteTarget(null);
  };

  const handleSheetUpdate = (updated) => {
    setSheets((prev) =>
      prev.map((s) => (s._id === updated._id ? { ...s, ...updated } : s))
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-6">
        <button
          type="button"
          onClick={() => setWizardOpen(true)}
          className="w-full flex items-center justify-center gap-2 bg-slate-700 text-white px-4 py-3 rounded-lg hover:bg-slate-800 text-sm font-medium mb-6"
        >
          <FiPlus className="w-5 h-5" />
          Create New Sheet
        </button>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>
        )}

        {loading ? (
          <LoadingSpinner />
        ) : sheets.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No sheets yet. Create your first sheet.</p>
        ) : (
          <div className="space-y-3">
            {sheets.map((sheet) => (
              <SheetCard
                key={sheet._id}
                sheet={sheet}
                isManager
                onDelete={setDeleteTarget}
                onUpdate={handleSheetUpdate}
              />
            ))}
          </div>
        )}
      </main>

      <CreateSheetWizard isOpen={wizardOpen} onClose={() => setWizardOpen(false)} />

      <DeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteSheet}
        itemType="sheet"
      />
    </div>
  );
}

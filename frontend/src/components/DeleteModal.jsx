import { useState } from 'react';

export default function DeleteModal({ isOpen, onClose, onConfirm, itemType }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onConfirm(password);
      setPassword('');
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete';
      setError(msg === 'Incorrect password' ? 'Incorrect password' : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
      <div
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 shadow-2xl sm:relative sm:bottom-auto sm:left-auto sm:right-auto sm:rounded-xl sm:max-w-sm sm:w-full sm:mx-4 sm:shadow-xl"
        role="dialog"
        aria-modal="true"
      >
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Confirm Delete</h2>
        <p className="text-sm text-gray-500 mb-4">
          Enter your password to delete this {itemType}.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full border border-gray-200 rounded-lg px-3 py-3 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-slate-500 min-h-[44px]"
            required
            autoFocus
          />
          {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
          <div className="flex gap-2 justify-end mt-4">
            <button
              type="button"
              onClick={handleClose}
              className="border border-gray-300 text-gray-600 px-4 py-3 rounded-lg hover:bg-gray-50 text-sm min-h-[44px]"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-red-500 text-white px-4 py-3 rounded-lg hover:bg-red-600 text-sm min-h-[44px] min-w-[100px] disabled:opacity-50"
              disabled={loading || !password}
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

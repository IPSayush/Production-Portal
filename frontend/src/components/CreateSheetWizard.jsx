import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX } from 'react-icons/fi';
import { sheetsApi } from '../api';
import LoadingSpinner from './LoadingSpinner';

function getColumnLetters(count) {
  const letters = [];
  for (let i = 0; i < count; i++) {
    letters.push(String.fromCharCode(65 + i));
  }
  return letters;
}

export default function CreateSheetWizard({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [columnCount, setColumnCount] = useState(0);
  const [columnNames, setColumnNames] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const letters = getColumnLetters(columnCount);
  const progress = step === 1 ? 50 : 100;

  const reset = () => {
    setStep(1);
    setTitle('');
    setColumnCount(0);
    setColumnNames({});
    setError('');
    setSuccess(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCreate = async () => {
    setLoading(true);
    setError('');
    try {
      const customColumns = letters.map((letter) => {
        const custom = columnNames[letter]?.trim();
        return custom || letter;
      });

      const res = await sheetsApi.create({ title: title.trim(), customColumns });
      setSuccess(true);
      setTimeout(() => {
        handleClose();
        navigate(`/sheet/${res.data._id}`);
      }, 800);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create sheet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Create New Sheet</h2>
          <button type="button" onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Step {step} of 2</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {success && (
          <div className="bg-green-50 text-green-700 text-sm px-3 py-2 rounded-lg mb-4">
            Sheet created!
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-500 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>
        )}

        {step === 1 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter product name / sheet title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Product name"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 mb-4"
            />
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!title.trim()}
              className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <p className="text-sm text-gray-600 mb-3">
              Fixed columns: Date, Quantity, Description (auto-added)
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How many additional columns do you need? (A, B, C...)
            </label>
            <div className="flex items-center gap-3 mb-4">
              <button
                type="button"
                onClick={() => setColumnCount(Math.max(0, columnCount - 1))}
                className="border border-gray-300 text-gray-600 w-10 h-10 rounded-lg hover:bg-gray-50 text-lg"
              >
                −
              </button>
              <span className="text-lg font-medium w-8 text-center">{columnCount}</span>
              <button
                type="button"
                onClick={() => setColumnCount(Math.min(26, columnCount + 1))}
                className="border border-gray-300 text-gray-600 w-10 h-10 rounded-lg hover:bg-gray-50 text-lg"
              >
                +
              </button>
            </div>

            {letters.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Preview: {letters.join(' ')}</p>
                <div className="space-y-2">
                  {letters.map((letter) => (
                    <div key={letter} className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600 w-6">{letter}</span>
                      <input
                        type="text"
                        placeholder={`Rename "${letter}" (optional)`}
                        value={columnNames[letter] || ''}
                        onChange={(e) =>
                          setColumnNames({ ...columnNames, [letter]: e.target.value })
                        }
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 border border-gray-300 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={loading}
                className="flex-1 bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-800 text-sm font-medium disabled:opacity-50"
              >
                Create Sheet →
              </button>
            </div>
          </div>
        )}

        {loading && <LoadingSpinner />}
      </div>
    </div>
  );
}

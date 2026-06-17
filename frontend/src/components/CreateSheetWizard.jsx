import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX } from 'react-icons/fi';
import { sheetsApi } from '../api';
import ImageUploadInput from './ImageUploadInput';

function getColumnLetters(count) {
  const letters = [];
  for (let i = 0; i < count; i++) {
    letters.push(String.fromCharCode(65 + i));
  }
  return letters;
}

export default function CreateSheetWizard({ isOpen, onClose, onCreated }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetQuantity, setTargetQuantity] = useState('');
  const [columnCount, setColumnCount] = useState(0);
  const [columnNames, setColumnNames] = useState({});
  const [imageUrl, setImageUrl] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const letters = getColumnLetters(columnCount);
  const progress = step === 1 ? 50 : 100;
  const descLen = description.length;

  const reset = () => {
    setStep(1);
    setTitle('');
    setDescription('');
    setTargetQuantity('');
    setColumnCount(0);
    setColumnNames({});
    setImageUrl('');
    setImageUploading(false);
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

      const payload = {
        title: title.trim(),
        description: description.trim(),
        imageUrl: imageUrl || '',
        customColumns,
      };
      if (targetQuantity !== '' && targetQuantity != null) {
        payload.targetQuantity = Math.max(0, Number(targetQuantity) || 0);
      }

      const res = await sheetsApi.create(payload);
      setSuccess(true);
      onCreated?.(res.data);
      setTimeout(() => {
        handleClose();
        navigate(`/sheet/${res.data._id}`);
      }, 600);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create sheet');
    } finally {
      setLoading(false);
    }
  };

  const panel = (
    <div className="bg-white sm:rounded-xl p-6 w-full sm:max-w-lg shadow-xl max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto min-h-[100dvh] sm:min-h-0">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Create New Sheet</h2>
        <button
          type="button"
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <FiX className="w-5 h-5" />
        </button>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Step {step} of 2</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-slate-700 transition-all" style={{ width: `${progress}%` }} />
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
            Sheet Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Product name / sheet title"
            className="w-full border border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 mb-4 min-h-[44px]"
          />
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sheet Description <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) =>
              setDescription(e.target.value.slice(0, 300))
            }
            placeholder="Add a brief description of this sheet..."
            rows={3}
            maxLength={300}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 mb-1 resize-none"
          />
          <p className="text-xs text-gray-400 mb-4 text-right">{descLen} / 300</p>

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sheet Image <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <div className="mb-4">
            <ImageUploadInput
              value={imageUrl}
              onChange={setImageUrl}
              disabled={loading}
              onUploadingChange={setImageUploading}
            />
          </div>

          {imageUploading && (
            <p className="text-xs text-gray-500 mb-3 text-center">
              Please wait for image to upload
            </p>
          )}

          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={!title.trim() || imageUploading}
            className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg hover:bg-slate-800 text-sm font-medium disabled:opacity-50 min-h-[44px]"
            title={imageUploading ? 'Please wait for image to upload' : undefined}
          >
            Next →
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <section className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Set Target Quantity
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Total units to be produced for this sheet
            </p>
            <input
              type="number"
              min={0}
              value={targetQuantity}
              onChange={(e) => setTargetQuantity(e.target.value)}
              placeholder="e.g. 5000"
              className="w-full border border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 min-h-[44px]"
            />
          </section>

          <hr className="border-gray-200 mb-6" />

          <section>
            <p className="text-sm text-gray-600 mb-3">
              Fixed columns: Date, Quantity, Description (auto-added)
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How many additional columns? (A, B, C...)
            </label>
            <div className="flex items-center gap-3 mb-4">
              <button
                type="button"
                onClick={() => setColumnCount(Math.max(0, columnCount - 1))}
                className="border border-gray-300 text-gray-600 w-11 h-11 rounded-lg hover:bg-gray-50 text-lg min-w-[44px] min-h-[44px]"
              >
                −
              </button>
              <span className="text-lg font-medium w-8 text-center">{columnCount}</span>
              <button
                type="button"
                onClick={() => setColumnCount(Math.min(26, columnCount + 1))}
                className="border border-gray-300 text-gray-600 w-11 h-11 rounded-lg hover:bg-gray-50 text-lg min-w-[44px] min-h-[44px]"
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
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 min-h-[44px]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 border border-gray-300 text-gray-600 px-4 py-3 rounded-lg hover:bg-gray-50 text-sm min-h-[44px]"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={loading}
              className="flex-1 bg-slate-700 text-white px-4 py-3 rounded-lg hover:bg-slate-800 text-sm font-medium disabled:opacity-50 min-h-[44px]"
            >
              {loading ? 'Creating...' : 'Create Sheet →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-white sm:bg-black/40 z-50 flex sm:items-center sm:justify-center sm:px-4">
      {panel}
    </div>
  );
}

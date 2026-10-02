import { useState } from 'react';
import { FiX } from 'react-icons/fi';
import { sheetsApi } from '../api';
import ImageUploadInput from './ImageUploadInput';

export default function AddItemModal({ isOpen, onClose, sheetId, onItemAdded }) {
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [size, setSize] = useState('');
  const [quality, setQuality] = useState('');
  const [targetQuantity, setTargetQuantity] = useState('');
  const [workerCount, setWorkerCount] = useState(0);
  const [workerNames, setWorkerNames] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const reset = () => {
    setName('');
    setImageUrl('');
    setSize('');
    setQuality('');
    setTargetQuantity('');
    setWorkerCount(0);
    setWorkerNames({});
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Item name is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const workerColumns = [];
      for (let i = 0; i < workerCount; i++) {
        const wn = workerNames[i]?.trim();
        workerColumns.push(wn || `Worker ${i + 1}`);
      }

      const res = await sheetsApi.addItem(sheetId, {
        name: name.trim(),
        imageUrl: imageUrl || '',
        size: size || '',
        quality: quality || '',
        workerColumns,
        targetQuantity: targetQuantity !== '' ? Number(targetQuantity) || 0 : 0,
      });

      onItemAdded(res.data);
      reset();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white sm:bg-black/40 z-50 flex sm:items-center sm:justify-center sm:px-4">
      <div className="bg-white sm:rounded-xl p-6 w-full sm:max-w-md shadow-xl max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto min-h-[100dvh] sm:min-h-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Add New Item</h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>
        )}

        {/* Item Name */}
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Item Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Cotton Shirt"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 mb-3 min-h-[44px]"
        />

        {/* Item Image */}
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Item Photo <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <div className="mb-3">
          <ImageUploadInput
            value={imageUrl}
            onChange={setImageUrl}
            disabled={loading}
            compact
          />
        </div>

        {/* Size & Quality */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Size</label>
            <input
              type="text"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="e.g. L, XL, Free"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 min-h-[44px]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Quality</label>
            <input
              type="text"
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              placeholder="e.g. Premium, A-Grade"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 min-h-[44px]"
            />
          </div>
        </div>

        {/* Target Quantity */}
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Target Quantity</label>
        <input
          type="number"
          min={0}
          value={targetQuantity}
          onChange={(e) => setTargetQuantity(e.target.value)}
          placeholder="e.g. 5000"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 mb-3 min-h-[44px]"
        />

        {/* Worker Columns */}
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Worker Columns <span className="text-gray-400 font-normal">(for data entry)</span>
        </label>
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            onClick={() => setWorkerCount(Math.max(0, workerCount - 1))}
            className="border border-gray-300 text-gray-600 w-9 h-9 rounded-lg hover:bg-gray-100 text-base min-w-[36px] min-h-[36px]"
          >
            −
          </button>
          <span className="text-sm font-medium w-6 text-center">{workerCount}</span>
          <button
            type="button"
            onClick={() => setWorkerCount(Math.min(20, workerCount + 1))}
            className="border border-gray-300 text-gray-600 w-9 h-9 rounded-lg hover:bg-gray-100 text-base min-w-[36px] min-h-[36px]"
          >
            +
          </button>
        </div>
        {workerCount > 0 && (
          <div className="space-y-1.5 mb-3">
            {Array.from({ length: workerCount }).map((_, i) => (
              <input
                key={i}
                type="text"
                placeholder={`Worker ${i + 1} name`}
                value={workerNames[i] || ''}
                onChange={(e) =>
                  setWorkerNames((prev) => ({ ...prev, [i]: e.target.value }))
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 min-h-[36px]"
              />
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 border border-gray-300 text-gray-600 px-4 py-3 rounded-lg hover:bg-gray-50 text-sm min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !name.trim()}
            className="flex-1 bg-slate-700 text-white px-4 py-3 rounded-lg hover:bg-slate-800 text-sm font-medium disabled:opacity-50 min-h-[44px]"
          >
            {loading ? 'Adding...' : 'Add Item'}
          </button>
        </div>
      </div>
    </div>
  );
}

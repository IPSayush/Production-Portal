import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiPlus, FiTrash2, FiImage } from 'react-icons/fi';
import { sheetsApi } from '../api';
import ImageUploadInput from './ImageUploadInput';

function emptyItem() {
  return {
    _tempId: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: '',
    imageUrl: '',
    size: '',
    quality: '',
    workerColumns: [],
    targetQuantity: '',
    _workerCount: 0,
    _workerNames: {},
  };
}

export default function CreateSheetWizard({ isOpen, onClose, onCreated }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [items, setItems] = useState([emptyItem()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const progress = step === 1 ? 50 : 100;
  const descLen = description.length;

  const reset = () => {
    setStep(1);
    setTitle('');
    setDescription('');
    setImageUrl('');
    setImageUploading(false);
    setItems([emptyItem()]);
    setError('');
    setSuccess(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const updateItem = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const addItem = () => {
    setItems((prev) => [...prev, emptyItem()]);
  };

  const removeItem = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateWorkerCount = (index, count) => {
    const clamped = Math.min(20, Math.max(0, count));
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, _workerCount: clamped } : item))
    );
  };

  const updateWorkerName = (itemIndex, workerIndex, name) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== itemIndex) return item;
        return {
          ...item,
          _workerNames: { ...item._workerNames, [workerIndex]: name },
        };
      })
    );
  };

  const handleCreate = async () => {
    setLoading(true);
    setError('');
    try {
      // Build items payload
      const itemsPayload = items
        .filter((item) => item.name.trim())
        .map((item) => {
          const workerColumns = [];
          for (let w = 0; w < item._workerCount; w++) {
            const name = item._workerNames[w]?.trim();
            workerColumns.push(name || `Worker ${w + 1}`);
          }
          return {
            name: item.name.trim(),
            imageUrl: item.imageUrl || '',
            size: item.size || '',
            quality: item.quality || '',
            workerColumns,
            targetQuantity: item.targetQuantity !== '' ? Number(item.targetQuantity) || 0 : 0,
          };
        });

      if (itemsPayload.length === 0) {
        setError('Please add at least one item with a name');
        setLoading(false);
        return;
      }

      const payload = {
        title: title.trim(),
        description: description.trim(),
        imageUrl: imageUrl || '',
        items: itemsPayload,
      };

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
            Next → Add Items
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <p className="text-sm text-gray-600 mb-4">
            Add items/products to this sheet. Each item can have its own photo, size, quality, target quantity, and worker columns.
          </p>

          <div className="space-y-4 mb-4">
            {items.map((item, idx) => (
              <div
                key={item._tempId}
                className="border border-gray-200 rounded-lg p-4 relative bg-gray-50"
              >
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1"
                    title="Remove item"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                )}

                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Item #{idx + 1}
                </p>

                {/* Item Name */}
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateItem(idx, 'name', e.target.value)}
                  placeholder="Item name *"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 mb-2 min-h-[44px] bg-white"
                />

                {/* Item Image */}
                <div className="mb-2">
                  <ImageUploadInput
                    value={item.imageUrl}
                    onChange={(url) => updateItem(idx, 'imageUrl', url)}
                    disabled={loading}
                    compact
                  />
                </div>

                {/* Size & Quality */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input
                    type="text"
                    value={item.size}
                    onChange={(e) => updateItem(idx, 'size', e.target.value)}
                    placeholder="Size (e.g. L, XL)"
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 min-h-[44px] bg-white"
                  />
                  <input
                    type="text"
                    value={item.quality}
                    onChange={(e) => updateItem(idx, 'quality', e.target.value)}
                    placeholder="Quality"
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 min-h-[44px] bg-white"
                  />
                </div>

                {/* Target Quantity */}
                <input
                  type="number"
                  min={0}
                  value={item.targetQuantity}
                  onChange={(e) => updateItem(idx, 'targetQuantity', e.target.value)}
                  placeholder="Target Quantity (e.g. 5000)"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 mb-2 min-h-[44px] bg-white"
                />

                {/* Worker Columns */}
                <div className="mt-2">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Worker Columns
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => updateWorkerCount(idx, item._workerCount - 1)}
                      className="border border-gray-300 text-gray-600 w-9 h-9 rounded-lg hover:bg-gray-100 text-base min-w-[36px] min-h-[36px]"
                    >
                      −
                    </button>
                    <span className="text-sm font-medium w-6 text-center">
                      {item._workerCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateWorkerCount(idx, item._workerCount + 1)}
                      className="border border-gray-300 text-gray-600 w-9 h-9 rounded-lg hover:bg-gray-100 text-base min-w-[36px] min-h-[36px]"
                    >
                      +
                    </button>
                  </div>
                  {item._workerCount > 0 && (
                    <div className="space-y-1">
                      {Array.from({ length: item._workerCount }).map((_, wi) => (
                        <input
                          key={wi}
                          type="text"
                          placeholder={`Worker ${wi + 1} name`}
                          value={item._workerNames[wi] || ''}
                          onChange={(e) => updateWorkerName(idx, wi, e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white min-h-[36px]"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addItem}
            className="w-full border-2 border-dashed border-gray-300 text-gray-500 rounded-lg py-3 text-sm font-medium hover:bg-gray-50 hover:border-gray-400 flex items-center justify-center gap-2 mb-4 min-h-[44px]"
          >
            <FiPlus className="w-4 h-4" /> Add Another Item
          </button>

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
              disabled={loading || items.every((i) => !i.name.trim())}
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

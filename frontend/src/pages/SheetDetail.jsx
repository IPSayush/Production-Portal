import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiCheck,
  FiX,
  FiCamera,
  FiPackage,
  FiCheckCircle,
  FiCircle,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import DeleteModal from '../components/DeleteModal';
import ImageUploadInput from '../components/ImageUploadInput';
import LoadingSpinner from '../components/LoadingSpinner';
import TopProgressBar from '../components/TopProgressBar';
import StatusBadge from '../components/StatusBadge';
import AddItemModal from '../components/AddItemModal';
import { sheetsApi } from '../api';
import { useSheets } from '../context/SheetsContext';

export default function SheetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isManager, role } = useAuth();
  const { updateSheetInCache } = useSheets();

  const [sheet, setSheet] = useState(null);
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState('Upcoming');
  const [loading, setLoading] = useState(true);
  const [bgLoading, setBgLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingDescription, setEditingDescription] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [editImageUrl, setEditImageUrl] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [savingImage, setSavingImage] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);

  const homePath = role === 'manager' ? '/manager/home' : '/viewer/home';

  const totalTarget = useMemo(
    () => items.reduce((s, i) => s + (i.targetQuantity || 0), 0),
    [items]
  );
  const totalAchieved = useMemo(
    () => items.reduce((s, i) => s + (i.achievedQuantity || 0), 0),
    [items]
  );
  const completedItems = useMemo(
    () => items.filter((i) => i.isCompleted).length,
    [items]
  );
  const progressPct = totalTarget > 0
    ? Math.min(100, Math.round((totalAchieved / totalTarget) * 100))
    : 0;

  const fetchSheet = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await sheetsApi.getOne(id);
      const data = res.data;
      setSheet(data);
      setTitle(data.title);
      setDescription(data.description || '');
      setEditDescription(data.description || '');
      setImageUrl(data.imageUrl || '');
      setStatus(data.status || 'Upcoming');
      setItems(data.items || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load sheet');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSheet();
  }, [fetchSheet]);

  const handleBack = useCallback(() => {
    navigate(homePath);
  }, [navigate, homePath]);

  const handleStatusChange = useCallback(
    async (newStatus) => {
      const prev = status;
      setStatus(newStatus);
      try {
        const res = await sheetsApi.updateStatus(id, newStatus);
        setSheet((s) => ({ ...s, status: newStatus }));
        updateSheetInCache(res.data);
      } catch {
        setStatus(prev);
      }
    },
    [id, status, updateSheetInCache]
  );

  const openImageModal = () => {
    setEditImageUrl(imageUrl);
    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
    setEditImageUrl('');
    setImageUploading(false);
  };

  const handleSaveImage = async () => {
    if (imageUploading) return;
    setSavingImage(true);
    setBgLoading(true);
    try {
      await sheetsApi.update(id, { imageUrl: editImageUrl || '' });
      setImageUrl(editImageUrl || '');
      setSheet((s) => ({ ...s, imageUrl: editImageUrl || '' }));
      updateSheetInCache({ _id: id, imageUrl: editImageUrl || '' });
      closeImageModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update image');
    } finally {
      setSavingImage(false);
      setBgLoading(false);
    }
  };

  const handleRemoveImage = async () => {
    const confirmed = window.confirm('Remove the current sheet image?');
    if (!confirmed) return;
    setSavingImage(true);
    setBgLoading(true);
    try {
      await sheetsApi.update(id, { imageUrl: '' });
      setImageUrl('');
      setEditImageUrl('');
      setSheet((s) => ({ ...s, imageUrl: '' }));
      updateSheetInCache({ _id: id, imageUrl: '' });
      closeImageModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove image');
    } finally {
      setSavingImage(false);
      setBgLoading(false);
    }
  };

  const handleSaveDescription = async () => {
    const trimmed = editDescription.trim().slice(0, 300);
    setBgLoading(true);
    try {
      await sheetsApi.update(id, { description: trimmed });
      setDescription(trimmed);
      setSheet((s) => ({ ...s, description: trimmed }));
      updateSheetInCache({ _id: id, description: trimmed });
      setEditingDescription(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update description');
    } finally {
      setBgLoading(false);
    }
  };

  const handleDeleteItem = async (password) => {
    setBgLoading(true);
    try {
      await sheetsApi.deleteItem(id, deleteTarget._id, password);
      setItems((prev) => prev.filter((i) => i._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete item');
      throw err;
    } finally {
      setBgLoading(false);
    }
  };

  const handleItemAdded = (newItem) => {
    setItems((prev) => [...prev, newItem]);
    setAddItemOpen(false);
  };

  const handleToggleCompleted = async (item) => {
    const newVal = !item.isCompleted;
    setItems((prev) =>
      prev.map((i) => (i._id === item._id ? { ...i, isCompleted: newVal } : i))
    );
    try {
      await sheetsApi.updateItem(id, item._id, { isCompleted: newVal });
    } catch {
      setItems((prev) =>
        prev.map((i) => (i._id === item._id ? { ...i, isCompleted: !newVal } : i))
      );
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  if (error && !sheet) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            type="button"
            onClick={handleBack}
            className="text-sm text-slate-600 underline"
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopProgressBar loading={bgLoading} />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Go back"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-slate-800 truncate flex-1 text-center">
            {title}
          </h1>
          <div className="w-[44px]" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
        {/* Sheet Image */}
        {imageUrl ? (
          <div className="relative rounded-xl overflow-hidden mb-4 max-h-48">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-48 object-cover"
            />
            {isManager && (
              <button
                type="button"
                onClick={openImageModal}
                className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-lg hover:bg-black/70"
              >
                <FiCamera className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : isManager ? (
          <button
            type="button"
            onClick={openImageModal}
            className="w-full border-2 border-dashed border-gray-300 rounded-xl py-6 text-gray-400 text-sm hover:border-gray-400 hover:bg-gray-50 flex items-center justify-center gap-2 mb-4"
          >
            <FiCamera className="w-4 h-4" /> Add Sheet Image
          </button>
        ) : null}

        {/* Status & Description */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            {isManager ? (
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 min-h-[44px]"
              >
                <option value="Upcoming">Upcoming</option>
                <option value="Working">Working</option>
                <option value="Completed">Completed</option>
              </select>
            ) : (
              <StatusBadge status={status} />
            )}
          </div>

          {/* Description */}
          {editingDescription ? (
            <div className="mb-2">
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value.slice(0, 300))}
                rows={2}
                maxLength={300}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 resize-none"
              />
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-400">{editDescription.length}/300</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingDescription(false)}
                    className="p-1.5 text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDescription}
                    className="p-1.5 text-green-600 hover:text-green-700"
                  >
                    <FiCheck className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <p className="text-sm text-gray-600 flex-1">
                {description || (isManager ? 'No description. Click edit to add one.' : 'No description.')}
              </p>
              {isManager && (
                <button
                  type="button"
                  onClick={() => {
                    setEditDescription(description);
                    setEditingDescription(true);
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 shrink-0"
                >
                  <FiEdit2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Progress Summary */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-500">
                Items: {completedItems}/{items.length} completed
              </span>
              <span className="font-semibold text-slate-700">
                {totalAchieved.toLocaleString('en-IN')} / {totalTarget.toLocaleString('en-IN')} pcs
              </span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-700 rounded-full transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1 text-right">{progressPct}% complete</p>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>
        )}

        {/* Items Header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <FiPackage className="w-5 h-5" /> Items ({items.length})
          </h2>
          {isManager && (
            <button
              type="button"
              onClick={() => setAddItemOpen(true)}
              className="flex items-center gap-1.5 bg-slate-700 text-white px-4 py-2.5 rounded-lg hover:bg-slate-800 text-sm font-medium min-h-[44px]"
            >
              <FiPlus className="w-4 h-4" /> Add Item
            </button>
          )}
        </div>

        {/* Items List */}
        {items.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FiPackage className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm">No items in this sheet yet.</p>
            {isManager && <p className="text-xs text-gray-400 mt-1">Click "Add Item" to get started.</p>}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const pct =
                item.targetQuantity > 0
                  ? Math.min(100, Math.round((item.achievedQuantity / item.targetQuantity) * 100))
                  : 0;

              return (
                <div
                  key={item._id}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div
                    className="flex items-stretch cursor-pointer"
                    onClick={() => navigate(`/sheet/${id}/item/${item._id}`)}
                  >
                    {/* Item Image */}
                    {item.imageUrl ? (
                      <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 bg-gray-100">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 bg-gray-100 flex items-center justify-center">
                        <FiPackage className="w-8 h-8 text-gray-300" />
                      </div>
                    )}

                    {/* Item Info */}
                    <div className="flex-1 p-3 sm:p-4 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h3 className="font-semibold text-slate-800 text-sm sm:text-base truncate">
                          {item.name}
                        </h3>
                        {item.isCompleted ? (
                          <span className="shrink-0 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            ✓ Done
                          </span>
                        ) : (
                          <span className="shrink-0 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                            In Progress
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mb-2">
                        {item.size && <span>Size: {item.size}</span>}
                        {item.quality && <span>Quality: {item.quality}</span>}
                        <span>{item.rowCount || 0} entries</span>
                      </div>

                      {/* Progress bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              item.isCompleted ? 'bg-green-500' : 'bg-slate-600'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-500 w-12 text-right">
                          {item.achievedQuantity.toLocaleString('en-IN')}/{item.targetQuantity.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Manager actions */}
                  {isManager && (
                    <div className="border-t border-gray-100 px-3 py-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleCompleted(item);
                        }}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors min-h-[36px] flex items-center gap-1 ${
                          item.isCompleted
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {item.isCompleted ? (
                          <>
                            <FiCheckCircle className="w-3.5 h-3.5" /> Completed
                          </>
                        ) : (
                          <>
                            <FiCircle className="w-3.5 h-3.5" /> Mark Complete
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(item);
                        }}
                        className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                        title="Delete item"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Image Edit Modal */}
      {imageModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Sheet Image</h3>
            <ImageUploadInput
              value={editImageUrl}
              onChange={setEditImageUrl}
              disabled={savingImage}
              onUploadingChange={setImageUploading}
            />
            <div className="flex gap-2 mt-4">
              {imageUrl && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={savingImage}
                  className="flex-1 border border-red-200 text-red-600 px-3 py-2.5 rounded-lg text-sm hover:bg-red-50 disabled:opacity-50 min-h-[44px]"
                >
                  Remove
                </button>
              )}
              <button
                type="button"
                onClick={closeImageModal}
                className="flex-1 border border-gray-300 text-gray-600 px-3 py-2.5 rounded-lg text-sm hover:bg-gray-50 min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveImage}
                disabled={savingImage || imageUploading}
                className="flex-1 bg-slate-700 text-white px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 min-h-[44px]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={addItemOpen}
        onClose={() => setAddItemOpen(false)}
        sheetId={id}
        onItemAdded={handleItemAdded}
      />

      {/* Delete Item Modal */}
      <DeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteItem}
        itemType="item"
      />
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi';
import { formatSheetDate } from '../utils/dateUtils';
import { sheetsApi } from '../api';

export default function SheetCard({ sheet, isManager, onDelete, onUpdate }) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(sheet.title);
  const [saving, setSaving] = useState(false);

  const handleSaveTitle = async () => {
    if (!editTitle.trim() || editTitle.trim() === sheet.title) {
      setEditing(false);
      setEditTitle(sheet.title);
      return;
    }
    setSaving(true);
    try {
      await sheetsApi.update(sheet._id, { title: editTitle.trim() });
      onUpdate?.({ ...sheet, title: editTitle.trim() });
      setEditing(false);
    } catch {
      setEditTitle(sheet.title);
    } finally {
      setSaving(false);
    }
  };

  const rowLabel = sheet.rowCount === 1 ? '1 entry' : `${sheet.rowCount || 0} entries`;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-500"
                autoFocus
                disabled={saving}
              />
              <button
                type="button"
                onClick={handleSaveTitle}
                className="text-green-600 p-1"
                disabled={saving}
              >
                <FiCheck className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setEditTitle(sheet.title);
                }}
                className="text-gray-400 p-1"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <h3 className="font-semibold text-gray-800 truncate">{sheet.title}</h3>
          )}
          <p className="text-sm text-gray-500 mt-1">{formatSheetDate(sheet.createdAt)}</p>
          <p className="text-sm text-gray-500">{rowLabel}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigate(`/sheet/${sheet._id}`)}
            className="p-2 text-slate-700 hover:bg-gray-100 rounded-lg"
            title="View sheet"
          >
            <FiEye className="w-5 h-5" />
          </button>
          {isManager && !editing && (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="p-2 text-slate-700 hover:bg-gray-100 rounded-lg"
                title="Edit title"
              >
                <FiEdit2 className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(sheet)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                title="Delete sheet"
              >
                <FiTrash2 className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

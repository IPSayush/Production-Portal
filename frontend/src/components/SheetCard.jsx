import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiEdit2, FiTrash2, FiCheck, FiX, FiFileText } from 'react-icons/fi';
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
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="hidden sm:flex w-12 h-12 bg-primary-50 rounded-lg items-center justify-center shrink-0">
          <FiFileText className="w-6 h-6 text-primary-600" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
                disabled={saving}
              />
              <button type="button" onClick={handleSaveTitle} className="text-green-600 p-1.5 hover:bg-green-50 rounded-full" disabled={saving}>
                <FiCheck className="w-5 h-5" />
              </button>
              <button type="button" onClick={() => { setEditing(false); setEditTitle(sheet.title); }} className="text-slate-400 p-1.5 hover:bg-slate-100 rounded-full">
                <FiX className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <h3 className="font-semibold text-slate-800 truncate text-base">{sheet.title}</h3>
          )}
          <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
             <span>{formatSheetDate(sheet.createdAt)}</span>
             <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
             <span>{rowLabel}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => navigate(`/sheet/${sheet._id}`)}
            className="p-2 text-slate-600 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-colors"
            title="View sheet"
          >
            <FiEye className="w-5 h-5" />
          </button>
          {isManager && !editing && (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                title="Edit title"
              >
                <FiEdit2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(sheet)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
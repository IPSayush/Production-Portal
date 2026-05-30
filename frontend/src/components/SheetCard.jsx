import { memo, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiEye,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiX,
  FiFileText,
} from 'react-icons/fi';
import { formatSheetDate } from '../utils/dateUtils';
import { sheetsApi } from '../api';
import StatusBadge from './StatusBadge';
import { ProgressSummaryCompact } from './ProgressSummary';

function ManagerSheetCard({ sheet, onDelete, onUpdate }) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(sheet.title);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(sheet.status || 'Upcoming');

  useEffect(() => {
    setStatus(sheet.status || 'Upcoming');
  }, [sheet.status]);

  const rowLabel =
    sheet.rowCount === 1 ? '1 entry' : `${sheet.rowCount || 0} entries`;

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

  const handleStatusChange = useCallback(
    async (newStatus) => {
      const prev = status;
      setStatus(newStatus);
      try {
        const res = await sheetsApi.updateStatus(sheet._id, newStatus);
        onUpdate?.(res.data);
      } catch {
        setStatus(prev);
      }
    },
    [sheet, status, onUpdate]
  );

  const handleView = useCallback(() => {
    navigate(`/sheet/${sheet._id}`);
  }, [navigate, sheet._id]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <StatusBadge status={status} editable onChange={handleStatusChange} />
      </div>

      <div className="flex items-start gap-3">
        <div className="hidden sm:flex w-12 h-12 bg-slate-100 rounded-lg items-center justify-center shrink-0">
          <FiFileText className="w-6 h-6 text-slate-600" />
        </div>

        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-500 min-h-[44px]"
                autoFocus
                disabled={saving}
              />
              <button
                type="button"
                onClick={handleSaveTitle}
                className="text-green-600 p-2.5 hover:bg-green-50 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center"
                disabled={saving}
              >
                <FiCheck className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setEditTitle(sheet.title);
                }}
                className="text-slate-400 p-2.5 hover:bg-slate-100 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <h3 className="font-semibold text-slate-800 truncate text-sm sm:text-base">
              📄 {sheet.title}
            </h3>
          )}
          {sheet.description ? (
            <p className="text-xs text-gray-500 truncate mt-0.5">
              {sheet.description}
            </p>
          ) : null}
          <div className="flex items-center gap-3 mt-1 text-xs sm:text-sm text-slate-500">
            <span>Created: {formatSheetDate(sheet.createdAt)}</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full" />
            <span>{rowLabel}</span>
          </div>
          <ProgressSummaryCompact
            targetQuantity={sheet.targetQuantity}
            achievedQuantity={sheet.achievedQuantity}
          />
        </div>
      </div>

      <div className="border-t border-slate-100 mt-3 pt-3 flex flex-wrap items-center justify-center sm:justify-end gap-1">
        <button
          type="button"
          onClick={handleView}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
          title="View sheet"
        >
          <FiEye className="w-5 h-5" />
          <span>View</span>
        </button>
        {!editing && (
          <>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] text-sm text-slate-500 hover:bg-slate-100 rounded-lg"
              title="Edit title"
            >
              <FiEdit2 className="w-4 h-4" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={() => onDelete?.(sheet)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] text-sm text-red-500 hover:bg-red-50 rounded-lg"
              title="Delete sheet"
            >
              <FiTrash2 className="w-5 h-5" />
              <span>Delete</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const SheetCard = memo(
  function SheetCard({ sheet, onDelete, onUpdate }) {
    return <ManagerSheetCard sheet={sheet} onDelete={onDelete} onUpdate={onUpdate} />;
  },
  (prev, next) =>
    prev.sheet._id === next.sheet._id &&
    prev.sheet.title === next.sheet.title &&
    prev.sheet.description === next.sheet.description &&
    prev.sheet.status === next.sheet.status &&
    prev.sheet.rowCount === next.sheet.rowCount &&
    prev.sheet.targetQuantity === next.sheet.targetQuantity &&
    prev.sheet.achievedQuantity === next.sheet.achievedQuantity
);

export default SheetCard;

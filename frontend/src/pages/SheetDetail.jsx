import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiSave, FiEdit2, FiCheck, FiX } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import DeleteModal from '../components/DeleteModal';
import LoadingSpinner from '../components/LoadingSpinner';
import TopProgressBar from '../components/TopProgressBar';
import StatusBadge from '../components/StatusBadge';
import { ProgressSummaryFull } from '../components/ProgressSummary';
import { sheetsApi } from '../api';
import { calculateQuantityTotal, formatQuantityTotal } from '../utils/quantityUtils';
import { useSheets } from '../context/SheetsContext';

function normalizeRows(rows) {
  return (rows || []).map((row) => ({
    ...row,
    customValues: row.customValues
      ? row.customValues instanceof Map
        ? Object.fromEntries(row.customValues)
        : { ...row.customValues }
      : {},
  }));
}

export default function SheetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isManager, role } = useAuth();
  const { updateSheetInCache } = useSheets();

  const [sheet, setSheet] = useState(null);
  const [rows, setRows] = useState([]);
  const [customColumns, setCustomColumns] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Upcoming');
  const [loading, setLoading] = useState(true);
  const [bgLoading, setBgLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [deleteRowTarget, setDeleteRowTarget] = useState(null);
  const [editingDescription, setEditingDescription] = useState(false);
  const [editDescription, setEditDescription] = useState('');

  const dirtyDebounceRef = useRef(null);
  const homePath = role === 'manager' ? '/manager/home' : '/viewer/home';

  const quantityTotal = useMemo(() => calculateQuantityTotal(rows), [rows]);
  const formattedQuantityTotal = formatQuantityTotal(quantityTotal);

  const targetQuantity = sheet?.targetQuantity ?? 0;
  const achievedForBar = isManager ? quantityTotal : (sheet?.achievedQuantity ?? quantityTotal);

  const fetchSheet = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Request all rows (high limit) since this page manages them client-side
      const res = await sheetsApi.getOne(id, 1, 10000);
      const data = res.data;
      setSheet(data);
      setTitle(data.title);
      setDescription(data.description || '');
      setEditDescription(data.description || '');
      setStatus(data.status || 'Upcoming');
      setCustomColumns(data.customColumns || []);
      setRows(normalizeRows(data.rows));
      setHasUnsavedChanges(false);
      updateSheetInCache({
        _id: data._id,
        title: data.title,
        description: data.description || '',
        status: data.status || 'Upcoming',
        targetQuantity: data.targetQuantity ?? 0,
        achievedQuantity: data.achievedQuantity ?? calculateQuantityTotal(data.rows),
        rowCount: data.rowCount ?? (data.rows?.length || 0),
        customColumns: data.customColumns,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load sheet');
    } finally {
      setLoading(false);
    }
  }, [id, updateSheetInCache]);

  useEffect(() => {
    fetchSheet();
  }, [fetchSheet]);

  const markDirtyDebounced = useCallback(() => {
    if (dirtyDebounceRef.current) clearTimeout(dirtyDebounceRef.current);
    dirtyDebounceRef.current = setTimeout(() => {
      setHasUnsavedChanges(true);
    }, 300);
  }, []);

  const handleBack = useCallback(() => {
    if (isManager && hasUnsavedChanges) {
      const leave = window.confirm('You have unsaved changes. Leave anyway?');
      if (!leave) return;
    }
    navigate(homePath);
  }, [isManager, hasUnsavedChanges, navigate, homePath]);

  const handleRowsChange = useCallback(
    (updatedRows) => {
      setRows(updatedRows);
      markDirtyDebounced();
    },
    [markDirtyDebounced]
  );

  const handleColumnsChange = useCallback((cols, updatedRows) => {
    setCustomColumns(cols);
    setRows(
      updatedRows.map((r) => ({
        ...r,
        _dirty: r._id && !r.isNew ? true : r._dirty,
      }))
    );
    setHasUnsavedChanges(true);
  }, []);

  const handleAddRow = useCallback(() => {
    const newRow = {
      _tempId: `temp-${Date.now()}`,
      date: new Date().toISOString(),
      quantity: 0,
      description: '',
      customValues: {},
      isNew: true,
    };
    customColumns.forEach((col) => {
      newRow.customValues[col] = '';
    });
    setRows((prev) => [...prev, newRow]);
    setHasUnsavedChanges(true);
  }, [customColumns]);

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

  const handleSave = async () => {
    setSaving(true);
    setBgLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      if (
        sheet &&
        (title !== sheet.title ||
          JSON.stringify(customColumns) !== JSON.stringify(sheet.customColumns))
      ) {
        await sheetsApi.update(id, { title, customColumns });
      }

      for (const row of rows) {
        const payload = {
          date: row.date,
          quantity: row.quantity,
          description: row.description || '',
          customValues: row.customValues || {},
        };

        if (row.isNew || !row._id) {
          await sheetsApi.addRow(id, payload);
        } else if (row._dirty) {
          await sheetsApi.updateRow(id, row._id, payload);
        }
      }

      await fetchSheet();
      setSuccessMsg('Changes saved successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
      setBgLoading(false);
    }
  };

  const handleDeleteRow = async (password) => {
    const target = deleteRowTarget.row;
    const index = deleteRowTarget.index;
    const snapshot = rows;

    if (target.isNew || !target._id || String(target._id).startsWith('temp')) {
      setRows(rows.filter((_, i) => i !== index));
      setDeleteRowTarget(null);
      setHasUnsavedChanges(true);
      return;
    }

    setRows(rows.filter((_, i) => i !== index));
    setDeleteRowTarget(null);
    setBgLoading(true);

    try {
      await sheetsApi.deleteRow(id, target._id, password);
      markDirtyDebounced();
    } catch (err) {
      setRows(snapshot);
      setError(err.response?.data?.message || 'Failed to delete row');
      throw err;
    } finally {
      setBgLoading(false);
    }
  };

  if (loading && !sheet) {
    return <LoadingSpinner fullScreen />;
  }

  if (error && !sheet) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
        <p className="text-red-500 mb-4 text-sm sm:text-base">{error}</p>
        <button
          type="button"
          onClick={() => navigate(homePath)}
          className="bg-slate-700 text-white px-4 py-3 rounded-lg text-sm min-h-[44px]"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28 text-sm sm:text-base">
      <TopProgressBar loading={bgLoading} />

      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm h-[52px] md:h-[60px]">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 font-medium min-w-[44px] min-h-[44px]"
        >
          <FiArrowLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Back</span>
        </button>
        {isManager ? (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !hasUnsavedChanges}
            className="flex items-center gap-2 bg-slate-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:bg-slate-300 min-h-[44px]"
          >
            <FiSave className="w-4 h-4" />
            <span>Save</span>
          </button>
        ) : (
          <span className="w-10" />
        )}
      </div>

      <div className="px-4 pt-4 space-y-3 max-w-5xl mx-auto">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-lg sm:text-xl font-bold text-slate-800 truncate">
              {title}
            </h1>
            <StatusBadge
              status={status}
              editable={isManager}
              onChange={isManager ? handleStatusChange : undefined}
            />
          </div>
          {editingDescription && isManager ? (
            <div className="mt-2">
              <textarea
                value={editDescription}
                onChange={(e) =>
                  setEditDescription(e.target.value.slice(0, 300))
                }
                rows={3}
                maxLength={300}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleSaveDescription}
                  className="text-green-600 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <FiCheck className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingDescription(false);
                    setEditDescription(description);
                  }}
                  className="text-slate-400 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              {description ? (
                <p className="text-sm text-gray-500 italic flex-1">{description}</p>
              ) : isManager ? (
                <p className="text-sm text-gray-400 italic">No description</p>
              ) : null}
              {isManager && (
                <button
                  type="button"
                  onClick={() => setEditingDescription(true)}
                  className="text-slate-400 hover:text-slate-600 p-2 min-w-[44px] min-h-[44px] shrink-0"
                  title="Edit description"
                >
                  <FiEdit2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        <ProgressSummaryFull
          targetQuantity={targetQuantity}
          achievedQuantity={achievedForBar}
        />
      </div>

      <main className="px-2 sm:px-4 pb-4 mt-2 max-w-5xl mx-auto">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl mb-3 border border-red-100">
            {error}
          </p>
        )}
        {successMsg && (
          <p className="text-sm text-green-700 bg-green-50 px-4 py-3 rounded-xl mb-3 border border-green-100">
            {successMsg}
          </p>
        )}

        <DataTable
          title={title}
          customColumns={customColumns}
          rows={rows}
          isManager={isManager}
          quantityTotal={quantityTotal}
          formattedQuantityTotal={formattedQuantityTotal}
          onRowsChange={handleRowsChange}
          onColumnsChange={handleColumnsChange}
          onDeleteRow={(row, index) => setDeleteRowTarget({ row, index })}
        />
      </main>

      {isManager && (
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-20">
          <button
            type="button"
            onClick={handleAddRow}
            className="flex items-center justify-center bg-slate-700 text-white w-14 h-14 rounded-full shadow-lg hover:bg-slate-800 transition-all active:scale-95 min-w-[56px] min-h-[56px]"
            title="Add Row"
          >
            <FiPlus className="w-6 h-6" />
          </button>
          {hasUnsavedChanges && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center bg-white border border-slate-200 text-slate-700 w-14 h-14 rounded-full shadow-lg hover:bg-slate-50 transition-all active:scale-95 min-w-[56px] min-h-[56px]"
              title="Save"
            >
              <FiSave className="w-6 h-6" />
            </button>
          )}
        </div>
      )}

      <DeleteModal
        isOpen={!!deleteRowTarget}
        onClose={() => setDeleteRowTarget(null)}
        onConfirm={handleDeleteRow}
        itemType="row"
      />
    </div>
  );
}

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiSave } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import DeleteModal from '../components/DeleteModal';
import LoadingSpinner from '../components/LoadingSpinner';
import TopProgressBar from '../components/TopProgressBar';
import { ProgressSummaryFull } from '../components/ProgressSummary';
import { sheetsApi } from '../api';
import { formatInputDate } from '../utils/dateUtils';
import { calculateQuantityTotal, formatQuantityTotal } from '../utils/quantityUtils';

function normalizeRows(rows) {
  return (rows || []).map((row) => ({
    ...row,
    workerValues: row.workerValues
      ? row.workerValues instanceof Map
        ? Object.fromEntries(row.workerValues)
        : { ...row.workerValues }
      : {},
  }));
}

export default function ItemDetail() {
  const { sheetId, itemId } = useParams();
  const navigate = useNavigate();
  const { isManager } = useAuth();

  const [item, setItem] = useState(null);
  const [rows, setRows] = useState([]);
  const [workerColumns, setWorkerColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bgLoading, setBgLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [deleteRowTarget, setDeleteRowTarget] = useState(null);

  const dirtyDebounceRef = useRef(null);

  const quantityTotal = useMemo(() => calculateQuantityTotal(rows), [rows]);
  const formattedQuantityTotal = formatQuantityTotal(quantityTotal);

  const targetQuantity = item?.targetQuantity ?? 0;
  const achievedForBar = isManager ? quantityTotal : (item?.achievedQuantity ?? quantityTotal);

  const fetchItem = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await sheetsApi.getItem(sheetId, itemId);
      const data = res.data;
      setItem(data);
      setWorkerColumns(data.workerColumns || []);
      setRows(normalizeRows(data.rows));
      setHasUnsavedChanges(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load item');
    } finally {
      setLoading(false);
    }
  }, [sheetId, itemId]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

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
    navigate(`/sheet/${sheetId}`);
  }, [isManager, hasUnsavedChanges, navigate, sheetId]);

  const handleRowsChange = useCallback(
    (updatedRows) => {
      setRows(updatedRows);
      markDirtyDebounced();
    },
    [markDirtyDebounced]
  );

  const handleColumnsChange = useCallback((cols, updatedRows) => {
    setWorkerColumns(cols);
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
      date: formatInputDate(new Date()),
      quantity: 0,
      description: '',
      workerValues: {},
      isNew: true,
    };
    workerColumns.forEach((col) => {
      newRow.workerValues[col] = '';
    });
    setRows((prev) => [...prev, newRow]);
    setHasUnsavedChanges(true);
  }, [workerColumns]);

  const handleSave = async () => {
    setSaving(true);
    setBgLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      // Update worker columns if changed
      if (
        item &&
        JSON.stringify(workerColumns) !== JSON.stringify(item.workerColumns)
      ) {
        await sheetsApi.updateItem(sheetId, itemId, { workerColumns });
      }

      for (const row of rows) {
        const payload = {
          date: formatInputDate(row.date),
          quantity: row.quantity,
          description: row.description || '',
          workerValues: row.workerValues || {},
        };

        if (row.isNew || !row._id) {
          await sheetsApi.addRow(sheetId, itemId, payload);
        } else if (row._dirty) {
          await sheetsApi.updateRow(sheetId, itemId, row._id, payload);
        }
      }

      await fetchItem();
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
      await sheetsApi.deleteRow(sheetId, itemId, target._id, password);
      markDirtyDebounced();
    } catch (err) {
      setRows(snapshot);
      setError(err.response?.data?.message || 'Failed to delete row');
    } finally {
      setBgLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  if (error && !item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => navigate(`/sheet/${sheetId}`)}
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
      <TopProgressBar loading={bgLoading || saving} />

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
          <div className="flex-1 text-center min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-slate-800 truncate">
              {item?.name}
            </h1>
            <p className="text-xs text-gray-400 truncate">{item?.sheetTitle}</p>
          </div>
          {isManager && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !hasUnsavedChanges}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium min-h-[44px] transition-colors ${
                hasUnsavedChanges
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              <FiSave className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          )}
          {!isManager && <div className="w-[44px]" />}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
        {/* Item meta */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mb-3">
            {item?.size && (
              <span>
                <strong className="text-gray-500">Size:</strong> {item.size}
              </span>
            )}
            {item?.quality && (
              <span>
                <strong className="text-gray-500">Quality:</strong> {item.quality}
              </span>
            )}
            {item?.isCompleted && (
              <span className="text-green-600 font-medium">✓ Completed</span>
            )}
          </div>
          <ProgressSummaryFull
            targetQuantity={targetQuantity}
            achievedQuantity={achievedForBar}
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>
        )}

        {successMsg && (
          <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg mb-4">{successMsg}</p>
        )}

        {/* Add Row Button */}
        {isManager && (
          <div className="flex justify-end mb-3">
            <button
              type="button"
              onClick={handleAddRow}
              className="flex items-center gap-1.5 bg-slate-700 text-white px-4 py-2.5 rounded-lg hover:bg-slate-800 text-sm font-medium min-h-[44px]"
            >
              <FiPlus className="w-4 h-4" /> Add Row
            </button>
          </div>
        )}

        {/* Data Table */}
        <DataTable
          title={item?.name || ''}
          customColumns={workerColumns}
          rows={rows}
          isManager={isManager}
          formattedQuantityTotal={formattedQuantityTotal}
          onRowsChange={handleRowsChange}
          onColumnsChange={handleColumnsChange}
          onDeleteRow={(row, index) => setDeleteRowTarget({ row, index })}
        />
      </main>

      <DeleteModal
        isOpen={!!deleteRowTarget}
        onClose={() => setDeleteRowTarget(null)}
        onConfirm={handleDeleteRow}
        itemType="row"
      />
    </div>
  );
}

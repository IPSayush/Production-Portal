import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiSave, FiPackage } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import DeleteModal from '../components/DeleteModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { sheetsApi } from '../api';
import { calculateQuantityTotal, formatQuantityTotal } from '../utils/quantityUtils';

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

  const [sheet, setSheet] = useState(null);
  const [rows, setRows] = useState([]);
  const [customColumns, setCustomColumns] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [deleteRowTarget, setDeleteRowTarget] = useState(null);

  const homePath = role === 'manager' ? '/manager/home' : '/viewer/home';

  const quantityTotal = useMemo(() => calculateQuantityTotal(rows), [rows]);
  const formattedQuantityTotal = formatQuantityTotal(quantityTotal);

  const fetchSheet = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await sheetsApi.getOne(id);
      const data = res.data;
      setSheet(data);
      setTitle(data.title);
      setCustomColumns(data.customColumns || []);
      setRows(normalizeRows(data.rows));
      setHasUnsavedChanges(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load sheet');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSheet();
  }, [fetchSheet]);

  // --- Handlers ---

  const handleBack = () => {
    if (isManager && hasUnsavedChanges) {
      const leave = window.confirm('You have unsaved changes. Leave anyway?');
      if (!leave) return;
    }
    navigate(homePath);
  };

  const handleRowsChange = (updatedRows, dirty = true) => {
    setRows(updatedRows);
    if (dirty) setHasUnsavedChanges(true);
  };

  const handleColumnsChange = (cols, updatedRows) => {
    setCustomColumns(cols);
    setRows(updatedRows.map((r) => ({ ...r, _dirty: r._id && !r.isNew ? true : r._dirty })));
    setHasUnsavedChanges(true);
  };

  const handleAddRow = () => {
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
    setRows([...rows, newRow]);
    setHasUnsavedChanges(true);
  };

  const markRowsDirty = (updatedRows) => {
    const marked = updatedRows.map((row) => {
      if (row.isNew || !row._id) return row;
      return { ...row, _dirty: true };
    });
    handleRowsChange(marked, true);
  };

  const handleSave = async () => {
    setSaving(true);
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
    }
  };

  const handleDeleteRow = async (password) => {
    const target = deleteRowTarget.row;
    if (target.isNew || !target._id || String(target._id).startsWith('temp')) {
      setRows(rows.filter((_, i) => i !== deleteRowTarget.index));
      setDeleteRowTarget(null);
      setHasUnsavedChanges(true);
      return;
    }
    await sheetsApi.deleteRow(id, target._id, password);
    setRows(rows.filter((_, i) => i !== deleteRowTarget.index));
    setDeleteRowTarget(null);
  };

  // --- Render ---

  if (loading && !sheet) {
    return <LoadingSpinner fullScreen />;
  }

  if (error && !sheet) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          type="button"
          onClick={() => navigate(homePath)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* Sticky Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-primary-700 font-medium"
        >
          <FiArrowLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Back</span>
        </button>
        <span className="text-sm font-bold text-slate-800 truncate max-w-[50%] text-center uppercase tracking-wide">
          {title}
        </span>
        {isManager ? (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !hasUnsavedChanges}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:bg-slate-300 transition-colors shadow-sm"
          >
            <FiSave className="w-4 h-4" />
            <span>Save</span>
          </button>
        ) : (
          <span className="w-16" />
        )}
      </div>

      {/* Total Quantity Card */}
      <div className="px-4 pt-4">
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium shadow-sm">
          <FiPackage className="w-5 h-5 text-primary-600 shrink-0" />
          <span>
            Total Quantity: <span className="font-bold text-primary-700">{formattedQuantityTotal}</span>
          </span>
        </div>
      </div>

      <main className="px-2 sm:px-4 pb-4 mt-2">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl mb-3 border border-red-100">{error}</p>
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
          onRowsChange={(updated) => markRowsDirty(updated)}
          onColumnsChange={handleColumnsChange}
          onDeleteRow={(row, index) => setDeleteRowTarget({ row, index })}
        />
      </main>

      {isManager && (
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-20">
          <button
            type="button"
            onClick={handleAddRow}
            className="flex items-center justify-center gap-2 bg-primary-600 text-white w-14 h-14 rounded-full shadow-lg hover:bg-primary-700 transition-all active:scale-95"
            title="Add Row"
          >
            <FiPlus className="w-6 h-6" />
          </button>
          {hasUnsavedChanges && (
             <button
             type="button"
             onClick={handleSave}
             disabled={saving}
             className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-primary-700 w-14 h-14 rounded-full shadow-lg hover:bg-slate-50 transition-all active:scale-95"
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

      {(loading || saving) && <LoadingSpinner fullScreen />}
    </div>
  );
}
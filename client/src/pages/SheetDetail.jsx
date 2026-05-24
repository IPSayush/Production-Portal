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

  const markRowsDirty = (updatedRows) => {
    const marked = updatedRows.map((row) => {
      if (row.isNew || !row._id) return row;
      return { ...row, _dirty: true };
    });
    handleRowsChange(marked, true);
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

  if (loading && !sheet) {
    return <LoadingSpinner fullScreen />;
  }

  if (error && !sheet) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          type="button"
          onClick={() => navigate(homePath)}
          className="bg-slate-700 text-white px-4 py-2 rounded-lg text-sm"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back
        </button>
        <span className="text-sm font-medium text-gray-800 truncate max-w-[40%] text-center">
          {title}
        </span>
        {isManager ? (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !hasUnsavedChanges}
            className="flex items-center gap-1 bg-slate-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
          >
            <FiSave className="w-4 h-4" />
            Save
          </button>
        ) : (
          <span className="w-16" />
        )}
      </div>

      <div className="px-2 sm:px-4 pt-4">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-700 font-medium mb-3">
          <FiPackage className="w-4 h-4 text-slate-700 shrink-0" />
          <span>
            Total Quantity: <span className="font-semibold text-gray-800">{formattedQuantityTotal}</span>
          </span>
        </div>
      </div>

      <main className="px-2 sm:px-4 pb-4">
        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg mb-3">{error}</p>
        )}
        {successMsg && (
          <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg mb-3">
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
        <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-20">
          <button
            type="button"
            onClick={handleAddRow}
            className="flex items-center gap-2 bg-slate-700 text-white px-4 py-3 rounded-full shadow-lg hover:bg-slate-800 text-sm font-medium"
          >
            <FiPlus className="w-5 h-5" />
            Add Row
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !hasUnsavedChanges}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-full shadow-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
          >
            <FiSave className="w-5 h-5" />
            Save
          </button>
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

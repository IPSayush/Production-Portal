import { useState } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import { formatInputDate, formatSheetDate, parseInputDate } from '../utils/dateUtils';

function mapCustomValues(customValues) {
  if (!customValues) return {};
  if (customValues instanceof Map) {
    return Object.fromEntries(customValues);
  }
  if (typeof customValues === 'object') {
    return { ...customValues };
  }
  return {};
}

export default function DataTable({
  title,
  customColumns,
  rows,
  isManager,
  formattedQuantityTotal,
  onRowsChange,
  onColumnsChange,
  onDeleteRow,
}) {
  const [editingColumn, setEditingColumn] = useState(null);
  const [columnEditValue, setColumnEditValue] = useState('');

  const totalCols = 3 + customColumns.length + (isManager ? 1 : 0);

  const updateRow = (rowIndex, field, value) => {
    const updated = rows.map((row, i) => {
      if (i !== rowIndex) return row;
      if (field.startsWith('custom_')) {
        const colName = field.replace('custom_', '');
        const customValues = { ...mapCustomValues(row.customValues) };
        customValues[colName] = value;
        return { ...row, customValues };
      }
      return { ...row, [field]: value };
    });
    onRowsChange(updated, true);
  };

  const startEditColumn = (index, name) => {
    if (!isManager) return;
    setEditingColumn(index);
    setColumnEditValue(name);
  };

  const saveColumnName = (index) => {
    if (editingColumn === null) return;
    const trimmed = columnEditValue.trim();
    if (trimmed && trimmed !== customColumns[index]) {
      const updated = [...customColumns];
      const oldName = updated[index];
      updated[index] = trimmed;

      const updatedRows = rows.map((row) => {
        const cv = mapCustomValues(row.customValues);
        if (cv[oldName] !== undefined) {
          cv[trimmed] = cv[oldName];
          delete cv[oldName];
        }
        return { ...row, customValues: cv };
      });

      onColumnsChange(updated, updatedRows);
    }
    setEditingColumn(null);
    setColumnEditValue('');
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm min-w-[600px]">
        <thead>
          <tr>
            <th
              colSpan={totalCols}
              className="bg-white font-bold text-lg text-center py-3 border border-gray-200 text-gray-800"
            >
              {title}
            </th>
          </tr>
          <tr className="bg-gray-100 font-semibold text-gray-700">
            <th className="border border-gray-200 px-3 py-2 w-[120px]">Date</th>
            <th className="border border-gray-200 px-3 py-2 w-[100px]">Quantity</th>
            <th className="border border-gray-200 px-3 py-2 w-[150px]">Description</th>
            {customColumns.map((col, idx) => (
              <th
                key={`${col}-${idx}`}
                className="border border-gray-200 px-3 py-2 w-[80px] cursor-pointer"
                onClick={() => startEditColumn(idx, col)}
              >
                {editingColumn === idx ? (
                  <input
                    type="text"
                    value={columnEditValue}
                    onChange={(e) => setColumnEditValue(e.target.value)}
                    onBlur={() => saveColumnName(idx)}
                    onKeyDown={(e) => e.key === 'Enter' && saveColumnName(idx)}
                    className="w-full bg-white border border-gray-300 rounded px-1 py-0.5 text-xs font-semibold"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  col
                )}
              </th>
            ))}
            {isManager && (
              <th className="border border-gray-200 px-3 py-2 w-[50px]"></th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={totalCols}
                className="border border-gray-200 px-3 py-8 text-center text-gray-500"
              >
                No entries yet.
                {isManager && ' Tap "+ Add Row" to add data.'}
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr
                key={row._id || row._tempId}
                className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                <td className="border border-gray-200 px-3 py-2">
                  {isManager ? (
                    <input
                      type="date"
                      value={formatInputDate(row.date)}
                      onChange={(e) =>
                        updateRow(rowIndex, 'date', parseInputDate(e.target.value))
                      }
                      className="w-full bg-transparent border-0 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500 rounded px-1"
                    />
                  ) : (
                    formatSheetDate(row.date)
                  )}
                </td>
                <td className="border border-gray-200 px-3 py-2">
                  {isManager ? (
                    <input
                      type="number"
                      value={row.quantity ?? 0}
                      onChange={(e) =>
                        updateRow(rowIndex, 'quantity', Number(e.target.value) || 0)
                      }
                      className="w-full bg-transparent border-0 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500 rounded px-1"
                    />
                  ) : (
                    row.quantity
                  )}
                </td>
                <td className="border border-gray-200 px-3 py-2">
                  {isManager ? (
                    <input
                      type="text"
                      value={row.description || ''}
                      onChange={(e) => updateRow(rowIndex, 'description', e.target.value)}
                      className="w-full bg-transparent border-0 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500 rounded px-1"
                    />
                  ) : (
                    row.description || ''
                  )}
                </td>
                {customColumns.map((col) => {
                  const cv = mapCustomValues(row.customValues);
                  return (
                    <td key={col} className="border border-gray-200 px-3 py-2">
                      {isManager ? (
                        <input
                          type="text"
                          value={cv[col] || ''}
                          onChange={(e) =>
                            updateRow(rowIndex, `custom_${col}`, e.target.value)
                          }
                          className="w-full bg-transparent border-0 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500 rounded px-1"
                        />
                      ) : (
                        cv[col] || ''
                      )}
                    </td>
                  );
                })}
                {isManager && (
                  <td className="border border-gray-200 px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => onDeleteRow(row, rowIndex)}
                      className="text-red-500 hover:text-red-600 p-1"
                      title="Delete row"
                    >
                      <FiTrash2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                )}
              </tr>
            ))
          )}
          <tr className="bg-gray-100 font-semibold text-gray-800 border-t-2 border-gray-300">
            <td className="border border-gray-200 px-3 py-2 text-gray-600 text-xs uppercase tracking-wide">
              TOTAL
            </td>
            <td className="border border-gray-200 px-3 py-2 font-semibold">
              {formattedQuantityTotal}
            </td>
            <td className="border border-gray-200 px-3 py-2 text-gray-400">—</td>
            {customColumns.map((col) => (
              <td key={`total-${col}`} className="border border-gray-200 px-3 py-2 text-gray-400">
                —
              </td>
            ))}
            {isManager && <td className="border border-gray-200 px-3 py-2"></td>}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

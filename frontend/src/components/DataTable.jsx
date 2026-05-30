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
    onRowsChange(updated);
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
    <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full border-collapse text-xs sm:text-sm min-w-[640px]">
        <thead>
          <tr>
            <th
              colSpan={totalCols}
              className="bg-slate-50 font-bold text-sm sm:text-base text-center py-3 sm:py-4 border-b border-slate-200 text-slate-800"
            >
              {title}
            </th>
          </tr>
          <tr className="bg-slate-50 font-semibold text-slate-600 border-b border-slate-200">
            <th className="sticky left-0 z-10 bg-slate-50 border-r border-slate-100 px-2 sm:px-4 py-2 sm:py-3 min-w-[110px] text-xs uppercase tracking-wider">
              Date
            </th>
            <th className="border-r border-slate-100 px-2 sm:px-4 py-2 sm:py-3 min-w-[90px] text-xs uppercase tracking-wider">
              Qty
            </th>
            <th className="border-r border-slate-100 px-2 sm:px-4 py-2 sm:py-3 min-w-[130px] text-xs uppercase tracking-wider">
              Description
            </th>
            {customColumns.map((col, idx) => (
              <th
                key={`${col}-${idx}`}
                className="border-r border-slate-100 px-2 sm:px-4 py-2 min-w-[80px] cursor-pointer hover:bg-slate-100 transition-colors text-xs uppercase tracking-wider"
                onClick={() => startEditColumn(idx, col)}
              >
                {editingColumn === idx ? (
                  <input
                    type="text"
                    value={columnEditValue}
                    onChange={(e) => setColumnEditValue(e.target.value)}
                    onBlur={() => saveColumnName(idx)}
                    onKeyDown={(e) => e.key === 'Enter' && saveColumnName(idx)}
                    className="w-full bg-white border border-slate-400 rounded px-2 py-1 text-xs font-semibold text-center focus:outline-none focus:ring-2 focus:ring-slate-500"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  col
                )}
              </th>
            ))}
            {isManager && (
              <th className="px-2 sm:px-4 py-2 min-w-[44px] w-[44px]" />
            )}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={totalCols}
                className="border-t border-slate-100 px-4 py-12 text-center text-slate-400 bg-white"
              >
                No entries yet.
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr
                key={row._id || row._tempId}
                className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors"
              >
                <td className="sticky left-0 z-[1] bg-white border-r border-slate-100 px-2 sm:px-4 py-2 align-top min-w-[110px]">
                  {isManager ? (
                    <input
                      type="date"
                      value={formatInputDate(row.date)}
                      onChange={(e) =>
                        updateRow(rowIndex, 'date', parseInputDate(e.target.value))
                      }
                      className="w-full bg-transparent border-0 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 rounded px-1 py-1 min-h-[36px]"
                    />
                  ) : (
                    <div className="text-slate-700 py-1">
                      {formatSheetDate(row.date)}
                    </div>
                  )}
                </td>
                <td className="border-r border-slate-100 px-2 sm:px-4 py-2 align-top min-w-[90px]">
                  {isManager ? (
                    <input
                      type="number"
                      value={row.quantity ?? 0}
                      onChange={(e) =>
                        updateRow(rowIndex, 'quantity', Number(e.target.value) || 0)
                      }
                      className="w-full bg-transparent border-0 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 rounded px-1 py-1 min-h-[36px]"
                    />
                  ) : (
                    <div className="font-medium text-slate-800 py-1">{row.quantity}</div>
                  )}
                </td>
                <td className="border-r border-slate-100 px-2 sm:px-4 py-2 align-top min-w-[130px]">
                  {isManager ? (
                    <input
                      type="text"
                      value={row.description || ''}
                      onChange={(e) => updateRow(rowIndex, 'description', e.target.value)}
                      className="w-full bg-transparent border-0 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 rounded px-1 py-1 min-h-[36px]"
                    />
                  ) : (
                    <div className="text-slate-600 py-1">{row.description || '—'}</div>
                  )}
                </td>
                {customColumns.map((col) => {
                  const cv = mapCustomValues(row.customValues);
                  return (
                    <td
                      key={col}
                      className="border-r border-slate-100 px-2 sm:px-4 py-2 align-top min-w-[80px]"
                    >
                      {isManager ? (
                        <input
                          type="text"
                          value={cv[col] || ''}
                          onChange={(e) =>
                            updateRow(rowIndex, `custom_${col}`, e.target.value)
                          }
                          className="w-full bg-transparent border-0 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 rounded px-1 py-1 min-h-[36px]"
                        />
                      ) : (
                        <div className="text-slate-600 py-1">{cv[col] || '—'}</div>
                      )}
                    </td>
                  );
                })}
                {isManager && (
                  <td className="px-2 py-2 text-center align-top min-w-[44px]">
                    <button
                      type="button"
                      onClick={() => onDeleteRow(row, rowIndex)}
                      className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
                      title="Delete row"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))
          )}
          <tr className="bg-slate-100 font-bold text-slate-800 border-t-2 border-slate-300">
            <td className="sticky left-0 z-[1] bg-slate-100 border-r border-slate-200 px-2 sm:px-4 py-3 text-xs uppercase tracking-wider text-slate-500">
              TOTAL
            </td>
            <td className="border-r border-slate-200 px-2 sm:px-4 py-3 text-base sm:text-lg text-slate-700">
              {formattedQuantityTotal}
            </td>
            <td className="border-r border-slate-200 px-2 sm:px-4 py-3 text-slate-300">—</td>
            {customColumns.map((col) => (
              <td
                key={`total-${col}`}
                className="border-r border-slate-200 px-2 sm:px-4 py-3 text-slate-300"
              >
                —
              </td>
            ))}
            {isManager && <td className="px-2 py-3" />}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

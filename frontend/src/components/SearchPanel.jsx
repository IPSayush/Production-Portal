import { useState, useEffect, useCallback } from 'react';
import { format, subDays } from 'date-fns';
import {
  FiSearch,
  FiX,
  FiCalendar,
  FiPackage,
  FiFileText,
} from 'react-icons/fi';
import StatusBadge from './StatusBadge';
import { formatInputDate, formatSheetDate, parseInputDate } from '../utils/dateUtils';
import { sheetsApi } from '../api';

function getTodayStr() {
  return formatInputDate(new Date());
}

function getYesterdayStr() {
  return formatInputDate(subDays(new Date(), 1));
}

function formatSearchDateLabel(dateStr) {
  return format(parseInputDate(dateStr), 'EEEE, d MMM yyyy');
}

function getCustomValues(row) {
  const raw = row.customValues;
  if (!raw) return {};
  if (raw instanceof Map) {
    return Object.fromEntries(raw);
  }
  return raw;
}

function formatCustomValues(row, customColumns) {
  const values = getCustomValues(row);
  const columns =
    customColumns?.length > 0
      ? customColumns
      : Object.keys(values).sort();

  return columns
    .filter((col) => {
      const val = values[col];
      return val != null && String(val).trim() !== '';
    })
    .map((col) => `${col}: ${values[col]}`)
    .join('  •  ');
}

function getClientTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

function SearchPanelContent({ onClose, searchDate, setSearchDate, quickSelect, setQuickSelect, searchResults, searching, onSearch }) {
  const handleDateChange = (value) => {
    setSearchDate(value);
    setQuickSelect(null);
  };

  const handleYesterday = () => {
    const dateStr = getYesterdayStr();
    setSearchDate(dateStr);
    setQuickSelect('yesterday');
    onSearch(dateStr);
  };

  const handleToday = () => {
    const dateStr = getTodayStr();
    setSearchDate(dateStr);
    setQuickSelect('today');
    onSearch(dateStr);
  };

  const quickBtnClass = (active) =>
    `flex-1 border rounded-xl py-2.5 text-sm flex items-center justify-center gap-1.5 font-medium transition-colors ${
      active
        ? 'bg-slate-700 text-white border-slate-700'
        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
    }`;

  const totalEntries = searchResults?.reduce(
    (sum, group) => sum + (group.matchingRows?.length || 0),
    0
  ) ?? 0;
  const sheetCount = searchResults?.length ?? 0;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <FiSearch className="w-5 h-5 text-gray-600" />
          Search by Date
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Close search"
        >
          <FiX className="w-5 h-5" />
        </button>
      </div>

      <input
        type="date"
        value={searchDate}
        max={getTodayStr()}
        onChange={(e) => handleDateChange(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-slate-400 bg-gray-50"
      />

      <div className="flex gap-2 mt-3">
        <button type="button" onClick={handleYesterday} className={quickBtnClass(quickSelect === 'yesterday')}>
          ⚡ Yesterday
        </button>
        <button type="button" onClick={handleToday} className={quickBtnClass(quickSelect === 'today')}>
          📅 Today
        </button>
      </div>

      <button
        type="button"
        onClick={() => onSearch(searchDate)}
        disabled={searching}
        className="w-full bg-slate-700 text-white py-3 rounded-xl text-sm font-medium mt-3 disabled:opacity-70"
      >
        Search Entries
      </button>

      {searching && (
        <div className="w-full h-0.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
          <div className="h-full bg-slate-700 animate-pulse w-2/3" />
        </div>
      )}

      <div className="mt-4 border-t border-gray-100 pt-4">
        {searching && searchResults === null && (
          <div className="space-y-2">
            <div className="animate-pulse bg-gray-100 rounded-xl h-16 w-full" />
            <div className="animate-pulse bg-gray-100 rounded-xl h-16 w-full" />
          </div>
        )}

        {!searching && searchResults !== null && searchResults.length === 0 && (
          <div className="text-gray-400 text-sm text-center py-6">
            <p className="text-2xl mb-2">📭</p>
            <p>No entries found for {formatSearchDateLabel(searchDate)}</p>
          </div>
        )}

        {!searching && searchResults && searchResults.length > 0 && (
          <div>
            {searchResults.map((group) => (
              <div key={group.sheetId}>
                <div className="flex items-center justify-between mb-2 mt-4 first:mt-0">
                  <span className="font-semibold text-gray-800 text-sm">
                    📄 {group.sheetTitle}
                  </span>
                  <StatusBadge status={group.status || 'Upcoming'} />
                </div>

                {group.matchingRows.map((row) => {
                  const customText = formatCustomValues(row, group.customColumns);
                  return (
                    <div
                      key={row._id}
                      className="bg-gray-50 border border-gray-100 rounded-xl p-3 mb-2"
                    >
                      <div className="flex items-center gap-3 text-sm text-gray-700">
                        <span className="flex items-center gap-1">
                          <FiCalendar className="w-4 h-4 shrink-0" />
                          {formatSheetDate(row.date)}
                        </span>
                        <span>|</span>
                        <span className="flex items-center gap-1">
                          <FiPackage className="w-4 h-4 shrink-0" />
                          Qty: {row.quantity ?? 0}
                        </span>
                      </div>

                      {row.description ? (
                        <p className="text-gray-500 text-xs mt-1 flex items-start gap-1">
                          <FiFileText className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>{row.description}</span>
                        </p>
                      ) : null}

                      {customText ? (
                        <p className="text-xs text-gray-500 mt-1">{customText}</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))}

            <p className="text-xs text-gray-400 text-center mt-3 pb-2">
              Found {totalEntries} {totalEntries === 1 ? 'entry' : 'entries'} across{' '}
              {sheetCount} {sheetCount === 1 ? 'sheet' : 'sheets'}
            </p>
          </div>
        )}
      </div>
    </>
  );
}

export default function SearchPanel({ isOpen, onClose }) {
  const [searchDate, setSearchDate] = useState(getTodayStr());
  const [quickSelect, setQuickSelect] = useState('today');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  const runSearch = useCallback(async (dateStr) => {
    setSearching(true);
    setSearchResults(null);
    try {
      const res = await sheetsApi.searchByDate(dateStr, getClientTimezone());
      setSearchResults(res.data);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      const today = getTodayStr();
      setSearchDate(today);
      setQuickSelect('today');
      setSearchResults(null);
      runSearch(today);
    } else {
      setSearchDate(getTodayStr());
      setQuickSelect('today');
      setSearchResults(null);
      setSearching(false);
    }
  }, [isOpen, runSearch]);

  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
  };

  const panelProps = {
    onClose: handleClose,
    searchDate,
    setSearchDate,
    quickSelect,
    setQuickSelect,
    searchResults,
    searching,
    onSearch: runSearch,
  };

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black bg-opacity-40"
        onClick={handleClose}
        aria-label="Close search panel"
      />

      <div className="md:hidden absolute inset-0 flex flex-col justify-end pointer-events-none">
        <div
          className="pointer-events-auto bg-white rounded-t-2xl shadow-2xl p-5 max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <SearchPanelContent {...panelProps} />
        </div>
      </div>

      <div className="hidden md:flex absolute inset-0 items-center justify-center px-4 pointer-events-none">
        <div
          className="pointer-events-auto bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <SearchPanelContent {...panelProps} />
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiClipboard, FiSearch } from 'react-icons/fi';
import Header from '../components/Header';
import SearchPanel from '../components/SearchPanel';
import SheetCardImage from '../components/SheetCardImage';
import SkeletonCard from '../components/SkeletonCard';
import StatusBadge from '../components/StatusBadge';
import { ProgressSummaryCompact } from '../components/ProgressSummary';
import { formatSheetDate } from '../utils/dateUtils';
import { useSheets } from '../context/SheetsContext';

const FILTERS = ['All', 'Working', 'Completed', 'Upcoming'];

export default function ViewerHome() {
  const navigate = useNavigate();
  const { sheets, loading, initialLoad, error, fetchSheets } = useSheets();
  const [activeFilter, setActiveFilter] = useState('Working');
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    fetchSheets();
  }, [fetchSheets]);

  const filteredSheets = useMemo(() => {
    let list = [...sheets];
    if (activeFilter !== 'All') {
      list = list.filter((s) => (s.status || 'Upcoming') === activeFilter);
    }
    list.sort((a, b) => {
      const ta = new Date(a.updatedAt || a.createdAt).getTime();
      const tb = new Date(b.updatedAt || b.createdAt).getTime();
      return tb - ta;
    });
    return list;
  }, [sheets, activeFilter]);

  const handleView = useCallback(
    (id) => {
      navigate(`/sheet/${id}`);
    },
    [navigate]
  );

  const showSkeleton = initialLoad && loading;
  const emptyAll = !loading && sheets.length === 0;
  const emptyFilter = !loading && sheets.length > 0 && filteredSheets.length === 0;

  const searchButton = (
    <button
      type="button"
      onClick={() => setSearchOpen(true)}
      className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
      title="Search by date"
      aria-label="Search by date"
    >
      <FiSearch className="w-5 h-5" />
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="📋 Production Sheets" centerTitle actions={searchButton} />
      <SearchPanel isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="flex flex-wrap gap-2 mb-4">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-2 rounded-full text-xs sm:text-sm font-medium min-h-[44px] sm:min-h-0 transition-colors ${
                activeFilter === f
                  ? 'bg-slate-700 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg mb-4">
            {error}
          </p>
        )}

        {showSkeleton ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : emptyAll ? (
          <div className="text-center py-16 text-gray-500">
            <FiClipboard className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm sm:text-base">No sheets available yet.</p>
          </div>
        ) : emptyFilter ? (
          <p className="text-center text-gray-500 py-12 text-sm sm:text-base">
            No {activeFilter} sheets found.
          </p>
        ) : (
          <div className="space-y-4">
            {filteredSheets.map((sheet) => (
              <article
                key={sheet._id}
                className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm"
              >
                <SheetCardImage imageUrl={sheet.imageUrl} title={sheet.title} />

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <StatusBadge status={sheet.status || 'Upcoming'} />
                    <span className="text-xs text-slate-500 shrink-0">
                      {formatSheetDate(sheet.updatedAt || sheet.createdAt)}
                    </span>
                  </div>

                  <h2 className="font-bold text-base text-slate-800">{sheet.title}</h2>
                  {sheet.description ? (
                    <p className="text-xs text-gray-500 italic mt-1 truncate">
                      {sheet.description}
                    </p>
                  ) : null}

                  <ProgressSummaryCompact
                    targetQuantity={sheet.targetQuantity}
                    achievedQuantity={sheet.achievedQuantity}
                  />

                  <button
                    type="button"
                    onClick={() => handleView(sheet._id)}
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-slate-700 text-white py-3 rounded-lg text-sm font-medium hover:bg-slate-800 min-h-[44px]"
                  >
                    <FiEye className="w-5 h-5" />
                    View Sheet →
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

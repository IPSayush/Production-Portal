import { useState, useEffect, useCallback, useMemo } from 'react';
import { FiPlus, FiSearch } from 'react-icons/fi';
import Header from '../components/Header';
import SearchPanel from '../components/SearchPanel';
import SheetCard from '../components/SheetCard';
import CreateSheetWizard from '../components/CreateSheetWizard';
import DeleteModal from '../components/DeleteModal';
import SkeletonCard from '../components/SkeletonCard';
import TopProgressBar from '../components/TopProgressBar';
import { sheetsApi } from '../api';
import { useSheets } from '../context/SheetsContext';

const FILTERS = ['All', 'Working', 'Completed', 'Upcoming'];

export default function ManagerHome() {
  const {
    sheets,
    loading,
    initialLoad,
    error,
    fetchSheets,
    updateSheetInCache,
    removeSheetFromCache,
    invalidateCache,
  } = useSheets();

  const [wizardOpen, setWizardOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bgLoading, setBgLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');

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

  const handleDeleteSheet = useCallback(async (password) => {
    setBgLoading(true);
    try {
      await sheetsApi.delete(deleteTarget._id, password);
      removeSheetFromCache(deleteTarget._id);
      setDeleteTarget(null);
    } finally {
      setBgLoading(false);
    }
  }, [deleteTarget, removeSheetFromCache]);

  const handleSheetUpdate = useCallback(
    (updated) => {
      updateSheetInCache(updated);
    },
    [updateSheetInCache]
  );

  const handleWizardClose = useCallback(() => {
    setWizardOpen(false);
  }, []);

  const handleSheetCreated = useCallback(() => {
    invalidateCache();
    fetchSheets(true);
  }, [invalidateCache, fetchSheets]);

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
      <TopProgressBar loading={bgLoading || (loading && !initialLoad)} />
      <Header actions={searchButton} />
      <SearchPanel isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      <main className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-6">
          <button
            type="button"
            onClick={() => setWizardOpen(true)}
            className="w-full lg:w-auto flex items-center justify-center gap-2 bg-slate-700 text-white px-4 py-3 rounded-lg hover:bg-slate-800 text-sm font-medium min-h-[44px] order-first lg:order-last"
          >
            <FiPlus className="w-5 h-5" />
            Create New Sheet
          </button>
        </div>

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
          <p className="text-center text-gray-500 py-12 text-sm sm:text-base">
            No sheets yet. Create your first sheet.
          </p>
        ) : emptyFilter ? (
          <p className="text-center text-gray-500 py-12 text-sm sm:text-base">
            No {activeFilter} sheets found.
          </p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {filteredSheets.map((sheet) => (
              <SheetCard
                key={sheet._id}
                sheet={sheet}
                onDelete={setDeleteTarget}
                onUpdate={handleSheetUpdate}
              />
            ))}
          </div>
        )}
      </main>

      <CreateSheetWizard
        isOpen={wizardOpen}
        onClose={handleWizardClose}
        onCreated={handleSheetCreated}
      />

      <DeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteSheet}
        itemType="sheet"
      />
    </div>
  );
}

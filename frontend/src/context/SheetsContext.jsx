import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from 'react';
import { sheetsApi } from '../api';

const SheetsContext = createContext(null);

export function SheetsProvider({ children }) {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState('');
  const cacheValid = useRef(false);

  const fetchSheets = useCallback(async (force = false) => {
    if (cacheValid.current && !force) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await sheetsApi.getAll();
      // Backend now returns { data: [...], pagination: {...} }
      const sheetList = res.data.data || res.data;
      setSheets(sheetList);
      cacheValid.current = true;
      return sheetList;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load sheets');
      throw err;
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, []);

  const invalidateCache = useCallback(() => {
    cacheValid.current = false;
  }, []);

  const updateSheetInCache = useCallback((updated) => {
    setSheets((prev) =>
      prev.map((s) => (s._id === updated._id ? { ...s, ...updated } : s))
    );
  }, []);

  const removeSheetFromCache = useCallback((id) => {
    setSheets((prev) => prev.filter((s) => s._id !== id));
    cacheValid.current = true;
  }, []);

  const addSheetToCache = useCallback((sheet) => {
    setSheets((prev) => [sheet, ...prev]);
    cacheValid.current = true;
  }, []);

  return (
    <SheetsContext.Provider
      value={{
        sheets,
        setSheets,
        loading,
        initialLoad,
        error,
        fetchSheets,
        invalidateCache,
        updateSheetInCache,
        removeSheetFromCache,
        addSheetToCache,
      }}
    >
      {children}
    </SheetsContext.Provider>
  );
}

export function useSheets() {
  const ctx = useContext(SheetsContext);
  if (!ctx) {
    throw new Error('useSheets must be used within SheetsProvider');
  }
  return ctx;
}

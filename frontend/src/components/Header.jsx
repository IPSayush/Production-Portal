import { FiLogOut, FiUser } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

export default function Header({ subtitle }) {
  const { user, logout, isViewer } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div>
        <h1 className="text-lg font-bold text-primary-700 tracking-tight">Production Portal</h1>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {isViewer && user?.name && (
          <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
             <FiUser className="w-4 h-4" />
             <span className="font-medium">{user.name}</span>
          </div>
        )}
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
        >
          <FiLogOut className="w-4 h-4" />
          <span className="hidden sm:inline font-medium">Logout</span>
        </button>
      </div>
    </header>
  );
}
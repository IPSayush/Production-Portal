import { FiLogOut } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

export default function Header({ subtitle }) {
  const { user, logout, isViewer } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
      <div>
        <h1 className="text-lg font-semibold text-gray-800">Production Portal</h1>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {isViewer && user?.name && (
          <span className="text-sm text-gray-600 hidden sm:inline">{user.name}</span>
        )}
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
        >
          <FiLogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}

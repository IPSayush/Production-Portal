import { useNavigate } from 'react-router-dom';
import { FiEye, FiSettings, FiBox } from 'react-icons/fi';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mb-10">
          <div className="w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-200">
            <FiBox className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Production Portal</h1>
          <p className="text-base text-slate-500 mt-2">Manage and track your daily production seamlessly.</p>
        </div>

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => navigate('/login?role=manager')}
            className="w-full bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-primary-300 hover:shadow-md text-left flex items-center gap-4 transition-all group"
          >
            <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary-200 transition-colors">
              <FiSettings className="w-7 h-7 text-primary-700" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-800 text-lg">Login as Manager</p>
              <p className="text-sm text-slate-500">Create, edit, and manage sheets</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/login?role=viewer')}
            className="w-full bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-slate-300 hover:shadow-md text-left flex items-center gap-4 transition-all group"
          >
            <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-slate-200 transition-colors">
              <FiEye className="w-7 h-7 text-slate-700" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-800 text-lg">Login as Viewer</p>
              <p className="text-sm text-slate-500">View production data (read-only)</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
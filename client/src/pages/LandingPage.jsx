import { useNavigate } from 'react-router-dom';
import { FiEye, FiSettings } from 'react-icons/fi';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mb-10">
          <div className="w-16 h-16 bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FiSettings className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Production Manager Portal</h1>
          <p className="text-sm text-gray-500 mt-2">Track daily production data</p>
        </div>

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => navigate('/login?role=manager')}
            className="w-full bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:border-slate-300 text-left flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
              <FiSettings className="w-6 h-6 text-slate-700" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">Login as Production Manager</p>
              <p className="text-sm text-gray-500">Create and manage production sheets</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/login?role=viewer')}
            className="w-full bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:border-slate-300 text-left flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
              <FiEye className="w-6 h-6 text-slate-700" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">Login as Viewer</p>
              <p className="text-sm text-gray-500">View production data (read-only)</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

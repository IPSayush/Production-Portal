import { FiLoader } from 'react-icons/fi';

export default function LoadingSpinner({ fullScreen = false }) {
  const wrapperClass = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm z-50'
    : 'flex items-center justify-center py-12';

  return (
    <div className={wrapperClass}>
      <FiLoader className="w-8 h-8 text-primary-600 animate-spin" />
    </div>
  );
}
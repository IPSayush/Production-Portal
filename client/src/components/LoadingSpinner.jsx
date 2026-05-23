import { FiLoader } from 'react-icons/fi';

export default function LoadingSpinner({ fullScreen = false }) {
  const wrapperClass = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50'
    : 'flex items-center justify-center py-12';

  return (
    <div className={wrapperClass}>
      <FiLoader className="w-8 h-8 text-slate-700 animate-spin" />
    </div>
  );
}

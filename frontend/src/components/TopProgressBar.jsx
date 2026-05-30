export default function TopProgressBar({ loading }) {
  return (
    <div
      className={`fixed top-0 left-0 h-0.5 bg-slate-600 transition-all duration-300 z-50 pointer-events-none ${
        loading ? 'w-3/4 opacity-100' : 'w-full opacity-0'
      }`}
      role="progressbar"
      aria-hidden={!loading}
    />
  );
}

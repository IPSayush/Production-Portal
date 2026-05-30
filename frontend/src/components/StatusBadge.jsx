const STATUS_STYLES = {
  Upcoming: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Working: 'bg-blue-100 text-blue-700 border-blue-200',
  Completed: 'bg-green-100 text-green-700 border-green-200',
};

const STATUS_OPTIONS = ['Upcoming', 'Working', 'Completed'];

export default function StatusBadge({ status = 'Upcoming', editable = false, onChange }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.Upcoming;

  if (editable && onChange) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${style}`}
        >
          {status}
        </span>
        <select
          value={status}
          onChange={(e) => onChange(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 min-h-[44px] sm:min-h-0 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
          aria-label="Change sheet status"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${style}`}
    >
      {status}
    </span>
  );
}

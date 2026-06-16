// import { FiLogOut } from 'react-icons/fi';
// import { useAuth } from '../context/AuthContext';

// export default function Header({ subtitle, title, centerTitle = false }) {
//   const { logout } = useAuth();

//   return (
//     <header className="bg-white border-b border-slate-200 px-4 flex items-center justify-between sticky top-0 z-30 shadow-sm h-[52px] md:h-[60px]">
//       {centerTitle ? (
//         <div className="flex-1" />
//       ) : (
//         <div className="min-w-0">
//           <h1 className="text-sm md:text-base font-bold text-slate-800 tracking-tight truncate">
//             {title || 'Production Portal'}
//           </h1>
//           {subtitle && (
//             <p className="text-xs text-slate-500 mt-0.5 truncate hidden sm:block">
//               {subtitle}
//             </p>
//           )}
//         </div>
//       )}

//       {centerTitle && (
//         <h1 className="text-sm md:text-base font-bold text-slate-800 text-center flex-1 px-2 truncate">
//           {title}
//         </h1>
//       )}

//       <button
//         type="button"
//         onClick={logout}
//         className="flex items-center justify-center gap-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] shrink-0"
//         title="Logout"
//       >
//         <FiLogOut className="w-5 h-5" />
//         <span className="hidden md:inline font-medium">Logout</span>
//       </button>
//     </header>
//   );
// }
import { FiLogOut } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

export default function Header({ subtitle, title, centerTitle = false, actions }) {
  const { logout } = useAuth();

  return (
    // 'relative' class add kiya gaya hai absolute positioning ke liye
    <header className="bg-white border-b border-slate-200 px-4 flex items-center justify-between sticky top-0 z-30 shadow-sm h-[52px] md:h-[60px] relative">
      
      {centerTitle ? (
        <div className="flex-1" />
      ) : (
        <div className="min-w-0">
          <h1 className="text-sm md:text-base font-bold text-slate-800 tracking-tight truncate">
            {title || 'Production Portal'}
          </h1>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5 truncate hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {centerTitle && (
        <h1 className="absolute left-1/2 -translate-x-1/2 text-sm md:text-base font-bold text-slate-800 tracking-tight truncate max-w-[50%] md:max-w-[60%] text-center px-2">
          {title}
        </h1>
      )}

      <div className="flex items-center gap-1 shrink-0">
        {actions}
        <button
          type="button"
          onClick={logout}
          className="flex items-center justify-center gap-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors min-w-[44px] min-h-[44px]"
          title="Logout"
        >
          <FiLogOut className="w-5 h-5" />
          <span className="hidden md:inline font-medium">Logout</span>
        </button>
      </div>
    </header>
  );
}
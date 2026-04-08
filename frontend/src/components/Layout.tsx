import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import {
  LayoutDashboard,
  PlusCircle,
  Package,
  Truck,
  Search,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/new-parcel', label: 'New Parcel', icon: PlusCircle },
  { to: '/parcels', label: 'Parcels', icon: Package },
  { to: '/drivers', label: 'Drivers', icon: Truck },
  { to: '/track', label: 'Track (Public)', icon: Search },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary-900 text-white transform transition-transform lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-primary-700">
          <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">TrackShip</h1>
            <p className="text-xs text-primary-400">Courier Tracker</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="px-3 py-4 space-y-1 flex-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-accent text-white'
                    : 'text-primary-300 hover:bg-primary-800 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-primary-700">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-sm font-bold">
              {user?.name?.[0] || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-primary-400 truncate">{user?.email}</p>
            </div>
            <button onClick={handleLogout} className="text-primary-400 hover:text-white">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 py-3 lg:hidden flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-primary-900">TrackShip</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

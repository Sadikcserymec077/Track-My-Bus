import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Bus, Users, UserCheck, MapPin, Bell, History, LogOut,
    LayoutDashboard, Menu, User
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import SOSAlertBanner from '../../components/SOSAlertBanner';

const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/admin/drivers', icon: UserCheck, label: 'Drivers' },
    { to: '/admin/students', icon: Users, label: 'Students' },
    { to: '/admin/buses', icon: Bus, label: 'Buses' },
    { to: '/admin/live-map', icon: MapPin, label: 'Live Map' },
    { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
    { to: '/admin/trip-history', icon: History, label: 'Trip History' },
];

export default function AdminLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        toast.success('Logged out');
        navigate('/login');
    };

    const Sidebar = () => (
        <div className="sidebar h-full flex flex-col">
            {/* Logo */}
            <div className="p-5 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
                        <Bus size={20} className="text-white" />
                    </div>
                    <div>
                        <p className="font-bold text-white text-sm">BusTrack</p>
                        <p className="text-xs text-slate-500">Admin Panel</p>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {navItems.map(({ to, icon: Icon, label, end }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={end}
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                ? 'bg-gradient-to-r from-blue-600/30 to-violet-600/20 text-white border border-blue-500/30'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`
                        }
                    >
                        <Icon size={18} />
                        {label}
                    </NavLink>
                ))}
            </nav>

            {/* User card + Profile link + Logout */}
            <div className="p-4 border-t border-slate-800 space-y-2">
                <NavLink to="/admin/profile" onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200 ${isActive
                            ? 'bg-slate-700 text-white'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`
                    }>
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {user?.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                        <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
                    </div>
                </NavLink>
                <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-red-500/10 hover:border-red-500/20 border border-transparent text-sm transition-all duration-200">
                    <LogOut size={16} /> Sign Out
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-slate-900">
            {/* SOS Alert Banner (floats over everything) */}
            <SOSAlertBanner />

            {/* Desktop sidebar */}
            <aside className="hidden md:flex w-60 flex-col flex-shrink-0">
                <Sidebar />
            </aside>

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 md:hidden">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
                    <aside className="relative w-64 h-full">
                        <Sidebar />
                    </aside>
                </div>
            )}

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile topbar */}
                <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900">
                    <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400">
                        <Menu size={20} />
                    </button>
                    <span className="font-bold gradient-text">BusTrack Admin</span>
                    <div className="w-9" />
                </div>

                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

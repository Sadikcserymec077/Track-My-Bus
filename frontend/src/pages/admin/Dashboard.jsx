import { useEffect, useState } from 'react';
import { getDashboard, getTripHistory } from '../../services/api';
import StatsCard from '../../components/StatsCard';
import { Bus, Users, UserCheck, Activity, TrendingUp, Clock, BarChart3 } from 'lucide-react';
import { getSocket } from '../../services/socket';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from 'recharts';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [recent, setRecent] = useState([]);
    const [liveCount, setLiveCount] = useState(0);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;
        socket.on('trip-started', () => { setLiveCount(c => c + 1); fetchData(); });
        socket.on('trip-stopped', () => { setLiveCount(c => Math.max(c - 1, 0)); fetchData(); });
        return () => {
            socket.off('trip-started');
            socket.off('trip-stopped');
        };
    }, []);

    const fetchData = async () => {
        try {
            const [sRes, tRes] = await Promise.all([getDashboard(), getTripHistory()]);
            setStats(sRes.data.data);
            setRecent(tRes.data.data?.slice(0, 5) || []);
            setAllTrips(tRes.data.data || []);
        } catch { }
    };

    const [allTrips, setAllTrips] = useState([]);

    // Prepare chart data from recent 10 completed trips
    const chartData = [...allTrips]
        .filter(t => t.status === 'completed')
        .slice(0, 10)
        .reverse()
        .map(t => ({
            name: `Bus ${t.busId?.busNumber}`,
            boarded: t.boardedStudents?.length || 0,
            date: new Date(t.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        }));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-slate-400 text-sm mt-1">Real-time bus fleet overview</p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard label="Total Buses" value={stats?.totalBuses} icon={Bus} color="blue" />
                <StatsCard label="Drivers" value={stats?.totalDrivers} icon={UserCheck} color="violet" />
                <StatsCard label="Students" value={stats?.totalStudents} icon={Users} color="emerald" />
                <StatsCard label="Active Trips" value={stats?.activeTrips} icon={Activity} color="amber"
                    subtitle={stats?.activeTrips > 0 ? 'Live now' : 'No active trips'} />
            </div>

            {/* Analytics Chart */}
            <div className="glass p-6 mt-6">
                <div className="flex items-center gap-2 mb-6">
                    <BarChart3 size={18} className="text-emerald-400" />
                    <h2 className="text-lg font-semibold text-white">Student Boardings Trend</h2>
                </div>
                <div className="h-64 w-full text-xs">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorBoarded" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                                    itemStyle={{ color: '#10b981' }}
                                />
                                <Area type="monotone" dataKey="boarded" name="Students Boarded" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorBoarded)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-500">Not enough data to graph</div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Recent trips */}
                <div className="glass p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Clock size={18} className="text-blue-400" />
                        <h2 className="text-lg font-semibold text-white">Recent Trips</h2>
                    </div>
                    {recent.length === 0 ? (
                        <p className="text-slate-500 text-sm text-center py-8">No trip history yet</p>
                    ) : (
                        <div className="space-y-3">
                            {recent.map((trip) => (
                                <div key={trip._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${trip.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                                        <div>
                                            <p className="text-sm font-medium text-white">Bus {trip.busId?.busNumber}</p>
                                            <p className="text-xs text-slate-400">Driver: {trip.driverId?.name}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`badge ${trip.status === 'active' ? 'badge-green' : trip.status === 'completed' ? 'badge-blue' : 'badge-red'}`}>
                                            {trip.status}
                                        </span>
                                        <p className="text-xs text-slate-500 mt-1">{new Date(trip.startTime).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Live pulse indicator moved here to keep grid layout balanced */}
                <div>
                    {stats?.activeTrips > 0 ? (
                        <div className="glass p-6 border border-emerald-500/20 bg-emerald-500/5 h-full flex flex-col justify-center items-center text-center">
                            <div className="status-active mb-4 w-12 h-12" />
                            <h3 className="text-xl font-bold text-emerald-400 mb-2">Live Fleet Tracking</h3>
                            <p className="text-sm text-emerald-200">
                                {stats.activeTrips} bus{stats.activeTrips > 1 ? 'es are' : ' is'} currently active.
                            </p>
                            <a href="/admin/live-map" className="mt-4 btn-primary animate-pulse">View Live Map</a>
                        </div>
                    ) : (
                        <div className="glass p-6 border border-slate-700/50 bg-slate-800/30 h-full flex flex-col justify-center items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center mb-4">
                                <Bus size={24} className="text-slate-500" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-400 mb-2">Fleet is Resting</h3>
                            <p className="text-sm text-slate-500">No active trips at the moment.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

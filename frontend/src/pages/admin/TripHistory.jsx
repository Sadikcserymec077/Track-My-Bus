import { useEffect, useState } from 'react';
import { getTripHistory } from '../../services/api';
import { History, Clock, Download, Map } from 'lucide-react';
import Modal from '../../components/Modal';
import ReplayMap from '../../components/ReplayMap';

function exportCSV(trips) {
    const rows = [['Date', 'Bus', 'Driver', 'Start Time', 'End Time', 'Duration', 'Students Boarded', 'Status']];
    trips.forEach(t => {
        const start = new Date(t.startTime);
        const end = t.endTime ? new Date(t.endTime) : null;
        const diffMs = end ? end - start : null;
        const dur = diffMs ? `${Math.floor(diffMs / 60000)}m` : 'Ongoing';
        rows.push([
            start.toLocaleDateString(),
            t.busId?.busNumber || '—',
            t.driverId?.name || '—',
            start.toLocaleTimeString(),
            end ? end.toLocaleTimeString() : '—',
            dur,
            t.boardedStudents?.length || 0,
            t.status
        ]);
    });
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trip-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

export default function TripHistory() {
    const [trips, setTrips] = useState([]);
    const [filter, setFilter] = useState('all');
    const [replayTrip, setReplayTrip] = useState(null);

    useEffect(() => {
        getTripHistory().then(r => setTrips(r.data.data)).catch(() => { });
    }, []);

    const filtered = filter === 'all' ? trips : trips.filter(t => t.status === filter);

    const duration = (start, end) => {
        if (!end) return 'Ongoing';
        const diff = Math.round((new Date(end) - new Date(start)) / 60000);
        return diff < 60 ? `${diff}m` : `${Math.floor(diff / 60)}h ${diff % 60}m`;
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <History size={22} className="text-slate-400" /> Trip History
                    </h1>
                    <p className="text-slate-400 text-sm mt-0.5">{trips.length} trips recorded</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Status filter */}
                    <select className="input-field py-2 text-sm" value={filter} onChange={e => setFilter(e.target.value)}>
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    {/* CSV Export */}
                    <button onClick={() => exportCSV(filtered)} disabled={filtered.length === 0}
                        className="btn-secondary flex items-center gap-2 py-2 px-4 text-sm disabled:opacity-50">
                        <Download size={14} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Total Trips', value: trips.length, color: 'text-blue-400' },
                    { label: 'Completed', value: trips.filter(t => t.status === 'completed').length, color: 'text-emerald-400' },
                    { label: 'Active', value: trips.filter(t => t.status === 'active').length, color: 'text-amber-400' },
                ].map(s => (
                    <div key={s.label} className="glass p-4 text-center">
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="space-y-3">
                {filtered.length === 0 ? (
                    <div className="glass p-10 text-center text-slate-500 text-sm">No trips found</div>
                ) : filtered.map(t => (
                    <div key={t._id} className="glass p-4 flex flex-col sm:flex-row sm:items-center gap-4 card-hover">
                        <div className="flex items-center gap-3 flex-1">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.status === 'active' ? 'bg-emerald-500/20' : t.status === 'completed' ? 'bg-blue-500/20' : 'bg-red-500/20'
                                }`}>
                                <span className="text-xl">🚌</span>
                            </div>
                            <div>
                                <p className="font-semibold text-white text-sm">Bus {t.busId?.busNumber}</p>
                                <p className="text-xs text-slate-400">Driver: {t.driverId?.name || '—'}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                            <div className="flex items-center gap-1.5"><Clock size={13} /> {new Date(t.startTime).toLocaleString()}</div>
                            {t.endTime && <div className="flex items-center gap-1.5">→ {new Date(t.endTime).toLocaleTimeString()}</div>}
                            <div className="text-white font-medium">⏱ {duration(t.startTime, t.endTime)}</div>
                            <div>👥 {t.boardedStudents?.length || 0} boarded</div>
                        </div>
                        <div className="flex items-center gap-3">
                            {t.isDelayed && <span className="badge badge-amber shrink-0">Delayed</span>}
                            <span className={`badge shrink-0 ${t.status === 'active' ? 'badge-green' : t.status === 'completed' ? 'badge-blue' : 'badge-red'}`}>
                                {t.status}
                            </span>
                            {(t.locationHistory && t.locationHistory.length > 0) && (
                                <button onClick={() => setReplayTrip(t)} className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors" title="Replay Trip Map">
                                    <Map size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Replay Modal */}
            <Modal isOpen={!!replayTrip} onClose={() => setReplayTrip(null)} title="Trip Replay" size="xl">
                {replayTrip && <ReplayMap trip={replayTrip} onClose={() => setReplayTrip(null)} />}
            </Modal>
        </div>
    );
}

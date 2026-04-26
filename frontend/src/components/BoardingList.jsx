import { useEffect, useState } from 'react';
import { getMyBusDriver, boardStudent } from '../services/api';
import { Users, CheckCircle2, Circle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BoardingList() {
    const [bus, setBus] = useState(null);
    const [boarded, setBoarded] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null);

    useEffect(() => { fetchBus(); }, []);

    const fetchBus = async () => {
        setLoading(true);
        try {
            const r = await getMyBusDriver();
            setBus(r.data.data);
        } catch { }
        setLoading(false);
    };

    const toggleBoard = async (studentId, studentName) => {
        setSaving(studentId);
        try {
            await boardStudent({ studentId });
            setBoarded(prev => {
                const next = new Set(prev);
                if (next.has(studentId)) { next.delete(studentId); toast(`✗ ${studentName} unmarked`); }
                else { next.add(studentId); toast.success(`✓ ${studentName} boarded`); }
                return next;
            });
        } catch { toast.error('Failed to update'); }
        setSaving(null);
    };

    if (loading) return <div className="glass p-8 text-center text-slate-500 text-sm">Loading students...</div>;
    if (!bus) return <div className="glass p-8 text-center text-slate-500 text-sm">No bus assigned</div>;

    const students = bus.studentIds || [];
    const boardedCount = boarded.size;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-base font-semibold text-white flex items-center gap-2">
                        <Users size={16} className="text-emerald-400" /> Boarding List
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{boardedCount} / {students.length} boarded</p>
                </div>
                <button onClick={fetchBus} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400">
                    <RefreshCw size={14} />
                </button>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500 rounded-full"
                    style={{ width: students.length ? `${(boardedCount / students.length) * 100}%` : '0%' }} />
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {students.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-6">No students assigned to this bus</p>
                ) : students.map(s => {
                    const id = s._id || s;
                    const name = s.name || 'Student';
                    const isBoarded = boarded.has(id);
                    return (
                        <button key={id} onClick={() => toggleBoard(id, name)} disabled={saving === id}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${isBoarded
                                ? 'bg-emerald-900/30 border-emerald-600/50 text-emerald-300'
                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                                }`}>
                            {saving === id ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                            ) : isBoarded ? (
                                <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
                            ) : (
                                <Circle size={20} className="text-slate-500 shrink-0" />
                            )}
                            <div className="text-left flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{name}</p>
                                {s.phone && <p className="text-xs text-slate-500 truncate">{s.phone}</p>}
                            </div>
                            {isBoarded && <span className="text-xs text-emerald-400 shrink-0">Boarded</span>}
                        </button>
                    );
                })}
            </div>

            {boardedCount === students.length && students.length > 0 && (
                <div className="glass p-3 text-center text-emerald-400 text-sm font-medium">
                    ✅ All students boarded!
                </div>
            )}
        </div>
    );
}

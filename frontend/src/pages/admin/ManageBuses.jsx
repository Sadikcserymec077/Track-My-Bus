import { useEffect, useState } from 'react';
import { getAllBuses, createBus, updateBus, deleteBus, getAllDrivers, assignDriverToBus } from '../../services/api';
import Modal from '../../components/Modal';
import StopEditor from '../../components/StopEditor';
import { Bus, Plus, Pencil, Trash2, UserCheck, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ManageBuses() {
    const [buses, setBuses] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState({ open: false, mode: 'create', data: null });
    const [assignModal, setAssignModal] = useState({ open: false, bus: null, driverId: '' });
    const [form, setForm] = useState({ busNumber: '', route: '' });
    const [loading, setLoading] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    useEffect(() => { fetchData(); }, []);
    useEffect(() => {
        setFiltered(buses.filter(b => b.busNumber.toLowerCase().includes(search.toLowerCase()) || (b.route || '').toLowerCase().includes(search.toLowerCase())));
    }, [search, buses]);

    const fetchData = async () => {
        try {
            const [bRes, dRes] = await Promise.all([getAllBuses(), getAllDrivers()]);
            setBuses(bRes.data.data); setDrivers(dRes.data.data);
        } catch { }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (modal.mode === 'create') { await createBus(form); toast.success('Bus created!'); }
            else { await updateBus(modal.data._id, form); toast.success('Bus updated!'); }
            setModal({ ...modal, open: false });
            fetchData();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
        finally { setLoading(false); }
    };

    const handleAssignDriver = async () => {
        if (!assignModal.driverId) return;
        try {
            await assignDriverToBus({ busId: assignModal.bus._id, driverId: assignModal.driverId });
            toast.success('Driver assigned!');
            setAssignModal({ open: false, bus: null, driverId: '' });
            fetchData();
        } catch (err) { toast.error('Failed'); }
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Bus size={22} className="text-blue-400" /> Buses</h1>
                    <p className="text-slate-400 text-sm">{buses.length} buses in fleet</p>
                </div>
                <button onClick={() => { setForm({ busNumber: '', route: '', stops: [] }); setModal({ open: true, mode: 'create', data: null }); }} className="btn-primary flex items-center gap-2 self-start sm:self-auto">
                    <Plus size={18} /> Add Bus
                </button>
            </div>

            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="input-field pl-9" placeholder="Search buses..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.length === 0 ? (
                    <div className="col-span-full glass p-10 text-center text-slate-500 text-sm">No buses found. Add your first bus!</div>
                ) : filtered.map(b => (
                    <div key={b._id} className="glass card-hover p-5 space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-2xl">🚌</span>
                                    <p className="text-lg font-bold text-white">Bus {b.busNumber}</p>
                                    {b.isActive && <span className="badge badge-green animate-pulse">Live</span>}
                                </div>
                                {b.route && <p className="text-xs text-slate-400 line-clamp-2">{b.route}</p>}
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => { setForm({ busNumber: b.busNumber, route: b.route || '', stops: b.stops || [] }); setModal({ open: true, mode: 'edit', data: b }); }} className="p-1.5 rounded-lg hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 transition-colors"><Pencil size={14} /></button>
                                <button onClick={() => setDeleteId(b._id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                            </div>
                        </div>

                        <div className="border-t border-slate-700 pt-3 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400">Driver</span>
                                {b.driverId ? (
                                    <span className="text-white font-medium">{b.driverId.name}</span>
                                ) : (
                                    <button onClick={() => setAssignModal({ open: true, bus: b, driverId: '' })} className="text-blue-400 hover:underline">Assign Driver</button>
                                )}
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400">Students</span>
                                <span className="text-white">{b.studentIds?.length || 0} assigned</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400">Stops</span>
                                <span className="text-white">{b.stops?.length || 0} stops</span>
                            </div>
                        </div>

                        {b.driverId && (
                            <button onClick={() => setAssignModal({ open: true, bus: b, driverId: b.driverId._id })} className="w-full text-xs text-slate-400 hover:text-blue-400 text-left transition-colors">
                                <UserCheck size={12} className="inline mr-1" /> Change Driver
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <Modal isOpen={modal.open} onClose={() => setModal({ ...modal, open: false })} title={modal.mode === 'create' ? 'Add Bus' : 'Edit Bus'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-slate-300 mb-1.5">Bus Number *</label>
                        <input className="input-field" placeholder="e.g. BUS-001" value={form.busNumber} onChange={e => setForm({ ...form, busNumber: e.target.value })} required />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-300 mb-1.5">Route Description</label>
                        <textarea className="input-field resize-none" rows={2} placeholder="e.g. Main Gate → Library → Hostel" value={form.route} onChange={e => setForm({ ...form, route: e.target.value })} />
                    </div>
                    <StopEditor stops={form.stops || []} onChange={stops => setForm({ ...form, stops })} />
                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={() => setModal({ ...modal, open: false })} className="btn-secondary flex-1">Cancel</button>
                        <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Saving...' : modal.mode === 'create' ? 'Create Bus' : 'Save'}</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={assignModal.open} onClose={() => setAssignModal({ open: false, bus: null, driverId: '' })} title="Assign Driver" size="sm">
                <p className="text-sm text-slate-300 mb-4">Assign driver to <strong>Bus {assignModal.bus?.busNumber}</strong></p>
                <select className="input-field mb-4" value={assignModal.driverId} onChange={e => setAssignModal({ ...assignModal, driverId: e.target.value })}>
                    <option value="">Select a driver</option>
                    {drivers.map(d => <option key={d._id} value={d._id}>{d.name} {d.phone ? `(${d.phone})` : ''}</option>)}
                </select>
                <div className="flex gap-3">
                    <button onClick={() => setAssignModal({ open: false, bus: null, driverId: '' })} className="btn-secondary flex-1">Cancel</button>
                    <button onClick={handleAssignDriver} className="btn-primary flex-1">Assign</button>
                </div>
            </Modal>

            <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Bus" size="sm">
                <p className="text-slate-300 text-sm mb-6">Delete this bus permanently?</p>
                <div className="flex gap-3">
                    <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancel</button>
                    <button onClick={async () => { await deleteBus(deleteId); setDeleteId(null); fetchData(); toast.success('Bus deleted'); }} className="btn-danger flex-1">Delete</button>
                </div>
            </Modal>
        </div>
    );
}

import { useEffect, useState } from 'react';
import { getAllDrivers, createDriver, updateDriver, deleteDriver } from '../../services/api';
import Modal from '../../components/Modal';
import { UserCheck, Plus, Pencil, Trash2, Phone, IdCard, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ManageDrivers() {
    const [drivers, setDrivers] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [modal, setModal] = useState({ open: false, mode: 'create', data: null });
    const [form, setForm] = useState({ name: '', phone: '', registrationId: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [deleteId, setDeleteId] = useState(null);

    useEffect(() => { fetchDrivers(); }, []);
    useEffect(() => {
        setFiltered(drivers.filter(d =>
            d.name.toLowerCase().includes(search.toLowerCase()) ||
            (d.phone || '').includes(search) ||
            (d.registrationId || '').toLowerCase().includes(search.toLowerCase())
        ));
    }, [search, drivers]);

    const fetchDrivers = async () => {
        try { const r = await getAllDrivers(); setDrivers(r.data.data); } catch { }
    };

    const openCreate = () => {
        setForm({ name: '', phone: '', registrationId: '', password: '' });
        setModal({ open: true, mode: 'create', data: null });
    };
    const openEdit = (d) => {
        setForm({ name: d.name, phone: d.phone || '', registrationId: d.registrationId || '', password: '' });
        setModal({ open: true, mode: 'edit', data: d });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (modal.mode === 'create') {
                await createDriver(form);
                toast.success('Driver created successfully!');
            } else {
                await updateDriver(modal.data._id, form);
                toast.success('Driver updated!');
            }
            setModal({ ...modal, open: false });
            fetchDrivers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation failed');
        } finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        try {
            await deleteDriver(id);
            toast.success('Driver deleted');
            setDeleteId(null);
            fetchDrivers();
        } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2"><UserCheck size={22} className="text-violet-400" /> Drivers</h1>
                    <p className="text-slate-400 text-sm mt-0.5">{drivers.length} total driver{drivers.length !== 1 ? 's' : ''}</p>
                </div>
                <button onClick={openCreate} className="btn-primary flex items-center gap-2 self-start sm:self-auto">
                    <Plus size={18} /> Add Driver
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="input-field pl-9" placeholder="Search drivers..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Table */}
            <div className="glass overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-700">
                                {['Name', 'Phone', 'Reg ID', 'Assigned Bus', 'Status', 'Actions'].map(h => (
                                    <th key={h} className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-5 py-3">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {filtered.length === 0 ? (
                                <tr><td colSpan={6} className="text-center text-slate-500 text-sm py-10">No drivers found</td></tr>
                            ) : filtered.map(d => (
                                <tr key={d._id} className="hover:bg-slate-800/40 transition-colors">
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-xs font-bold text-white">{d.name[0]}</div>
                                            <span className="text-sm font-medium text-white">{d.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 text-sm text-slate-300">{d.phone || '—'}</td>
                                    <td className="px-5 py-3.5 text-sm text-slate-300">{d.registrationId || '—'}</td>
                                    <td className="px-5 py-3.5 text-sm text-slate-300">{d.assignedBusId?.busNumber || <span className="text-slate-500">None</span>}</td>
                                    <td className="px-5 py-3.5">
                                        {d.isFirstLogin ? <span className="badge badge-yellow">First Login</span> : <span className="badge badge-green">Active</span>}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 transition-colors"><Pencil size={15} /></button>
                                            <button onClick={() => setDeleteId(d._id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={15} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Modal */}
            <Modal isOpen={modal.open} onClose={() => setModal({ ...modal, open: false })} title={modal.mode === 'create' ? 'Add New Driver' : 'Edit Driver'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name *</label>
                        <input className="input-field" placeholder="Driver name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Phone</label>
                            <input className="input-field" placeholder="Phone number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Registration ID</label>
                            <input className="input-field" placeholder="DRV001" value={form.registrationId} onChange={e => setForm({ ...form, registrationId: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">{modal.mode === 'create' ? 'Password *' : 'New Password (leave blank to keep)'}</label>
                        <input type="password" className="input-field" placeholder="Set login password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={modal.mode === 'create'} />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setModal({ ...modal, open: false })} className="btn-secondary flex-1">Cancel</button>
                        <button type="submit" disabled={loading} className="btn-primary flex-1">
                            {loading ? 'Saving...' : modal.mode === 'create' ? 'Create Driver' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete confirm */}
            <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Driver" size="sm">
                <p className="text-slate-300 text-sm mb-6">Are you sure you want to delete this driver? This cannot be undone.</p>
                <div className="flex gap-3">
                    <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancel</button>
                    <button onClick={() => handleDelete(deleteId)} className="btn-danger flex-1">Delete</button>
                </div>
            </Modal>
        </div>
    );
}

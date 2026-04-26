import { useEffect, useState } from 'react';
import { getAllStudents, createStudent, updateStudent, deleteStudent, getAllBuses, assignStudentToBus, removeStudentFromBus } from '../../services/api';
import Modal from '../../components/Modal';
import { Users, Plus, Pencil, Trash2, Search, Bus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ManageStudents() {
    const [students, setStudents] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [buses, setBuses] = useState([]);
    const [modal, setModal] = useState({ open: false, mode: 'create', data: null });
    const [assignModal, setAssignModal] = useState({ open: false, student: null, busId: '' });
    const [form, setForm] = useState({ name: '', phone: '', registrationId: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [deleteId, setDeleteId] = useState(null);

    useEffect(() => { fetchData(); }, []);
    useEffect(() => {
        setFiltered(students.filter(s =>
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            (s.phone || '').includes(search) ||
            (s.registrationId || '').toLowerCase().includes(search.toLowerCase())
        ));
    }, [search, students]);

    const fetchData = async () => {
        try {
            const [sRes, bRes] = await Promise.all([getAllStudents(), getAllBuses()]);
            setStudents(sRes.data.data); setBuses(bRes.data.data);
        } catch { }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (modal.mode === 'create') { await createStudent(form); toast.success('Student created!'); }
            else { await updateStudent(modal.data._id, form); toast.success('Student updated!'); }
            setModal({ ...modal, open: false });
            fetchData();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
        finally { setLoading(false); }
    };

    const handleAssign = async () => {
        if (!assignModal.busId) return;
        try {
            await assignStudentToBus({ busId: assignModal.busId, studentId: assignModal.student._id });
            toast.success('Student assigned to bus!');
            setAssignModal({ open: false, student: null, busId: '' });
            fetchData();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const handleUnassign = async (s) => {
        if (!s.assignedBusId) return;
        try {
            await removeStudentFromBus({ busId: s.assignedBusId._id || s.assignedBusId, studentId: s._id });
            toast.success('Student unassigned');
            fetchData();
        } catch (err) { toast.error('Failed to unassign'); }
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Users size={22} className="text-emerald-400" /> Students</h1>
                    <p className="text-slate-400 text-sm">{students.length} total students</p>
                </div>
                <button onClick={() => { setForm({ name: '', phone: '', registrationId: '', password: '' }); setModal({ open: true, mode: 'create', data: null }); }} className="btn-primary flex items-center gap-2 self-start sm:self-auto">
                    <Plus size={18} /> Add Student
                </button>
            </div>

            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="input-field pl-9" placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <div className="glass overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-700">
                                {['Name', 'Phone', 'Reg ID', 'Bus', 'Actions'].map(h => (
                                    <th key={h} className="text-left text-xs font-medium text-slate-400 uppercase px-5 py-3">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {filtered.length === 0 ? (
                                <tr><td colSpan={5} className="text-center text-slate-500 text-sm py-10">No students found</td></tr>
                            ) : filtered.map(s => (
                                <tr key={s._id} className="hover:bg-slate-800/40 transition-colors">
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-xs font-bold text-white">{s.name[0]}</div>
                                            <span className="text-sm font-medium text-white">{s.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 text-sm text-slate-300">{s.phone || '—'}</td>
                                    <td className="px-5 py-3.5 text-sm text-slate-300">{s.registrationId || '—'}</td>
                                    <td className="px-5 py-3.5">
                                        {s.assignedBusId ? (
                                            <div className="flex items-center gap-1.5">
                                                <span className="badge badge-blue">🚌 {s.assignedBusId.busNumber}</span>
                                                <button onClick={() => handleUnassign(s)} className="text-xs text-slate-500 hover:text-red-400 transition-colors">×</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setAssignModal({ open: true, student: s, busId: '' })} className="text-xs text-blue-400 hover:underline">+ Assign Bus</button>
                                        )}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => { setForm({ name: s.name, phone: s.phone || '', registrationId: s.registrationId || '', password: '' }); setModal({ open: true, mode: 'edit', data: s }); }} className="p-1.5 rounded-lg hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 transition-colors"><Pencil size={15} /></button>
                                            <button onClick={() => setDeleteId(s._id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={15} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={modal.open} onClose={() => setModal({ ...modal, open: false })} title={modal.mode === 'create' ? 'Add Student' : 'Edit Student'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-slate-300 mb-1.5">Full Name *</label>
                        <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-sm text-slate-300 mb-1.5">Phone</label><input className="input-field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                        <div><label className="block text-sm text-slate-300 mb-1.5">Reg ID</label><input className="input-field" value={form.registrationId} onChange={e => setForm({ ...form, registrationId: e.target.value })} /></div>
                    </div>
                    <div>
                        <label className="block text-sm text-slate-300 mb-1.5">{modal.mode === 'create' ? 'Password *' : 'New Password'}</label>
                        <input type="password" className="input-field" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={modal.mode === 'create'} />
                    </div>
                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={() => setModal({ ...modal, open: false })} className="btn-secondary flex-1">Cancel</button>
                        <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Saving...' : modal.mode === 'create' ? 'Create' : 'Save'}</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={assignModal.open} onClose={() => setAssignModal({ open: false, student: null, busId: '' })} title="Assign Bus" size="sm">
                <p className="text-sm text-slate-300 mb-4">Assign bus to <strong>{assignModal.student?.name}</strong></p>
                <select className="input-field mb-4" value={assignModal.busId} onChange={e => setAssignModal({ ...assignModal, busId: e.target.value })}>
                    <option value="">Select a bus</option>
                    {buses.map(b => <option key={b._id} value={b._id}>Bus {b.busNumber} {b.driverId?.name ? `— ${b.driverId.name}` : ''}</option>)}
                </select>
                <div className="flex gap-3">
                    <button onClick={() => setAssignModal({ open: false, student: null, busId: '' })} className="btn-secondary flex-1">Cancel</button>
                    <button onClick={handleAssign} className="btn-primary flex-1">Assign</button>
                </div>
            </Modal>

            <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Student" size="sm">
                <p className="text-slate-300 text-sm mb-6">Delete this student permanently?</p>
                <div className="flex gap-3">
                    <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancel</button>
                    <button onClick={async () => { await deleteStudent(deleteId); setDeleteId(null); fetchData(); toast.success('Deleted'); }} className="btn-danger flex-1">Delete</button>
                </div>
            </Modal>
        </div>
    );
}

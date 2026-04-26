import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/api';
import { User, Phone, KeyRound, IdCard, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Profile() {
    const { user, updateUser } = useAuth();
    const [tab, setTab] = useState('info');
    const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
    const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
    const [loading, setLoading] = useState(false);

    const handleUpdateInfo = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateProfile(form);
            updateUser({ name: form.name, phone: form.phone });
            toast.success('Profile updated!');
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
        finally { setLoading(false); }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passForm.newPassword !== passForm.confirm) { toast.error('Passwords do not match'); return; }
        if (passForm.newPassword.length < 6) { toast.error('Minimum 6 characters'); return; }
        setLoading(true);
        try {
            const { changePassword } = await import('../services/api');
            await changePassword({ currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
            toast.success('Password changed!');
            setPassForm({ currentPassword: '', newPassword: '', confirm: '' });
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
        finally { setLoading(false); }
    };

    const roleBadge = { admin: '👨‍💼 Admin', driver: '🚗 Driver', student: '🎓 Student' };

    return (
        <div className="space-y-5 max-w-lg">
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2"><User size={22} className="text-blue-400" /> Profile</h1>
                <p className="text-slate-400 text-sm mt-0.5">Manage your account information</p>
            </div>

            {/* Avatar card */}
            <div className="glass p-5 flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-2xl font-bold text-white shrink-0">
                    {user?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                    <p className="text-lg font-bold text-white">{user?.name}</p>
                    <p className="text-sm text-slate-400">{user?.phone || user?.email || user?.registrationId}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 mt-1 inline-block">
                        {roleBadge[user?.role]}
                    </span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-700">
                {[{ key: 'info', label: 'Basic Info' }, { key: 'password', label: 'Change Password' }].map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`px-5 py-2.5 text-sm font-medium transition-colors ${tab === t.key ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-white'}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === 'info' && (
                <div className="glass p-6">
                    <form onSubmit={handleUpdateInfo} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-1.5"><User size={13} /> Full Name</label>
                            <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-1.5"><Phone size={13} /> Phone</label>
                            <input className="input-field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                        </div>
                        {user?.registrationId && (
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-1.5"><IdCard size={13} /> Registration ID</label>
                                <input className="input-field bg-slate-800 cursor-not-allowed" value={user.registrationId} disabled />
                            </div>
                        )}
                        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                            <Save size={16} /> {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>
                </div>
            )}

            {tab === 'password' && (
                <div className="glass p-6">
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-1.5"><KeyRound size={13} /> Current Password</label>
                            <input type="password" className="input-field" value={passForm.currentPassword} onChange={e => setPassForm({ ...passForm, currentPassword: e.target.value })} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">New Password</label>
                            <input type="password" className="input-field" placeholder="Min 6 characters" value={passForm.newPassword} onChange={e => setPassForm({ ...passForm, newPassword: e.target.value })} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm New Password</label>
                            <input type="password" className="input-field" value={passForm.confirm} onChange={e => setPassForm({ ...passForm, confirm: e.target.value })} required />
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                            <KeyRound size={16} /> {loading ? 'Updating...' : 'Change Password'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}

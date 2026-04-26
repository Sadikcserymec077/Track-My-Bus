import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { changePassword } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Bus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChangePassword() {
    const { user, updateUser, logout } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.newPassword !== form.confirm) { toast.error('Passwords do not match'); return; }
        if (form.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
        setLoading(true);
        try {
            await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
            toast.success('Password changed successfully!');
            updateUser({ isFirstLogin: false });
            const role = user?.role;
            if (role === 'driver') navigate('/driver');
            else if (role === 'admin') navigate('/admin');
            else navigate('/student');
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password'); }
        finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 mb-4 shadow-xl">
                        <KeyRound size={28} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Set Your Password</h1>
                    {user?.isFirstLogin && <p className="text-amber-400 text-sm mt-2">⚠️ Please set a new password before continuing</p>}
                </div>

                <div className="glass p-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Current Password</label>
                            <input type="password" className="input-field" placeholder="Enter current password" value={form.currentPassword} onChange={e => setForm({ ...form, currentPassword: e.target.value })} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">New Password</label>
                            <input type="password" className="input-field" placeholder="Min 6 characters" value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm New Password</label>
                            <input type="password" className="input-field" placeholder="Repeat new password" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} required />
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                            {loading ? 'Updating...' : 'Set New Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

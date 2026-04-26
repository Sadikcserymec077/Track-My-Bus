import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser, registerParent } from '../services/api';
import { Bus, Eye, EyeOff, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
    const [isRegister, setIsRegister] = useState(false);
    const [form, setForm] = useState({ identifier: '', password: '', name: '', phone: '', studentRegistrationId: '' });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isRegister) {
                await registerParent({
                    name: form.name,
                    phone: form.phone,
                    password: form.password,
                    studentRegistrationId: form.studentRegistrationId
                });
                toast.success('Parent account created! Please sign in.');
                setIsRegister(false);
                setForm({ ...form, password: '' });
            } else {
                const res = await loginUser({ identifier: form.identifier, password: form.password });
                login(res.data.user, res.data.token);
                toast.success(`Welcome, ${res.data.user.name}!`);
                const role = res.data.user.role;
                if (role === 'admin') navigate('/admin');
                else if (role === 'driver') navigate('/driver');
                else if (role === 'parent') navigate('/parent');
                else navigate('/student');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || (isRegister ? 'Registration failed.' : 'Login failed. Please check credentials.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
                <div className="absolute top-20 left-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-20 right-20 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/5 rounded-full blur-2xl" />
            </div>

            <div className="relative z-10 w-full max-w-md px-4">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 mb-6 shadow-2xl shadow-blue-500/30">
                        <Bus className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold gradient-text mb-2">BusTrack</h1>
                    <p className="text-slate-400 text-sm">Smart Real-Time Bus Tracking System</p>
                </div>

                {/* Card */}
                <div className="glass p-8 shadow-2xl">
                    <h2 className="text-xl font-semibold text-white mb-6">{isRegister ? 'Parent Registration' : 'Sign in to your account'}</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isRegister && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                                    <input type="text" className="input-field" placeholder="Parent name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Phone Number</label>
                                    <input type="text" className="input-field" placeholder="Parent phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Student Registration ID</label>
                                    <input type="text" className="input-field" placeholder="Child's school ID" value={form.studentRegistrationId} onChange={e => setForm({ ...form, studentRegistrationId: e.target.value })} required />
                                </div>
                            </>
                        )}
                        {!isRegister && (
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Phone / ID / Email</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Enter phone, registration ID or email"
                                    value={form.identifier}
                                    onChange={e => setForm({ ...form, identifier: e.target.value })}
                                    required
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    className="input-field pr-12"
                                    placeholder="Enter your password"
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                >
                                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`${isRegister ? 'btn-secondary mt-4 w-full' : 'btn-primary w-full flex items-center justify-center gap-2 mt-4'}`}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                            ) : (
                                <>{!isRegister && <Zap size={18} />} {isRegister ? 'Register Parent Account' : 'Sign In'}</>
                            )}
                        </button>
                    </form>

                    <div className="text-center mt-6">
                        <button type="button" onClick={() => { setIsRegister(!isRegister); setForm({ identifier: '', password: '', name: '', phone: '', studentRegistrationId: '' }); }} className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                            {isRegister ? 'Already have an account? Sign in' : "I'm a Parent. Register here"}
                        </button>
                    </div>

                    {/* Role hints */}
                    <div className="mt-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                        <p className="text-xs text-slate-400 font-medium mb-2">Demo Credentials</p>
                        <div className="space-y-1 text-xs text-slate-500">
                            <p><span className="text-blue-400 font-medium">Admin:</span> phone=admin / pass=admin123</p>
                            <p><span className="text-emerald-400 font-medium">Driver:</span> phone=driver1 / pass=driver123</p>
                            <p><span className="text-violet-400 font-medium">Student:</span> phone=9876543210 / pass=student123</p>
                        </div>
                    </div>
                </div>

                <p className="text-center text-xs text-slate-600 mt-6">
                    © 2024 BusTrack — Powered by Socket.IO & Leaflet Maps
                </p>
            </div>
        </div>
    );
}

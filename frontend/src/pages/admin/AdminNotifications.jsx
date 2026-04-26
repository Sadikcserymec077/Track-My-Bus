import { useState } from 'react';
import { sendNotification } from '../../services/api';
import { Bell, Send, Users, UserCheck, Bus } from 'lucide-react';
import toast from 'react-hot-toast';

const types = ['general', 'reminder', 'delay', 'trip_start', 'trip_stop'];
const roles = [
    { value: 'student', label: 'All Students', icon: Users, color: 'emerald' },
    { value: 'driver', label: 'All Drivers', icon: UserCheck, color: 'violet' },
    { value: 'all', label: 'Everyone', icon: Bus, color: 'blue' },
];

export default function AdminNotifications() {
    const [form, setForm] = useState({ title: '', message: '', type: 'general', broadcastToRole: 'student' });
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState([]);

    const handleSend = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await sendNotification(form);
            toast.success('Notification sent!');
            setSent(prev => [{ ...form, sentAt: new Date() }, ...prev.slice(0, 9)]);
            setForm({ title: '', message: '', type: 'general', broadcastToRole: 'student' });
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to send'); }
        finally { setLoading(false); }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Bell size={22} className="text-amber-400" /> Notifications</h1>
                <p className="text-slate-400 text-sm mt-0.5">Send push notifications to drivers or students</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Compose */}
                <div className="glass p-6">
                    <h2 className="text-lg font-semibold text-white mb-5">Send Notification</h2>
                    <form onSubmit={handleSend} className="space-y-4">
                        <div>
                            <label className="block text-sm text-slate-300 mb-1.5">Title *</label>
                            <input className="input-field" placeholder="Notification title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-300 mb-1.5">Message *</label>
                            <textarea className="input-field resize-none" rows={4} placeholder="Type your message..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm text-slate-300 mb-1.5">Type</label>
                                <select className="input-field" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                    {types.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-300 mb-1.5">Send To</label>
                                <select className="input-field" value={form.broadcastToRole} onChange={e => setForm({ ...form, broadcastToRole: e.target.value })}>
                                    {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                </select>
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send size={16} /> Send Notification</>}
                        </button>
                    </form>
                </div>

                {/* Quick templates */}
                <div className="glass p-6">
                    <h2 className="text-lg font-semibold text-white mb-5">Quick Templates</h2>
                    <div className="space-y-3">
                        {[
                            { title: '🚌 Trip Reminder', message: 'Please start your trip on time. Students are waiting.', type: 'reminder', role: 'driver' },
                            { title: '⏰ Bus Delayed', message: 'Bus is delayed by 15 minutes. Please be patient.', type: 'delay', role: 'student' },
                            { title: '✅ Trip Started', message: 'Your bus has started. Track it on the app.', type: 'trip_start', role: 'student' },
                            { title: '🏁 All Trips Completed', message: 'All buses have completed their trips for today.', type: 'general', role: 'all' },
                        ].map((tpl, i) => (
                            <button key={i} onClick={() => setForm({ title: tpl.title, message: tpl.message, type: tpl.type, broadcastToRole: tpl.role })}
                                className="w-full text-left p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors">
                                <p className="text-sm font-medium text-white">{tpl.title}</p>
                                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{tpl.message}</p>
                            </button>
                        ))}
                    </div>

                    {sent.length > 0 && (
                        <div className="mt-6 border-t border-slate-700 pt-4">
                            <h3 className="text-sm font-medium text-slate-300 mb-3">Recently Sent</h3>
                            <div className="space-y-2">
                                {sent.map((n, i) => (
                                    <div key={i} className="text-xs text-slate-400 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                        <span className="truncate">{n.title} → {n.broadcastToRole}</span>
                                        <span className="text-slate-600 ml-auto shrink-0">{n.sentAt.toLocaleTimeString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

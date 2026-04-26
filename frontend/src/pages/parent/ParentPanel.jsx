import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMyBusStudent, getStudentNotifications, markNotificationRead } from '../../services/api';
import { getSocket, joinBusRoom } from '../../services/socket';
import MapView from '../../components/MapView';
import { useNavigate } from 'react-router-dom';
import { Bus, MapPin, Bell, LogOut, Navigation, Clock, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function ParentPanel() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [myBus, setMyBus] = useState(null);
    const [notifs, setNotifs] = useState([]);
    const [tab, setTab] = useState('map');
    const [eta, setEta] = useState(null);
    const [busLocation, setBusLocation] = useState(null);
    const [userPos, setUserPos] = useState(null);

    useEffect(() => {
        fetchData();
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(p => setUserPos({ latitude: p.coords.latitude, longitude: p.coords.longitude }));
        }
    }, []);

    const fetchData = async () => {
        try {
            // Reusing student endpoints as they now support the parent role checking child_id
            const [busRes, notifRes] = await Promise.all([getMyBusStudent(), getStudentNotifications()]);
            const bus = busRes.data.data;
            setMyBus(bus);
            setNotifs(notifRes.data.data);
            if (bus?.currentLocation?.latitude) {
                setBusLocation({ latitude: bus.currentLocation.latitude, longitude: bus.currentLocation.longitude });
            }
            if (bus?._id) joinBusRoom(bus._id);
        } catch { }
    };

    useEffect(() => {
        const socket = getSocket();
        if (!socket || !myBus) return;

        socket.on('location-update', ({ busId, latitude, longitude, speed }) => {
            if (busId === myBus._id || busId?.toString() === myBus._id?.toString()) {
                setBusLocation({ latitude, longitude });
            }
            computeETA(latitude, longitude, speed);
        });
        socket.on('trip-started', (data) => {
            if (data.busId === myBus._id) toast.success(`🚌 Bus ${myBus.busNumber} has started!`);
        });
        socket.on('trip-stopped', (data) => {
            if (data.busId === myBus._id) { toast('Bus trip ended'); setBusLocation(null); }
        });
        socket.on('approaching-stop', (data) => toast.success(`Bus approaching ${data.stopName}!`, { icon: '🚏' }));
        socket.on('notification', (n) => {
            toast(n.title || n.message, { icon: '🔔' });
            setNotifs(prev => [{ ...n, status: 'unread', createdAt: new Date() }, ...prev]);
        });

        // Also listen for child SOS
        socket.on('sos-alert', (data) => {
            // Parent gets a local broadcast if their tracked bus triggers SOS
            if (data.busId === myBus._id) {
                toast.error(`EMERGENCY: ${data.message}`, { duration: 10000 });
            }
        });

        return () => {
            socket.off('location-update');
            socket.off('trip-started');
            socket.off('trip-stopped');
            socket.off('approaching-stop');
            socket.off('notification');
            socket.off('sos-alert');
        };
    }, [myBus]);

    const computeETA = (busLat, busLng, busSpeed) => {
        if (!userPos || !busLat || !busLng) return;
        const dist = haversine(busLat, busLng, userPos.latitude, userPos.longitude);
        const activeSpeed = (busSpeed && busSpeed > 5) ? busSpeed : 30;
        const minutes = Math.round((dist / activeSpeed) * 60);
        setEta(minutes);
    };

    const handleMarkRead = async (id) => {
        await markNotificationRead(id);
        setNotifs(n => n.map(x => x._id === id ? { ...x, status: 'read' } : x));
    };

    const unreadCount = notifs.filter(n => n.status === 'unread').length;
    const displayBuses = myBus && busLocation ? [{ ...myBus, currentLocation: { ...busLocation, updatedAt: new Date() } }] : [];

    return (
        <div className="min-h-screen bg-slate-900">
            {/* Header */}
            <div className="bg-slate-900/95 border-b border-slate-800 p-4 flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
                        <ShieldCheck size={18} className="text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white">Parent: {user?.name}</p>
                        <p className="text-xs text-slate-400">{myBus ? `Tracking Child's Bus ${myBus.busNumber}` : 'Child not assigned'}</p>
                    </div>
                </div>
                <button onClick={() => { logout(); navigate('/login'); }} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400"><LogOut size={16} /></button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-800">
                {[{ key: 'map', label: 'Track Bus', icon: MapPin }, { key: 'info', label: 'Bus Info', icon: Bus }, { key: 'notifs', label: `Alerts${unreadCount > 0 ? ` (${unreadCount})` : ''}`, icon: Bell }].map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${tab === t.key ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-white'}`}>
                        <t.icon size={16} /> <span className="hidden sm:inline">{t.label}</span>
                    </button>
                ))}
            </div>

            <div className="p-4 max-w-lg mx-auto space-y-4">
                {tab === 'map' && (
                    <>
                        {/* ETA */}
                        {eta !== null && busLocation && (
                            <div className="glass p-4 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                    <Clock size={16} className="text-indigo-400" />
                                    <span>Estimated arrival to your location</span>
                                </div>
                                <span className="text-2xl font-bold text-white">{eta < 1 ? '< 1' : eta} min</span>
                            </div>
                        )}

                        {/* Bus status */}
                        {myBus && (
                            <div className="glass p-3 flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${myBus.isActive || busLocation ? 'bg-indigo-400 animate-pulse' : 'bg-slate-600'}`} />
                                <p className="text-sm text-white">Bus {myBus.busNumber}</p>
                                <p className="text-xs text-slate-400 ml-auto">{myBus.isActive ? '🟢 On the way' : '⚪ Not started'}</p>
                            </div>
                        )}

                        <MapView buses={displayBuses} stops={myBus?.stops || []} height="460px"
                            center={busLocation ? [busLocation.latitude, busLocation.longitude] : null} />

                        {!busLocation && (
                            <div className="glass p-6 text-center text-slate-500 text-sm">Your child's bus hasn't started yet.</div>
                        )}
                    </>
                )}

                {tab === 'info' && myBus && (
                    <div className="space-y-4">
                        <div className="glass p-5 space-y-4">
                            <div className="flex items-center gap-4">
                                <span className="text-4xl">🚌</span>
                                <div>
                                    <p className="text-xl font-bold text-white">Bus {myBus.busNumber}</p>
                                    {myBus.isActive && <span className="badge badge-indigo">Active</span>}
                                </div>
                            </div>
                            {myBus.driverId && (
                                <div>
                                    <p className="text-xs text-slate-400 mb-1">Driver Contact</p>
                                    <p className="text-sm text-white">{myBus.driverId.name}</p>
                                    {myBus.driverId.phone && <p className="text-xs text-slate-400 hover:text-indigo-400"><a href={`tel:${myBus.driverId.phone}`}>{myBus.driverId.phone}</a></p>}
                                </div>
                            )}
                        </div>

                        {myBus.stops?.length > 0 && (
                            <div className="glass p-5">
                                <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Navigation size={14} className="text-indigo-400" /> Stops</p>
                                <div className="space-y-2">
                                    {myBus.stops.map((s, i) => (
                                        <div key={i} className="flex items-center gap-3 text-sm">
                                            <div className="w-6 h-6 rounded-full bg-slate-700 text-xs flex items-center justify-center text-slate-400 shrink-0">{i + 1}</div>
                                            <span className="text-white">{s.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {!myBus && tab === 'info' && (
                    <div className="glass p-8 text-center text-slate-500 text-sm">Child is not assigned to any bus.</div>
                )}

                {tab === 'notifs' && (
                    <div className="space-y-3">
                        {notifs.length === 0 ? (
                            <div className="glass p-8 text-center text-slate-500 text-sm">No recent alerts</div>
                        ) : notifs.map((n, i) => (
                            <div key={n._id || i} className={`glass p-4 flex items-start gap-3 cursor-pointer ${n.status === 'unread' ? 'border-l-2 border-indigo-500' : ''}`}
                                onClick={() => n._id && n.status === 'unread' && handleMarkRead(n._id)}>
                                <div className="text-xl shrink-0">{n.type === 'trip_start' ? '🚌' : n.type === 'sos' ? '🚨' : n.type === 'delay' ? '⏰' : '🔔'}</div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white">{n.title || 'Alert'}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">{n.message}</p>
                                    <p className="text-xs text-slate-600 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                                </div>
                                {n.status === 'unread' && <div className="w-2 h-2 rounded-full bg-indigo-400 shrink-0 mt-1" />}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMyBusStudent, getAllBusLocations, getStudentNotifications, markNotificationRead, studentSosAlert } from '../../services/api';
import { getSocket, joinBusRoom } from '../../services/socket';
import MapView from '../../components/MapView';
import { useNavigate } from 'react-router-dom';
import { Bus, MapPin, Bell, LogOut, Navigation, Clock, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function StudentPanel() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [myBus, setMyBus] = useState(null);
    const [allBuses, setAllBuses] = useState([]);
    const [showAllBuses, setShowAllBuses] = useState(false);
    const [notifs, setNotifs] = useState([]);
    const [tab, setTab] = useState('map');
    const [eta, setEta] = useState(null);
    const [busLocation, setBusLocation] = useState(null);
    const [userPos, setUserPos] = useState(null);
    const [sosLoading, setSosLoading] = useState(false);
    const [isOnboarded, setIsOnboarded] = useState(false);
    const watchId = useRef(null);

    useEffect(() => {
        fetchData();
        // Get user's continuous location for ETA and onboarding
        if (navigator.geolocation) {
            watchId.current = navigator.geolocation.watchPosition(
                p => setUserPos({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
                err => console.error('Geolocation error:', err),
                { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
            );
        }
        return () => {
            if (watchId.current && navigator.geolocation) {
                navigator.geolocation.clearWatch(watchId.current);
            }
        };
    }, []);

    // Emit student location
    useEffect(() => {
        const socket = getSocket();
        if (socket && userPos && myBus && !isOnboarded) {
            socket.emit('student-location', {
                latitude: userPos.latitude,
                longitude: userPos.longitude,
                busId: myBus._id
            });
        }
    }, [userPos, myBus, isOnboarded]);

    const fetchData = async () => {
        try {
            const [busRes, notifRes] = await Promise.all([getMyBusStudent(), getStudentNotifications()]);
            const bus = busRes.data.data;
            setMyBus(bus);
            setNotifs(notifRes.data.data);
            if (bus?.currentLocation?.latitude) {
                setBusLocation({ latitude: bus.currentLocation.latitude, longitude: bus.currentLocation.longitude });
            }
            // Join bus socket room
            if (bus?._id) joinBusRoom(bus._id);
        } catch { }
        try {
            const r = await getAllBusLocations();
            setAllBuses(r.data.data);
        } catch { }
    };

    useEffect(() => {
        const socket = getSocket();
        if (!socket || !myBus) return;
        socket.on('location-update', ({ busId, latitude, longitude, speed }) => {
            if (busId === myBus._id || busId?.toString() === myBus._id?.toString()) {
                setBusLocation({ latitude, longitude });
                setAllBuses(prev => prev.map(b => b._id === busId ? { ...b, currentLocation: { latitude, longitude, updatedAt: new Date() } } : b));
            }
            computeETA(latitude, longitude, speed);
        });
        socket.on('trip-started', (data) => {
            if (data.busId === myBus._id) toast.success(`🚌 Bus ${myBus.busNumber} has started!`);
        });
        socket.on('trip-stopped', (data) => {
            if (data.busId === myBus._id) { toast('Bus trip ended'); setBusLocation(null); }
        });
        socket.on('approaching-stop', (data) => toast.success(`Bus approaching ${data.stopName}! (${data.distance}m away)`, {
            icon: '🚏', style: { background: '#10b981', color: 'white', fontWeight: 'bold' }, duration: 6000
        }));
        socket.on('notification', (n) => {
            toast(n.title || n.message, { icon: '🔔' });
            setNotifs(prev => [{ ...n, status: 'unread', createdAt: new Date() }, ...prev]);
        });
        socket.on('student-onboarded', () => {
            setIsOnboarded(true);
            toast.success('You have boarded the bus!', { icon: '✅', style: { background: '#10b981', color: 'white' } });
        });
        return () => {
            socket.off('location-update');
            socket.off('trip-started');
            socket.off('trip-stopped');
            socket.off('approaching-stop');
            socket.off('notification');
            socket.off('student-onboarded');
        };
    }, [myBus]);

    const computeETA = (busLat, busLng, busSpeed) => {
        if (!userPos || !busLat || !busLng) return;
        const dist = haversine(busLat, busLng, userPos.latitude, userPos.longitude);
        // Use live speed if > 5 km/h, otherwise assume 30 km/h average
        const activeSpeed = (busSpeed && busSpeed > 5) ? busSpeed : 30;
        const minutes = Math.round((dist / activeSpeed) * 60);
        setEta(minutes);
    };

    const displayBuses = showAllBuses ? allBuses : (myBus && busLocation ? [{ ...myBus, currentLocation: { ...busLocation, updatedAt: new Date() } }] : []);

    const handleMarkRead = async (id) => {
        await markNotificationRead(id);
        setNotifs(n => n.map(x => x._id === id ? { ...x, status: 'read' } : x));
    };

    const unreadCount = notifs.filter(n => n.status === 'unread').length;

    const handleSOS = async () => {
        if (!userPos) return toast.error('Enable location services to send SOS');
        try {
            setSosLoading(true);
            await studentSosAlert({ latitude: userPos.latitude, longitude: userPos.longitude });
            toast.success('🚨 SOS SENT! Admin has been notified.', {
                style: { background: '#ef4444', color: '#fff', fontWeight: 'bold' },
                duration: 5000,
            });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send SOS');
        } finally {
            setSosLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900">
            {/* Header */}
            <div className="bg-slate-900/95 border-b border-slate-800 p-4 flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center">
                        <Bus size={18} className="text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white">{user?.name}</p>
                        <p className="text-xs text-slate-400">{myBus ? `Bus ${myBus.busNumber}` : 'No bus assigned'}</p>
                    </div>
                </div>
                <button onClick={() => { logout(); navigate('/login'); }} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400"><LogOut size={16} /></button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-800">
                {[{ key: 'map', label: 'Track Bus', icon: MapPin }, { key: 'info', label: 'Bus Info', icon: Bus }, { key: 'notifs', label: `Alerts${unreadCount > 0 ? ` (${unreadCount})` : ''}`, icon: Bell }].map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${tab === t.key ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400 hover:text-white'}`}>
                        <t.icon size={16} /> <span className="hidden sm:inline">{t.label}</span>
                    </button>
                ))}
            </div>

            <div className="p-4 max-w-lg mx-auto space-y-4">
                {tab === 'map' && (
                    <>
                        {/* Onboarded Status or ETA */}
                        {isOnboarded ? (
                            <div className="glass p-4 flex items-center justify-center gap-3 bg-emerald-500/10 border-emerald-500/30">
                                <span className="text-2xl">✅</span>
                                <span className="text-lg font-bold text-white">You are on board</span>
                            </div>
                        ) : (
                            eta !== null && busLocation && (
                                <div className="glass p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-slate-300">
                                        <Clock size={16} className="text-emerald-400" />
                                        <span>Estimated arrival</span>
                                    </div>
                                    <span className="text-2xl font-bold text-white">{eta < 1 ? '< 1' : eta} min</span>
                                </div>
                            )
                        )}

                        {/* Bus status */}
                        {myBus && (
                            <div className="glass p-3 flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${myBus.isActive || busLocation ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                                <p className="text-sm text-white">Bus {myBus.busNumber}</p>
                                <p className="text-xs text-slate-400 ml-auto">{myBus.isActive ? '🟢 On the way' : '⚪ Not started yet'}</p>
                            </div>
                        )}

                        {/* My Bus / All Buses toggle */}
                        <div className="flex items-center gap-3">
                            <span className={`text-sm font-medium ${!showAllBuses ? 'text-white' : 'text-slate-500'}`}>My Bus</span>
                            <button
                                onClick={() => setShowAllBuses(!showAllBuses)}
                                className={`relative w-12 h-6 rounded-full transition-colors ${showAllBuses ? 'bg-emerald-600' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${showAllBuses ? 'left-6' : 'left-0.5'}`} />
                            </button>
                            <span className={`text-sm font-medium ${showAllBuses ? 'text-white' : 'text-slate-500'}`}>All Buses</span>
                            {showAllBuses && <span className="badge badge-blue text-xs ml-auto">{allBuses.length} buses</span>}
                        </div>

                        <MapView buses={displayBuses} stops={myBus?.stops || []} height="420px"
                            center={busLocation ? [busLocation.latitude, busLocation.longitude] : null} />

                        {!busLocation && !showAllBuses && (
                            <div className="glass p-6 text-center text-slate-500 text-sm">Bus hasn't started yet. You'll see it here when the driver starts the trip.</div>
                        )}

                        {/* Student SOS Button */}
                        <div className="pt-2">
                            <button
                                onClick={handleSOS}
                                disabled={sosLoading || !userPos}
                                className="w-full btn-danger flex items-center justify-center gap-2 py-4 shadow-lg shadow-red-500/20 disabled:opacity-50"
                            >
                                <AlertTriangle size={20} className={sosLoading ? 'animate-spin' : 'animate-pulse'} />
                                <span className="font-bold">{sosLoading ? 'SENDING...' : 'SOS EMERGENCY HELP'}</span>
                            </button>
                        </div>
                    </>
                )}

                {tab === 'info' && myBus && (
                    <div className="space-y-4">
                        <div className="glass p-5 space-y-4">
                            <div className="flex items-center gap-4">
                                <span className="text-4xl">🚌</span>
                                <div>
                                    <p className="text-xl font-bold text-white">Bus {myBus.busNumber}</p>
                                    {myBus.isActive && <span className="badge badge-green">Active</span>}
                                </div>
                            </div>
                            {myBus.route && (
                                <div>
                                    <p className="text-xs text-slate-400 mb-1">Route</p>
                                    <p className="text-sm text-white">{myBus.route}</p>
                                </div>
                            )}
                            {myBus.driverId && (
                                <div>
                                    <p className="text-xs text-slate-400 mb-1">Driver</p>
                                    <p className="text-sm text-white">{myBus.driverId.name}</p>
                                    {myBus.driverId.phone && <p className="text-xs text-slate-400">{myBus.driverId.phone}</p>}
                                </div>
                            )}
                        </div>

                        {myBus.stops?.length > 0 && (
                            <div className="glass p-5">
                                <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Navigation size={14} className="text-blue-400" /> Stops ({myBus.stops.length})</p>
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
                    <div className="glass p-8 text-center text-slate-500 text-sm">No bus assigned. Please contact admin.</div>
                )}

                {tab === 'notifs' && (
                    <div className="space-y-3">
                        {notifs.length === 0 ? (
                            <div className="glass p-8 text-center text-slate-500 text-sm">No notifications yet</div>
                        ) : notifs.map((n, i) => (
                            <div key={n._id || i} className={`glass p-4 flex items-start gap-3 cursor-pointer ${n.status === 'unread' ? 'border-l-2 border-emerald-500' : ''}`}
                                onClick={() => n._id && n.status === 'unread' && handleMarkRead(n._id)}>
                                <div className="text-xl shrink-0">{n.type === 'trip_start' ? '🚌' : n.type === 'sos' ? '🚨' : n.type === 'delay' ? '⏰' : '🔔'}</div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white">{n.title || 'Notification'}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">{n.message}</p>
                                    <p className="text-xs text-slate-600 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                                </div>
                                {n.status === 'unread' && <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-1" />}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMyBusDriver, startTrip, stopTrip, sosAlert, getDriverTripHistory } from '../../services/api';
import { getSocket } from '../../services/socket';
import { useNavigate } from 'react-router-dom';
import MapView from '../../components/MapView';
import BoardingList from '../../components/BoardingList';
import { Bus, Play, Square, AlertTriangle, LogOut, MapPin, Users, History, Navigation } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DriverPanel() {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const [bus, setBus] = useState(null);
    const [tripActive, setTripActive] = useState(false);
    const [currentPos, setCurrentPos] = useState(null);
    const [tripHistory, setTripHistory] = useState([]);
    const [tab, setTab] = useState('dashboard');
    const [sosConfirm, setSosConfirm] = useState(false);
    const watchId = useRef(null);
    const socket = getSocket();

    useEffect(() => {
        // Redirect if first login
        if (user?.isFirstLogin) { navigate('/change-password'); return; }
        fetchBus();
        getDriverTripHistory().then(r => setTripHistory(r.data.data)).catch(() => { });
    }, []);

    const fetchBus = async () => {
        try { const r = await getMyBusDriver(); setBus(r.data.data); } catch { }
    };

    const handleStartTrip = async () => {
        try {
            await startTrip({ startLocation: currentPos || {} });
            setTripActive(true);
            toast.success('Trip started! Sharing your location...');
            startLocationTracking();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to start trip'); }
    };

    const handleStopTrip = async () => {
        try {
            stopLocationTracking();
            await stopTrip({ endLocation: currentPos || {} });
            setTripActive(false);
            toast.success('Trip stopped successfully!');
            getDriverTripHistory().then(r => setTripHistory(r.data.data)).catch(() => { });
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to stop trip'); }
    };

    const startLocationTracking = useCallback(() => {
        if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
        watchId.current = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude, speed, heading } = pos.coords;
                const locData = { latitude, longitude, speed: speed || 0, heading: heading || 0, timestamp: Date.now() };
                setCurrentPos({ latitude, longitude });

                if (navigator.onLine && socket?.connected) {
                    flushOfflineLocations();
                    socket.emit('send-location', locData);
                } else {
                    // Offline coords caching
                    const queue = JSON.parse(localStorage.getItem('offlineLocs') || '[]');
                    queue.push(locData);
                    localStorage.setItem('offlineLocs', JSON.stringify(queue));
                }
            },
            (err) => console.error('Geolocation error:', err),
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
        );
    }, [socket]);

    const flushOfflineLocations = () => {
        const queue = JSON.parse(localStorage.getItem('offlineLocs') || '[]');
        if (queue.length > 0 && socket?.connected) {
            queue.forEach(loc => socket.emit('send-location', loc));
            localStorage.setItem('offlineLocs', '[]');
            toast.success(`Synced ${queue.length} offline locations`);
        }
    };

    const stopLocationTracking = useCallback(() => {
        if (watchId.current !== null) {
            navigator.geolocation.clearWatch(watchId.current);
            watchId.current = null;
        }
    }, []);

    useEffect(() => {
        const handleOnline = () => flushOfflineLocations();
        window.addEventListener('online', handleOnline);
        return () => {
            stopLocationTracking();
            window.removeEventListener('online', handleOnline);
        };
    }, [stopLocationTracking]);

    const handleSOS = async () => {
        setSosConfirm(false);
        try {
            await sosAlert({ latitude: currentPos?.latitude, longitude: currentPos?.longitude, message: '' });
            toast.error('🚨 SOS Alert sent to admin!', { duration: 5000 });
        } catch { toast.error('SOS failed — try again!'); }
    };

    const handleLogout = () => { stopLocationTracking(); logout(); navigate('/login'); };

    const busArray = bus ? [{ ...bus, currentLocation: currentPos ? { latitude: currentPos.latitude, longitude: currentPos.longitude, updatedAt: new Date() } : bus.currentLocation }] : [];

    return (
        <div className="min-h-screen bg-slate-900">
            {/* Top bar */}
            <div className="bg-slate-900/95 border-b border-slate-800 p-4 flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
                        <Bus size={18} className="text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white">{user?.name}</p>
                        <p className="text-xs text-slate-400">{bus ? `Bus ${bus.busNumber}` : 'No bus assigned'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {tripActive && <div className="flex items-center gap-1.5 text-xs text-emerald-400 animate-pulse"><div className="w-2 h-2 rounded-full bg-emerald-400" /> Live</div>}
                    <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400"><LogOut size={16} /></button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-800 overflow-x-auto">
                {[{ key: 'dashboard', label: 'Dashboard', icon: Bus }, { key: 'map', label: 'My Location', icon: MapPin }, { key: 'boarding', label: 'Boarding', icon: Users }, { key: 'history', label: 'History', icon: History }].map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${tab === t.key ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-white'}`}>
                        <t.icon size={16} /> <span className="hidden sm:inline">{t.label}</span>
                    </button>
                ))}
            </div>

            <div className="p-4 space-y-4 max-w-lg mx-auto">
                {tab === 'dashboard' && (
                    <>
                        {/* Bus info */}
                        {bus ? (
                            <div className="glass p-5 space-y-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">🚌</span>
                                    <div>
                                        <p className="font-bold text-white text-lg">Bus {bus.busNumber}</p>
                                        <p className="text-sm text-slate-400">{bus.route || 'No route set'}</p>
                                    </div>
                                    {tripActive && <span className="badge badge-green ml-auto animate-pulse">Active Trip</span>}
                                </div>
                                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-white">{bus.studentIds?.length || 0}</p>
                                        <p className="text-xs text-slate-400">Students</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-white">{bus.stops?.length || 0}</p>
                                        <p className="text-xs text-slate-400">Stops</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="glass p-8 text-center text-slate-500">No bus assigned yet. Contact admin.</div>
                        )}

                        {/* Trip controls */}
                        {bus && (
                            <div className="space-y-3">
                                {!tripActive ? (
                                    <button onClick={handleStartTrip} className="btn-success w-full flex items-center justify-center gap-3 py-4 text-base">
                                        <Play size={20} fill="currentColor" /> Start Trip
                                    </button>
                                ) : (
                                    <button onClick={handleStopTrip} className="btn-danger w-full flex items-center justify-center gap-3 py-4 text-base">
                                        <Square size={20} fill="currentColor" /> Stop Trip
                                    </button>
                                )}

                                {/* SOS */}
                                <button onClick={() => setSosConfirm(true)}
                                    className="w-full py-4 bg-gradient-to-r from-red-700 to-rose-700 text-white font-bold rounded-xl border-2 border-red-500/50 flex items-center justify-center gap-2 hover:from-red-600 hover:to-rose-600 active:scale-95 transition-all sos-shake">
                                    <AlertTriangle size={20} /> SOS Emergency
                                </button>
                            </div>
                        )}

                        {currentPos && (
                            <div className="glass p-3 flex items-center gap-2 text-xs text-slate-400">
                                <Navigation size={12} className="text-blue-400" />
                                <span>GPS: {currentPos.latitude.toFixed(5)}, {currentPos.longitude.toFixed(5)}</span>
                            </div>
                        )}
                    </>
                )}

                {tab === 'map' && (
                    <div className="space-y-3">
                        <p className="text-sm text-slate-400">
                            {currentPos ? 'Your real-time location:' : 'Start a trip to share your location'}
                        </p>
                        <MapView buses={busArray} stops={bus?.stops || []} height="450px" center={currentPos ? [currentPos.latitude, currentPos.longitude] : null} />
                    </div>
                )}

                {tab === 'history' && (
                    <div className="space-y-3">
                        {tripHistory.length === 0 ? (
                            <div className="glass p-8 text-center text-slate-500 text-sm">No trips yet</div>
                        ) : tripHistory.map(t => (
                            <div key={t._id} className="glass p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-white">{new Date(t.startTime).toLocaleDateString()}</p>
                                    <p className="text-xs text-slate-400">{new Date(t.startTime).toLocaleTimeString()} — {t.endTime ? new Date(t.endTime).toLocaleTimeString() : 'Ongoing'}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{t.boardedStudents?.length || 0} students boarded</p>
                                </div>
                                <span className={`badge ${t.status === 'active' ? 'badge-green' : 'badge-blue'}`}>{t.status}</span>
                            </div>
                        ))}
                    </div>
                )}
                {tab === 'boarding' && (
                    <div className="glass p-4">
                        <BoardingList />
                    </div>
                )}
            </div>

            {/* SOS confirm */}
            {sosConfirm && (
                <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
                    <div className="glass p-6 max-w-sm w-full text-center">
                        <div className="text-5xl mb-4">🚨</div>
                        <h3 className="text-xl font-bold text-white mb-2">Send SOS Alert?</h3>
                        <p className="text-slate-400 text-sm mb-6">This will immediately alert the admin with your current location.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setSosConfirm(false)} className="btn-secondary flex-1">Cancel</button>
                            <button onClick={handleSOS} className="btn-danger flex-1">Send SOS</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

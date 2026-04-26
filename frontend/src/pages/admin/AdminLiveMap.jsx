import { useEffect, useState, useRef } from 'react';
import { getLiveLocations } from '../../services/api';
import { getSocket } from '../../services/socket';
import MapView from '../../components/MapView';
import { MapPin, RefreshCw, Radio } from 'lucide-react';

export default function AdminLiveMap() {
    const [buses, setBuses] = useState([]);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [fullscreen, setFullscreen] = useState(false);
    const intervalRef = useRef(null);

    useEffect(() => {
        fetchLocations();
        intervalRef.current = setInterval(fetchLocations, 10000);
        const socket = getSocket();
        if (socket) {
            socket.on('location-update', ({ busId, latitude, longitude }) => {
                setBuses(prev => prev.map(b =>
                    b._id === busId
                        ? { ...b, currentLocation: { latitude, longitude, updatedAt: new Date() } }
                        : b
                ));
                setLastUpdated(new Date());
            });
            socket.on('trip-started', () => fetchLocations());
            socket.on('trip-stopped', ({ busId }) => {
                setBuses(prev => prev.filter(b => b._id !== busId));
            });
        }
        return () => {
            clearInterval(intervalRef.current);
            if (socket) { socket.off('location-update'); socket.off('trip-started'); socket.off('trip-stopped'); }
        };
    }, []);

    const fetchLocations = async () => {
        try { const r = await getLiveLocations(); setBuses(r.data.data); setLastUpdated(new Date()); } catch { }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <MapPin size={22} className="text-red-400" /> Live Map
                    </h1>
                    {lastUpdated && <p className="text-xs text-slate-400 mt-0.5">Last updated: {lastUpdated.toLocaleTimeString()}</p>}
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                        <Radio size={14} className="animate-pulse" />
                        {buses.filter(b => b.currentLocation?.latitude).length} buses live
                    </div>
                    <button onClick={fetchLocations} className="btn-secondary flex items-center gap-2 py-2 px-4 text-sm">
                        <RefreshCw size={14} /> Refresh
                    </button>
                </div>
            </div>

            {/* Bus list */}
            <div className="flex gap-3 flex-wrap">
                {buses.map(b => (
                    <div key={b._id} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs">
                        <div className={`w-2 h-2 rounded-full ${b.currentLocation?.latitude ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                        <span className="text-white font-medium">Bus {b.busNumber}</span>
                        {b.driverId?.name && <span className="text-slate-400">— {b.driverId.name}</span>}
                    </div>
                ))}
                {buses.length === 0 && <p className="text-slate-500 text-sm">No active buses right now</p>}
            </div>

            <div className={`glass p-1 ${fullscreen ? 'fixed inset-4 z-50' : ''}`}>
                <div className="flex justify-end p-2">
                    <button onClick={() => setFullscreen(!fullscreen)} className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded">
                        {fullscreen ? '⛶ Exit Fullscreen' : '⛶ Fullscreen'}
                    </button>
                </div>
                <MapView buses={buses} height={fullscreen ? 'calc(100vh - 120px)' : '500px'} />
            </div>
        </div>
    );
}

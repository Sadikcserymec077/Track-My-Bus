import { useEffect, useState } from 'react';
import { getSocket } from '../services/socket';
import { AlertTriangle, X, MapPin } from 'lucide-react';

export default function SOSAlertBanner() {
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;
        socket.on('sos-alert', (data) => {
            const id = Date.now();
            setAlerts(prev => [{ ...data, id }, ...prev]);
            // Auto-dismiss after 60 seconds
            setTimeout(() => setAlerts(prev => prev.filter(a => a.id !== id)), 60000);
            // Play alert sound
            try { new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAA=').play().catch(() => { }); } catch { }
        });
        return () => socket.off('sos-alert');
    }, []);

    if (alerts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[200] space-y-2 max-w-sm w-full">
            {alerts.map(alert => (
                <div key={alert.id} className="bg-red-900 border-2 border-red-500 rounded-xl p-4 shadow-2xl animate-bounce-once">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center shrink-0 animate-pulse">
                            <AlertTriangle size={20} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-red-200 text-sm">🚨 SOS EMERGENCY</p>
                            <p className="text-white font-semibold">{alert.driverName}</p>
                            {alert.latitude && (
                                <a href={`https://maps.google.com/?q=${alert.latitude},${alert.longitude}`} target="_blank" rel="noopener noreferrer"
                                    className="text-xs text-red-300 hover:text-white flex items-center gap-1 mt-1">
                                    <MapPin size={10} /> View Location on Maps
                                </a>
                            )}
                            <p className="text-xs text-red-400 mt-1">{new Date(alert.timestamp).toLocaleTimeString()}</p>
                        </div>
                        <button onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))} className="text-red-400 hover:text-white p-1">
                            <X size={16} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

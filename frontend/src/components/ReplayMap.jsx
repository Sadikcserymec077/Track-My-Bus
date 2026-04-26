import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

function createIcon(color) {
    return new L.DivIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
}

function MapUpdater({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (center) map.setView(center, zoom || map.getZoom());
    }, [center, zoom, map]);
    return null;
}

export default function ReplayMap({ trip, onClose }) {
    const history = trip.locationHistory || [];
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const timerRef = useRef(null);

    // Filter out invalid coords just in case
    const validHistory = history.filter(h => h.latitude && h.longitude);

    useEffect(() => {
        if (isPlaying && currentIndex < validHistory.length - 1) {
            timerRef.current = setTimeout(() => {
                setCurrentIndex(prev => prev + 1);
            }, 300); // 300ms per point
        } else if (currentIndex >= validHistory.length - 1) {
            setIsPlaying(false);
        }
        return () => clearTimeout(timerRef.current);
    }, [isPlaying, currentIndex, validHistory.length]);

    if (!validHistory.length) {
        return (
            <div className="glass p-6 text-center">
                <p className="text-white mb-4">No GPS history available for this trip.</p>
                <button onClick={onClose} className="btn-secondary">Close</button>
            </div>
        );
    }

    const currentPoint = validHistory[currentIndex];
    const pathCoords = validHistory.map(h => [h.latitude, h.longitude]);
    const center = [validHistory[0].latitude, validHistory[0].longitude];

    const progress = Math.round((currentIndex / (validHistory.length - 1)) * 100) || 0;

    return (
        <div className="flex flex-col h-[70vh] bg-slate-900 rounded-xl overflow-hidden relative border border-slate-700">
            {/* Header / Controls */}
            <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex flex-wrap gap-4 items-center justify-between z-10">
                <div>
                    <h3 className="text-white font-bold flex items-center gap-2">
                        Bus {trip.busId?.busNumber} <span className="badge badge-blue">Replay</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                        Driver: {trip.driverId?.name} • Alerts: {trip.speedingAlerts || 0}
                    </p>
                </div>

                <div className="flex items-center gap-3 flex-1 max-w-sm">
                    <button onClick={() => setIsPlaying(!isPlaying)} className={`p-2 rounded-lg text-white ${isPlaying ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                        {isPlaying ? '⏸ Pause' : '▶ Play'}
                    </button>
                    <div className="flex-1 bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-xs font-mono text-slate-300">{progress}%</span>
                </div>

                <button onClick={onClose} className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm">
                    Close
                </button>
            </div>

            {/* Map */}
            <div className="flex-1 z-0 relative">
                <MapContainer center={center} zoom={15} className="w-full h-full">
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

                    {/* The Full Path */}
                    <Polyline positions={pathCoords} color="#3b82f6" weight={4} opacity={0.6} />

                    {/* The Moving Marker */}
                    {currentPoint && (
                        <Marker position={[currentPoint.latitude, currentPoint.longitude]} icon={createIcon(currentPoint.speed > 60 ? '#ef4444' : '#10b981')}>
                            <Popup>
                                <div className="text-center font-sans">
                                    <p className="font-bold mb-1">Time: {new Date(currentPoint.timestamp).toLocaleTimeString()}</p>
                                    <p>Speed: <span className={currentPoint.speed > 60 ? 'text-red-500 font-bold' : ''}>{Math.round(currentPoint.speed)} km/h</span></p>
                                </div>
                            </Popup>
                        </Marker>
                    )}

                    <MapUpdater center={currentPoint && isPlaying ? [currentPoint.latitude, currentPoint.longitude] : null} />
                </MapContainer>

                {/* Speed Overlay */}
                {currentPoint && (
                    <div className="absolute top-4 left-4 z-[400] glass px-4 py-2 flex flex-col items-center">
                        <span className="text-xs text-slate-400 uppercase tracking-wide">Speed</span>
                        <span className={`text-2xl font-black ${currentPoint.speed > 60 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
                            {Math.round(currentPoint.speed)}<span className="text-sm font-normal ml-1 text-slate-400">km/h</span>
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

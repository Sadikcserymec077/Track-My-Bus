import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom animated bus icon
const busIcon = (isActive) => L.divIcon({
    html: `<div style="
    width:36px;height:36px;border-radius:50%;
    background:${isActive ? 'linear-gradient(135deg,#2563eb,#7c3aed)' : '#475569'};
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 4px 12px rgba(37,99,235,0.5);
    border:2px solid rgba(255,255,255,0.3);
    position:relative;
  ">
    <span style="font-size:18px;">🚌</span>
    ${isActive ? `<div style="
      position:absolute;inset:-4px;border-radius:50%;
      background:rgba(37,99,235,0.3);
      animation:ping 1.5s cubic-bezier(0,0,.2,1) infinite;
    "></div>` : ''}
  </div>
  <style>@keyframes ping{75%,100%{transform:scale(2);opacity:0}}</style>`,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
});

const stopIcon = L.divIcon({
    html: `<div style="width:12px;height:12px;border-radius:50%;background:#f59e0b;border:2px solid white;box-shadow:0 2px 6px rgba(245,158,11,0.5)"></div>`,
    className: '',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
});

function FlyToLocation({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) map.flyTo(center, 15, { animate: true, duration: 1.5 });
    }, [center, map]);
    return null;
}

export default function MapView({ buses = [], stops = [], center = null, height = '400px', className = '' }) {
    const defaultCenter = [12.9716, 77.5946];

    return (
        <div style={{ height }} className={`w-full rounded-xl overflow-hidden ${className}`}>
            <MapContainer
                center={center || defaultCenter}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
                zoomControl={true}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                {center && <FlyToLocation center={center} />}

                {/* Bus markers */}
                {buses.map((bus) => {
                    const lat = bus.currentLocation?.latitude;
                    const lng = bus.currentLocation?.longitude;
                    if (!lat || !lng) return null;
                    return (
                        <Marker key={bus._id} position={[lat, lng]} icon={busIcon(bus.isActive)}>
                            <Popup>
                                <div className="text-slate-900">
                                    <p className="font-bold text-sm">🚌 {bus.busNumber}</p>
                                    {bus.driverId?.name && <p className="text-xs">Driver: {bus.driverId.name}</p>}
                                    {bus.route && <p className="text-xs text-slate-600">{bus.route}</p>}
                                    <p className="text-xs text-slate-500">Updated: {bus.currentLocation?.updatedAt ? new Date(bus.currentLocation.updatedAt).toLocaleTimeString() : 'N/A'}</p>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                {/* Stop markers */}
                {stops.map((stop, i) => (
                    <Marker key={i} position={[stop.latitude, stop.longitude]} icon={stopIcon}>
                        <Popup><p className="text-slate-900 text-xs font-medium">🚏 {stop.name}</p></Popup>
                    </Marker>
                ))}

                {/* Route polyline */}
                {stops.length > 1 && (
                    <Polyline
                        positions={stops.map(s => [s.latitude, s.longitude])}
                        pathOptions={{ color: '#3b82f6', weight: 3, opacity: 0.7, dashArray: '8,6' }}
                    />
                )}
            </MapContainer>
        </div>
    );
}

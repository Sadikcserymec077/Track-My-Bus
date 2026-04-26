import { useState } from 'react';
import { MapPin, Plus, Trash2 } from 'lucide-react';

/**
 * StopEditor — add, edit, remove stops inside the bus create/edit modal.
 * Props: stops (array), onChange(newStops)
 */
export default function StopEditor({ stops = [], onChange }) {
    const [newStop, setNewStop] = useState({ name: '', latitude: '', longitude: '' });
    const [locating, setLocating] = useState(false);

    const addStop = () => {
        if (!newStop.name.trim()) return;
        onChange([...stops, {
            name: newStop.name.trim(),
            latitude: newStop.latitude ? parseFloat(newStop.latitude) : undefined,
            longitude: newStop.longitude ? parseFloat(newStop.longitude) : undefined,
        }]);
        setNewStop({ name: '', latitude: '', longitude: '' });
    };

    const removeStop = (i) => onChange(stops.filter((_, idx) => idx !== i));

    const useMyLocation = () => {
        if (!navigator.geolocation) return;
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setNewStop(prev => ({ ...prev, latitude: pos.coords.latitude.toFixed(6), longitude: pos.coords.longitude.toFixed(6) }));
                setLocating(false);
            },
            () => setLocating(false)
        );
    };

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-300">Stops</label>

            {/* Current stops list */}
            {stops.length > 0 && (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {stops.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-slate-800 border border-slate-700">
                            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-xs text-white shrink-0">{i + 1}</div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate">{s.name}</p>
                                {s.latitude && <p className="text-xs text-slate-500">{s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}</p>}
                            </div>
                            <button type="button" onClick={() => removeStop(i)} className="text-slate-500 hover:text-red-400 transition-colors">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Add new stop */}
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2">
                <input className="input-field" placeholder="Stop name (e.g. Main Gate)" value={newStop.name}
                    onChange={e => setNewStop({ ...newStop, name: e.target.value })}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addStop())} />
                <div className="grid grid-cols-2 gap-2">
                    <input className="input-field text-xs" placeholder="Latitude" value={newStop.latitude}
                        onChange={e => setNewStop({ ...newStop, latitude: e.target.value })} />
                    <input className="input-field text-xs" placeholder="Longitude" value={newStop.longitude}
                        onChange={e => setNewStop({ ...newStop, longitude: e.target.value })} />
                </div>
                <div className="flex gap-2">
                    <button type="button" onClick={useMyLocation} disabled={locating}
                        className="btn-secondary flex-1 py-1.5 text-xs flex items-center justify-center gap-1">
                        <MapPin size={12} /> {locating ? 'Getting...' : 'Use My Location'}
                    </button>
                    <button type="button" onClick={addStop} disabled={!newStop.name.trim()}
                        className="btn-primary flex-1 py-1.5 text-xs flex items-center justify-center gap-1">
                        <Plus size={12} /> Add Stop
                    </button>
                </div>
            </div>
        </div>
    );
}

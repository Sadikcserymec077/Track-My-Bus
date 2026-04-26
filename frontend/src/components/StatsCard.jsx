export default function StatsCard({ label, value, icon: Icon, color = 'blue', subtitle, trend }) {
    const colors = {
        blue: 'from-blue-600/20 to-blue-600/5 border-blue-500/20 text-blue-400',
        violet: 'from-violet-600/20 to-violet-600/5 border-violet-500/20 text-violet-400',
        emerald: 'from-emerald-600/20 to-emerald-600/5 border-emerald-500/20 text-emerald-400',
        amber: 'from-amber-600/20 to-amber-600/5 border-amber-500/20 text-amber-400',
        rose: 'from-rose-600/20 to-rose-600/5 border-rose-500/20 text-rose-400',
    };
    const cls = colors[color] || colors.blue;

    return (
        <div className={`card-hover glass p-6 bg-gradient-to-br ${cls} border`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-slate-400 text-sm font-medium">{label}</p>
                    <p className="text-3xl font-bold text-white mt-1">{value ?? '—'}</p>
                    {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
                    {trend !== undefined && (
                        <p className={`text-xs mt-2 font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% from yesterday
                        </p>
                    )}
                </div>
                {Icon && (
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${cls}`}>
                        <Icon size={22} />
                    </div>
                )}
            </div>
        </div>
    );
}

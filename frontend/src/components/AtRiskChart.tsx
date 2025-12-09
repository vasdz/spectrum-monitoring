import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { useStore } from '../store/useStore.ts';
import { AlertTriangle } from 'lucide-react';

export function AtRiskChart() {
    const { atRiskStudents } = useStore();

    return (
        <div className="liquid-glass h-full flex flex-col p-8 rounded-3xl">
             <div className="flex justify-between items-center mb-8">
                 <div>
                    <h3 className="font-sans text-xl font-bold text-white flex items-center gap-3">
                        <AlertTriangle className="text-pink w-5 h-5" />
                        Anomaly Detection
                    </h3>
                    <p className="text-xs text-gray-500 font-mono mt-1 ml-8">AI PREDICTION CONFIDENCE: 99.8%</p>
                 </div>
                 <div className="px-4 py-1.5 rounded-full border border-pink/30 bg-pink/10 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-pink rounded-full animate-pulse" />
                    <span className="text-pink text-[10px] font-bold tracking-widest">SCANNING</span>
                 </div>
             </div>

            <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={atRiskStudents} layout="vertical" margin={{ left: 0, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="full_name"
                            type="category"
                            width={140}
                            tick={{ fill: '#9ca3af', fontSize: 12, fontFamily: 'Share Tech Mono' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(255, 0, 85, 0.05)' }}
                            contentStyle={{ backgroundColor: 'rgba(3, 0, 5, 0.9)', borderColor: '#333', color: '#fff', backdropFilter: 'blur(10px)' }}
                            itemStyle={{ color: '#ff0055' }}
                        />
                        <Bar dataKey="risk_score" barSize={12} radius={[0, 6, 6, 0]}>
                            {atRiskStudents.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.risk_score > 0.7 ? '#ff0055' : 'url(#gradientBar)'} />
                            ))}
                        </Bar>
                        <defs>
                            <linearGradient id="gradientBar" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#00f3ff" />
                                <stop offset="100%" stopColor="#bc13fe" />
                            </linearGradient>
                        </defs>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}


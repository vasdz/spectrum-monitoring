import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface EloHistoryItem {
    id: number;
    prev_rating: number;
    new_rating: number;
    change_amount: number;
    reason: string;
    created_at: string;
}

export function EloTimeline({ studentId }: { studentId: number }) {
    const [history, setHistory] = useState<EloHistoryItem[]>([]);

    useEffect(() => {
        fetch(`http://localhost:8000/api/students/${studentId}/elo-history`)
            .then(res => res.json())
            .then(setHistory)
            .catch(console.error);
    }, [studentId]);

    return (
        <div className="bg-black/40 backdrop-blur-xl border border-cyan/20 rounded-2xl p-6 h-full flex flex-col">
            <h3 className="text-cyan font-bold uppercase tracking-widest text-sm mb-4">
                ELO Timeline
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {history.length === 0 ? (
                    <div className="text-center text-gray-600 text-xs italic py-10">
                        No rating history yet
                    </div>
                ) : (
                    history.map(item => (
                        <div key={item.id} className="relative pl-6 pb-4 border-l-2 border-cyan/30 last:border-l-0">
                            <div className="absolute left-0 top-0 -translate-x-1/2 w-3 h-3 rounded-full bg-cyan shadow-[0_0_10px_#00f3ff]" />
                            <div className="text-[10px] text-gray-500 mb-1">
                                {new Date(item.created_at).toLocaleDateString('ru-RU')} {new Date(item.created_at).toLocaleTimeString('ru-RU')}
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                                {item.change_amount > 0 ? (
                                    <TrendingUp className="text-green-400" size={14} />
                                ) : (
                                    <TrendingDown className="text-red-400" size={14} />
                                )}
                                <span className={`font-bold font-mono text-sm ${item.change_amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {item.change_amount > 0 ? '+' : ''}{item.change_amount}
                                </span>
                                <span className="text-white text-xs">
                                    {item.prev_rating} → {item.new_rating}
                                </span>
                            </div>
                            <div className="text-[10px] text-gray-400 italic">
                                {item.reason}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

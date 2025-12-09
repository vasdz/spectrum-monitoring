import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react'; // Удалил Wifi, Database, Lock

interface LogEvent {
    id: number;
    text: string;
    type: 'info' | 'warn' | 'success';
    time: string;
}

export function LiveFeed() {
    const [logs, setLogs] = useState<LogEvent[]>([]);

    // Генератор случайных событий
    useEffect(() => {
        const actions = [
            "Syncing neural nodes...",
            "Packets received from Group 12",
            "Analysing attendance patterns",
            "Encryption keys rotated",
            "New grade committed to DB",
            "Anomaly scan complete: Clean",
            "User connection established",
            "C++ Core: Batch processed"
        ];

        const interval = setInterval(() => {
            const newLog: LogEvent = {
                id: Date.now(),
                text: actions[Math.floor(Math.random() * actions.length)],
                type: Math.random() > 0.8 ? 'success' : 'info',
                time: new Date().toLocaleTimeString('ru-RU', { hour12: false })
            };

            setLogs(prev => [newLog, ...prev].slice(0, 7)); // Храним последние 7
        }, 1500); // Каждые 1.5 сек

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 h-full flex flex-col overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                <div className="flex items-center gap-2 text-cyan uppercase font-mono tracking-widest text-xs font-bold">
                    <Activity className="w-4 h-4 animate-pulse" />
                    Data Stream
                </div>
                <div className="text-[10px] text-green-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span> LIVE
                </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                {logs.length === 0 && <div className="text-gray-600 text-xs text-center mt-10 font-mono">WAITING FOR SIGNAL...</div>}

                {logs.map(log => (
                    <div key={log.id} className="flex items-start gap-3 text-xs animate-in slide-in-from-left-2 fade-in duration-300">
                        <div className="text-gray-500 font-mono whitespace-nowrap">[{log.time}]</div>
                        <div className="font-mono text-cyan/80 truncate">
                            <span className="text-purple mr-2">{">"}</span>
                            {log.text}
                        </div>
                    </div>
                ))}
            </div>

            {/* Декор снизу */}
            <div className="mt-2 pt-2 border-t border-white/5 flex justify-between text-[9px] text-gray-600 font-mono">
                <span>PORT: 8000</span>
                <span>ENCRYPTION: AES-256</span>
            </div>
        </div>
    );
}

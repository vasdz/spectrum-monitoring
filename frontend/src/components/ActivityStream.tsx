import { useState, useEffect } from 'react';
import { Radio, Activity, Database, Shield, FileCode } from 'lucide-react';

// Тип события
interface LogEvent {
    id: number;
    type: string;
    message: string;
    severity: string;
    time: string;
}

export function ActivityStream() {
    const [logs, setLogs] = useState<LogEvent[]>([]);

    useEffect(() => {
        // Подключаемся к WebSocket
        const socket = new WebSocket('ws://localhost:8000/ws');

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            // Если пришло новое событие активности
            if (data.type === "new_activity") {
                setLogs(prev => [data.payload, ...prev].slice(0, 10)); // Храним только последние 10
            }
        };

        return () => socket.close();
    }, []);

    // Иконка по типу события
    const getIcon = (type: string) => {
        switch(type) {
            case 'LOGIN': return <Activity size={14} />;
            case 'SUBMISSION': return <FileCode size={14} />;
            case 'ACCESS': return <Shield size={14} />;
            case 'SYSTEM': return <Database size={14} />;
            default: return <Radio size={14} />;
        }
    }

    return (
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 h-full flex flex-col relative overflow-hidden">
            {/* Заголовок */}
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                <div className="flex items-center gap-2 text-cyan font-bold uppercase tracking-widest text-sm">
                    <Radio className="w-4 h-4 animate-pulse" /> Netrunner Feed
                </div>
                <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-cyan rounded-full animate-ping"></span>
                    <span className="text-[10px] text-cyan/50 font-mono">LIVE</span>
                </div>
            </div>

            {/* Список событий */}
            <div className="flex-1 flex flex-col gap-2 overflow-hidden">
                {logs.length === 0 && (
                    <div className="text-center text-gray-600 text-xs mt-10 animate-pulse">
                        Connecting to neural network...
                    </div>
                )}

                {logs.map((log) => (
                    <div key={log.id} className="flex items-center gap-3 text-xs animate-in fade-in slide-in-from-left-4 duration-300">
                        <div className="font-mono text-gray-500 text-[10px] min-w-[50px]">{log.time}</div>
                        <div className={`p-1.5 rounded-md ${
                            log.severity === 'WARNING' ? 'bg-yellow-500/20 text-yellow-500' : 
                            log.severity === 'SUCCESS' ? 'bg-green-500/20 text-green-500' : 'bg-white/5 text-cyan'
                        }`}>
                            {getIcon(log.type)}
                        </div>
                        <div className="truncate text-gray-300 font-mono">
                            <span className="text-white/60 font-bold mr-2">[{log.type}]</span>
                            {log.message}
                        </div>
                    </div>
                ))}
            </div>

            {/* Эффект матрицы внизу */}
            <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"></div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { Cpu, Users, Layers } from 'lucide-react';

interface TeacherLoad {
    id: number;
    name: string;
    students: number;
    groups: number;
    load: number;
    status: string;
}

export function TeachersLoad() {
    const [teachers, setTeachers] = useState<TeacherLoad[]>([]);

    useEffect(() => {
        fetch('http://localhost:8000/api/analytics/teachers-load')
            .then(res => res.json())
            .then(setTeachers)
            .catch(console.error);
    }, []);

    // Цвета для статусов (Киберпанк палитра)
    const getStatusColors = (status: string) => {
        switch (status) {
            case 'OVERLOAD': return { text: 'text-red-500', bg: 'bg-red-500', shadow: 'shadow-[0_0_15px_#ef4444]', border: 'border-red-500' };
            case 'HIGH': return { text: 'text-orange-400', bg: 'bg-orange-400', shadow: 'shadow-[0_0_10px_#fb923c]', border: 'border-orange-400' };
            case 'OPTIMAL': return { text: 'text-emerald-400', bg: 'bg-emerald-400', shadow: 'shadow-[0_0_10px_#34d399]', border: 'border-emerald-400' };
            default: return { text: 'text-cyan', bg: 'bg-cyan', shadow: 'shadow-[0_0_10px_#00f3ff]', border: 'border-cyan' };
        }
    };

    return (
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 h-full flex flex-col relative overflow-hidden">
            {/* Фоновая сетка (Neural Grid) */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

            {/* Заголовок */}
            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-2 text-pink-500 font-bold uppercase tracking-widest text-sm">
                    <Cpu className="w-5 h-5 animate-pulse" /> Neural Load Nodes
                </div>
                <div className="text-[10px] font-mono text-gray-500">Capacity: 70 STU/Node</div>
            </div>

            {/* Визуализация Узлов */}
            <div className="flex-1 flex flex-col justify-center gap-5 relative z-10">
                {teachers.map((t) => {
                    const colors = getStatusColors(t.status);
                    // Ширина линии загрузки (макс 100%)
                    const loadWidth = Math.min(t.load, 100);

                    return (
                        <div key={t.id} className="group relative">
                            <div className="flex items-center gap-4">
                                {/* Узел (Аватарка/Индикатор) */}
                                <div className={`relative flex-shrink-0 w-10 h-10 rounded-full border-2 ${colors.border} flex items-center justify-center bg-black/50 ${colors.shadow} transition-all duration-500 group-hover:scale-110`}>
                                    <span className={`font-bold text-xs ${colors.text}`}>{t.load}%</span>
                                    {/* Орбита вокруг узла */}
                                    <div className={`absolute inset-[-4px] rounded-full border border-dashed ${colors.border} opacity-30 animate-[spin_10s_linear_infinite]`}></div>
                                </div>

                                {/* Информация и Линия связи */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <div className="text-xs font-bold text-white truncate">{t.name}</div>
                                        <div className="flex gap-3 text-[9px] font-mono text-gray-400">
                                            <span className="flex items-center gap-1"><Users size={10}/> {t.students}</span>
                                            <span className={`flex items-center gap-1 ${t.groups > 3 ? 'text-red-400 animate-pulse' : ''}`}><Layers size={10}/> {t.groups} GR</span>
                                        </div>
                                    </div>

                                    {/* Линия "Нейронной связи" (Прогресс бар) */}
                                    <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden relative">
                                        <div
                                            className={`h-full rounded-full ${colors.bg} ${colors.shadow} relative`}
                                            style={{ width: `${loadWidth}%`, transition: 'width 1s ease-out' }}
                                        >
                                            {/* Эффект бегущего импульса */}
                                            <div className="absolute top-0 right-0 bottom-0 w-10 bg-gradient-to-l from-white/50 to-transparent animate-[pulse_2s_infinite]"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { useStore } from "../store/useStore";
import { KpiCard } from "./KpiCard";
import { Users, Activity, ShieldCheck, Cpu, AlertTriangle, Award, Zap, GitBranch } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AiAssistant } from "./AiAssistant";
import { SocialGraph } from "./SocialGraph";
import { ThreatMonitor } from "./ThreatMonitor";
import { ActivityStream } from "./ActivityStream";

// --- СПИСОК РИСКА ---
function RiskList() {
    const [students, setStudents] = useState<any[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetch('http://localhost:8000/api/analytics/at-risk?limit=10')
            .then(res => res.json())
            .then(setStudents)
            .catch(console.error);
    }, []);

    return (
        <div className="bg-black/60 backdrop-blur-xl border border-red-500/20 rounded-2xl p-6 shadow-[0_0_30px_rgba(255,0,0,0.05)] h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-red-400 font-bold uppercase tracking-widest text-sm">
                    <AlertTriangle className="w-5 h-5" /> Critical Alerts
                </div>
                <div className="px-2 py-1 bg-red-500/10 rounded text-[10px] text-red-400 border border-red-500/20 animate-pulse">
                    ACTION REQUIRED
                </div>
            </div>
            <div className="space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {students.map(s => (
                    <div
                        key={s.student_id}
                        onClick={() => navigate(`/student/${s.student_id}`)}
                        className="group flex items-center justify-between p-3 bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/30 rounded-lg cursor-pointer transition-all"
                    >
                        <div>
                            <div className="text-white text-xs font-bold group-hover:text-red-400 transition-colors">
                                {s.full_name}
                            </div>
                            <div className="text-[9px] text-gray-500">{s.group_name}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-red-400 font-bold font-mono text-xs">{s.risk_score}%</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- ТОП ПО ELO ---
function TopEloList() {
    const [students, setStudents] = useState<any[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetch('http://localhost:8000/api/analytics/top-students?limit=10')
            .then(res => res.json())
            .then(setStudents)
            .catch(console.error);
    }, []);

    return (
        <div className="bg-black/60 backdrop-blur-xl border border-purple/20 rounded-2xl p-6 shadow-[0_0_30px_rgba(188,19,254,0.05)] h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-purple font-bold uppercase tracking-widest text-sm">
                    <Zap className="w-5 h-5" /> Competitive Rating
                </div>
                <div className="px-2 py-1 bg-purple/10 rounded text-[10px] text-purple border border-purple/20">
                    TOP 10 ELO
                </div>
            </div>
            <div className="space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {students.map((s, idx) => (
                    <div
                        key={s.id}
                        onClick={() => navigate(`/student/${s.id}`)}
                        className="group flex items-center justify-between p-3 bg-white/5 hover:bg-purple/10 border border-white/5 hover:border-purple/30 rounded-lg cursor-pointer transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <div className="font-mono text-purple/50 text-sm italic">#{idx + 1}</div>
                            <div>
                                <div className="text-white text-xs font-bold group-hover:text-purple transition-colors">
                                    {s.full_name}
                                </div>
                                <div className="text-[9px] text-gray-500">{s.group_name}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-purple font-bold font-mono text-lg">{s.elo}</div>
                            <div className="text-[9px] text-purple/70 uppercase">ELO</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- ТОП ПО GPA ---
function TopGpaList() {
    const [students, setStudents] = useState<any[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetch('http://localhost:8000/api/analytics/top-by-gpa?limit=10')
            .then(res => res.json())
            .then(setStudents)
            .catch(console.error);
    }, []);

    return (
        <div className="bg-black/60 backdrop-blur-xl border border-cyan/20 rounded-2xl p-6 shadow-[0_0_30px_rgba(0,243,255,0.05)] h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-cyan font-bold uppercase tracking-widest text-sm">
                    <Award className="w-5 h-5" /> Academic Excellence
                </div>
                <div className="px-2 py-1 bg-cyan/10 rounded text-[10px] text-cyan border border-cyan/20">
                    TOP 10 GPA
                </div>
            </div>
            <div className="space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {students.map((s, idx) => (
                    <div
                        key={s.id}
                        onClick={() => navigate(`/student/${s.id}`)}
                        className="group flex items-center justify-between p-3 bg-white/5 hover:bg-cyan/10 border border-white/5 hover:border-cyan/30 rounded-lg cursor-pointer transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <div className="font-mono text-cyan/50 text-sm italic">#{idx + 1}</div>
                            <div>
                                <div className="text-white text-xs font-bold group-hover:text-cyan transition-colors">
                                    {s.full_name}
                                </div>
                                <div className="text-[9px] text-gray-500">{s.group_name}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-cyan font-bold font-mono text-lg">{s.gpa}</div>
                            <div className="text-[9px] text-cyan/70 uppercase">GPA</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function Dashboard() {
    const { kpi } = useStore();

    return (
        <main className="max-w-[1800px] mx-auto space-y-8 relative z-10 pb-10">
            {/* HEADER */}
            <header className="relative flex flex-col md:flex-row justify-between items-end gap-6">
                <div>
                    <div className="text-cyan/80 text-[10px] tracking-[0.2em] font-sans uppercase mb-2">
                        Student Performance Education Control & Tracking Research Unified Monitor
                    </div>
                    <h1 className="text-7xl md:text-8xl font-black tracking-tighter uppercase leading-none text-white">
                        SPEC<span className="animate-text-flow">TRUM</span>
                    </h1>
                </div>
                <div className="flex items-center gap-6 pb-2">
                    <div className="hidden md:block text-right">
                        <div className="text-[10px] text-purple font-mono mb-1 tracking-widest">SYSTEM STATUS</div>
                        <div className="flex items-center justify-end gap-2">
                            <span className="w-2 h-2 bg-cyan rounded-full shadow-[0_0_10px_#00f3ff] animate-pulse" />
                            <span className="text-xl text-white font-sans font-bold">ONLINE</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* KPI CARDS - С ЦВЕТНЫМИ ЗНАЧЕНИЯМИ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard
                    icon={Users}
                    title="Users Connected"
                    value={kpi?.total_students}
                    color="cyan"
                    description="Общее количество подключенных студентов"
                />
                <KpiCard
                    icon={ShieldCheck}
                    title="Integrity"
                    value={kpi?.system_health_index}
                    unit="%"
                    color="purple"
                    description="Индекс целостности системы и данных"
                />
                <KpiCard
                    icon={Cpu}
                    title="Neural Load"
                    value={kpi?.avg_gpa}
                    color="pink"
                    description="Средний GPA по потоку"
                />
                <KpiCard
                    icon={Activity}
                    title="Active Nodes"
                    value={kpi?.active_courses}
                    color="orange"
                    description="Количество активных курсов"
                />
            </div>

            {/* MAIN GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="flex flex-col gap-6">
                    <div className="h-[350px]"><RiskList /></div>
                    <div className="h-[400px]"><ThreatMonitor /></div>
                </div>
                <div className="flex flex-col gap-6">
                    <div className="h-[400px]"><TopEloList /></div>
                    <div className="h-[350px]"><TopGpaList /></div>
                </div>
                <div className="flex flex-col gap-6">
                    <div className="h-[400px]"><ActivityStream /></div>
                    <div className="h-[350px]"><AiAssistant /></div>
                </div>
            </div>

            {/* ГРАФ */}
            <div className="mt-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                <div className="w-full h-[500px]">
                    <SocialGraph />
                </div>

                {/* БЛОК АНАЛИЗА ГРАФА */}
                <div className="mt-6 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-lg">
                    <h3 className="text-cyan font-bold uppercase tracking-widest text-sm mb-4 flex items-center gap-2">
                        <GitBranch size={16}/>
                        Анализ Социального Графа
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-xs text-gray-400 font-mono leading-relaxed">
                        <div>
                            <strong className="text-white">Узлы и Группы:</strong>
                            <p className="mt-1 opacity-80">
                                Каждый узел на графе представляет собой студента. Цвет узла обозначает его принадлежность к одной из учебных групп (КБ, ИС, ПИ). Это позволяет визуально отслеживать распределение студентов по группам.
                            </p>
                        </div>
                        <div>
                            <strong className="text-white">Социальное Притяжение:</strong>
                            <p className="mt-1 opacity-80">
                                Узлы одного цвета (одногруппники) притягиваются друг к другу, образуя кластеры. Сила притяжения симулирует социальные связи. Это помогает быстро оценить сплоченность групп и выявить "одиночек".
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ПОДПИСЬ */}
            <div className="w-full mt-8 mb-4 flex items-center justify-center pointer-events-none">
                <p className="text-xs text-cyan/60 font-mono tracking-[0.2em] uppercase drop-shadow-[0_0_5px_rgba(0,243,255,0.3)] opacity-80">
                    The project was created for RTU MIREA by vasdz
                </p>
            </div>
        </main>
    );
}

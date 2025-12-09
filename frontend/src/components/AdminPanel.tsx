import { useState, useEffect } from 'react';
import { StudentSearch } from './StudentSearch';
import { useNavigate } from 'react-router-dom';
import { Shield, Award, Trash2, UserCheck, Key, AlertTriangle, ArrowLeft, TrendingUp, Zap } from 'lucide-react';

interface Title {
    id: number;
    name: string;
    rarity: string;
}

const ADMIN_ACCOUNTS = {
    'SPECTRUM-ROOT': 'Супер-администратор',
    'DEAN-OFFICE': 'Деканат',
    'PROFESSOR-X': 'Зав. кафедрой'
};

export function AdminPanel() {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [accessKey, setAccessKey] = useState('');
    const [currentUser, setCurrentUser] = useState('');
    const [error, setError] = useState('');
    const [logs, setLogs] = useState<string[]>([]);
    const [availableTitles, setAvailableTitles] = useState<Title[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [selectedTitle, setSelectedTitle] = useState('');
    const [eloModifier, setEloModifier] = useState<number | ''>(50);
    const [terminalText, setTerminalText] = useState('');

    useEffect(() => {
        const text = "ИНИЦИАЛИЗАЦИЯ ЗАЩИЩЕННОГО СОЕДИНЕНИЯ... ШИФРОВАНИЕ ПРОТОКОЛОВ... ОЖИДАНИЕ КЛЮЧА...";
        let i = 0;
        const timer = setInterval(() => {
            setTerminalText(text.substring(0, i));
            i++;
            if (i > text.length) clearInterval(timer);
        }, 30);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        fetch('http://localhost:8000/api/analytics/titles-list')
            .then(res => res.json())
            .then(data => {
                setAvailableTitles(data);
                if (data.length > 0) setSelectedTitle(data[0].name);
            })
            .catch(err => {
                console.error("Ошибка загрузки титулов:", err);
                setLogs(prev => [`[СИСТЕМНАЯ ОШИБКА] Не удалось загрузить конфигурацию титулов`, ...prev]);
            });
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (ADMIN_ACCOUNTS[accessKey as keyof typeof ADMIN_ACCOUNTS]) {
            setIsAuthenticated(true);
            const adminName = ADMIN_ACCOUNTS[accessKey as keyof typeof ADMIN_ACCOUNTS];
            setCurrentUser(adminName);
            setLogs(prev => [`[СИСТЕМА] ДОСТУП РАЗРЕШЕН. ДОБРО ПОЖАЛОВАТЬ, ${adminName}.`, ...prev]);
        } else {
            setError('ДОСТУП ЗАПРЕЩЕН: НЕВЕРНЫЙ КЛЮЧ');
            setAccessKey('');
            setTimeout(() => setError(''), 2000);
        }
    };

    const handleAction = async (actionType: "GRANT_TITLE" | "REVOKE_TITLE" | "MODIFY_ELO") => {
        if (!selectedStudent) {
            setLogs(prev => [`[ОШИБКА] ЦЕЛЬ НЕ ОПРЕДЕЛЕНА. ВЫБЕРИТЕ СТУДЕНТА.`, ...prev]);
            return;
        }

        const timestamp = new Date().toLocaleTimeString();
        let logMessage = "";
        let endpoint = "";
        let options: RequestInit = {};

        try {
            if (actionType === "GRANT_TITLE") {
                logMessage = `ПРОТОКОЛ: Выдача титула '${selectedTitle}' СУБЪЕКТУ #${selectedStudent.id}...`;
                endpoint = `http://localhost:8000/api/students/${selectedStudent.id}/titles`;
                options = {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title_name: selectedTitle })
                };
            } else if (actionType === "REVOKE_TITLE") {
                logMessage = `ПРОТОКОЛ: Сброс титулов СУБЪЕКТА #${selectedStudent.id}...`;
                endpoint = `http://localhost:8000/api/students/${selectedStudent.id}/titles`;
                options = { method: 'DELETE' };
            } else if (actionType === "MODIFY_ELO") {
                const amount = Number(eloModifier);
                if (isNaN(amount) || amount === 0) {
                    setLogs(prev => [`[ОШИБКА] Введите корректное значение ELO`, ...prev]);
                    return;
                }
                logMessage = `ПРОТОКОЛ: Изменение ELO (${amount > 0 ? '+' : ''}${amount}) для СУБЪЕКТА #${selectedStudent.id}...`;
                endpoint = `http://localhost:8000/api/students/${selectedStudent.id}/modify-elo`;
                options = {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        change: amount,
                        reason: `Админ. коррекция (${currentUser})`
                    })
                };
            }

            setLogs(prev => [`[${timestamp}] [${currentUser}] ${logMessage}`, ...prev]);
            const res = await fetch(endpoint, options);
            const data = await res.json();

            if (res.ok) {
                setLogs(prev => [`[УСПЕХ] База данных обновлена: ${data.message || "OK"}`, ...prev]);
            } else {
                const errorMsg = data.detail ? JSON.stringify(data.detail) : "Сервер отклонил транзакцию";
                throw new Error(errorMsg);
            }
        } catch (e: any) {
            console.error(e);
            setLogs(prev => [`[КРИТИЧЕСКАЯ ОШИБКА] Операция не удалась: ${e.message}`, ...prev]);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-black overflow-hidden z-[9999]">
                <button onClick={() => navigate('/')} className="absolute top-8 left-8 text-red-500/50 hover:text-red-500 transition-colors flex items-center gap-2 font-mono text-xs uppercase tracking-widest z-50 bg-black/20 px-4 py-2 rounded-full border border-red-500/20 backdrop-blur-sm">
                    <ArrowLeft size={16} /> Вернуться на главную
                </button>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 blur-[150px] rounded-full pointer-events-none animate-pulse" />
                <div className="z-10 w-full max-w-md p-8 relative">
                    <div className="mb-12 text-center space-y-6">
                        <div className="relative inline-block group">
                            <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full group-hover:bg-red-500/30 transition-all duration-500" />
                            <Shield className="relative w-24 h-24 text-red-500 mx-auto drop-shadow-[0_0_25px_rgba(239,68,68,0.6)]" />
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-400/30 to-transparent h-1/3 w-full animate-[scan_3s_linear_infinite] pointer-events-none rounded-full opacity-50" />
                        </div>
                        <div>
                            <h1 className="text-5xl font-black text-white tracking-tighter uppercase drop-shadow-2xl mb-2">Закрытая зона</h1>
                            <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-red-950/40 border border-red-500/20 rounded-full backdrop-blur-md">
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_#ef4444]" />
                                <span className="text-xs text-red-400 font-mono tracking-[0.2em] uppercase">{terminalText}<span className="animate-pulse">_</span></span>
                            </div>
                        </div>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-6 relative">
                        <div className="absolute -inset-8 bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl -z-10" />
                        <div className="space-y-2">
                            <label className="text-[10px] text-gray-400 uppercase tracking-widest ml-2">Ключ безопасности</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-500 group-focus-within:text-red-400 transition-colors"><Key size={20} /></div>
                                <input type="password" value={accessKey} onChange={e => setAccessKey(e.target.value)} className="w-full bg-black/40 border border-white/10 focus:border-red-500/60 rounded-2xl py-5 pl-14 pr-5 text-white placeholder-gray-700 outline-none font-mono text-center text-3xl tracking-[0.3em] transition-all shadow-inner focus:shadow-[0_0_30px_rgba(220,38,38,0.15)] focus:bg-black/60" placeholder="••••••" autoFocus />
                            </div>
                        </div>
                        <button type="submit" className="w-full group relative overflow-hidden bg-gradient-to-r from-red-900 to-red-700 hover:from-red-800 hover:to-red-600 p-[1px] rounded-2xl shadow-[0_0_20px_rgba(153,27,27,0.3)] hover:shadow-[0_0_40px_rgba(220,38,38,0.5)] transition-all duration-300 active:scale-[0.98]">
                            <div className="relative bg-black/20 hover:bg-transparent rounded-2xl py-4 px-6 flex items-center justify-center gap-3 transition-colors">
                                <span className="text-white font-bold uppercase tracking-[0.2em] text-sm group-hover:text-white/90">Аутентификация</span>
                                <div className="w-1.5 h-1.5 bg-white rounded-full opacity-50 group-hover:opacity-100 group-hover:shadow-[0_0_10px_white] transition-all" />
                            </div>
                        </button>
                    </form>
                    {error && (<div className="mt-8 text-center animate-[shake_0.5s_cubic-bezier(.36,.07,.19,.97)_both]"><div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/40 rounded-lg text-red-400 font-mono text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(220,38,38,0.2)]"><AlertTriangle size={14} />{error}</div></div>)}
                </div>
                <div className="absolute bottom-8 text-[10px] text-gray-600 font-mono tracking-widest opacity-50">СИСТЕМА_VER: 4.0.2 // КАНАЛ ЗАШИФРОВАН</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full p-4 md:p-8 font-sans text-white relative overflow-x-hidden">
            <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none z-0" />
            <div className="max-w-[1600px] mx-auto relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-end mb-10 border-b border-white/10 pb-6 gap-4">
                    <div className="flex items-start gap-4">
                         <button onClick={() => navigate('/')} className="mt-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all"><ArrowLeft size={20} /></button>
                         <div>
                             <div className="flex items-center gap-4 mb-2">
                                <div className="p-3 bg-cyan/10 rounded-xl border border-cyan/20 backdrop-blur-md shadow-[0_0_15px_rgba(0,243,255,0.2)]"><Shield className="text-cyan w-8 h-8" /></div>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase text-white drop-shadow-lg">Командный центр</h1>
                             </div>
                             <div className="flex items-center gap-3 text-[10px] font-mono text-emerald-400 tracking-widest bg-emerald-950/30 px-3 py-1 rounded border border-emerald-500/20">
                                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_#34d399]" />
                                ЗАЩИЩЕННОЕ СОЕДИНЕНИЕ • АДМИН: {currentUser}
                             </div>
                         </div>
                    </div>
                    <button onClick={() => setIsAuthenticated(false)} className="text-xs text-red-400 hover:text-white border border-red-500/30 hover:bg-red-600 px-6 py-3 rounded-lg bg-red-950/30 uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(220,38,38,0.1)] hover:shadow-[0_0_20px_rgba(220,38,38,0.4)]">Завершить сессию</button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-black/20 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:border-cyan/30 transition-colors">
                            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                            <h3 className="text-cyan font-bold uppercase tracking-widest text-sm mb-6 flex items-center gap-2"><UserCheck size={16} /> Идентификация цели</h3>
                            <div className="mb-6 relative z-20"><StudentSearch onSelect={(s) => setSelectedStudent(s)} /></div>
                            {selectedStudent ? (
                                <div className="animate-in fade-in slide-in-from-top-2 p-5 bg-cyan/5 border border-cyan/20 rounded-2xl backdrop-blur-md relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 opacity-20"><Shield size={40} /></div>
                                    <div className="text-[10px] text-cyan/60 uppercase tracking-widest mb-1">Выбранный субъект</div>
                                    <div className="text-xl font-bold text-white mb-1 truncate">{selectedStudent.full_name}</div>
                                    <div className="text-sm text-gray-400 font-mono mb-3">{selectedStudent.group_name}</div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="px-2 py-1 bg-white/10 rounded text-gray-300 font-mono">#{selectedStudent.id}</span>
                                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">АКТИВНЫЙ СТАТУС</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-10 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-gray-600 gap-3 bg-white/5">
                                    <div className="w-3 h-3 bg-gray-600 rounded-full animate-ping" />
                                    <span className="text-xs font-mono uppercase tracking-widest">Ожидание выбора...</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-black/20 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden">
                            <div className="absolute -right-20 -top-20 w-96 h-96 bg-purple/20 rounded-full blur-[100px] pointer-events-none opacity-40" />
                            <h3 className="text-purple font-bold uppercase tracking-widest text-sm mb-8 flex items-center gap-2 relative z-10"><Award size={18} /> Управление привилегиями</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 mb-8">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] text-gray-400 uppercase tracking-widest pl-1 block mb-2">Назначение титула</label>
                                        <div className="relative">
                                            <select value={selectedTitle} onChange={(e) => setSelectedTitle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-sm text-white outline-none focus:border-purple/50 transition-all hover:bg-white/10 appearance-none cursor-pointer">
                                                {availableTitles.length === 0 ? (<option>Загрузка конфигурации...</option>) : (availableTitles.map(title => (<option key={title.id} value={title.name} className="bg-[#0a0a12]">{title.name} ({title.rarity})</option>)))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">▼</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleAction("GRANT_TITLE")} disabled={!selectedStudent || !selectedTitle} className="flex-1 py-3 bg-purple/20 hover:bg-purple/40 border border-purple/50 hover:border-purple/80 rounded-xl text-purple hover:text-white font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 text-xs shadow-[0_0_20px_rgba(188,19,254,0.2)] hover:shadow-[0_0_40px_rgba(188,19,254,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"><Award size={16} /> Выдать</button>
                                        <button onClick={() => handleAction("REVOKE_TITLE")} disabled={!selectedStudent} className="py-3 px-4 bg-red-500/10 hover:bg-red-500/30 border border-red-500/20 hover:border-red-500/50 rounded-xl text-red-400 hover:text-white font-bold uppercase tracking-wider transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed" title="Сбросить титулы"><Trash2 size={16} /></button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] text-gray-400 uppercase tracking-widest pl-1 block mb-2">Корректировка ELO</label>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            value={eloModifier}
                                            onChange={(e) => setEloModifier(e.target.value === '' ? '' : Number(e.target.value))}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-4 text-sm text-white outline-none focus:border-purple/50 transition-all hover:bg-white/10 font-mono"
                                            placeholder="Например: 50 или -25"
                                        />
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple transition-colors"><Zap size={16} /></div>
                                    </div>
                                    <button onClick={() => handleAction("MODIFY_ELO")} disabled={!selectedStudent || eloModifier === ''} className="w-full mt-4 py-3 bg-cyan/10 hover:bg-cyan/30 border border-cyan/30 hover:border-cyan/60 rounded-xl text-cyan hover:text-white font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 text-xs hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50 disabled:cursor-not-allowed">
                                        <TrendingUp size={16} /> Применить изменения
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* БЛОК ЛОГОВ (ИСПРАВЛЕННЫЙ) */}
                        <div className="relative group overflow-hidden rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl shadow-2xl">

                            {/* Верхняя панель */}
                            <div className="flex items-center justify-between bg-white/5 px-4 py-2 border-b border-white/5 backdrop-blur-sm">
                                <div className="flex items-center gap-2">
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    <span className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-[0.2em]">
                                        System Logs_
                                    </span>
                                </div>
                                <div className="text-[9px] text-gray-500 font-mono">
                                    AUTO-SCROLL: ON
                                </div>
                            </div>

                            {/* Контейнер логов */}
                            <div className="relative h-64 overflow-y-auto custom-scrollbar p-4 font-mono text-xs space-y-2">

                                {/* Фоновая сетка */}
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-50"></div>

                                {logs.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
                                        <div className="animate-pulse mb-2">_</div>
                                        <span className="text-[10px] uppercase tracking-widest">Ожидание команд администратора...</span>
                                    </div>
                                )}

                                {logs.map((log, i) => (
                                    <div
                                        key={i}
                                        className="relative pl-4 group/log animate-in slide-in-from-left-2 duration-300"
                                    >
                                        <div className="absolute left-0 top-1.5 w-1 h-1 bg-emerald-500/50 rounded-full group-hover/log:bg-emerald-400 transition-colors"></div>
                                        <span className="text-emerald-500/80 group-hover/log:text-emerald-300 transition-colors break-all leading-relaxed selection:bg-emerald-500/30 selection:text-emerald-100">
                                            {log}
                                        </span>
                                    </div>
                                ))}

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

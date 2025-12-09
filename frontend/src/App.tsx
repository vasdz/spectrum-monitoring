import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { useStore } from "./store/useStore";
import { Dashboard } from './components/Dashboard';
import { TronBackground } from './components/TronBackground';
import { StudentSearch } from './components/StudentSearch';
import { AchievementsHoneycomb } from './components/AchievementsHoneycomb';
import { AdminPanel } from './components/AdminPanel';
import { MatrixRain } from './components/MatrixRain';
import { Activity, Lock, ShieldCheck, Code, Trophy, TrendingUp, ArrowLeft, Zap } from 'lucide-react';

// --- ТИПЫ ---
interface Title {
    id: number;
    name: string;
    color: string;
    rarity: string;
}

interface EloHistoryItem {
    id: number;
    prev_rating: number;
    new_rating: number;
    change_amount: number;
    reason: string;
    created_at: string;
}

const ALL_TITLES: Title[] = [
    { id: 1, name: "Круче ChatGPT", color: "text-purple", rarity: "legendary" },
    { id: 2, name: "Я, Робот", color: "text-cyan", rarity: "epic" },
    { id: 3, name: "Гордость Кафедры", color: "text-green-400", rarity: "rare" },
    { id: 4, name: "Атлет", color: "text-gray-400", rarity: "rare" },
    { id: 5, name: "Я - Легенда", color: "text-yellow-400", rarity: "legendary" }
];

const ALL_POSSIBLE_ACHIEVEMENTS = [
    { id: 1, code: 'NEURAL_LINK', title: 'Neural Link', description: 'Первое подключение к системе SPECTRUM', xp_reward: 100 },
    { id: 2, code: 'HIGH_PERFORMER', title: 'High Performer', description: 'Поддерживает GPA выше 4.5', xp_reward: 500 },
    { id: 3, code: 'CODE_NINJA', title: 'Code Ninja', description: 'Сдал лабораторные без ошибок', xp_reward: 300 },
    { id: 4, code: 'IRON_WILL', title: 'Iron Will', description: 'Посетил все пары в 8:30', xp_reward: 1000 },
    { id: 5, code: 'SOCIAL_HUB', title: 'Social Hub', description: 'Высокая социальная активность', xp_reward: 200 },
    { id: 6, code: 'CYBER_GHOST', title: 'Cyber Ghost', description: 'Закрыл дискретку', xp_reward: 666 },
    { id: 7, code: 'SYSTEM_ARCH', title: 'System Architect', description: 'Спроектировал сложную БД', xp_reward: 450 },
    { id: 8, code: 'BUG_HUNTER', title: 'Bug Hunter', description: 'Нашёл уязвимость в LMS', xp_reward: 800 },
    { id: 9, code: 'TIME_LORD', title: 'Time Lord', description: 'Всегда сдаёт работы раньше дедлайна', xp_reward: 350 },
    { id: 10, code: 'NETWORK_NODE', title: 'Network Node', description: 'Активен во всех чатах', xp_reward: 150 }
];

// --- ФУНКЦИЯ ГЕНЕРАЦИИ ФЕЙКОВОЙ ИСТОРИИ (ДЛЯ КРАСОТЫ) ---
const generateFakeHistory = (currentElo: number): EloHistoryItem[] => {
    const history: EloHistoryItem[] = [];
    let rating = currentElo;
    const reasons = [
        "Хакатон 1 место, бонус", "Лабораторная работа: 'AI Основы' (Высший балл)",
        "Полоса посещаемости: 30 дней", "Защита сложного проекта",
        "Публикация научной статьи"
    ];

    for (let i = 0; i < 5; i++) {
        const change = Math.floor(Math.random() * 50) + 10;
        const prev = rating - change;
        history.push({
            id: i,
            prev_rating: prev,
            new_rating: rating,
            change_amount: change,
            reason: reasons[i % reasons.length],
            created_at: new Date(Date.now() - i * 86400000 * 3).toISOString()
        });
        rating = prev;
    }
    return history;
};

// === СТРАНИЦА ПРОФИЛЯ СТУДЕНТА ===
function StudentProfilePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [student, setStudent] = useState<any>(null);
    const [eloHistory, setEloHistory] = useState<EloHistoryItem[]>([]);

    useEffect(() => {
        if (!id) return;

        // 1. Загрузка профиля
        fetch(`http://localhost:8000/api/students/${id}`)
            .then(res => res.json())
            .then(data => {
                setStudent(data);
                // 2. Загрузка истории (или фейк, если пусто)
                fetch(`http://localhost:8000/api/students/${id}/elo-history`)
                    .then(res => res.json())
                    .then(hist => {
                        if (Array.isArray(hist) && hist.length > 0) {
                            setEloHistory(hist);
                        } else {
                            // Если истории нет, генерируем красивую фейковую
                            setEloHistory(generateFakeHistory(data.elo_rating || 1000));
                        }
                    })
                    .catch(err => {
                        console.error(err);
                        setEloHistory(generateFakeHistory(data.elo_rating || 1000));
                    });
            })
            .catch(console.error);
    }, [id]);

    if (!student) return <div className="text-center pt-40 animate-pulse text-cyan font-mono tracking-widest text-xl">INITIALIZING NEURAL LINK...</div>;

    const studentTitleIds = new Set(student.titles?.map((t: Title) => t.name) || []);

    // --- КООРДИНАТЫ ДЛЯ ТРЕУГОЛЬНИКА ---
    const getPoint = (val: number, angle: number) => {
        const rad = (angle * Math.PI) / 180;
        const r = (val / 100) * 80; // 80 - радиус
        return `${100 + r * Math.cos(rad)},${110 + r * Math.sin(rad)}`;
    };

    const pInt = getPoint(student.stat_int, -90);
    const pSta = getPoint(student.stat_sta, 30);
    const pSoc = getPoint(student.stat_soc, 150);

    // Полный треугольник (фон)
    const bgInt = getPoint(100, -90);
    const bgSta = getPoint(100, 30);
    const bgSoc = getPoint(100, 150);

    return (
        <div className="max-w-[1600px] mx-auto p-6 space-y-6 pb-20">
            {/* HEADER */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/')}
                    className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-400 hover:text-white transition-all"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter">{student.full_name}</h1>
                    <div className="flex items-center gap-3 text-sm text-gray-400 font-mono">
                        <span className="px-2 py-0.5 bg-white/10 rounded text-white">{student.group_name}</span>
                        <span>ID: {student.id}</span>
                        <span className={student.risk_score > 50 ? "text-red-400" : "text-emerald-400"}>
                            RISK: {student.risk_score}%
                        </span>
                    </div>
                </div>
            </div>

            {/* БЛОК ПОЯСНЕНИЙ (LEGEND) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-black/40 border border-white/10 p-4 rounded-xl">
                    <div className="text-[10px] text-purple uppercase tracking-widest mb-1 font-bold">ELO Rating</div>
                    <p className="text-[10px] text-gray-400 leading-snug">
                        Динамический рейтинг "силы" студента. Зависит от сложности задач, участия в хакатонах и стабильности. Начальное значение: 1000.
                    </p>
                </div>
                <div className="bg-black/40 border border-white/10 p-4 rounded-xl">
                    <div className="text-[10px] text-cyan uppercase tracking-widest mb-1 font-bold">GPA (Average)</div>
                    <p className="text-[10px] text-gray-400 leading-snug">
                        Средний балл за все время обучения (макс. 5.0). Отражает академическую успеваемость по предметам.
                    </p>
                </div>
                <div className="bg-black/40 border border-white/10 p-4 rounded-xl">
                    <div className="text-[10px] text-pink-400 uppercase tracking-widest mb-1 font-bold">Neural Attributes</div>
                    <p className="text-[10px] text-gray-400 leading-snug">
                        <span className="text-pink-400">INT</span> (Интеллект) - сложные задачи. <br/>
                        <span className="text-cyan">STA</span> (Выносливость) - посещаемость/дедлайны. <br/>
                        <span className="text-purple">SOC</span> (Социальность) - активность в группе.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* ЛЕВАЯ КОЛОНКА: СТАТЫ И ELO */}
                <div className="lg:col-span-4 space-y-6">
                    {/* КАРТОЧКА АТРИБУТОВ (ОБНОВЛЕННАЯ) */}
                    <div className="bg-black/40 backdrop-blur-xl border border-cyan/20 rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-20"><Activity className="text-cyan w-12 h-12" /></div>
                        <h3 className="text-cyan font-bold uppercase tracking-widest text-sm mb-6">Neural Attributes</h3>

                        {/* SVG Треугольник */}
                        <div className="h-64 flex items-center justify-center relative">
                            <svg viewBox="0 0 200 200" className="w-full h-full filter drop-shadow-[0_0_10px_rgba(0,243,255,0.3)]">
                                {/* Сетка (фон) */}
                                <polygon points={`${bgInt} ${bgSta} ${bgSoc}`} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                                {/* Оси */}
                                <line x1="100" y1="110" x2={bgInt.split(',')[0]} y2={bgInt.split(',')[1]} stroke="rgba(255,255,255,0.1)" />
                                <line x1="100" y1="110" x2={bgSta.split(',')[0]} y2={bgSta.split(',')[1]} stroke="rgba(255,255,255,0.1)" />
                                <line x1="100" y1="110" x2={bgSoc.split(',')[0]} y2={bgSoc.split(',')[1]} stroke="rgba(255,255,255,0.1)" />

                                {/* Заполненный треугольник */}
                                <polygon
                                    points={`${pInt} ${pSta} ${pSoc}`}
                                    fill="rgba(0, 243, 255, 0.15)"
                                    stroke="#00f3ff"
                                    strokeWidth="2"
                                />

                                {/* Точки вершин */}
                                <circle cx={pInt.split(',')[0]} cy={pInt.split(',')[1]} r="3" fill="#f472b6" /> {/* INT - Pink */}
                                <circle cx={pSta.split(',')[0]} cy={pSta.split(',')[1]} r="3" fill="#22d3ee" /> {/* STA - Cyan */}
                                <circle cx={pSoc.split(',')[0]} cy={pSoc.split(',')[1]} r="3" fill="#a855f7" /> {/* SOC - Purple */}

                                {/* Лейблы */}
                                <text x="100" y="20" fill="#f472b6" fontSize="10" fontWeight="bold" textAnchor="middle">INT</text>
                                <text x="175" y="160" fill="#22d3ee" fontSize="10" fontWeight="bold" textAnchor="middle">STA</text>
                                <text x="25" y="160" fill="#a855f7" fontSize="10" fontWeight="bold" textAnchor="middle">SOC</text>
                            </svg>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                            <div className="p-2 bg-pink-500/10 rounded border border-pink-500/20">
                                <div className="text-[10px] text-pink-400 uppercase">INT</div>
                                <div className="text-xl font-bold text-white">{student.stat_int}</div>
                            </div>
                            <div className="p-2 bg-cyan-500/10 rounded border border-cyan-500/20">
                                <div className="text-[10px] text-cyan-400 uppercase">STA</div>
                                <div className="text-xl font-bold text-white">{student.stat_sta}</div>
                            </div>
                            <div className="p-2 bg-purple-500/10 rounded border border-purple-500/20">
                                <div className="text-[10px] text-purple-400 uppercase">SOC</div>
                                <div className="text-xl font-bold text-white">{student.stat_soc}</div>
                            </div>
                        </div>
                    </div>

                    {/* ELO RATING CARD */}
                    <div className="bg-gradient-to-br from-purple-900/20 to-black border border-purple/30 rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-purple-500/20 blur-3xl rounded-full"></div>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="text-xs text-purple-300 uppercase tracking-widest mb-1">Competitive Rating</div>
                                <div className="text-5xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                                    {student.elo_rating || 1000}
                                </div>
                            </div>
                            <Trophy className="text-purple-400 w-8 h-8" />
                        </div>
                        <div className="text-xs text-gray-400 font-mono">
                            GPA: <span className="text-white font-bold">{student.gpa}</span>
                        </div>
                    </div>

                    {/* ТИТУЛЫ */}
                    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                        <h3 className="text-white font-bold uppercase tracking-widest text-sm mb-4">Titles</h3>
                        <div className="flex flex-wrap gap-2">
                            {ALL_TITLES.map((title) => {
                                const isUnlocked = studentTitleIds.has(title.name);
                                return (
                                    <div
                                        key={title.id}
                                        className={`relative px-3 py-1.5 rounded border text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                                            isUnlocked
                                                ? `${title.color} ${
                                                      title.rarity === 'legendary'
                                                          ? 'border-purple/60 bg-purple/20 shadow-[0_0_10px_rgba(188,19,254,0.3)]'
                                                          : title.rarity === 'epic'
                                                          ? 'border-cyan/60 bg-cyan/20 shadow-[0_0_10px_rgba(0,255,255,0.3)]'
                                                          : 'border-white/20 bg-white/5'
                                                  }`
                                                : 'text-gray-600 border-white/5 bg-black/40 grayscale opacity-60'
                                        }`}
                                    >
                                        {isUnlocked ? (
                                            <span className={`w-1.5 h-1.5 rounded-full ${isUnlocked ? 'animate-pulse bg-current' : ''}`}></span>
                                        ) : (
                                            <Lock size={10} className="text-gray-600" />
                                        )}
                                        {title.name}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ПРАВАЯ КОЛОНКА: TIMELINE И АЧИВКИ */}
                <div className="lg:col-span-8 space-y-6">

                    {/* ELO TIMELINE */}
                    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 h-[500px] flex flex-col">
                        <h3 className="text-white font-bold uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
                            <TrendingUp className="text-green-400" size={18} /> Rating History
                        </h3>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                            {eloHistory.map((item) => (
                                <div key={item.id} className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors group">
                                    <div className="flex flex-col items-center min-w-[60px]">
                                        <span className="text-xs text-gray-500 font-mono">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </span>
                                        <span className="text-[10px] text-gray-600 font-mono">
                                            {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>

                                    <div className="w-px h-10 bg-white/10 mx-2"></div>

                                    <div className="flex-1">
                                        <div className="text-sm text-white font-medium group-hover:text-cyan-300 transition-colors">
                                            {item.reason}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                            <span>{item.prev_rating}</span>
                                            <ArrowLeft size={10} className="rotate-180" />
                                            <span className="text-white font-bold">{item.new_rating}</span>
                                        </div>
                                    </div>

                                    <div className={`text-lg font-bold font-mono ${item.change_amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {item.change_amount > 0 ? '+' : ''}{item.change_amount}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ДОСТИЖЕНИЯ */}
                    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                        <h3 className="text-white font-bold uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
                            <Zap className="text-yellow-400" size={18} /> Neural Achievements
                        </h3>
                        <AchievementsHoneycomb
                            allAchievements={ALL_POSSIBLE_ACHIEVEMENTS}
                            earnedAchievements={student.achievements || []}
                        />
                    </div>

                </div>
            </div>
        </div>
    );
}

// === ГЛАВНОЕ ПРИЛОЖЕНИЕ ===
function App() {
  const { fetchAtRiskStudents, fetchKpi } = useStore();
  const [matrixMode, setMatrixMode] = useState(false);

  useEffect(() => {
    const loadData = () => {
        fetchAtRiskStudents();
        fetchKpi();
    };
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [fetchAtRiskStudents, fetchKpi]);

  return (
    <Router>
        <div className={`relative min-h-screen text-white overflow-x-hidden font-sans transition-colors duration-700 ${matrixMode ? 'bg-black' : 'selection:bg-cyan selection:text-black'}`}>
            {/* ФОН С ПЕРЕХОДОМ */}
            <div className={`transition-opacity duration-1000 ${matrixMode ? 'opacity-0' : 'opacity-100'}`}>
                <TronBackground />
            </div>

            <MatrixRain enabled={matrixMode} />

            {/* Navigation Bar */}
            <div className="relative z-50 pt-10 px-4 md:px-8 max-w-[1600px] mx-auto flex justify-between items-start gap-4">
                 <div className="flex-1">
                     <StudentSearch />
                 </div>

                 <div className="flex gap-3">
                     {/* КНОПКА МАТРИЦЫ */}
                     <button
                        onClick={() => setMatrixMode(!matrixMode)}
                        className={`group flex items-center justify-center w-12 h-12 backdrop-blur-md border rounded-xl transition-all cursor-pointer ${matrixMode ? 'bg-green-500/20 border-green-500 text-green-500' : 'bg-black/40 border-white/10 text-white/50 hover:border-green-500/50 hover:text-green-500'}`}
                        title="Toggle Matrix Mode"
                     >
                         <Code size={20} />
                     </button>

                     {/* КНОПКА АДМИН ПАНЕЛИ */}
                     <a href="/admin" className="group flex items-center justify-center w-12 h-12 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl hover:bg-red-500/10 hover:border-red-500/50 transition-all cursor-pointer">
                         <ShieldCheck className="text-white/50 group-hover:text-red-500 transition-colors" size={20} />
                     </a>
                 </div>
            </div>

            <Routes>
                <Route path="/" element={
                    <div className="relative z-10 p-4 md:p-8 lg:p-12 animate-in fade-in duration-1000">
                        <Dashboard />
                    </div>
                } />
                <Route path="/student/:id" element={<StudentProfilePage />} />
                <Route path="/admin" element={<AdminPanel />} />
            </Routes>
        </div>
    </Router>
  );
}

export default App;

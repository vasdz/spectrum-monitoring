import { Lock, Hexagon } from 'lucide-react';

interface Achievement {
    id: number;
    code: string;
    title: string;
    description: string;
    xp_reward: number; // Оставляем в интерфейсе, но не рендерим
}

interface Props {
    allAchievements: Achievement[];
    earnedAchievements: Achievement[];
}

export function AchievementsHoneycomb({ allAchievements, earnedAchievements }: Props) {
    if (!allAchievements || allAchievements.length === 0) return null;

    // Создаем Set из кодов полученных достижений для быстрого поиска
    const earnedCodes = new Set(earnedAchievements.map(a => a.code));

    return (
        <div className="relative py-10">
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
                {allAchievements.map((achievement) => {
                    const isUnlocked = earnedCodes.has(achievement.code);

                    return (
                        <div
                            key={achievement.id}
                            className={`relative w-28 h-32 md:w-32 md:h-36 flex items-center justify-center transition-all duration-500 group ${
                                isUnlocked 
                                    ? 'scale-100 opacity-100 z-10' 
                                    : 'scale-90 opacity-40 grayscale hover:opacity-60'
                            }`}
                        >
                            {/* SVG Hexagon Background */}
                            <svg
                                viewBox="0 0 100 115"
                                className={`absolute inset-0 w-full h-full drop-shadow-2xl transition-all duration-500 ${
                                    isUnlocked 
                                        ? 'fill-purple/20 stroke-purple stroke-2' 
                                        : 'fill-black/60 stroke-gray-700 stroke-1'
                                }`}
                            >
                                <path d="M50 0 L93.3 25 L93.3 75 L50 100 L6.7 75 L6.7 25 Z" />
                            </svg>

                            {/* Контент внутри соты */}
                            <div className="relative z-20 flex flex-col items-center text-center p-2">
                                {isUnlocked ? (
                                    <div className="mb-2 p-2 bg-purple/20 rounded-full border border-purple/50 shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                                        <Hexagon className="text-purple w-6 h-6 md:w-8 md:h-8 fill-current" />
                                    </div>
                                ) : (
                                    <Lock className="mb-2 text-gray-500 w-6 h-6" />
                                )}

                                <div className={`text-[9px] md:text-[10px] font-bold uppercase tracking-wider leading-tight ${
                                    isUnlocked ? 'text-white' : 'text-gray-500'
                                }`}>
                                    {achievement.title}
                                </div>

                                {/* XP убрали отсюда */}
                            </div>

                            {/* Тултип при наведении */}
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-black/90 border border-white/10 rounded-xl p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 backdrop-blur-md">
                                <div className={`text-xs font-bold mb-1 ${isUnlocked ? 'text-purple' : 'text-gray-400'}`}>
                                    {achievement.title}
                                </div>
                                <div className="text-[10px] text-gray-400 leading-relaxed">
                                    {achievement.description}
                                </div>
                                {!isUnlocked && (
                                    <div className="mt-2 text-[9px] text-red-400 uppercase tracking-widest">
                                        LOCKED
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

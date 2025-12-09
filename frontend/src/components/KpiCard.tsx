import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: number | string | undefined;
  unit?: string;
  icon: LucideIcon;
  color?: 'cyan' | 'purple' | 'pink' | 'orange';
  description?: string;
}

export function KpiCard({ title, value, unit, icon: Icon, color = 'cyan', description }: KpiCardProps) {
    const palette = {
        cyan: {
            main: '#00f3ff',
            glow: 'rgba(0,243,255,0.8)',
            bg: 'rgba(0,243,255,0.10)',
        },
        purple: {
            main: '#a855f7',
            glow: 'rgba(168,85,247,0.8)',
            bg: 'rgba(168,85,247,0.10)',
        },
        pink: {
            main: '#ff0055',               // Neural Load
            glow: 'rgba(255,0,85,0.8)',
            bg: 'rgba(255,0,85,0.10)',
        },
        orange: {
            main: '#ff9900',               // Active Nodes
            glow: 'rgba(255,153,0,0.8)',
            bg: 'rgba(255,153,0,0.10)',
        },
    } as const;

    const theme = palette[color];

    return (
        <motion.div
            className="
                relative p-6 rounded-2xl group
                backdrop-blur-xl bg-black/40
                border
                transition-all duration-300 ease-out
            "
            style={{
                borderColor: theme.main,                // ЦВЕТНАЯ ОБВОДКА КАРТОЧКИ
                boxShadow: `0 0 18px ${theme.glow}`,
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            title={description}
        >
            {/* Цветное свечение фона */}
            <div
                className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br to-transparent opacity-10 blur-3xl group-hover:opacity-20 transition-all duration-500"
                style={{ backgroundImage: `linear-gradient(135deg, ${theme.main}, transparent)` }}
            />

            <div className="flex justify-between items-start relative z-10">
                <div>
                    {/* ЦВЕТНОЙ ЗАГОЛОВОК */}
                    <p
                        className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase mb-2 opacity-80"
                        style={{ color: theme.main }}
                    >
                        {title}
                    </p>
                    <div className="flex items-baseline gap-2">
                        {/* ЦВЕТНОЕ ЗНАЧЕНИЕ */}
                        <span
                            className="text-4xl font-black font-sans"
                            style={{
                                color: theme.main,
                                textShadow: `0 0 10px ${theme.glow}`,
                            }}
                        >
                            {value ?? '--'}
                        </span>
                        {unit && (
                            <span
                                className="text-sm font-bold"
                                style={{ color: theme.main, opacity: 0.9 }}
                            >
                                {unit}
                            </span>
                        )}
                    </div>
                </div>

                {/* ЦВЕТНОЙ БЛОК ИКОНКИ С ЦВЕТНОЙ ОБВОДКОЙ */}
                <div
                    className="p-3 rounded-xl border backdrop-blur-md flex items-center justify-center"
                    style={{
                        borderColor: theme.main,
                        color: theme.main,
                        backgroundColor: theme.bg,
                        boxShadow: `0 0 12px ${theme.glow}`,
                    }}
                >
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </motion.div>
    );
}

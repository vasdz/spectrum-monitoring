import { useEffect, useRef } from 'react';

export function MatrixRain({ enabled }: { enabled: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!enabled) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const letters = "アカサタナハマヤラワ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const fontSize = 14; // Чуть меньше шрифт
        const columns = canvas.width / fontSize;
        const drops: number[] = [];

        for (let x = 0; x < columns; x++) drops[x] = 1;

        const draw = () => {
            // Полупрозрачный черный фон для эффекта "хвоста"
            // Чем меньше альфа (0.05), тем длиннее хвосты
            ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Цвет символов (более глубокий зеленый, не такой яркий)
            ctx.fillStyle = "#00ff41"; // Cyberpunk Green
            ctx.font = fontSize + "px monospace";

            for (let i = 0; i < drops.length; i++) {
                const text = letters.charAt(Math.floor(Math.random() * letters.length));

                // Рисуем символ
                // Добавляем немного рандомной яркости для "мерцания"
                ctx.globalAlpha = Math.random() * 0.5 + 0.5;
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                ctx.globalAlpha = 1; // Сброс альфы

                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };

        const interval = setInterval(draw, 33);
        return () => clearInterval(interval);
    }, [enabled]);

    if (!enabled) return null;

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-[9999] pointer-events-none mix-blend-screen opacity-40" // Снизил общую прозрачность до 40%
        />
    );
}

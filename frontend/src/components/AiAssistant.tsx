import { useState } from 'react';
import { Send, Cpu, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';

type Message = {
    from: 'ai' | 'user';
    text: string;
};

export function AiAssistant() {
    const [messages, setMessages] = useState<Message[]>([
        { from: 'ai', text: 'Система SPECTRUM онлайн. Готова к анализу.' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userText = input.trim();
        setInput('');

        // Добавляем сообщение пользователя
        setMessages(prev => [...prev, { from: 'user', text: userText }]);
        setIsLoading(true);

        try {
            // ВАЖНО: эндпоинт совпадает с /api/analytics/ask-ai из backend/analytics.py
            const res = await fetch('http://localhost:8000/api/analytics/ask-ai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: userText,
                    student_id: null   // можешь передавать ID студента, если нужно
                })
            });

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            const data = await res.json();
            const aiText: string =
                data.response ||
                'Аномалия в канале: ядро вернуло пустой вектор ответа.';

            setMessages(prev => [...prev, { from: 'ai', text: aiText }]);
        } catch (e) {
            console.error(e);
            setMessages(prev => [
                ...prev,
                {
                    from: 'ai',
                    text:
                        '⚠ Сбой синхронизации с нейроядром. Проверь соединение с портом 8085 и статус Llama-сервера.'
                }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative flex flex-col h-full bg-black/60 backdrop-blur-xl border border-purple/20 rounded-2xl shadow-[0_0_30px_rgba(188,19,254,0.05)] overflow-hidden">

            {/* ШАПКА */}
            <div className="flex items-center justify-between p-4 border-b border-purple/10 bg-black/30 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <BrainCircuit className="w-6 h-6 text-purple" />
                    <h3 className="font-mono text-purple font-bold tracking-widest uppercase text-sm">
                        AI Advisory Core
                    </h3>
                </div>
                <span className="px-2 py-0.5 bg-purple/10 border border-purple/20 text-purple/80 text-[10px] font-mono rounded">
                    V2.5 (SAIGA)
                </span>
            </div>

            {/* ОБЛАСТЬ ЧАТА */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">
                {messages.map((msg, i) => (
                    <motion.div
                        key={i}
                        className={`flex items-start gap-3 text-xs ${msg.from === 'ai' ? '' : 'justify-end'}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {msg.from === 'ai' && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple/10 border border-purple/20 flex items-center justify-center">
                                <Cpu size={16} className="text-purple" />
                            </div>
                        )}
                        <div
                            className={`max-w-[80%] p-3 rounded-xl ${
                                msg.from === 'ai'
                                    ? 'bg-purple/10 text-purple/90 border border-purple/20'
                                    : 'bg-white/10 text-white/90 border border-white/20'
                            }`}
                        >
                            {msg.text}
                        </div>
                    </motion.div>
                ))}
                {isLoading && (
                    <motion.div
                        className="flex items-start gap-3 text-xs"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple/10 border border-purple/20 flex items-center justify-center">
                            <Cpu size={16} className="text-purple animate-pulse" />
                        </div>
                        <div className="p-3 rounded-xl bg-purple/10 text-purple/50 border border-purple/20">
                            <span className="animate-pulse">...</span>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* ПОЛЕ ВВОДА */}
            <div className="p-4 border-t border-purple/10 bg-black/30">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        placeholder="Общий запрос к системе..."
                        className="w-full bg-black/50 border border-purple/30 focus:border-purple/70 rounded-lg py-3 pl-4 pr-12 text-sm text-white placeholder-purple/30 outline-none transition-colors duration-300 shadow-inner"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md text-purple/50 hover:text-purple hover:bg-purple/10 disabled:text-gray-600 disabled:bg-transparent transition-colors"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>

        </div>
    );
}
